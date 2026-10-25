"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../supabase/browserClient";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import { useToast } from "../../../lib/ToastContext";
import Input from "../../../components/ui/Input";
import WorkspaceDropdown from "../../../components/WorkspaceDropdown";
import { SettingInfoButton } from "../../../components/ui/SettingInfoModal";
import PageHeader from "../../../components/layout/PageHeader";
import FoxMascotLoader from "../../../components/ui/FoxMascotLoader";
import ChatInterface, { ChatMessage } from "../../../components/ChatInterface";

const COLOR_PRESETS = [
  { name: "Crimson Red", value: "#E50914" },
  { name: "Electric Blue", value: "#2563EB" },
  { name: "Emerald Green", value: "#059669" },
  { name: "Royal Purple", value: "#7C3AED" },
  { name: "Amber Gold", value: "#D97706" },
  { name: "Midnight Black", value: "#1E293B" },
];

export default function ChatbotStylingConfigPage() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [mobileTab, setMobileTab] = useState<"settings" | "preview">("settings");

  // Form State
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [chatbotName, setChatbotName] = useState("AI Assistant");
  const [chatbotDesc, setChatbotDesc] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E50914");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [chatbotTheme, setChatbotTheme] = useState<"dark" | "light">("dark");

  // Live Chatbot Preview State
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([]);
  const [isPreviewChatting, setIsPreviewChatting] = useState(false);

  // Populate from activeWorkspace
  useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.workspace_name || "");
      setWorkspaceDesc(activeWorkspace.workspace_description || "");
      setChatbotName(activeWorkspace.chatbot_name || "AI Assistant");
      setChatbotDesc(activeWorkspace.chatbot_description || "Powered by FoxxNuts");
      setPrimaryColor(activeWorkspace.primary_color || "#E50914");
      setWidgetPosition(activeWorkspace.widget_position || "bottom-right");
      setChatbotTheme(activeWorkspace.chatbot_theme === "light" ? "light" : "dark");

      setPreviewMessages([
        {
          id: "preview-welcome",
          role: "ai",
          content:
            activeWorkspace.welcome_message ||
            "👋 Hi there! I'm the FoxxNuts Assistant. Ask me anything about our LangGraph architecture, dashboard features, or how to embed a chatbot on your site!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setHasChanges(false);
    }
  }, [activeWorkspace]);

  const markDirty = () => {
    if (!hasChanges) setHasChanges(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
          chatbot_name: chatbotName,
          chatbot_description: chatbotDesc,
          primary_color: primaryColor,
          widget_position: widgetPosition,
          chatbot_theme: chatbotTheme,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save styling configuration");
      }

      toast.success("Chatbot styling updated successfully!");
      setHasChanges(false);
      await refreshWorkspaces();
    } catch (err: any) {
      console.error("Save config error:", err);
      toast.error(err.message || "Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  // Preview interactive message handler
  const handlePreviewSend = async (text: string) => {
    if (!text?.trim() || isPreviewChatting) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "human",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setPreviewMessages((prev) => [...prev, userMsg]);
    setIsPreviewChatting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/chat/sendMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token || "",
        },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          session_id: "preview-session-id",
          message: text,
        }),
      });

      const botMsgId = (Date.now() + 1).toString();
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: "ai",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setPreviewMessages((prev) => [...prev, botMsg]);

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setPreviewMessages((prev) =>
            prev.map((m) => (m.id === botMsgId ? { ...m, content: full } : m))
          );
        }
      }
    } catch (err) {
      setPreviewMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "I am ready to assist based on your current knowledge documents and system prompts.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsPreviewChatting(false);
    }
  };

  const handleResetSession = () => {
    setPreviewMessages([
      {
        id: "preview-welcome-reset",
        role: "ai",
        content:
          activeWorkspace?.welcome_message ||
          "👋 Hi there! I'm the FoxxNuts Assistant. Ask me anything about our LangGraph architecture, dashboard features, or how to embed a chatbot on your site!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (wsLoading) {
    return <FoxMascotLoader variant="page" message="Loading chatbot styling preferences..." />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      <PageHeader
        title="Chatbot Styling & Theme"
        eyebrow="Appearance & Identity"
        description="Customize display identity, brand accent colors, theme styles, and widget alignment with live preview."
      >
        <WorkspaceDropdown />
        <SettingInfoButton settingId="styling-section" size="sm" />
        {hasChanges && (
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Unsaved Changes
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          {saving ? "Saving..." : "Save Styling"}
        </button>
      </PageHeader>

      {/* Mobile Tab Switcher (Only visible on < lg screens) */}
      <div className="lg:hidden px-4 pt-2.5 pb-1 shrink-0">
        <div className="flex items-center p-1 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTab("settings")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "settings"
                ? "bg-[var(--fn-accent)] text-white shadow-xs"
                : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Theme Settings
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === "preview"
                ? "bg-[var(--fn-accent)] text-white shadow-xs"
                : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Preview
          </button>
        </div>
      </div>

      {/* 50/50 Split Screen: Left Scrollable Settings | Right Fixed Live Chatbot */}
      <div className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start lg:items-stretch p-4 sm:p-6 lg:p-7 overflow-y-auto lg:overflow-hidden">
        {/* ============================================================
            LEFT HALF: INDEPENDENTLY SCROLLABLE FORM
            ============================================================ */}
        <div
          className={`lg:col-span-7 w-full h-auto lg:h-full flex flex-col bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-4 sm:p-6 shadow-sm ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="w-full space-y-6 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0 lg:pr-3 no-scrollbar">
            {/* Identity Group */}
            <div className="space-y-4">
              <div className="border-b border-[var(--fn-border)] pb-2.5">
                <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)]" />
                  Public Display & Branding
                </h3>
                <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                  How your chatbot introduces itself to website visitors
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Chatbot Display Name"
                  value={chatbotName}
                  onChange={(e) => {
                    setChatbotName(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. FoxxNuts Assistant"
                  hint="Shown in the header and launcher bubble."
                />

                <Input
                  label="Tagline / Subtitle"
                  value={chatbotDesc}
                  onChange={(e) => {
                    setChatbotDesc(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. Powered by AI Knowledge Base"
                  hint="Sub-caption under the chatbot title."
                />
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[var(--fn-border)] pb-2.5">
                <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Brand Color & Accents
                </h3>
                <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                  Select a preset palette or enter a custom brand hex code
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                  Primary Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2.5 bg-[var(--fn-elevated)] border border-[var(--fn-border)] px-3.5 py-2 rounded-[var(--fn-radius)]">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        markDirty();
                      }}
                      className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-xs font-semibold text-[var(--fn-text)] uppercase">
                      {primaryColor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(preset.value);
                          markDirty();
                        }}
                        style={{ backgroundColor: preset.value }}
                        className={`w-7 h-7 rounded-full transition-all hover:scale-110 cursor-pointer ${
                          primaryColor.toLowerCase() === preset.value.toLowerCase()
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--fn-bg)] scale-105"
                            : "opacity-85 hover:opacity-100"
                        }`}
                        title={preset.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Mode & Position */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[var(--fn-border)] pb-2.5">
                <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Theme Mode & Screen Alignment
                </h3>
                <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                  Light or dark mode styling and screen placement
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Theme Mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                    Widget Theme
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[var(--fn-elevated)] p-1.5 rounded-[var(--fn-radius)] border border-[var(--fn-border)]">
                    <button
                      type="button"
                      onClick={() => {
                        setChatbotTheme("dark");
                        markDirty();
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-[var(--fn-radius-sm)] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        chatbotTheme === "dark"
                          ? "bg-[var(--fn-surface)] text-[var(--fn-accent)] border border-[var(--fn-border)] shadow-xs"
                          : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                      Dark Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setChatbotTheme("light");
                        markDirty();
                      }}
                      className={`py-2 px-3 text-xs font-bold rounded-[var(--fn-radius-sm)] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        chatbotTheme === "light"
                          ? "bg-[var(--fn-surface)] text-[var(--fn-accent)] border border-[var(--fn-border)] shadow-xs"
                          : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                      Light Mode
                    </button>
                  </div>
                </div>

                {/* Position */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[var(--fn-text-secondary)]">
                    Widget Alignment
                  </label>
                  <select
                    value={widgetPosition}
                    onChange={(e) => {
                      setWidgetPosition(e.target.value);
                      markDirty();
                    }}
                    className="w-full bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3.5 py-2.5 focus:outline-none focus:border-[var(--fn-accent)] cursor-pointer font-medium"
                  >
                    <option value="bottom-right">Bottom Right (Recommended)</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Workspace Label Reference */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[var(--fn-border)] pb-2.5">
                <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  Workspace Reference
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Workspace Title"
                  value={workspaceName}
                  onChange={(e) => {
                    setWorkspaceName(e.target.value);
                    markDirty();
                  }}
                  placeholder="Workspace title"
                />

                <Input
                  label="Internal Notes"
                  value={workspaceDesc}
                  onChange={(e) => {
                    setWorkspaceDesc(e.target.value);
                    markDirty();
                  }}
                  placeholder="Internal reference notes"
                />
              </div>
            </div>

            {/* Mobile Switch to Live Preview CTA */}
            <div className="lg:hidden pt-2 pb-1">
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className="w-full py-3 px-4 rounded-xl bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Preview Live Chatbot Styling →
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT HALF: FIXED LIVE CHATBOT SANDBOX
            ============================================================ */}
        <div
          className={`lg:col-span-5 w-full h-[540px] sm:h-[600px] lg:h-full flex flex-col space-y-2 min-h-0 shrink-0 ${
            mobileTab === "settings" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between px-1 shrink-0">
            <span className="text-xs font-bold text-[var(--fn-text)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Interactive Sandbox
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--fn-text-tertiary)] font-mono">
                Theme: {chatbotTheme}
              </span>
              <button
                type="button"
                onClick={() => setMobileTab("settings")}
                className="lg:hidden text-xs text-[var(--fn-accent)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← Edit Styling
              </button>
            </div>
          </div>

          {/* Fixed Live Chatbot Sandbox with ChatInterface */}
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <ChatInterface
              config={{
                chatbot_name: chatbotName || "FoxxNuts Assistant",
                chatbot_description: chatbotDesc || "Powered by FoxxNuts",
                primary_color: primaryColor,
                chatbot_theme: chatbotTheme,
                welcome_message:
                  activeWorkspace?.welcome_message ||
                  "👋 Hi there! I'm the FoxxNuts Assistant. Ask me anything about our LangGraph architecture, dashboard features, or how to embed a chatbot on your site!",
                suggested_questions:
                  activeWorkspace?.suggested_questions && activeWorkspace.suggested_questions.length > 0
                    ? activeWorkspace.suggested_questions
                    : [
                        "What topics are covered in our documents?",
                        "Can you summarize key policies?",
                      ],
              }}
              messages={previewMessages}
              isChatting={isPreviewChatting}
              onSendMessage={handlePreviewSend}
              onResetSession={handleResetSession}
              showLiveBadge={true}
              className="w-full h-full flex-1 min-h-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
