'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex items-center gap-1 border-b border-[var(--fn-border)] ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium
            transition-colors duration-200 cursor-pointer
            ${
              activeTab === tab.id
                ? 'text-[var(--fn-accent)]'
                : 'text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]'
            }
          `}
        >
          {tab.icon && <span className="shrink-0">{tab.icon}</span>}
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--fn-accent)] rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
