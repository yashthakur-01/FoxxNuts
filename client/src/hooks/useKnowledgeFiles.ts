"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../supabase/browserClient";

const supabase = createClient();

export interface WorkspaceFile {
  file_id: string;
  file_name: string;
  created_at: string;
  file_size?: number;
  status: "uploaded" | "processing" | "completed" | "failed";
  metadata?: any;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: session.access_token,
  };
}

export function useKnowledgeFiles(workspaceId: string | null) {
  return useQuery<{ files: WorkspaceFile[] }>({
    queryKey: ["workspace_files", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { files: [] };
      const headers = await getAuthHeaders();
      const res = await fetch("/api/customer/getFiles", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId }),
      });
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
