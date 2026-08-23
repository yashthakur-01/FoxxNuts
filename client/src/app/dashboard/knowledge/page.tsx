"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "../../../supabase/browserClient";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import { useToast } from "../../../lib/ToastContext";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import FileUpload from "../../../components/ui/FileUpload";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton, { SkeletonRow } from "../../../components/ui/Skeleton";

interface WorkspaceFile {
  file_id: string;
  file_name: string;
  status: "uploaded" | "processing" | "completed" | "failed";
  file_path?: string;
  created_at: string;
  updated_at?: string;
}

export default function KnowledgePage() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Click-outside listener to close filter dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");

  // Action states
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<WorkspaceFile | null>(null);

  const fetchFiles = async () => {
    if (!activeWorkspaceId) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/customer/getFiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({ workspace_id: activeWorkspaceId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error("Error fetching files:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchFiles();
    }
  }, [activeWorkspaceId]);

  // Upload helpers
  const uploadToR2WithProgress = (
    url: string,
    file: File,
    onProgress: (p: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed: ${xhr.status}`));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    if (!activeWorkspaceId) return;

    const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast.error(`"${file.name}" is not supported. Only PDF files are accepted.`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        toast.error(`"${file.name}" is ${sizeMB}MB. Maximum allowed file size is 10MB.`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress(0);
      setUploadStatusText(`Uploading ${file.name} (${i + 1}/${validFiles.length})...`);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        // 1. Get Presigned URL with fileSize metadata
        const presignedRes = await fetch("/api/customer/uploadFile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_id: activeWorkspaceId,
            fileName: file.name,
            fileType: file.type || "application/octet-stream",
            fileSize: file.size,
          }),
        });

        if (!presignedRes.ok) {
          const errData = await presignedRes.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to get presigned URL");
        }
        const { uploadUrl, uniqueFileName, key } = await presignedRes.json();

        // 2. Upload to Cloudflare R2
        await uploadToR2WithProgress(uploadUrl, file, (p) => setUploadProgress(p));

        // 3. Save record in Supabase
        await supabase.from("files").insert({
          file_id: uniqueFileName,
          file_name: file.name,
          workspace_id: activeWorkspaceId,
          file_path: key,
          status: "uploaded",
        });

        // 4. Trigger processing in FastAPI / Celery
        await fetch("/api/customer/processDocument", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_id: activeWorkspaceId,
            fileName: uniqueFileName,
          }),
        });

        toast.info(`Uploaded ${file.name}. Indexing in background...`);
        await fetchFiles();

        // Poll for processing completion
        const pollInterval = setInterval(async () => {
          const { data } = await supabase
            .from("files")
            .select("status")
            .eq("file_id", uniqueFileName)
            .maybeSingle();

          if (data?.status === "completed" || data?.status === "failed") {
            setFiles((prev) =>
              prev.map((f) =>
                f.file_id === uniqueFileName
                  ? { ...f, status: data.status as WorkspaceFile["status"] }
                  : f
              )
            );
            if (data.status === "completed") {
              toast.success(`Upload and indexing completed for "${file.name}"!`);
            } else {
              // Refund daily upload quota in Redis so user doesn't lose quota on failure
              fetch("/api/customer/refundUpload", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: session.access_token,
                },
              }).catch(console.error);

              toast.error(
                `Processing failed for "${file.name}". Please delete the file and re-upload. Your daily upload count has been restored.`
              );
            }
            clearInterval(pollInterval);
          }
        }, 2500);
      } catch (err: any) {
        console.error("Upload error:", err);
        // Refund daily upload quota if upload failed before or during storage
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await fetch("/api/customer/refundUpload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: session.access_token,
              },
            });
          }
        } catch (refundErr) {
          console.error("Refund error:", refundErr);
        }
        toast.error(`Upload failed for "${file.name}": ${err.message}. Daily upload count restored.`);
      }
    }

    setIsUploading(false);
    setShowUploadModal(false);
    setUploadProgress(0);
    setUploadStatusText("");
  };

  const handleReprocess = async (fileId: string) => {
    if (!activeWorkspaceId) return;
    setReprocessingId(fileId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/reprocessDocument", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          fileName: fileId,
        }),
      });

      if (!res.ok) throw new Error("Reprocess request failed");

      setFiles((prev) =>
        prev.map((f) => (f.file_id === fileId ? { ...f, status: "processing" } : f))
      );
      toast.info("Reprocessing queued...");

      const pollInterval = setInterval(async () => {
        const { data } = await supabase
          .from("files")
          .select("status")
          .eq("file_id", fileId)
          .maybeSingle();

        if (data?.status === "completed" || data?.status === "failed") {
          setFiles((prev) =>
            prev.map((f) =>
              f.file_id === fileId ? { ...f, status: data.status as WorkspaceFile["status"] } : f
            )
          );
          setReprocessingId(null);
          if (data.status === "completed") {
            toast.success("Document reprocessed and indexed successfully!");
          } else {
            toast.error(
              "Reprocessing failed. Please delete the file and re-upload."
            );
          }
          clearInterval(pollInterval);
        }
      }, 2500);
    } catch (err: any) {
      console.error("Reprocess error:", err);
      toast.error(err.message || "Failed to reprocess file");
      setReprocessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteFile || !activeWorkspaceId) return;
    const fileId = confirmDeleteFile.file_id;
    setDeletingId(fileId);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/deleteFile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          file_id: fileId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete file");
      }

      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
      toast.success("File and vectors deleted");
      setConfirmDeleteFile(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesSearch = file.file_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || file.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [files, searchQuery, statusFilter]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return (
        <div className="w-8 h-8 rounded-[var(--fn-radius-sm)] bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-[10px]">
          PDF
        </div>
      );
    }
    if (ext === "txt" || ext === "md") {
      return (
        <div className="w-8 h-8 rounded-[var(--fn-radius-sm)] bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-[10px]">
          TXT
        </div>
      );
    }
    if (ext === "docx" || ext === "doc") {
      return (
        <div className="w-8 h-8 rounded-[var(--fn-radius-sm)] bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold text-[10px]">
          DOC
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-[var(--fn-radius-sm)] bg-[var(--fn-elevated)] text-[var(--fn-text-tertiary)] flex items-center justify-center font-bold text-[10px]">
        FILE
      </div>
    );
  };

  if (wsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton height={32} width="20%" />
        <Skeleton height={40} />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* Vibrant Full-Bleed End-to-End Red Ribbon Header */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Manage files and documents indexed for <span className="font-bold text-white">{activeWorkspace?.workspace_name || "your workspace"}</span>
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-900 border border-white/20 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Upload Files
        </button>
      </div>

      {/* Main Content Scroll Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-5 sm:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name..."
            size="sm"
          />
        </div>
        <div ref={filterRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="h-[38px] flex items-center gap-2.5 bg-[var(--fn-surface)] hover:bg-[var(--fn-elevated)] border border-[var(--fn-border)] hover:border-[var(--fn-accent)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3.5 transition-all duration-150 cursor-pointer font-medium shadow-xs"
          >
            <span className="text-[var(--fn-text-tertiary)]">Status:</span>
            <span className="capitalize font-semibold text-[var(--fn-text)]">
              {statusFilter === "all" ? "All statuses" : statusFilter}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-[var(--fn-text-tertiary)] transition-transform duration-200 ${filterOpen ? "rotate-180 text-[var(--fn-accent)]" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-40 w-44 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] shadow-2xl p-1.5 space-y-0.5 animate-fn-slide-down backdrop-blur-md">
              {[
                { label: "All statuses", value: "all" },
                { label: "Completed", value: "completed" },
                { label: "Processing", value: "processing" },
                { label: "Failed", value: "failed" },
                { label: "Uploaded", value: "uploaded" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.value);
                    setFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--fn-radius-sm)] text-xs transition-colors text-left cursor-pointer ${
                    statusFilter === opt.value
                      ? "bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold"
                      : "text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium"
                  }`}
                >
                  <span>{opt.label}</span>
                  {statusFilter === opt.value && (
                    <svg className="w-3.5 h-3.5 text-[var(--fn-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Files Table / List */}
      <div className="border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] bg-[var(--fn-surface)] overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <EmptyState
            icon={
              <svg className="w-12 h-12 text-[var(--fn-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            }
            title={searchQuery || statusFilter !== "all" ? "No matching documents found" : "No documents added yet"}
            description={
              searchQuery || statusFilter !== "all"
                ? "No files match your search query. Try adjusting your search keywords or resetting filters."
                : "Upload PDF documents, policy guides, or FAQs to train your AI assistant and ground chat responses."
            }
            action={{
              label: "Add Documents",
              onClick: () => setShowUploadModal(true),
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--fn-border)] bg-[var(--fn-elevated)]/50 text-[11px] font-medium text-[var(--fn-text-tertiary)] uppercase tracking-wider">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden md:table-cell">Added</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--fn-border)]">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.file_id}
                    className="hover:bg-[var(--fn-elevated)]/40 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.file_name)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--fn-text)] truncate max-w-[240px] sm:max-w-xs md:max-w-sm">
                            {file.file_name}
                          </p>
                          <p className="text-[11px] text-[var(--fn-text-tertiary)] font-mono truncate max-w-[200px]">
                            {file.file_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          file.status === "completed"
                            ? "success"
                            : file.status === "processing"
                            ? "warning"
                            : file.status === "failed"
                            ? "error"
                            : "info"
                        }
                        dot
                      >
                        {file.status === "completed"
                          ? "Indexed"
                          : file.status === "processing"
                          ? "Processing"
                          : file.status === "failed"
                          ? "Failed"
                          : "Uploaded"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--fn-text-secondary)] hidden md:table-cell">
                      {formatDate(file.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {file.status === "failed" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReprocess(file.file_id)}
                            disabled={reprocessingId === file.file_id}
                            loading={reprocessingId === file.file_id}
                          >
                            Retry
                          </Button>
                        )}
                        <button
                          onClick={() => setConfirmDeleteFile(file)}
                          className="p-1.5 rounded-[var(--fn-radius-sm)] text-[var(--fn-text-tertiary)] hover:text-[var(--fn-error)] hover:bg-[var(--fn-error)]/10 transition-colors cursor-pointer"
                          title="Delete file"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => !isUploading && setShowUploadModal(false)}
        title="Upload Knowledge Documents"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--fn-text-secondary)]">
            Upload PDF, text, markdown, or Word documents. They will be parsed, chunked, embedded with Cohere, and stored in vector database for retrieval.
          </p>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--fn-text)] font-medium">{uploadStatusText}</span>
                <span className="text-[var(--fn-text-secondary)]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--fn-border)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--fn-accent)] transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDeleteFile}
        onClose={() => !deletingId && setConfirmDeleteFile(null)}
        title="Delete Document"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmDeleteFile(null)}
              disabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={!!deletingId}
            >
              Delete Document
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--fn-text)] leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)]">
              {confirmDeleteFile?.file_name}
            </span>
            ?
          </p>
          <p className="text-xs text-[var(--fn-text-secondary)]">
            This will permanently remove the database record, Cloudflare R2 file storage, and all vector embeddings in Pinecone. This action cannot be undone.
          </p>
        </div>
      </Modal>
        </div>
      </div>
    </div>
  );
}
