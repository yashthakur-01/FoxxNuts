"""Page-window PDF ingestion with topic-aware LangChain Document chunks."""

from __future__ import annotations

import argparse
import re
import shutil
import uuid
from pathlib import Path
from typing import Iterable, Literal, TypedDict

from langchain_core.documents import Document
import pymupdf

from app.controllers.pdf_parsing import preprocess_document
from app.controllers.markdown_parsing import (
    detect_markdown_headings,
    preprocess_markdown,
    split_markdown_blocks,
)


class QualityReport(TypedDict):
    """Quality metrics used to decide whether parsed text looks suspicious."""

    parser: str
    character_count: int
    word_count: int
    line_count: int
    heading_count: int
    table_line_count: int
    list_item_count: int
    suspicious_character_count: int
    suspicious_character_ratio: float
    alphanumeric_ratio: float
    average_line_length: float
    file_size_bytes: int
    page_count: int | None
    suspicious: bool
    reasons: list[str]


class PageWindowText(TypedDict):
    """Parsed text for a contiguous PDF page range."""

    text: str
    page_start: int
    page_end: int


class TextBlock(TypedDict):
    """A structure-aware text block used during chunking."""

    type: str
    text: str
    section_title: str


def chunk_markdown_file(
    content: str,
    *,
    document_title: str = "",
    file_name: str = "",
    chunk_size_tokens: int = 300,
    chunk_overlap_tokens: int = 40,
    chars_per_token: float = 4.2,
) -> list[Document]:
    """Parse and chunk a Markdown (.md) document directly in memory.

    Preserves Markdown headings, tables, lists, and code blocks.
    Strictly avoids adding page numbers to metadata or chunk headers.
    """
    max_chars = max(1, int(chunk_size_tokens * chars_per_token))
    overlap_chars = max(0, int(chunk_overlap_tokens * chars_per_token))

    cleaned = preprocess_markdown(content)
    blocks = _markdown_blocks(cleaned)
    title = document_title.strip() or file_name.strip()
    chunk_pairs = _chunk_blocks_by_topic(
        blocks,
        document_title=title,
        max_chars=max_chars,
        overlap_chars=overlap_chars,
    )

    documents: list[Document] = []
    total_chunks = len(chunk_pairs)

    for chunk_index, (chunk_text, section_title) in enumerate(chunk_pairs, start=1):
        header_parts = []
        if title:
            header_parts.append(f"[Document: {title}]")
        if section_title:
            header_parts.append(f"[Section: {section_title}]")

        header_prefix = " ".join(header_parts)
        content_with_metadata = f"{header_prefix}\n{chunk_text}" if header_prefix else chunk_text

        # DO NOT add page numbers as metadata for markdown files
        metadata = {
            "source": file_name or title,
            "document_title": title,
            "section_title": section_title,
            "chunk_index": chunk_index,
            "total_chunks": total_chunks,
            "parser": "markdown_native",
            "file_type": "markdown",
            "chunk_size_chars": len(content_with_metadata),
            "chunk_size_tokens_estimate": max(1, round(len(content_with_metadata) / chars_per_token)),
        }
        documents.append(Document(page_content=content_with_metadata, metadata=metadata))

    return documents


