"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Button from "../components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client-side runtime errors
    console.error("FoxxNuts Runtime Boundary Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--fn-bg)] text-[var(--fn-text)] flex flex-col items-center justify-center p-6 selection:bg-[var(--fn-accent)] selection:text-white font-sans">
      <div className="w-full max-w-md bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-8 sm:p-10 shadow-xl text-center space-y-6 animate-fn-fade-in">
        {/* Subtle Alert Badge */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--fn-accent-subtle)] border border-[var(--fn-border-subtle)] flex items-center justify-center text-[var(--fn-accent)]">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Headline & Description */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[var(--fn-accent)] font-semibold">
            System Notice
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--fn-text)]">
            Something went off track
          </h1>
          <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
            An unexpected error occurred while rendering this interface. Your workspace data remains safe.
          </p>
        </div>

        {/* Optional Error Digest */}
        {error?.digest && (
          <div className="px-3 py-2 rounded-lg bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[11px] font-mono text-[var(--fn-text-tertiary)] break-all">
            Digest: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="md" onClick={() => reset()} className="w-full sm:w-auto">
            Try again
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
