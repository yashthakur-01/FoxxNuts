'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../supabase/browserClient';

export interface Workspace {
  id: string;
  workspace_name: string;
  workspace_description?: string;
  workspace_url?: string;
  onboarding_completed?: boolean;
  chatbot_name?: string;
  chatbot_description?: string;
  chatbot_avatar?: string;
  primary_color?: string;
  welcome_message?: string;
  suggested_questions?: string[];
  widget_position?: string;
  chatbot_theme?: string;
  temperature?: number;
  model_name?: string;
  provider?: string;
  system_prompt?: string;
  search_enabled?: boolean;
  chunk_size?: number;
  chunk_overlap?: number;
  similarity_threshold?: number;
  top_k?: number;
  allowed_domains?: string;
  created_at: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        setLoading(false);
        if (!pathname.startsWith('/login') && !pathname.startsWith('/embed')) {
          router.replace('/login');
        }
        return;
      }

      const res = await fetch('/api/customer/getWorkspaces', {
        headers: { 'Authorization': session.access_token },
      });

      if (res.status === 401) {
        router.replace('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        const ws: Workspace[] = data.workspaces || [];
        setWorkspaces(ws);

        // If user has no workspace or none with completed onboarding, redirect to onboarding wizard
        if (ws.length === 0 || !ws.some(w => w.onboarding_completed)) {
          if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/login')) {
            router.push('/onboarding');
            return;
          }
        }

        // Restore last active workspace from localStorage, or use first
        if (ws.length > 0) {
          const stored = localStorage.getItem('fn-active-workspace');
          const match = ws.find((w: Workspace) => w.id === stored);
          setActiveWorkspaceId(match ? match.id : ws[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, pathname]);

  useEffect(() => {
    refreshWorkspaces();

    // Listen to real-time auth changes (signout, token expiry, session refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (!pathname.startsWith('/login') && !pathname.startsWith('/embed')) {
          router.replace('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshWorkspaces, supabase, router, pathname]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('fn-active-workspace', activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        setActiveWorkspaceId,
        refreshWorkspaces,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
