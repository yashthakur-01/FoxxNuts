'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import ThemeToggle from '../ui/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--fn-bg)] font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-[var(--fn-border)] bg-[var(--fn-surface)] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-[var(--fn-radius-sm)] text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/light_without_text.png"
              alt="FoxxNuts"
              className="w-7 h-7 object-contain shrink-0 hidden [.light_&]:block"
            />
            <img
              src="/dark_without_text.png"
              alt="FoxxNuts"
              className="w-7 h-7 object-contain shrink-0 block [.light_&]:hidden"
            />
            <span className="text-base font-extrabold text-[var(--fn-text)] tracking-tight">FoxxNuts</span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 flex flex-col min-w-0 h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden bg-[var(--fn-bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
