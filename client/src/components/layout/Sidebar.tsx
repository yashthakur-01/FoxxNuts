'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../supabase/browserClient';
import { useWorkspace } from '../../lib/WorkspaceContext';
import { useTheme } from '../../lib/ThemeContext';
import ThemeToggle from '../ui/ThemeToggle';
import CreateWorkspaceModal from '../CreateWorkspaceModal';

interface SubItem {
  id: string;
  label: string;
  href: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  subItems?: SubItem[];
}

const navItems: NavItem[] = [
  {
    id: 'chatbot',
    label: 'Chatbot',
    href: '/dashboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    href: '/dashboard/knowledge',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    id: 'configuration',
    label: 'Configurations',
    href: '/dashboard/configuration',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    subItems: [
      { id: 'cfg-chatbot', label: 'Chatbot Styling', href: '/dashboard/configuration' },
      { id: 'cfg-prompts', label: 'Prompts & Behavior', href: '/dashboard/configuration/prompts' },
      { id: 'cfg-advanced', label: 'Advanced Settings', href: '/dashboard/configuration/advanced' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    subItems: [
      { id: 'an-overview', label: 'Overview & Rates', href: '/dashboard/analytics' },
      { id: 'an-traces', label: 'Sessions & Traces', href: '/dashboard/analytics/traces' },
      { id: 'an-gaps', label: 'Knowledge Gaps', href: '/dashboard/analytics/gaps' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    href: '/dashboard/settings',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.75c0-.414.336-.75.75-.75h4.5c.414 0 .75.336.75.75V21" />
      </svg>
    ),
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { activeWorkspace, workspaces, setActiveWorkspaceId } = useWorkspace();
  const { theme } = useTheme();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load user session profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, [supabase]);

  // Dropdown expansion state for sub-menus
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    configuration: true,
    analytics: true,
  });

  // Modal and custom dropdown states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const wsDropdownRef = useRef<HTMLDivElement>(null);
  const [mobileWsDropdownOpen, setMobileWsDropdownOpen] = useState(false);
  const mobileWsDropdownRef = useRef<HTMLDivElement>(null);

  // Click-outside listener to close workspace dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wsDropdownRef.current && !wsDropdownRef.current.contains(event.target as Node)) {
        setWsDropdownOpen(false);
      }
      if (mobileWsDropdownRef.current && !mobileWsDropdownRef.current.contains(event.target as Node)) {
        setMobileWsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubMenu = (e: React.MouseEvent, menuId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const isRouteActive = (href: string) => {
    return pathname === href;
  };

  const isParentActive = (item: NavItem) => {
    if (item.href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (item.subItems && item.subItems.length > 0) {
      return pathname === item.href || item.subItems.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  const handleLogout = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetch('/api/customer/logout', {
          method: 'POST',
          headers: { Authorization: session.access_token },
        });
      }
    } catch (err) {
      console.error('Logout cache clearance error:', err);
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  const BRAND_LETTERS = ['F', 'o', 'x', 'x', 'N', 'u', 't', 's'];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col shrink-0 h-screen sticky top-0
          bg-[var(--fn-surface)] border-r border-[var(--fn-border)]
          transition-[width] duration-300 ease-in-out z-40 select-none overflow-hidden
          ${collapsed ? 'w-16 shadow-xs' : 'w-64 shadow-xl'}
        `}
      >
        {/* Header Bar */}
        <div className={`h-16 flex items-center shrink-0 border-b border-[var(--fn-border)] ${!collapsed ? 'px-4 justify-between' : 'justify-center px-0'}`}>
          {!collapsed ? (
            <>
              {/* Logo + Staggered Animated Text when Open */}
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/light_without_text.png"
                  alt="FoxxNuts"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 hidden [.light_&]:block"
                />
                <img
                  src="/dark_without_text.png"
                  alt="FoxxNuts"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 block [.light_&]:hidden"
                />
                <div className="flex items-center overflow-hidden">
                  {BRAND_LETTERS.map((char, index) => (
                    <span
                      key={index}
                      style={{ animationDelay: `${index * 35}ms` }}
                      className="text-lg sm:text-xl font-black text-[var(--fn-text)] tracking-tight inline-block animate-fn-letter-stagger"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Collapse Button */}
              <button
                onClick={onToggle}
                className="p-1.5 rounded-lg text-[var(--fn-text-tertiary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                </svg>
              </button>
            </>
          ) : (
            /* Open Sidebar Button when Collapsed */
            <button
              onClick={onToggle}
              className="w-10 h-10 rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] flex items-center justify-center p-1.5 text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:border-[var(--fn-accent)] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Open sidebar"
            >
              <img
                src="/light_without_text.png"
                alt="FoxxNuts"
                className="w-6 h-6 object-contain hidden [.light_&]:block"
              />
              <img
                src="/dark_without_text.png"
                alt="FoxxNuts"
                className="w-6 h-6 object-contain block [.light_&]:hidden"
              />
            </button>
          )}
        </div>

        {/* Workspace Selector Bar */}
        <div className={`shrink-0 border-b border-[var(--fn-border)] ${!collapsed ? 'p-3.5' : 'py-3 flex justify-center px-2'}`}>
          {workspaces.length > 0 && activeWorkspace ? (
            !collapsed ? (
              <div ref={wsDropdownRef} className="relative space-y-1.5">
                <div className="px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)]">
                    Active Workspace
                  </span>
                </div>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] hover:border-[var(--fn-accent)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3 py-2 transition-all duration-150 cursor-pointer shadow-xs font-medium active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-4 h-4 rounded bg-[var(--fn-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-xs">
                      {(activeWorkspace.workspace_name || 'W')[0].toUpperCase()}
                    </div>
                    <span className="truncate font-semibold">{activeWorkspace.workspace_name || 'Workspace'}</span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 text-[var(--fn-text-tertiary)] shrink-0 transition-transform duration-200 ${wsDropdownOpen ? 'rotate-180 text-[var(--fn-accent)]' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Animated Dropdown Menu */}
                {wsDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] shadow-2xl p-1.5 space-y-1 animate-fn-slide-down backdrop-blur-md">
                    <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                      {workspaces.map(w => {
                        const isSelected = w.id === activeWorkspace.id;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setActiveWorkspaceId(w.id);
                              setWsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[var(--fn-radius-sm)] text-xs transition-colors text-left cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold'
                                : 'text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--fn-accent)] text-white' : 'bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)] border border-[var(--fn-border)]'}`}>
                                {(w.workspace_name || 'W')[0].toUpperCase()}
                              </div>
                              <span className="truncate">{w.workspace_name || 'Workspace'}</span>
                            </div>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-[var(--fn-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-1 border-t border-[var(--fn-border)] space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setWsDropdownOpen(false);
                          setShowCreateModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fn-radius-sm)] text-xs text-[var(--fn-accent)] hover:bg-[var(--fn-elevated)] font-semibold transition-colors cursor-pointer text-left"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Workspace
                      </button>
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setWsDropdownOpen(false)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fn-radius-sm)] text-xs text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12l-.773.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.093c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.855-.108-1.205l-.527-.737a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage Settings
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] flex items-center justify-center text-xs font-bold text-[var(--fn-text-secondary)] shadow-xs"
                title={`Workspace: ${activeWorkspace.workspace_name || 'Active'}`}
              >
                {(activeWorkspace.workspace_name || 'W')[0].toUpperCase()}
              </div>
            )
          ) : (
            /* Option to add workspace if none is set */
            !collapsed ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-full py-2 px-3 rounded-[var(--fn-radius)] bg-[var(--fn-accent)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>+</span> Add Workspace
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="w-9 h-9 rounded-xl bg-[var(--fn-accent)] text-white flex items-center justify-center text-sm font-bold shadow-xs hover:opacity-90 cursor-pointer"
                title="Add Workspace"
              >
                +
              </button>
            )
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-3 px-2 space-y-1.5">
          {navItems.map(item => {
            const parentActive = isParentActive(item);
            const isMenuOpen = expandedMenus[item.id] ?? false;

            return (
              <div key={item.id} className="space-y-1">
                {/* Main Item Link */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={`
                      flex-1 flex items-center rounded-[var(--fn-radius)] text-sm transition-all duration-150 relative group
                      ${!collapsed ? 'px-3 py-2.5 gap-3' : 'w-10 h-10 mx-auto justify-center'}
                      ${
                        parentActive
                          ? 'bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold'
                          : 'text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium'
                      }
                    `}
                    title={collapsed ? item.label : undefined}
                  >
                    {parentActive && !collapsed && (
                      <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-[var(--fn-accent)] rounded-r" />
                    )}
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  </Link>

                  {/* Submenu toggle button when open */}
                  {!collapsed && item.subItems && (
                    <button
                      type="button"
                      onClick={(e) => toggleSubMenu(e, item.id)}
                      className="p-2 text-[var(--fn-text-tertiary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] rounded-md transition-colors cursor-pointer"
                      title={isMenuOpen ? "Collapse submenu" : "Expand submenu"}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Sub-items list */}
                {!collapsed && item.subItems && isMenuOpen && (
                  <div className="pl-8 pr-2 py-1 space-y-1 border-l-2 border-[var(--fn-border)] ml-5 animate-fn-slide-down">
                    {item.subItems.map(sub => {
                      const subActive = isRouteActive(sub.href);
                      return (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          className={`
                            block px-3 py-1.5 rounded-md text-xs transition-colors truncate
                            ${
                              subActive
                                ? 'bg-[var(--fn-elevated)] text-[var(--fn-accent)] font-semibold'
                                : 'text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]/60'
                            }
                          `}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section: ONLY Profile & Theme */}
        <div className="shrink-0 border-t border-[var(--fn-border)] py-3 px-3 space-y-2.5 bg-[var(--fn-surface)]">
          {/* Profile row */}
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--fn-accent)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {(userEmail || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--fn-text)] truncate max-w-[100px]">
                    {userEmail ? userEmail.split('@')[0] : 'Account'}
                  </p>
                  <p className="text-[10px] text-[var(--fn-text-tertiary)] truncate max-w-[100px]">
                    {userEmail || 'Active'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="text-[11px] font-semibold text-[var(--fn-text-secondary)] hover:text-[var(--fn-error)] px-2 py-1 rounded-md transition-colors cursor-pointer"
                title="Sign out"
              >
                Logout
              </button>
            </div>
          ) : (
            <div
              className="w-9 h-9 mx-auto rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] flex items-center justify-center text-xs font-bold text-[var(--fn-text)] shadow-xs"
              title={`Account: ${userEmail || 'User'}`}
            >
              {(userEmail || 'U')[0].toUpperCase()}
            </div>
          )}

          {/* Theme row */}
          <div className={`flex items-center ${!collapsed ? 'justify-between px-1' : 'justify-center'}`}>
            {!collapsed && (
              <span className="text-xs font-medium text-[var(--fn-text-secondary)]">
                Theme
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-[var(--fn-overlay)] z-40 lg:hidden animate-fn-fade-in backdrop-blur-xs"
            onClick={onMobileClose}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--fn-surface)] border-r border-[var(--fn-border)] z-50 lg:hidden animate-fn-slide-up shadow-2xl flex flex-col overflow-hidden">
            {/* Mobile Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--fn-border)] shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/light_without_text.png"
                  alt="FoxxNuts"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 hidden [.light_&]:block"
                />
                <img
                  src="/dark_without_text.png"
                  alt="FoxxNuts"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 block [.light_&]:hidden"
                />
                <div className="flex items-center overflow-hidden">
                  {BRAND_LETTERS.map((char, index) => (
                    <span
                      key={index}
                      style={{ animationDelay: `${index * 35}ms` }}
                      className="text-lg sm:text-xl font-black text-[var(--fn-text)] tracking-tight inline-block animate-fn-letter-stagger"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onMobileClose}
                className="p-2 rounded-[var(--fn-radius-sm)] text-[var(--fn-text-tertiary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]"
              >
                ✕
              </button>
            </div>

            {/* Mobile Workspace Selector */}
            <div className="p-3.5 border-b border-[var(--fn-border)] shrink-0">
              {workspaces.length > 0 && activeWorkspace ? (
                <div ref={mobileWsDropdownRef} className="relative space-y-1.5">
                  <div className="px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)]">
                      Active Workspace
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileWsDropdownOpen(!mobileWsDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3 py-2 transition-all cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-4 h-4 rounded bg-[var(--fn-accent)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {(activeWorkspace.workspace_name || 'W')[0].toUpperCase()}
                      </div>
                      <span className="truncate font-semibold">{activeWorkspace.workspace_name || 'Workspace'}</span>
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-[var(--fn-text-tertiary)] shrink-0 transition-transform duration-200 ${mobileWsDropdownOpen ? 'rotate-180 text-[var(--fn-accent)]' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {mobileWsDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] shadow-2xl p-1.5 space-y-1 animate-fn-slide-down">
                      <div className="max-h-48 overflow-y-auto space-y-0.5 no-scrollbar">
                        {workspaces.map(w => {
                          const isSelected = w.id === activeWorkspace.id;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => {
                                setActiveWorkspaceId(w.id);
                                setMobileWsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[var(--fn-radius-sm)] text-xs transition-colors text-left cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold'
                                  : 'text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--fn-accent)] text-white' : 'bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)]'}`}>
                                  {(w.workspace_name || 'W')[0].toUpperCase()}
                                </div>
                                <span className="truncate">{w.workspace_name || 'Workspace'}</span>
                              </div>
                              {isSelected && (
                                <svg className="w-3.5 h-3.5 text-[var(--fn-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-1 border-t border-[var(--fn-border)] space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setMobileWsDropdownOpen(false);
                            onMobileClose();
                            setShowCreateModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fn-radius-sm)] text-xs text-[var(--fn-accent)] hover:bg-[var(--fn-elevated)] font-semibold transition-colors cursor-pointer text-left"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          New Workspace
                        </button>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => {
                            setMobileWsDropdownOpen(false);
                            onMobileClose();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--fn-radius-sm)] text-xs text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12l-.773.773a1.125 1.125 0 01-1.45.12l-.737-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.093c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.855-.108-1.205l-.527-.737a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.93l.15-.893z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Manage Settings
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(true);
                    onMobileClose();
                  }}
                  className="w-full py-2 px-3 rounded-[var(--fn-radius)] bg-[var(--fn-accent)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>+</span> Add Workspace
                </button>
              )}
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-3 px-3 space-y-1.5">
              {navItems.map(item => (
                <div key={item.id} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={onMobileClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-[var(--fn-radius)] text-sm transition-colors
                      ${
                        isParentActive(item)
                          ? 'bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold'
                          : 'text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]'
                      }
                    `}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>

                  {item.subItems && (
                    <div className="pl-8 pr-2 py-1 space-y-1 border-l-2 border-[var(--fn-border)] ml-4">
                      {item.subItems.map(sub => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          onClick={onMobileClose}
                          className={`
                            block px-3 py-1.5 rounded-md text-xs transition-colors
                            ${
                              isRouteActive(sub.href)
                                ? 'bg-[var(--fn-elevated)] text-[var(--fn-accent)] font-semibold'
                                : 'text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]'
                            }
                          `}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Mobile Bottom */}
            <div className="shrink-0 border-t border-[var(--fn-border)] p-4 space-y-3 bg-[var(--fn-surface)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--fn-accent)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {(userEmail || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[var(--fn-text)] truncate max-w-[120px]">
                    {userEmail || 'My Profile'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-[var(--fn-text-tertiary)] hover:text-[var(--fn-error)] transition-colors cursor-pointer font-medium"
                >
                  Sign out
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[var(--fn-border)]">
                <span className="text-xs text-[var(--fn-text-secondary)] font-medium">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  );
}
