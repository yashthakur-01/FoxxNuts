"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../supabase/browserClient";
import { useRouter } from "next/navigation";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Input";
import FileUpload from "../../components/ui/FileUpload";
import { FileItem } from "../../components/ui/FileUpload";
import { useToast } from "../../lib/ToastContext";
import { useTheme } from "../../lib/ThemeContext";

interface UploadedFile {
  file_id: string;
  file_name: string;
  status: "uploaded" | "processing" | "completed" | "failed";
}

const STEPS = [
  { id: 1, label: "Workspace" },
  { id: 2, label: "Knowledge" },
  { id: 3, label: "Chatbot" },
  { id: 4, label: "Configure" },
  { id: 5, label: "Launch" },
];

const PROVIDERS = [
  { value: "groq", label: "Groq (Ultra-Fast Inference)" },
  { value: "openai", label: "OpenAI" },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
  groq: [
    { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Recommended)" },
    { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Fast)" },
    { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
    { value: "qwen/qwen3-32b", label: "Qwen 3 32B" },
    { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  ],
};

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1: Workspace
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Step 2: Files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3: Chatbot
  const [chatbotName, setChatbotName] = useState("AI Assistant");
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Hello! How can I help you today?"
  );
  const [primaryColor, setPrimaryColor] = useState("#E50914");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");

  // Step 4: AI Config
  const [provider, setProvider] = useState("groq");
  const [modelName, setModelName] = useState("openai/gpt-oss-120b");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant."
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chunkSize, setChunkSize] = useState(1024);
  const [chunkOverlap, setChunkOverlap] = useState(250);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.6);

  // Auth & workspace check
  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Check if user already has a workspace with onboarding complete
      const { data: workspaces } = await supabase
        .from("workspace")
        .select("id, onboarding_completed, workspace_name")
        .eq("cust_id", session.user.id);

      if (workspaces && workspaces.length > 0) {
        const completed = workspaces.find(
          (w) => w.onboarding_completed === true
        );
        if (completed) {
          router.push("/dashboard");
          return;
        }
        // Resume onboarding for existing workspace
        setWorkspaceId(workspaces[0].id);
        setWorkspaceName(workspaces[0].workspace_name || "");
      }
      setLoading(false);
    };
    init();
  }, [router, supabase]);

  const uploadToR2WithProgress = (
    url: string,
    file: File,
    onProgress: (p: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable)
          onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve()
          : reject(new Error(`Upload failed: ${xhr.status}`));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });
  };

  // Step 1: Create workspace
  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      toast.error("Please enter a workspace name to continue");
      return;
    }
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      if (workspaceId) {
        // Update existing
        await fetch("/api/customer/updateConfig", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            workspace_name: workspaceName,
            workspace_description: workspaceDesc,
          }),
        });
      } else {
        // Create new
        const slug = workspaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const res = await fetch("/api/customer/createWorkspace", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_name: workspaceName,
            workspace_url: slug || "workspace",
            workspace_description: workspaceDesc,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to create workspace");
        }

        if (data.workspace && data.workspace.length > 0) {
          setWorkspaceId(data.workspace[0].id);
        }
      }

      setStep(2);
    } catch (err: any) {
      console.error("Workspace error:", err);
      toast.error(err.message || "Failed to save workspace");
    } finally {
      setSaving(false);
    }
  };

  // "Configure it later" handler: Mandatory workspace is created and user skips to dashboard
  const handleConfigureLater = async () => {
    if (!workspaceName.trim() && !workspaceId) {
      toast.error("Setting a workspace name is mandatory before proceeding to the dashboard");
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      let targetWsId = workspaceId;

      if (!targetWsId) {
        const slug = workspaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const res = await fetch("/api/customer/createWorkspace", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_name: workspaceName,
            workspace_url: slug || "workspace",
            workspace_description: workspaceDesc,
          }),
        });

        const data = await res.json();
        if (data.success && data.workspace?.[0]?.id) {
          targetWsId = data.workspace[0].id;
        }
      }

      if (targetWsId) {
        await fetch("/api/customer/updateConfig", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_id: targetWsId,
            workspace_name: workspaceName || "Default Workspace",
            onboarding_completed: true,
          }),
        });

        toast.success("Workspace initialized! You can customize settings anytime.");
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Configure later error:", err);
      toast.error(err.message || "Failed to skip onboarding");
    } finally {
      setSaving(false);
    }
  };

  // Step 2: Upload file
  const handleFilesSelected = async (files: File[]) => {
    if (!workspaceId || files.length === 0) return;
    setIsUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      for (const file of files) {
        const tempId = `temp-${Date.now()}`;
        setUploadedFiles((prev) => [
          ...prev,
          { file_id: tempId, file_name: file.name, status: "uploaded" },
        ]);

        const presignedRes = await fetch("/api/customer/uploadFile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            file_name: file.name,
            file_type: file.type || "application/octet-stream",
            file_size: file.size,
          }),
        });

        const presignedData = await presignedRes.json();
        if (!presignedRes.ok || !presignedData.success) {
          toast.error(presignedData.message || `Failed to prepare upload for ${file.name}`);
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.file_id === tempId ? { ...f, status: "failed" } : f
            )
          );
          continue;
        }

        const { upload_url, file_record } = presignedData;
        const realFileId = file_record.id;

        await uploadToR2WithProgress(upload_url, file, () => {});

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file_id === tempId
              ? { file_id: realFileId, file_name: file.name, status: "processing" }
              : f
          )
        );

        toast.info(`Indexing "${file.name}" in background...`);

        fetch("/api/customer/reprocessDocument", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: session.access_token,
          },
          body: JSON.stringify({
            workspace_id: workspaceId,
            file_id: realFileId,
          }),
        }).catch((err) => {
          console.error("Reprocess error:", err);
          fetch("/api/customer/refundUpload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: session.access_token,
            },
          }).catch(console.error);
        });

        // Set status to completed and show toast
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.file_id === realFileId
              ? { ...f, status: "completed" }
              : f
          )
        );
        toast.success(`Upload and indexing completed for "${file.name}"!`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload file. Quota restored.");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch("/api/customer/refundUpload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: session.access_token,
            },
          });
        }
      } catch (refundErr) {
        console.error("Refund error:", refundErr);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Step 3/4: Save config & advance
  const handleSaveConfig = async (nextStep: number) => {
    if (!workspaceId) return;
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/customer/updateConfig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          chatbot_name: chatbotName,
          welcome_message: welcomeMessage,
          primary_color: primaryColor,
          widget_position: widgetPosition,
          provider,
          model_name: modelName,
          temperature,
          system_prompt: systemPrompt,
          chunk_size: chunkSize,
          chunk_overlap: chunkOverlap,
          similarity_threshold: similarityThreshold,
        }),
      });

      setStep(nextStep);
    } catch (err) {
      console.error("Config error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Step 5: Launch
  const handleLaunch = async () => {
    if (!workspaceId) return;
    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/customer/updateConfig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          onboarding_completed: true,
        }),
      });

      router.push("/dashboard");
    } catch (err) {
      console.error("Launch error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--fn-bg)] flex items-center justify-center font-sans">
        <div className="animate-fn-pulse text-[var(--fn-text-secondary)] text-sm font-medium">
          Loading Setup Wizard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fn-bg)] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="flex items-center justify-between h-16 px-6 sm:px-8 border-b border-[var(--fn-border)] bg-[var(--fn-surface)] shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src="/light_with_text.png"
            alt="FoxxNuts"
            className="h-8 w-auto object-contain hidden [.light_&]:block"
          />
          <img
            src="/dark_with_text.png"
            alt="FoxxNuts"
            className="h-8 w-auto object-contain block [.light_&]:hidden"
          />
        </div>

        {/* Global "Configure it later" Header Action */}
        <button
          onClick={handleConfigureLater}
          disabled={saving}
          className="text-xs font-semibold text-[var(--fn-text-secondary)] hover:text-white bg-[var(--fn-elevated)] hover:bg-[var(--fn-elevated)]/80 border border-[var(--fn-border)] px-3.5 py-1.5 rounded-lg transition-all cursor-pointer"
        >
          Configure it later →
        </button>
      </header>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 py-8 px-4">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold
                  transition-colors duration-200 shadow-sm
                  ${
                    step > s.id
                      ? "bg-[var(--fn-accent)] text-white"
                      : step === s.id
                        ? "bg-[var(--fn-accent)] text-white ring-4 ring-[var(--fn-accent)]/20"
                        : "bg-[var(--fn-elevated)] text-[var(--fn-text-tertiary)] border border-[var(--fn-border)]"
                  }
                `}
              >
                {step > s.id ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  s.id
                )}
              </div>
              <span
                className={`text-[11px] font-semibold mt-1.5 ${step >= s.id ? "text-[var(--fn-text)]" : "text-[var(--fn-text-tertiary)]"}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 mt-[-16px] ${step > s.id ? "bg-[var(--fn-accent)]" : "bg-[var(--fn-border)]"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-lg animate-fn-fade-in bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Step 1: Workspace */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Create your workspace
                </h2>
                <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] mt-1">
                  Setting a workspace is <span className="text-[var(--fn-accent)] font-semibold">mandatory</span>. A workspace holds your knowledge base, chatbot, and configuration.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Workspace name *"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Corporation"
                  required
                  hint="This unique name identifies your organization."
                />

                <Textarea
                  label="Description (optional)"
                  value={workspaceDesc}
                  onChange={(e) => setWorkspaceDesc(e.target.value)}
                  placeholder="Internal AI assistant for our team"
                  rows={3}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleCreateWorkspace}
                  loading={saving}
                  disabled={!workspaceName.trim()}
                  className="w-full"
                  size="lg"
                >
                  Continue to Setup →
                </Button>

                <button
                  type="button"
                  onClick={handleConfigureLater}
                  disabled={saving}
                  className="w-full py-2.5 rounded-lg border border-[var(--fn-border)] bg-[var(--fn-elevated)] hover:bg-[var(--fn-elevated)]/80 text-xs font-semibold text-[var(--fn-text-secondary)] hover:text-white transition-all cursor-pointer"
                >
                  Configure it later (Skip to Dashboard)
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Knowledge */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Add your knowledge
                </h2>
                <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] mt-1">
                  Upload documents to build your AI assistant&apos;s knowledge base.
                </p>
              </div>

              <FileUpload
                onFilesSelected={handleFilesSelected}
                disabled={isUploading}
              />

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--fn-text-secondary)]">
                    Uploaded files ({uploadedFiles.length})
                  </p>
                  {uploadedFiles.map((f) => (
                    <FileItem
                      key={f.file_id}
                      fileName={f.file_name}
                      status={f.status}
                    />
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    {uploadedFiles.length > 0 ? "Continue →" : "Next Step →"}
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={handleConfigureLater}
                  className="w-full py-2 text-center text-xs text-[var(--fn-text-tertiary)] hover:text-white transition-colors cursor-pointer"
                >
                  Configure it later (Skip to Dashboard)
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Chatbot */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Configure your chatbot
                </h2>
                <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] mt-1">
                  Customize how your AI assistant looks and greets users.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Chatbot name"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="AI Assistant"
                />

                <Textarea
                  label="Welcome message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Hello! How can I help you today?"
                  rows={2}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                    Primary color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-full cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs px-3 py-2 rounded-[var(--fn-radius)] font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                    Widget position
                  </label>
                  <select
                    value={widgetPosition}
                    onChange={(e) => setWidgetPosition(e.target.value)}
                    className="w-full bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs px-3.5 py-2.5 rounded-[var(--fn-radius)] focus:outline-none focus:border-[var(--fn-accent)] cursor-pointer"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(4)}
                    loading={saving}
                    className="flex-1"
                  >
                    Continue →
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={handleConfigureLater}
                  className="w-full py-2 text-center text-xs text-[var(--fn-text-tertiary)] hover:text-white transition-colors cursor-pointer"
                >
                  Configure it later (Skip to Dashboard)
                </button>
              </div>
            </div>
          )}

          {/* Step 4: AI Configuration */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  AI Configuration
                </h2>
                <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] mt-1">
                  Choose your AI model and configure retrieval behavior.
                </p>
              </div>

              {/* Basic */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                    LLM Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      setModelName(MODELS[e.target.value]?.[0]?.value || "");
                    }}
                    className="w-full bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs px-3.5 py-2.5 rounded-[var(--fn-radius)] focus:outline-none focus:border-[var(--fn-accent)] cursor-pointer"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                    Model
                  </label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs px-3.5 py-2.5 rounded-[var(--fn-radius)] focus:outline-none focus:border-[var(--fn-accent)] cursor-pointer"
                  >
                    {(MODELS[provider] || []).map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[var(--fn-text-secondary)]">Temperature:</span>
                    <span className="font-mono text-[var(--fn-accent)] font-bold">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-full accent-[var(--fn-accent)] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--fn-text-tertiary)]">
                    <span>Precise (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>

                <Textarea
                  label="System prompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant."
                  rows={3}
                />
              </div>

              {/* Advanced Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] transition-colors cursor-pointer"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
                Advanced settings
              </button>

              {showAdvanced && (
                <div className="space-y-4 pl-4 border-l-2 border-[var(--fn-border)] animate-fn-slide-down">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Chunk size"
                      type="number"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                    />
                    <Input
                      label="Chunk overlap"
                      type="number"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[var(--fn-text-secondary)]">Similarity threshold:</span>
                      <span className="font-mono text-[var(--fn-accent)] font-bold">{similarityThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={similarityThreshold}
                      onChange={(e) =>
                        setSimilarityThreshold(Number(e.target.value))
                      }
                      className="w-full accent-[var(--fn-accent)] cursor-pointer"
                    />
                    <p className="text-[11px] text-[var(--fn-text-tertiary)] leading-relaxed mt-1">
                      💡 Tip: If relevant context is not retrieved even though present in documents, try lowering (relaxing) this threshold.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setStep(3)}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={() => handleSaveConfig(5)}
                    loading={saving}
                    className="flex-1"
                  >
                    Continue →
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={handleConfigureLater}
                  className="w-full py-2 text-center text-xs text-[var(--fn-text-tertiary)] hover:text-white transition-colors cursor-pointer"
                >
                  Configure it later (Skip to Dashboard)
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {step === 5 && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <svg
                    className="w-7 h-7 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Your workspace is ready!
                </h2>
                <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] mt-1">
                  Everything is set up. Launch your dashboard to start interacting.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Workspace",
                    value: workspaceName,
                  },
                  {
                    label: "Knowledge",
                    value:
                      uploadedFiles.length > 0
                        ? `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""} uploaded`
                        : "No files yet",
                  },
                  { label: "Chatbot", value: chatbotName },
                  {
                    label: "AI Model",
                    value: `${provider} / ${modelName}`,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 border border-[var(--fn-border)] rounded-[var(--fn-radius)] bg-[var(--fn-elevated)]"
                  >
                    <span className="text-xs font-medium text-[var(--fn-text-secondary)]">
                      {item.label}
                    </span>
                    <span className="text-xs font-bold text-[var(--fn-text)] font-mono">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleLaunch}
                loading={saving}
                className="w-full"
                size="lg"
              >
                Launch Dashboard →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
