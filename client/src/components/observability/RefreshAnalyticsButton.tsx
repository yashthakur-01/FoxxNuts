"use client";

import React, { useState } from "react";
import Button from "../ui/Button";

interface RefreshAnalyticsButtonProps {
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
  className?: string;
  label?: string;
}

export default function RefreshAnalyticsButton({
  onRefresh,
  isRefreshing: externalIsRefreshing,
  className = "",
  label = "Refresh",
}: RefreshAnalyticsButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const isBusy = Boolean(externalIsRefreshing || internalLoading);

  const handleClick = async () => {
    if (isBusy) return;
    setInternalLoading(true);
    try {
      await onRefresh();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--fn-border)] bg-[var(--fn-elevated)] text-[var(--fn-text)] text-xs font-semibold hover:bg-[var(--fn-surface)] hover:border-[var(--fn-accent)]/50 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs select-none ${className}`}
      title={isBusy ? "Refreshing..." : "Fetch fresh analytics"}
    >
      <svg
        className={`w-3.5 h-3.5 text-[var(--fn-accent)] transition-transform duration-500 ${
          isBusy ? "animate-spin text-[var(--fn-accent)]" : ""
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.25}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
      <span>{isBusy ? "Refreshing..." : "Refresh"}</span>
    </button>
  );
}
