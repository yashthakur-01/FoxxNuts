"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../supabase/browserClient";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import { useToast } from "../../../lib/ToastContext";
import Button from "../../../components/ui/Button";
import Input, { Textarea } from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Skeleton from "../../../components/ui/Skeleton";
import WorkspaceDropdown from "../../../components/WorkspaceDropdown";

export default function WorkspaceSettingsPage() {
  const supabase = createClient();
  const {
    activeWorkspaceId,
    activeWorkspace,
    workspaces,
    setActiveWorkspaceId,
    refreshWorkspaces,
    loading: wsLoading,
  } = useWorkspace();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [allowedDomains, setAllowedDomains] = useState("*");

  // Create Workspace Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsUrl, setNewWsUrl] = useState("");
  const [creatingWs, setCreatingWs] = useState(false);

  // Danger Zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWs, setDeletingWs] = useState(false);
  const [confirmWsName, setConfirmWsName] = useState("");

  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.workspace_name || "");
      setWorkspaceDesc(activeWorkspace.workspace_description || "");
      setAllowedDomains(activeWorkspace.allowed_domains || "*");
    }
  }, [activeWorkspace]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/updateConfig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          workspace_name: workspaceName,
          workspace_description: workspaceDesc,
          allowed_domains: allowedDomains,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update workspace settings");
      }

      toast.success("Workspace settings updated!");
      await refreshWorkspaces();
    } catch (err: any) {
      console.error("Settings save error:", err);
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) {
      toast.error("Please provide a workspace name");
      return;
    }

    const slug = (newWsUrl.trim() || newWsName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setCreatingWs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/createWorkspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_name: newWsName.trim(),
          workspace_url: slug || "workspace",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create workspace");
      }

      toast.success("Workspace created successfully!");
      setShowCreateModal(false);
      setNewWsName("");
      setNewWsUrl("");
      await refreshWorkspaces();

      if (data.workspace?.[0]?.id) {
        setActiveWorkspaceId(data.workspace[0].id);
      }
    } catch (err: any) {
      console.error("Create workspace error:", err);
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setCreatingWs(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!activeWorkspaceId || confirmWsName !== activeWorkspace?.workspace_name) {
      toast.error("Workspace name does not match");
      return;
    }

    setDeletingWs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/deleteWorkspace", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to initiate workspace deletion");
      }

      const taskId = data.task_id;
      toast.info("Deleting workspace and cleaning up files in background...");

      // Poll background Celery task status until completion
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/customer/taskStatus?taskId=${taskId}`, {
            headers: {
              Authorization: session.access_token,
            },
          });
          const statusData = await statusRes.json();

          if (statusData.ready) {
            clearInterval(pollInterval);
            setDeletingWs(false);

            if (statusData.successful) {
              toast.success("Workspace and all files deleted successfully!");
              setShowDeleteModal(false);
              setConfirmWsName("");
              await refreshWorkspaces();
            } else {
              const errMsg = statusData.error || "Failed to delete workspace files from storage";
              toast.error(`Failed to delete workspace: ${errMsg}`);
            }
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setDeletingWs(false);
          toast.error(`Error checking deletion status: ${pollErr.message}`);
        }
      }, 1500);
    } catch (err: any) {
      console.error("Delete workspace error:", err);
      toast.error(err.message || "Failed to delete workspace");
      setDeletingWs(false);
    }
  };

  if (wsLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton height={48} width="30%" />
        <Skeleton height={300} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* Vibrant Full-Bleed End-to-End Red Ribbon Header */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Workspace & Settings
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Manage workspace preferences, allowed domain whitelist, and organization settings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WorkspaceDropdown />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-5 sm:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* If No Workspace is set / active */}
          {!activeWorkspace && (
            <div className="p-8 border border-[var(--fn-border)] rounded-2xl bg-[var(--fn-surface)] text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-[var(--fn-accent)]/10 text-[var(--fn-accent)] flex items-center justify-center text-2xl mx-auto shadow-xs">
                🏢
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-extrabold text-[var(--fn-text)]">
                  No Workspace Selected
                </h3>
                <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                  You don&apos;t have an active workspace configured yet. Create a workspace to start uploading knowledge documents and deploying your AI assistant.
                </p>
              </div>

              <div className="pt-2">
                <Button onClick={() => setShowCreateModal(true)} size="md">
                  + Create Your Workspace
                </Button>
              </div>
            </div>
          )}

          {activeWorkspace && (
            <>
              {/* Switcher & Create Workspace Bar */}
              <div className="p-5 border border-[var(--fn-border)] rounded-2xl bg-[var(--fn-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-[var(--fn-text)]">Active Workspace</h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Switch between workspaces or initialize a new one
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={activeWorkspaceId || ""}
                    onChange={(e) => setActiveWorkspaceId(e.target.value)}
                    className="bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3.5 py-2.5 focus:outline-none focus:border-[var(--fn-accent)] font-medium cursor-pointer"
                  >
                    {workspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.workspace_name || "Workspace"}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    icon={
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    }
                  >
                    New Workspace
                  </Button>
                </div>
              </div>

              {/* General Settings Form */}
              <form onSubmit={handleSaveGeneral} className="p-6 border border-[var(--fn-border)] rounded-2xl bg-[var(--fn-surface)] space-y-5 shadow-sm">
                <div className="border-b border-[var(--fn-border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)]" />
                    Workspace Details
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Update workspace name and internal description
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Workspace Name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Acme Corporation"
                    required
                  />

                  <Input
                    label="Workspace URL Slug"
                    value={activeWorkspace?.workspace_url || ""}
                    disabled
                    hint="Identifier used in embed script URLs."
                  />
                </div>

                <Textarea
                  label="Description (optional)"
                  value={workspaceDesc}
                  onChange={(e) => setWorkspaceDesc(e.target.value)}
                  placeholder="Internal description for your team"
                  rows={2}
                />

                <div className="flex justify-end pt-1">
                  <Button type="submit" loading={saving} size="sm">
                    Save Details
                  </Button>
                </div>
              </form>

              {/* Security & Allowed Domains */}
              <form onSubmit={handleSaveGeneral} className="p-6 border border-[var(--fn-border)] rounded-2xl bg-[var(--fn-surface)] space-y-4 shadow-sm">
                <div className="border-b border-[var(--fn-border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    Domain Security Whitelist
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Restrict widget embedding to approved hostnames
                  </p>
                </div>

                <Input
                  label="Allowed Host Domains"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="* or yourdomain.com, app.yourdomain.com"
                  hint="Use * to allow all domains, or comma-separate allowed origins."
                />

                <div className="flex justify-end pt-1">
                  <Button type="submit" loading={saving} size="sm">
                    Save Security Whitelist
                  </Button>
                </div>
              </form>

              {/* Danger Zone */}
              <div className="p-6 border border-[var(--fn-error)]/25 rounded-2xl bg-[var(--fn-surface)] space-y-4 shadow-sm">
                <div className="border-b border-[var(--fn-border)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--fn-error)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-error)]" />
                    Danger Zone
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Irreversible actions regarding this workspace
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[var(--fn-text)]">
                      Delete this workspace
                    </p>
                    <p className="text-[11px] text-[var(--fn-text-secondary)] mt-0.5">
                      Permanently delete this workspace, documents, vector indexes, and all analytics telemetry.
                    </p>
                  </div>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setConfirmWsName("");
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete Workspace
                  </Button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Modal: Create Workspace */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !creatingWs && setShowCreateModal(false)}
        title="Create New Workspace"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              disabled={creatingWs}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateWorkspace}
              loading={creatingWs}
              disabled={!newWsName.trim()}
            >
              Create Workspace
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            label="Workspace Name *"
            value={newWsName}
            onChange={(e) => {
              setNewWsName(e.target.value);
              if (!newWsUrl) {
                setNewWsUrl(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }
            }}
            placeholder="e.g. Acme Corp Support"
            required
          />

          <Input
            label="URL Slug"
            value={newWsUrl}
            onChange={(e) => setNewWsUrl(e.target.value)}
            placeholder="e.g. acme-support"
            hint="Lowercase letters, numbers, and hyphens."
          />
        </form>
      </Modal>

      {/* Modal: Delete Workspace Confirmation */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deletingWs && setShowDeleteModal(false)}
        title="Delete Workspace"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={deletingWs}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteWorkspace}
              loading={deletingWs}
              disabled={confirmWsName !== activeWorkspace?.workspace_name}
            >
              Permanently Delete
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--fn-text)] leading-relaxed">
            This will permanently remove the workspace{" "}
            <span className="font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)]">
              {activeWorkspace?.workspace_name}
            </span>{" "}
            and all associated documents, vectors, and traces.
          </p>
          <p className="text-xs text-[var(--fn-text-secondary)]">
            Please type{" "}
            <span className="font-mono font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)] select-all">
              {activeWorkspace?.workspace_name}
            </span>{" "}
            below to confirm:
          </p>
          <Input
            value={confirmWsName}
            onChange={(e) => setConfirmWsName(e.target.value)}
            placeholder="Type workspace name..."
          />
        </div>
      </Modal>
    </div>
  );
}