def main(
    file_input: str | Path | bytes | None = None,
    *,
    pdf_path: str | Path | None = None,
    file_name: str = "",
    document_title: str = "",
    chunk_size_tokens: int = 300,
    chunk_overlap_tokens: int = 40,
    chars_per_token: float = 4.2,
    pymupdf_pages_per_window: int = 10,
    **kwargs,
) -> list[Document]:
    """Return structure-aware chunks as LangChain Document objects.

    Directly parses in-memory bytes or file paths without disk writes:
      - .md / .markdown: Native smart markdown chunking (preserves headings, tables, code, lists; no page numbers).
      - .pdf: Pure in-memory PyMuPDF page-window streaming with page labels.
    """
    input_data = file_input if file_input is not None else pdf_path
    if input_data is None:
        raise ValueError("Either file_input or pdf_path must be provided.")

    max_chars = max(1, int(chunk_size_tokens * chars_per_token))
    overlap_chars = max(0, int(chunk_overlap_tokens * chars_per_token))

    name = file_name.strip()
    if not name and isinstance(input_data, (str, Path)):
        name = Path(input_data).name
    title = document_title.strip() or (Path(input_data).stem if isinstance(input_data, (str, Path)) else name) or "Document"

    # Route 1: Markdown (.md / .markdown)
    if name.lower().endswith((".md", ".markdown")):
        text_content = ""
        if isinstance(input_data, (bytes, bytearray)):
            text_content = input_data.decode("utf-8", errors="replace")
        elif isinstance(input_data, (str, Path)) and Path(input_data).exists():
            text_content = Path(input_data).read_text(encoding="utf-8", errors="replace")
        elif isinstance(input_data, str):
            text_content = input_data

        return chunk_markdown_file(
            content=text_content,
            document_title=title,
            file_name=name,
            chunk_size_tokens=chunk_size_tokens,
            chunk_overlap_tokens=chunk_overlap_tokens,
            chars_per_token=chars_per_token,
        )

    # Route 2: PDF Document (100% in-memory via PyMuPDF)
    plain_windows = _parse_page_windows_with_pymupdf(
        input_data,
        pages_per_window=pymupdf_pages_per_window,
    )
    if not plain_windows:
        raise ValueError(f"No readable text could be extracted from PDF '{name}'.")

    plain_text = "\n\n".join(window["text"] for window in plain_windows)
    file_size = len(input_data) if isinstance(input_data, (bytes, bytearray)) else (Path(input_data).stat().st_size if Path(input_data).exists() else len(plain_text))
    page_count = _get_pdf_page_count(input_data)

    report = assess_parse_quality(
        plain_text,
        parser="pymupdf",
        file_size_bytes=file_size,
        page_count=page_count,
        markdown=False,
    )

    return _windows_to_documents(
        plain_windows,
        source_name=name,
        document_title=title,
        parser_name="pymupdf",
        markdown=False,
        max_chars=max_chars,
        overlap_chars=overlap_chars,
        quality_report=report,
        fallback_reason="",
    )


def assess_parse_quality(
    text: str,
    *,
    parser: str,
    file_size_bytes: int,
    page_count: int | None,
    markdown: bool,
) -> QualityReport:
    """Run lightweight quality checks over parsed text."""

    lines = text.splitlines()
    character_count = len(text)
    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)
    line_count = len(lines)
    suspicious_character_count = len(re.findall(r"[\ufffd\u25a1]|[@%#]{5,}", text))
    alnum_count = sum(1 for char in text if char.isalnum())
    non_space_count = sum(1 for char in text if not char.isspace())

    heading_count = (
        len(detect_markdown_headings(text)) if markdown else len(_detect_plain_headings(text))
    )
    table_line_count = sum(1 for line in lines if _looks_like_markdown_table_line(line))
    list_item_count = sum(1 for line in lines if _looks_like_list_item(line.strip()))
    suspicious_ratio = suspicious_character_count / max(character_count, 1)
    alphanumeric_ratio = alnum_count / max(non_space_count, 1)
    average_line_length = character_count / max(line_count, 1)

    reasons: list[str] = []
    if character_count < 500:
        reasons.append("very low character count")
    if file_size_bytes >= 100_000 and character_count < 2_000:
        reasons.append("large PDF produced very little text")
    if page_count and page_count >= 5 and character_count / page_count < 250:
        reasons.append("low text density per page")
    if word_count < 100 and file_size_bytes >= 100_000:
        reasons.append("very low word count for PDF size")
    if suspicious_ratio > 0.02:
        reasons.append("too many OCR replacement or junk characters")
    if character_count >= 500 and alphanumeric_ratio < 0.45:
        reasons.append("low alphanumeric ratio")
    if page_count and page_count >= 3 and heading_count == 0 and markdown:
        reasons.append("no headings detected in multi-page Markdown parse")

    return {
        "parser": parser,
        "character_count": character_count,
        "word_count": word_count,
        "line_count": line_count,
        "heading_count": heading_count,
        "table_line_count": table_line_count,
        "list_item_count": list_item_count,
        "suspicious_character_count": suspicious_character_count,
        "suspicious_character_ratio": round(suspicious_ratio, 4),
        "alphanumeric_ratio": round(alphanumeric_ratio, 4),
        "average_line_length": round(average_line_length, 2),
        "file_size_bytes": file_size_bytes,
        "page_count": page_count,
        "suspicious": bool(reasons),
        "reasons": reasons,
    }


def chunk_plain_text_by_structure(
    text: str,
    *,
    document_title: str = "",
    max_chars: int = 1200,
    overlap_chars: int = 150,
) -> list[str]:
    """Backward-compatible string chunking for cleaned plain text."""

    blocks = _split_plain_text_blocks(text)
    chunks = _chunk_blocks_by_topic(
        blocks,
        document_title=document_title,
        max_chars=max_chars,
        overlap_chars=overlap_chars,
    )
    return [chunk_text for chunk_text, _section in chunks]


