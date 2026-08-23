"use client";

import React, { useState } from "react";
import { createClient } from "../supabase/browserClient";
import { useWorkspace } from "../lib/WorkspaceContext";
import { useToast } from "../lib/ToastContext";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import Button from "./ui/Button";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceModal({
  isOpen,
  onClose,
}: CreateWorkspaceModalProps) {
  const supabase = createClient();
  const { setActiveWorkspaceId, refreshWorkspaces } = useWorkspace();
  const { toast } = useToast();

  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error("Workspace name is required");
      return;
    }

    const slug = (workspaceUrl.trim() || workspaceName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setCreating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/createWorkspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_name: workspaceName.trim(),
          workspace_url: slug || "workspace",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create workspace");
      }

      toast.success("Workspace created successfully!");
      setWorkspaceName("");
      setWorkspaceUrl("");
      onClose();
      await refreshWorkspaces();

      if (data.workspace?.[0]?.id) {
        setActiveWorkspaceId(data.workspace[0].id);
      }
    } catch (err: any) {
      console.error("Create workspace error:", err);
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setWorkspaceName("");
      setWorkspaceUrl("");
      onClose();
    }
  };

  const generatedSlug = (workspaceUrl.trim() || workspaceName.trim())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Workspace"
      size="md"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreate}
            loading={creating}
            disabled={!workspaceName.trim() || creating}
          >
            Create Workspace
          </Button>
        </>
      }
    >
      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          label="Workspace Name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="e.g. Acme Corp Knowledge Base"
          required
          autoFocus
        />

        <div className="space-y-1.5">
          <Input
            label="Workspace Identifier / Slug"
            value={workspaceUrl}
            onChange={(e) => setWorkspaceUrl(e.target.value)}
            placeholder="acme-corp"
            hint={
              generatedSlug
                ? `Identifier: ${generatedSlug}`
                : "Used to uniquely namespace your vectors and telemetry."
            }
          />
        </div>
      </form>
    </Modal>
  );
}
