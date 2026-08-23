"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "../lib/WorkspaceContext";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

interface WorkspaceDropdownProps {
  className?: string;
  variant?: "header" | "inline";
}

export default function WorkspaceDropdown({
  className = "",
  variant = "header",
}: WorkspaceDropdownProps) {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!activeWorkspace) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 border border-white/20 text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Create Workspace
        </button>
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={
            variant === "header"
              ? "flex items-center gap-2 bg-black/35 hover:bg-black/55 text-white border border-white/25 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shadow-xs backdrop-blur-xs select-none active:scale-[0.98]"
              : "flex items-center justify-between gap-2 bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] hover:border-[var(--fn-accent)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3 py-2 transition-all duration-150 cursor-pointer shadow-xs font-medium active:scale-[0.99]"
          }
          title="Switch active workspace"
        >
          <div className="w-4 h-4 rounded bg-white/20 text-white text-[10px] font-bold flex items-center justify-center shrink-0 border border-white/25">
            {(activeWorkspace.workspace_name || "W")[0].toUpperCase()}
          </div>
          <span className="truncate max-w-[150px] sm:max-w-[200px]">
            {activeWorkspace.workspace_name || "Workspace"}
          </span>
          <svg
            className={`w-3.5 h-3.5 opacity-80 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-white opacity-100" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {/* Dropdown Floating Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[230px] bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] shadow-2xl p-1.5 space-y-1 animate-fn-slide-down backdrop-blur-md">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] border-b border-[var(--fn-border)] pb-1.5">
              Select Workspace
            </div>

            <div className="max-h-52 overflow-y-auto space-y-0.5 no-scrollbar py-0.5">
              {workspaces.map((w) => {
                const isSelected = w.id === activeWorkspace.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkspaceId(w.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[var(--fn-radius-sm)] text-xs transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold"
                        : "text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[var(--fn-accent)] text-white"
                            : "bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)] border border-[var(--fn-border)]"
                        }`}
                      >
                        {(w.workspace_name || "W")[0].toUpperCase()}
                      </div>
                      <span className="truncate">
                        {w.workspace_name || "Workspace"}
                      </span>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5 text-[var(--fn-accent)] shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t border-[var(--fn-border)]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fn-radius-sm)] text-xs text-[var(--fn-accent)] hover:bg-[var(--fn-elevated)] font-semibold transition-colors cursor-pointer text-left"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                New Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