def _windows_to_documents(
    windows: list[PageWindowText],
    *,
    source_name: str,
    document_title: str,
    parser_name: str,
    markdown: bool,
    max_chars: int,
    overlap_chars: int,
    quality_report: QualityReport,
    fallback_reason: str,
) -> list[Document]:
    documents: list[Document] = []

    for window_index, window in enumerate(windows, start=1):
        cleaned = preprocess_markdown(window["text"]) if markdown else preprocess_document(window["text"])
        blocks = _markdown_blocks(cleaned) if markdown else _split_plain_text_blocks(cleaned)
        chunk_pairs = _chunk_blocks_by_topic(
            blocks,
            document_title=document_title,
            max_chars=max_chars,
            overlap_chars=overlap_chars,
        )

        for chunk_index, (chunk_text, section_title) in enumerate(chunk_pairs, start=1):
            page_start = window["page_start"]
            page_end = window["page_end"]
            page_label = f"Page {page_start}" if page_start == page_end else f"Pages {page_start}-{page_end}"
            
            # Embed page number, document title, and section title directly into chunk text
            header_parts = [f"[{page_label}]"]
            if document_title:
                header_parts.append(f"[Document: {document_title}]")
            if section_title:
                header_parts.append(f"[Section: {section_title}]")
            
            header_prefix = " ".join(header_parts)
            content_with_metadata = f"{header_prefix}\n{chunk_text}"

            metadata = {
                "source": str(source_name),
                "document_title": document_title,
                "section_title": section_title,
                "page": window["page_start"],
                "page_start": window["page_start"],
                "page_end": window["page_end"],
                "page_window": f"{window['page_start']}-{window['page_end']}",
                "window_index": window_index,
                "chunk_index": chunk_index,
                "parser": parser_name,
                "fallback_reason": fallback_reason,
                "chunk_size_chars": len(content_with_metadata),
                "chunk_size_tokens_estimate": max(1, round(len(content_with_metadata) / 4.2)),
                "quality_suspicious": quality_report["suspicious"],
                "quality_reasons": quality_report["reasons"],
            }
            documents.append(Document(page_content=content_with_metadata, metadata=metadata))

    return documents


def _chunk_blocks_by_topic(
    blocks: list[TextBlock],
    *,
    document_title: str,
    max_chars: int,
    overlap_chars: int,
) -> list[tuple[str, str]]:
    topic_groups = _group_blocks_by_heading(blocks)
    chunks: list[tuple[str, str]] = []

    for section_title, topic_blocks in topic_groups:
        current: list[str] = []
        previous_overlap = ""

        for block in topic_blocks:
            block_text = block["text"].strip()
            if not block_text:
                continue

            candidate_parts = ([previous_overlap] if previous_overlap else []) + current + [block_text]
            candidate = "\n\n".join(part for part in candidate_parts if part).strip()

            if current and len(candidate) > max_chars:
                chunk_text = _with_context(
                    "\n\n".join(([previous_overlap] if previous_overlap else []) + current),
                    document_title,
                    section_title,
                )
                chunks.append((chunk_text, section_title))
                previous_overlap = _tail_overlap("\n\n".join(current), overlap_chars)
                current = []

            if len(block_text) > max_chars and block["type"] not in {"table", "list", "code"}:
                for part in _split_long_text(block_text, max_chars, overlap_chars):
                    chunk_text = _with_context(
                        "\n\n".join(part for part in [previous_overlap, part] if part),
                        document_title,
                        section_title,
                    )
                    chunks.append((chunk_text, section_title))
                    previous_overlap = _tail_overlap(part, overlap_chars)
            else:
                current.append(block_text)

        if current:
            chunk_text = _with_context(
                "\n\n".join(([previous_overlap] if previous_overlap else []) + current),
                document_title,
                section_title,
            )
            chunks.append((chunk_text, section_title))

    return chunks


def _group_blocks_by_heading(blocks: list[TextBlock]) -> list[tuple[str, list[TextBlock]]]:
    groups: list[tuple[str, list[TextBlock]]] = []
    current_section = ""
    current_blocks: list[TextBlock] = []

    for block in blocks:
        if block["type"] == "heading":
            if current_blocks:
                groups.append((current_section, current_blocks))
            current_section = block["section_title"] or _strip_heading_markup(block["text"])
            current_blocks = [block]
            continue
        current_blocks.append(block)

    if current_blocks:
        groups.append((current_section, current_blocks))

    return groups


