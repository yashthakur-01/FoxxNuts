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
      className={`w-full px-3 sm:px-6 lg:px-8 pt-3 sm:pt-6 pb-2 sm:pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0 bg-transparent transition-colors ${className}`}
    >
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        {eyebrow && (
          <div className="hidden sm:block text-[11px] font-mono tracking-wider uppercase text-[var(--fn-text-tertiary)] font-medium truncate">
            {eyebrow}
          </div>
        )}
        <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[var(--fn-text)] tracking-tight font-sans truncate">
          {title}
        </h1>
        {description && (
          <div className="text-xs sm:text-sm text-[var(--fn-text-secondary)] font-normal leading-relaxed line-clamp-1 sm:line-clamp-none">
            {description}
          </div>
        )}
      </div>

      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          {actions || children}
        </div>
      )}
    </div>
  );
}
