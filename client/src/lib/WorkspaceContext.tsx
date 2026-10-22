'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fn-active-workspace') || null;
    }
    return null;
  });

  const { data, isLoading: queryLoading } = useQuery<{ workspaces: Workspace[] }>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        if (!pathname.startsWith('/login') && !pathname.startsWith('/embed')) {
          router.replace('/login');
        }
        return { workspaces: [] };
      }

      const res = await fetch('/api/customer/getWorkspaces', {
        headers: { 'Authorization': session.access_token },
      });

      if (res.status === 401) {
        router.replace('/login');
        return { workspaces: [] };
      }

      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const workspaces = useMemo(() => data?.workspaces || [], [data?.workspaces]);
  const loading = queryLoading;

  const refreshWorkspaces = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
  }, [queryClient]);

  // Handle workspace redirection & default selection
  useEffect(() => {
    if (!queryLoading) {
      // If user has no workspace or none with completed onboarding, redirect to onboarding wizard
      if (workspaces.length === 0 || !workspaces.some(w => w.onboarding_completed)) {
        if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/login') && !pathname.startsWith('/embed')) {
          router.push('/onboarding');
          return;
        }
      }

      if (workspaces.length > 0) {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('fn-active-workspace') : null;
        const match = workspaces.find((w: Workspace) => w.id === stored);
        if (!activeWorkspaceId || !workspaces.some(w => w.id === activeWorkspaceId)) {
          setActiveWorkspaceId(match ? match.id : workspaces[0].id);
        }
      }
    }
  }, [workspaces, queryLoading, pathname, router, activeWorkspaceId]);

  // Listen to real-time auth changes (signout, token expiry, session refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        queryClient.clear();
        if (!pathname.startsWith('/login') && !pathname.startsWith('/embed')) {
          router.replace('/login');
        }
      } else if (event === 'SIGNED_IN') {
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, pathname, queryClient]);

  useEffect(() => {
    if (activeWorkspaceId) {
      localStorage.setItem('fn-active-workspace', activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  const activeWorkspace = useMemo(
    () => workspaces.find(w => w.id === activeWorkspaceId) || null,
    [workspaces, activeWorkspaceId]
  );

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