def _markdown_blocks(markdown: str) -> list[TextBlock]:
    return [
        {
            "type": block["type"],
            "text": block["text"],
            "section_title": block["section_title"],
        }
        for block in split_markdown_blocks(markdown)
    ]


def _parse_page_windows_with_pymupdf(
    doc_input: Path | bytes | str,
    *,
    pages_per_window: int,
) -> list[PageWindowText]:
    """Extract page windows directly in memory using PyMuPDF without disk files."""
    windows: list[PageWindowText] = []
    if isinstance(doc_input, (bytes, bytearray)):
        doc_context = pymupdf.open(stream=doc_input, filetype="pdf")
    else:
        doc_context = pymupdf.open(str(doc_input))

    with doc_context as document:
        for page_start, page_end in _iter_page_windows(document.page_count, pages_per_window):
            parts: list[str] = []
            for page_number in range(page_start, page_end + 1):
                page = document[page_number - 1]
                text = page.get_text("text").strip()
                if text:
                    parts.append(f"Page {page_number}\n{text}")
            if parts:
                windows.append(
                    {
                        "text": "\n\n".join(parts),
                        "page_start": page_start,
                        "page_end": page_end,
                    }
                )
    return windows


def _iter_page_windows(page_count: int, pages_per_window: int) -> Iterable[tuple[int, int]]:
    window_size = max(1, pages_per_window)
    for page_start in range(1, page_count + 1, window_size):
        page_end = min(page_start + window_size - 1, page_count)
        yield page_start, page_end


def _get_pdf_page_count(doc_input: Path | bytes | str) -> int | None:
    try:
        if isinstance(doc_input, (bytes, bytearray)):
            with pymupdf.open(stream=doc_input, filetype="pdf") as document:
                return int(document.page_count)
        else:
            with pymupdf.open(str(doc_input)) as document:
                return int(document.page_count)
    except Exception:
        return None


def _title_from_path(source: Path | str) -> str:
    name = Path(source).stem if not isinstance(source, bytes) else "Document"
    return re.sub(r"[-_]+", " ", name).strip().title()


def _split_plain_text_blocks(text: str) -> list[TextBlock]:
    paragraphs = [part.strip() for part in re.split(r"\n{2,}", text) if part.strip()]
    blocks: list[TextBlock] = []
    current_section = ""

    for paragraph in paragraphs:
        lines = paragraph.splitlines()
        block_type: Literal["heading", "paragraph", "list", "table"]
        if all(_looks_like_list_item(line.strip()) or line.startswith((" ", "\t")) for line in lines):
            block_type = "list"
        elif all(_looks_like_key_value_line(line) for line in lines) and len(lines) >= 2:
            block_type = "table"
        elif len(lines) == 1 and _detect_plain_headings(paragraph):
            block_type = "heading"
            current_section = paragraph.strip()
        else:
            block_type = "paragraph"

        blocks.append(
            {
                "type": block_type,
                "text": paragraph,
                "section_title": current_section,
            }
        )

    return blocks


def _detect_plain_headings(text: str) -> list[str]:
    headings: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or len(stripped) > 100:
            continue
        words = stripped.split()
        if len(words) <= 12 and (
            stripped.isupper()
            or stripped.endswith(":")
            or sum(1 for word in words if word[:1].isupper()) / max(len(words), 1) >= 0.8
        ):
            headings.append(stripped)
    return headings


def _looks_like_markdown_table_line(line: str) -> bool:
    stripped = line.strip()
    return "|" in stripped and stripped.count("|") >= 1


def _looks_like_list_item(line: str) -> bool:
    return bool(
        re.match(
            r"^(\s*)((?:[-*+])|(?:\d+[\.)])|(?:[A-Za-z][\.)])|(?:[ivxlcdmIVXLCDM]+[\.)]))\s+",
            line,
        )
    )


def _looks_like_key_value_line(line: str) -> bool:
    return bool(re.match(r"^[A-Za-z][A-Za-z0-9 /_-]{0,40}:\s+\S+", line.strip()))


def _strip_heading_markup(text: str) -> str:
    stripped = text.strip()
    markdown_heading = re.match(r"^#{1,6}\s+(.+?)\s*#*\s*$", stripped)
    return markdown_heading.group(1).strip() if markdown_heading else stripped


def _with_context(text: str, document_title: str, section_title: str) -> str:
    metadata: list[str] = []
    if document_title.strip():
        metadata.append(f"Document Title: {document_title.strip()}")
    if section_title.strip():
        metadata.append(f"Section Title: {section_title.strip()}")
    return "\n".join(metadata + ["", text.strip()]).strip() if metadata else text.strip()


