"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../../supabase/browserClient";
import { useWorkspace } from "../../../lib/WorkspaceContext";
import { useToast } from "../../../lib/ToastContext";
import Input from "../../../components/ui/Input";
import Skeleton from "../../../components/ui/Skeleton";
import WorkspaceDropdown from "../../../components/WorkspaceDropdown";
import { SettingInfoButton } from "../../../components/ui/SettingInfoModal";

const COLOR_PRESETS = [
  { name: "Crimson Red", value: "#E50914" },
  { name: "Electric Blue", value: "#2563EB" },
  { name: "Emerald Green", value: "#059669" },
  { name: "Royal Purple", value: "#7C3AED" },
  { name: "Amber Gold", value: "#D97706" },
  { name: "Midnight Black", value: "#1E293B" },
];

interface PreviewMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function ChatbotStylingConfigPage() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form State
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [chatbotName, setChatbotName] = useState("AI Assistant");
  const [chatbotDesc, setChatbotDesc] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#E50914");
  const [widgetPosition, setWidgetPosition] = useState("bottom-right");
  const [chatbotTheme, setChatbotTheme] = useState<"dark" | "light">("dark");

  // Live Chatbot Preview State
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([]);
  const [previewInput, setPreviewInput] = useState("");
  const [isPreviewChatting, setIsPreviewChatting] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const previewEndRef = useRef<HTMLDivElement>(null);
  const previewInputRef = useRef<HTMLTextAreaElement>(null);

  const handlePreviewInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreviewInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 110)}px`;
  };

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
          role: "bot",
          text: activeWorkspace.welcome_message || "Hello! How can I help you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setHasChanges(false);
    }
  }, [activeWorkspace]);

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

  const markDirty = () => {
    if (!hasChanges) setHasChanges(true);
  };

  // Preview interactive message handler
  const handlePreviewSend = async (customText?: string) => {
    const text = customText || previewInput.trim();
    if (!text || isPreviewChatting) return;

    const userMsg: PreviewMessage = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (!customText) {
      setPreviewInput("");
      if (previewInputRef.current) {
        previewInputRef.current.style.height = "38px";
      }
    }
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
      const botMsg: PreviewMessage = {
        id: botMsgId,
        role: "bot",
        text: "",
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
            prev.map((m) => (m.id === botMsgId ? { ...m, text: full } : m))
          );
        }
      }
    } catch (err) {
      setPreviewMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "bot",
          text: "I am ready to assist based on your current knowledge documents and system prompts.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsPreviewChatting(false);
    }
  };

  if (wsLoading) {
    return (
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        <Skeleton height={48} width="30%" />
        <Skeleton height={600} />
      </div>
    );
  }

  const isDarkPreview = chatbotTheme === "dark";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* ============================================================
          VIBRANT FULL-BLEED END-TO-END RED RIBBON HEADER
          ============================================================ */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Chatbot Styling & Theme
            </h1>
            <SettingInfoButton settingId="styling-section" size="md" className="text-white/80 hover:text-white hover:bg-white/20" />
          </div>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Customize display identity, brand accent colors, theme styles, and widget alignment with live preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WorkspaceDropdown />
          {hasChanges && (
            <span className="px-3 py-1 rounded-lg bg-black/40 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved Changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-900 border border-white/20 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {saving ? "Saving..." : "Save Styling"}
          </button>
        </div>
      </div>

      {/* 50/50 Split Screen: Left Scrollable Settings | Right Fixed Live Chatbot */}
      <div className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch p-5 sm:p-7 overflow-hidden">
        {/* ============================================================
            LEFT HALF: INDEPENDENTLY SCROLLABLE FORM
            ============================================================ */}
        <div className="lg:col-span-7 h-full flex flex-col overflow-hidden min-h-0 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex-1 min-h-0 overflow-y-auto pr-3 space-y-6 no-scrollbar">
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
                      🌙 Dark Mode
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
                      ☀️ Light Mode
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
          </div>
        </div>

        {/* ============================================================
            RIGHT HALF: FIXED LIVE CHATBOT SANDBOX
            ============================================================ */}
        <div className="lg:col-span-5 h-full flex flex-col space-y-2 overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-1 shrink-0">
            <span className="text-xs font-bold text-[var(--fn-text)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Interactive Sandbox
            </span>
            <span className="text-[11px] text-[var(--fn-text-tertiary)] font-mono">
              Theme: {chatbotTheme}
            </span>
          </div>

          {/* Fixed Live Chatbot Sandbox (Dynamically adapts to selected Dark/Light Widget Theme) */}
          <div
            className={`w-full flex-1 border rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-0 transition-colors duration-200 ${
              isDarkPreview
                ? "bg-[#0E0E0E] text-white border-[#222222]"
                : "bg-[#FFFFFF] text-gray-900 border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              style={{ backgroundColor: primaryColor }}
              className="px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-xs select-none"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-extrabold text-sm shrink-0 border border-white/25">
                  {(chatbotName || "A")[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{chatbotName}</h3>
                  <p className="text-[11px] sm:text-xs text-white/80 leading-tight truncate">{chatbotDesc || "Powered by FoxxNuts"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs bg-black/25 text-white px-3 py-1 rounded-full backdrop-blur-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Assistant
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewMessages([
                      {
                        id: "welcome-reset",
                        role: "bot",
                        text: activeWorkspace?.welcome_message || "Hello! How can I help you today?",
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                      },
                    ])
                  }
                  className="p-1.5 rounded-lg text-white/80 hover:bg-black/20 hover:text-white transition-colors cursor-pointer"
                  title="Reset conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto p-5 space-y-4 transition-colors duration-200 ${
                isDarkPreview ? "bg-[#080808]" : "bg-gray-50"
              }`}
            >
              {previewMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    style={msg.role === "user" ? { backgroundColor: primaryColor } : {}}
                    className={`max-w-[85%] sm:max-w-[78%] rounded-[var(--fn-radius-lg)] px-4 py-3 text-sm leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "text-white rounded-br-xs font-medium"
                        : isDarkPreview
                        ? "bg-[#141414] text-gray-100 border border-[#2A2A2A] rounded-bl-xs"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-xs shadow-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span
                    className={`text-[10px] mt-1 px-1 ${
                      isDarkPreview ? "text-neutral-500" : "text-gray-400"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing Indicator */}
              {isPreviewChatting && (
                <div className="flex flex-col items-start">
                  <div
                    className={`rounded-[var(--fn-radius-lg)] rounded-bl-xs px-4 py-3 flex items-center gap-1.5 shadow-xs border ${
                      isDarkPreview
                        ? "bg-[#141414] border-[#2A2A2A]"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={previewEndRef} />
            </div>

            {/* Suggested Question Pills */}
            {(activeWorkspace?.suggested_questions || [
              "What topics are covered in our documents?",
              "Can you summarize key policies?",
            ]).length > 0 &&
              previewMessages.length <= 1 && (
                <div
                  className={`px-5 py-3 border-t flex flex-wrap gap-2 shrink-0 transition-colors duration-200 ${
                    isDarkPreview
                      ? "bg-[#0E0E0E] border-[#222222]"
                      : "bg-white border-gray-200"
                  }`}
                >
                  {(
                    activeWorkspace?.suggested_questions || [
                      "What topics are covered in our documents?",
                      "Can you summarize key policies?",
                    ]
                  ).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePreviewSend(q)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer truncate max-w-full font-medium border ${
                        isDarkPreview
                          ? "bg-[#1A1A1A] hover:bg-[#252525] border-[#2A2A2A] text-gray-300 hover:text-white"
                          : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800 hover:text-gray-900"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handlePreviewSend();
              }}
              className={`p-4 border-t flex items-end gap-3 shrink-0 transition-colors duration-200 ${
                isDarkPreview
                  ? "bg-[#0E0E0E] border-[#222222]"
                  : "bg-white border-gray-200"
              }`}
            >
              <textarea
                ref={previewInputRef}
                value={previewInput}
                onChange={handlePreviewInputChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePreviewSend();
                  }
                }}
                rows={1}
                placeholder="Ask a question..."
                disabled={isPreviewChatting}
                style={{
                  height: "44px",
                  borderColor: isInputFocused ? primaryColor : (isDarkPreview ? "#2A2A2A" : "#E5E7EB"),
                  boxShadow: isInputFocused ? `0 0 0 1px ${primaryColor}40` : "none",
                  outline: "none",
                }}
                className={`flex-1 border text-sm rounded-[var(--fn-radius)] px-4 py-2.5 transition-all font-medium resize-none min-h-[44px] max-h-[128px] overflow-y-auto leading-relaxed ${
                  isDarkPreview
                    ? "bg-[#141414] text-white placeholder:text-neutral-500"
                    : "bg-gray-50 text-gray-900 placeholder:text-gray-400"
                }`}
              />
              <button
                type="submit"
                disabled={!previewInput.trim() || isPreviewChatting}
                style={{ backgroundColor: primaryColor }}
                className="h-[42px] px-4 text-white rounded-[var(--fn-radius)] disabled:opacity-40 transition-transform active:scale-95 cursor-pointer shadow-md flex items-center justify-center shrink-0"
                title="Send Message (Enter)"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
