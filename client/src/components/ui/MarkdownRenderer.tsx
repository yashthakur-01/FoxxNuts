"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isDark?: boolean;
}

export default function MarkdownRenderer({
  content,
  className = "",
  isDark = true,
}: MarkdownRendererProps) {
  if (!content || !content.trim()) return null;

  return (
    <div className={`markdown-body break-words leading-relaxed text-sm sm:text-base ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed font-normal">{children}</p>
          ),

          // Headings
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-bold mt-3.5 mb-1.5 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>
          ),

          // Unordered Lists (renders * and - as actual bullet dots)
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1.5 marker:text-current">{children}</ul>
          ),

          // Ordered Lists (1., 2., etc.)
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1.5 marker:text-current">{children}</ol>
          ),

          // List Items
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">{children}</li>
          ),

          // Strong / Bold
          strong: ({ children }) => (
            <strong className="font-semibold text-current">{children}</strong>
          ),

          // Emphasis / Italic
          em: ({ children }) => <em className="italic">{children}</em>,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 underline underline-offset-2 transition-colors cursor-pointer"
            >
              {children}
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote
              className={`border-l-3 pl-3.5 my-2 italic ${
                isDark ? "border-neutral-600 text-neutral-300" : "border-gray-300 text-gray-600"
              }`}
            >
              {children}
            </blockquote>
          ),

          // Inline & Block Code
          code: ({ className: codeClassName, children, ...props }) => {
            const isCodeBlock = /language-/.test(codeClassName || "");

            if (isCodeBlock) {
              return (
                <div
                  className={`my-2.5 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono border ${
                    isDark
                      ? "bg-[#181818] border-[#2A2A2A] text-gray-200"
                      : "bg-gray-100 border-gray-200 text-gray-800"
                  }`}
                >
                  <pre className="p-3">
                    <code {...props}>{children}</code>
                  </pre>
                </div>
              );
            }

            // Inline code snippet
            return (
              <code
                className={`px-1.5 py-0.5 rounded text-[13px] font-mono border ${
                  isDark
                    ? "bg-[#1C1C1C] text-rose-300 border-[#2D2D2D]"
                    : "bg-gray-100 text-rose-600 border-gray-200"
                }`}
                {...props}
              >
                {children}
              </code>
            );
          },

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table
                className={`w-full text-left border-collapse border text-xs sm:text-sm ${
                  isDark ? "border-[#2A2A2A]" : "border-gray-200"
                }`}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className={`px-3 py-2 font-semibold border ${
                isDark ? "bg-[#1C1C1C] border-[#2A2A2A]" : "bg-gray-100 border-gray-200"
              }`}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className={`px-3 py-2 border ${
                isDark ? "border-[#2A2A2A]" : "border-gray-200"
              }`}
            >
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => (
            <hr
              className={`my-3 border-0 border-t ${
                isDark ? "border-[#2A2A2A]" : "border-gray-200"
              }`}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