def _tail_overlap(text: str, overlap_chars: int) -> str:
    if overlap_chars <= 0:
        return ""
    return _trim_to_boundary(text.strip()[-overlap_chars:])


def _split_long_text(text: str, max_chars: int, overlap_chars: int) -> list[str]:
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            boundary_end = _find_boundary_end(text, start, end)
            if boundary_end is not None and boundary_end > start + max_chars // 2:
                end = boundary_end
        chunk = _trim_to_boundary(text[start:end])
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break
        start = max(_boundary_overlap_start(text, end, overlap_chars), start + 1)
    return chunks


def _find_boundary_end(text: str, start: int, end: int) -> int | None:
    window = text[start:end]
    paragraph_break = window.rfind("\n\n")
    sentence_breaks = [
        window.rfind(". "),
        window.rfind("! "),
        window.rfind("? "),
    ]
    sentence_break = max(sentence_breaks)

    if paragraph_break >= 0:
        return start + paragraph_break + 2
    if sentence_break >= 0:
        return start + sentence_break + 2
    single_newline = window.rfind("\n")
    if single_newline >= 0:
        return start + single_newline + 1
    return None


def _boundary_overlap_start(text: str, end: int, overlap_chars: int) -> int:
    if overlap_chars <= 0:
        return end

    start = max(0, end - overlap_chars)
    overlap_text = text[start:end].lstrip()

    sentence_start = _find_sentence_start(overlap_text)
    if sentence_start is not None:
        return start + sentence_start

    paragraph_start = overlap_text.rfind("\n\n")
    if paragraph_start >= 0:
        return start + paragraph_start + 2

    line_start = overlap_text.rfind("\n")
    if line_start >= 0:
        return start + line_start + 1

    return start


def _find_sentence_start(text: str) -> int | None:
    for separator in (". ", "! ", "? "):
        position = text.rfind(separator)
        if position >= 0:
            return position + 2
    return None


def _trim_to_boundary(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return ""

    paragraph_break = stripped.rfind("\n\n")
    if paragraph_break >= 0 and paragraph_break >= len(stripped) * 0.5:
        return stripped[: paragraph_break + 2].strip()

    sentence_break = max(stripped.rfind(". "), stripped.rfind("! "), stripped.rfind("? "))
    if sentence_break >= 0 and sentence_break >= len(stripped) * 0.5:
        return stripped[: sentence_break + 1].strip()

    newline_break = stripped.rfind("\n")
    if newline_break >= 0 and newline_break >= len(stripped) * 0.5:
        return stripped[: newline_break + 1].strip()

    return stripped


def _print_documents_summary(documents: list[Document]) -> None:
    parser_name = documents[0].metadata.get("parser", "") if documents else ""
    fallback_reason = documents[0].metadata.get("fallback_reason", "") if documents else ""
    print(f"Parser used: {parser_name}")
    if fallback_reason:
        print(f"Fallback reason: {fallback_reason}")
    print(f"Documents/chunks: {len(documents)}")
    if documents and "page_start" in documents[0].metadata:
        page_start = min(int(doc.metadata["page_start"]) for doc in documents if "page_start" in doc.metadata)
        page_end = max(int(doc.metadata["page_end"]) for doc in documents if "page_end" in doc.metadata)
        print(f"Page range: {page_start}-{page_end}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse a local PDF or Markdown file into LangChain Documents.")
    parser.add_argument("file_path", help="Local PDF or Markdown file path to ingest")
    parser.add_argument("--title", default="", help="Document title to add to chunk context")
    parser.add_argument("--chunk-size-tokens", type=int, default=300)
    parser.add_argument("--chunk-overlap-tokens", type=int, default=40)
    parser.add_argument("--chars-per-token", type=float, default=4.2)
    parser.add_argument("--pymupdf-pages-per-window", type=int, default=10)
    parser.add_argument("--output", default="", help="Optional path to write chunks as text")
    args = parser.parse_args()

    docs = main(
        file_input=args.file_path,
        document_title=args.title,
        chunk_size_tokens=args.chunk_size_tokens,
        chunk_overlap_tokens=args.chunk_overlap_tokens,
        chars_per_token=args.chars_per_token,
        pymupdf_pages_per_window=args.pymupdf_pages_per_window,
    )
    _print_documents_summary(docs)

    if args.output:
        output_path = Path(args.output)
        output_path.write_text(
            "\n\n--- CHUNK ---\n\n".join(doc.page_content for doc in docs),
            encoding="utf-8",
        )
        print(f"Wrote chunks to: {output_path}")

