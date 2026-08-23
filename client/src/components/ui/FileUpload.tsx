'use client';

import React, { useCallback, useRef, useState } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
}

export default function FileUpload({
  onFilesSelected,
  accept = '.pdf,application/pdf',
  multiple = true,
  maxSizeMB = 10,
  disabled = false,
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-[var(--fn-radius-lg)]
        transition-all duration-200 cursor-pointer
        flex flex-col items-center justify-center py-10 px-6 text-center
        ${
          isDragging
            ? 'border-[var(--fn-accent)] bg-[var(--fn-accent-subtle)]'
            : 'border-[var(--fn-border)] hover:border-[var(--fn-text-tertiary)] bg-[var(--fn-surface)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      <svg
        className={`w-8 h-8 mb-3 ${isDragging ? 'text-[var(--fn-accent)]' : 'text-[var(--fn-text-tertiary)]'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
        />
      </svg>

      <p className="text-sm font-medium text-[var(--fn-text)] mb-1">
        {isDragging ? 'Drop PDF files here' : 'Drag PDF files here'}
      </p>
      <p className="text-xs text-[var(--fn-text-tertiary)] mb-3">or click to browse</p>
      <p className="text-[10px] text-[var(--fn-text-tertiary)]">
        PDF documents only — Max {maxSizeMB}MB per file
      </p>
    </div>
  );
}

// File list item with status
interface FileItemProps {
  fileName: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  progress?: number;
  onDelete?: () => void;
  onReprocess?: () => void;
  deleting?: boolean;
  reprocessing?: boolean;
}

const statusConfig = {
  uploaded: { label: 'Uploaded', color: 'text-[var(--fn-info)]', dot: 'bg-[var(--fn-info)]' },
  processing: { label: 'Processing', color: 'text-[var(--fn-warning)]', dot: 'bg-[var(--fn-warning)]' },
  completed: { label: 'Completed', color: 'text-[var(--fn-success)]', dot: 'bg-[var(--fn-success)]' },
  failed: { label: 'Failed', color: 'text-[var(--fn-error)]', dot: 'bg-[var(--fn-error)]' },
};

export function FileItem({
  fileName,
  status,
  progress,
  onDelete,
  onReprocess,
  deleting,
  reprocessing,
}: FileItemProps) {
  const config = statusConfig[status] || statusConfig.uploaded;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border border-[var(--fn-border)] rounded-[var(--fn-radius)] group hover:border-[var(--fn-text-tertiary)] transition-colors">
      <svg className="w-4 h-4 text-[var(--fn-text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--fn-text)] truncate">{fileName}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${config.dot} ${status === 'processing' ? 'animate-fn-pulse' : ''}`} />
          <span className={`text-xs ${config.color}`}>{config.label}</span>
        </div>
      </div>

      {progress !== undefined && status === 'processing' && (
        <div className="w-16 h-1.5 bg-[var(--fn-border)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--fn-warning)] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {status === 'failed' && onReprocess && (
          <button
            onClick={onReprocess}
            disabled={reprocessing}
            className="text-xs text-[var(--fn-warning)] hover:text-[var(--fn-text)] transition-colors disabled:opacity-50 cursor-pointer px-1.5 py-0.5"
          >
            {reprocessing ? '...' : 'Retry'}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-xs text-[var(--fn-text-tertiary)] hover:text-[var(--fn-error)] transition-colors disabled:opacity-50 cursor-pointer px-1.5 py-0.5"
          >
            {deleting ? '...' : 'Delete'}
          </button>
        )}
      </div>
    </div>
  );
}
