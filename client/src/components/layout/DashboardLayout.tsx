'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';
import { useWorkspace } from '../../lib/WorkspaceContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { activeWorkspace } = useWorkspace();

  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-[var(--fn-bg)] font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen h-[100dvh] overflow-hidden">
        {/* Fixed Top Bar (Clean, Slim, Non-overwhelming, Fixed at Top) */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-11 sm:h-14 px-3 sm:px-6 border-b border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Mobile Navigation Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] transition-colors cursor-pointer shrink-0"
              aria-label="Open Navigation Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Brand / Active Workspace Identifier */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <img
                src="/light_without_text.png"
                alt="FoxxNuts"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 hidden [.light_&]:block"
              />
              <img
                src="/dark_without_text.png"
                alt="FoxxNuts"
                className="w-5 h-5 sm:w-6 sm:h-6 object-contain shrink-0 block [.light_&]:hidden"
              />
              <span className="text-xs sm:text-base font-bold text-[var(--fn-text)] tracking-tight truncate">
                {activeWorkspace?.workspace_name || "FoxxNuts AI"}
              </span>
            </div>
          </div>

          {/* Right Topbar Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col bg-[var(--fn-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
