"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/browserClient";
import type { Metrics, Trace, GapItem } from "../types";

const supabase = createClient();

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: session.access_token,
  };
}

/**
 * Fetch 30-day KPI metrics & minute/daily timeline throughput.
 */
export function useObservabilityMetrics(workspaceId: string | null) {
  return useQuery<{ metrics: Metrics | null }>({
    queryKey: ["observability_metrics", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { metrics: null };
      const headers = await getAuthHeaders();
      const res = await fetch("/api/customer/observability/metrics", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch execution traces with pagination.
 */
export function useObservabilityTraces(
  workspaceId: string | null,
  page: number = 1,
  limit: number = 100
) {
  return useQuery<{ traces: Trace[]; total: number }>({
    queryKey: ["observability_traces", workspaceId, page, limit],
    queryFn: async () => {
      if (!workspaceId) return { traces: [], total: 0 };
      const headers = await getAuthHeaders();
      const res = await fetch("/api/customer/observability/traces", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId, page, limit }),
      });
      if (!res.ok) throw new Error("Failed to fetch traces");
      return res.json();
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch knowledge gaps where context retrieval failed or scored zero.
 */
export function useObservabilityGaps(workspaceId: string | null, limit: number = 50) {
  return useQuery<{ gaps: GapItem[]; total_gaps: number }>({
    queryKey: ["observability_gaps", workspaceId, limit],
    queryFn: async () => {
      if (!workspaceId) return { gaps: [], total_gaps: 0 };
      const headers = await getAuthHeaders();
      const res = await fetch("/api/customer/observability/gaps", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId, limit }),
      });
      if (!res.ok) throw new Error("Failed to fetch knowledge gaps");
      return res.json();
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Hook providing manual refresh actions for analytics pages.
 * Bypasses both TanStack client cache and server Redis cache to force fresh DB reads.
 */
export function useRefreshAnalytics(workspaceId: string | null) {
  const queryClient = useQueryClient();

  const refreshMetrics = async () => {
    if (!workspaceId) return;
    const headers = await getAuthHeaders();
    const res = await fetch("/api/customer/observability/metrics", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspace_id: workspaceId, refresh: true }),
    });
    if (res.ok) {
      const data = await res.json();
      queryClient.setQueryData(["observability_metrics", workspaceId], data);
    }
  };

  const refreshTraces = async (page: number = 1, limit: number = 100) => {
    if (!workspaceId) return;
    const headers = await getAuthHeaders();
    const res = await fetch("/api/customer/observability/traces", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspace_id: workspaceId, page, limit, refresh: true }),
    });
    if (res.ok) {
      const data = await res.json();
      queryClient.setQueryData(["observability_traces", workspaceId, page, limit], data);
    }
  };

  const refreshGaps = async (limit: number = 50) => {
    if (!workspaceId) return;
    const headers = await getAuthHeaders();
    const res = await fetch("/api/customer/observability/gaps", {
      method: "POST",
      headers,
      body: JSON.stringify({ workspace_id: workspaceId, limit, refresh: true }),
    });
    if (res.ok) {
      const data = await res.json();
      queryClient.setQueryData(["observability_gaps", workspaceId, limit], data);
    }
  };

  const refreshAll = async () => {
    await Promise.allSettled([
      refreshMetrics(),
      refreshTraces(),
      refreshGaps(),
    ]);
  };

  return {
    refreshMetrics,
    refreshTraces,
    refreshGaps,
    refreshAll,
  };
}
