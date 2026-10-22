"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/browserClient";
import type { ChatMessage } from "../components/ChatInterface";

const supabase = createClient();

/**
 * Fetch authenticated chat history for a specific workspace and session.
 */
export function useChatHistory(workspaceId: string | null, sessionId: string | null) {
  return useQuery<{ messages: ChatMessage[] }>({
    queryKey: ["chat_history", workspaceId, sessionId],
    queryFn: async () => {
      if (!workspaceId || !sessionId) return { messages: [] };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return { messages: [] };

      const res = await fetch("/api/chat/getHistory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_id: sessionId,
        }),
      });

      if (!res.ok) throw new Error("Failed to load chat history");
      return res.json();
    },
    enabled: Boolean(workspaceId && sessionId),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch public chatbot configuration for the embed widget.
 */
export function useEmbedConfig(workspaceId: string | null) {
  return useQuery({
    queryKey: ["embed_config", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null;
      const res = await fetch("/api/embed/getConfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to load embed configuration");
      const data = await res.json();
      return data.config || null;
    },
    enabled: Boolean(workspaceId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch public chat history for a visitor session in the embed widget.
 */
export function useEmbedHistory(workspaceId: string | null, visitorId: string | null) {
  return useQuery<{ messages: ChatMessage[] }>({
    queryKey: ["embed_history", workspaceId, visitorId],
    queryFn: async () => {
      if (!workspaceId || !visitorId) return { messages: [] };
      const res = await fetch("/api/embed/getHistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_id: visitorId,
        }),
      });
      if (!res.ok) throw new Error("Failed to load embed history");
      return res.json();
    },
    enabled: Boolean(workspaceId && visitorId),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
