"use client";

import React, { useEffect } from "react";
import Button from "../../components/ui/Button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardErrorPage({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard Route Error Boundary:", error);
  }, [error]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center animate-fn-fade-in font-sans">
      <div className="max-w-md w-full bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-8 space-y-5 shadow-lg">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--fn-accent-subtle)] border border-[var(--fn-border-subtle)] flex items-center justify-center text-[var(--fn-accent)]">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[var(--fn-text)] tracking-tight">
            Failed to load view
          </h2>
          <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
            There was a problem loading this section. You can retry loading or navigate to another view from the sidebar.
          </p>
        </div>

        {error?.message && (
          <div className="p-2.5 rounded-lg bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[11px] font-mono text-[var(--fn-text-tertiary)] max-h-24 overflow-y-auto text-left">
            {error.message}
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <Button variant="primary" size="sm" onClick={() => reset()}>
            Retry view
          </Button>
        </div>
      </div>
    </div>
  );
}
