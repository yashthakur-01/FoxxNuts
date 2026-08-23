"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../../../supabase/browserClient";
import { useWorkspace } from "../../../../lib/WorkspaceContext";
import { useToast } from "../../../../lib/ToastContext";
import Input, { Textarea } from "../../../../components/ui/Input";
import Skeleton from "../../../../components/ui/Skeleton";
import WorkspaceDropdown from "../../../../components/WorkspaceDropdown";
import { SettingInfoButton } from "../../../../components/ui/SettingInfoModal";

interface PreviewMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

export default function PromptsConfigPage() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form State
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [suggestedQuestionsText, setSuggestedQuestionsText] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);

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
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Populate from activeWorkspace
  useEffect(() => {
    if (activeWorkspace) {
      setWelcomeMessage(activeWorkspace.welcome_message || "Hello! How can I help you today?");
      setSystemPrompt(activeWorkspace.system_prompt || "You are a helpful assistant.");
      setSearchEnabled(activeWorkspace.search_enabled ?? false);
      setSuggestedQuestionsText(
        Array.isArray(activeWorkspace.suggested_questions)
          ? activeWorkspace.suggested_questions.join("\n")
          : "What topics are covered in our documents?\nCan you summarize key policies?"
      );

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

  // Update Welcome message in preview when changed
  useEffect(() => {
    setPreviewMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: "preview-welcome",
            role: "bot",
            text: welcomeMessage || "Hello! How can I help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [welcomeMessage]);

  const parsedQuestions = suggestedQuestionsText
    .split("\n")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

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
          welcome_message: welcomeMessage,
          system_prompt: systemPrompt,
          suggested_questions: parsedQuestions,
          search_enabled: searchEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save prompts configuration");
      }

      toast.success("Prompts & persona updated successfully!");
      setHasChanges(false);
      await refreshWorkspaces();
    } catch (err: any) {
      console.error("Save prompts error:", err);
      toast.error(err.message || "Failed to update prompts");
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

    setPreviewMessages((prev) => [...prev, userMsg]);
    if (!customText) setPreviewInput("");
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
          text: "I am ready to assist based on your knowledge documents and system prompts.",
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

  const primaryColor = activeWorkspace?.primary_color || "#E50914";
  const chatbotName = activeWorkspace?.chatbot_name || "AI Assistant";
  const isDarkPreview = activeWorkspace?.chatbot_theme !== "light";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* ============================================================
          VIBRANT FULL-BLEED END-TO-END RED RIBBON HEADER
          ============================================================ */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Prompts & Conversational Behavior
            </h1>
            <SettingInfoButton settingId="prompts-section" size="md" className="text-white/80 hover:text-white hover:bg-white/20" />
          </div>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Configure welcome greetings, system guidelines, starter question chips, and live search fallbacks.
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
            {saving ? "Saving..." : "Save Prompts"}
          </button>
        </div>
      </div>

      {/* 50/50 Split Screen */}
      <div className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch p-5 sm:p-7 overflow-hidden">
        {/* Left Form */}
        <div className="lg:col-span-7 h-full flex flex-col overflow-hidden min-h-0 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex-1 min-h-0 overflow-y-auto pr-3 space-y-6 no-scrollbar">
            {/* Welcome Greeting */}
            <div className="space-y-4">
              <div className="border-b border-[var(--fn-border)] pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    Initial Greeting
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    The first message sent when a visitor opens your assistant
                  </p>
                </div>
                <SettingInfoButton settingId="welcome-message" />
              </div>

              <Input
                label="Welcome Message"
                value={welcomeMessage}
                onChange={(e) => {
                  setWelcomeMessage(e.target.value);
                  markDirty();
                }}
                placeholder="e.g. Hello! How can I help you today?"
                hint="Displayed as the initial AI bubble in new chat sessions."
              />
            </div>

            {/* Persona & System Prompt */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[var(--fn-border)] pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)]" />
                    System Prompt & Grounding Rules
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Instructions for tone, response formatting, and grounding constraints
                  </p>
                </div>
                <SettingInfoButton settingId="system-prompt" />
              </div>

              <Textarea
                label="System Prompt Guidelines"
                rows={5}
                value={systemPrompt}
                onChange={(e) => {
                  setSystemPrompt(e.target.value);
                  markDirty();
                }}
                placeholder="You are a helpful customer assistant for FoxxNuts..."
                hint="Guides the LLM on how to answer queries using the retrieved knowledge chunks."
              />
            </div>

            {/* Starter Questions */}
            <div className="space-y-4 pt-2">
              <div className="border-b border-[var(--fn-border)] pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--fn-text)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    Suggested Starter Questions
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Actionable prompt chips shown to new visitors (one per line)
                  </p>
                </div>
                <SettingInfoButton settingId="suggested-questions" />
              </div>

              <Textarea
                label="Suggested Chips (One per line)"
                rows={4}
                value={suggestedQuestionsText}
                onChange={(e) => {
                  setSuggestedQuestionsText(e.target.value);
                  markDirty();
                }}
                placeholder="What topics are covered in our documents?&#10;Can you summarize key policies?&#10;What is your pricing?"
                hint="Visitors can click these chips to immediately ask common questions."
              />
            </div>

            {/* Web Search Toggle */}
            <div className="pt-2">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)]">
                <div className="space-y-0.5 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--fn-text)] block">
                      Web Search Fallback (Tavily Engine)
                    </span>
                    <SettingInfoButton settingId="search-enabled" />
                  </div>
                  <span className="text-[11px] text-[var(--fn-text-secondary)]">
                    Trigger real-time web search if no relevant document chunks match the query.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={searchEnabled}
                    onChange={(e) => {
                      setSearchEnabled(e.target.checked);
                      markDirty();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[var(--fn-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--fn-accent)]" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sandbox */}
        <div className="lg:col-span-5 h-full flex flex-col space-y-2 overflow-hidden min-h-0">
          <div className="flex items-center justify-between px-1 shrink-0">
            <span className="text-xs font-bold text-[var(--fn-text)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Interactive Sandbox
            </span>
            <span className="text-[11px] text-[var(--fn-text-tertiary)] font-mono">
              Live Preview
            </span>
          </div>

          <div
            className={`w-full flex-1 border rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-0 transition-all duration-200 ${
              isDarkPreview
                ? "bg-[#0D0D0D] text-white border-[#222222]"
                : "bg-[#FFFFFF] text-gray-900 border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-3.5 text-white flex items-center justify-between shrink-0 shadow-xs select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-extrabold text-xs shrink-0 border border-white/25">
                  {(chatbotName || "A")[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm leading-tight truncate">{chatbotName}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewMessages([
                    {
                      id: "welcome-reset",
                      role: "bot",
                      text: welcomeMessage || "Hello! How can I help you today?",
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

            {/* Messages Scroll Area */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto p-4 space-y-4 ${
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
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "text-white rounded-br-xs font-medium"
                        : isDarkPreview
                        ? "bg-[#151515] text-[#EDEDED] border border-[#222222] rounded-bl-xs"
                        : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isPreviewChatting && (
                <div
                  className={`flex items-center space-x-1.5 p-3 rounded-2xl rounded-bl-xs max-w-[80px] ${
                    isDarkPreview ? "bg-[#151515] border border-[#222222]" : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              )}

              <div ref={previewEndRef} />
            </div>

            {/* Suggested Questions Pills */}
            {parsedQuestions.length > 0 && previewMessages.length <= 1 && (
              <div
                className={`px-3.5 py-2.5 border-t flex flex-wrap gap-2 shrink-0 ${
                  isDarkPreview ? "bg-[#0D0D0D] border-[#222222]" : "bg-white border-gray-100"
                }`}
              >
                {parsedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePreviewSend(q)}
                    className={`text-[11px] px-3 py-1 rounded-full border transition-colors cursor-pointer truncate max-w-full font-medium ${
                      isDarkPreview
                        ? "bg-[#181818] border-[#2E2E2E] text-gray-300 hover:text-white hover:border-gray-500"
                        : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
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
              className={`p-3.5 border-t flex items-end gap-2.5 shrink-0 ${
                isDarkPreview ? "bg-[#0D0D0D] border-[#222222]" : "bg-white border-gray-200"
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
                  height: "40px",
                  borderColor: isInputFocused ? primaryColor : (isDarkPreview ? "#262626" : "#E5E7EB"),
                  boxShadow: isInputFocused ? `0 0 0 1px ${primaryColor}40` : "none",
                  outline: "none",
                }}
                className={`flex-1 text-xs px-3.5 py-2.5 rounded-xl border transition-all font-medium resize-none min-h-[40px] max-h-[120px] overflow-y-auto leading-relaxed ${
                  isDarkPreview
                    ? "bg-[#181818] text-white placeholder-gray-500"
                    : "bg-gray-100 text-gray-900 placeholder-gray-400"
                }`}
              />
              <button
                type="submit"
                disabled={!previewInput.trim() || isPreviewChatting}
                style={{ backgroundColor: primaryColor }}
                className="h-[40px] px-3.5 text-white rounded-xl disabled:opacity-40 transition-transform active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
                title="Send"
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
