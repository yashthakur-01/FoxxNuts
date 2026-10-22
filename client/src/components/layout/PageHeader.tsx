"use client";

import React from "react";

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader
 * 
 * Standardized, production-grade page header for all FoxxNuts dashboard routes.
 * Replaces heavy saturated banners with a refined, Linear/Vercel-grade composition:
 * clear typographic hierarchy, subtle surface elevation, and flexible action slot.
 */
export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div
      className={`w-full bg-[var(--fn-surface)]/80 backdrop-blur-md border-b border-[var(--fn-border)] px-6 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 transition-colors ${className}`}
    >
      <div className="space-y-1 min-w-0">
        {eyebrow && (
          <div className="text-[11px] font-mono tracking-wider uppercase text-[var(--fn-text-tertiary)] font-medium truncate">
            {eyebrow}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)] tracking-tight font-sans truncate">
          {title}
        </h1>
        {description && (
          <div className="text-xs sm:text-sm text-[var(--fn-text-secondary)] font-normal leading-relaxed truncate">
            {description}
          </div>
        )}
      </div>

      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions || children}
        </div>
      )}
    </div>
  );
}
