"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../../supabase/browserClient";
import { useWorkspace } from "../../../../lib/WorkspaceContext";
import { useToast } from "../../../../lib/ToastContext";
import Input, { Textarea } from "../../../../components/ui/Input";
import WorkspaceDropdown from "../../../../components/WorkspaceDropdown";
import { SettingInfoButton } from "../../../../components/ui/SettingInfoModal";
import PageHeader from "../../../../components/layout/PageHeader";
import FoxMascotLoader from "../../../../components/ui/FoxMascotLoader";
import ChatInterface, { ChatMessage } from "../../../../components/ChatInterface";

export default function PromptsConfigPage() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [mobileTab, setMobileTab] = useState<"settings" | "preview">("settings");

  // Form State
  const [welcomeMessage, setWelcomeMessage] = useState("Hello! How can I help you today?");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful assistant.");
  const [suggestedQuestionsText, setSuggestedQuestionsText] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);

  // Live Chatbot Preview State
  const [previewMessages, setPreviewMessages] = useState<ChatMessage[]>([]);
  const [isPreviewChatting, setIsPreviewChatting] = useState(false);

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
          role: "ai",
          content: activeWorkspace.welcome_message || "Hello! How can I help you today?",
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
            role: "ai",
            content: welcomeMessage || "Hello! How can I help you today?",
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
          content: "I am ready to assist based on your knowledge documents and system prompts.",
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
        id: "welcome-reset",
        role: "ai",
        content: welcomeMessage || "Hello! How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (wsLoading) {
    return <FoxMascotLoader variant="page" message="Loading prompt templates & agent behavior..." />;
  }

  const primaryColor = activeWorkspace?.primary_color || "#E50914";
  const chatbotName = activeWorkspace?.chatbot_name || "AI Assistant";

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      <PageHeader
        title="Prompts & Conversational Behavior"
        eyebrow="Agent Instructions"
        description="Configure welcome greetings, system guidelines, starter question chips, and live search fallbacks."
      >
        <WorkspaceDropdown />
        <SettingInfoButton settingId="prompts-section" size="sm" />
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
          {saving ? "Saving..." : "Save Prompts"}
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
            Prompts Settings
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

            {/* Mobile Switch to Live Preview CTA */}
            <div className="lg:hidden pt-2 pb-1">
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className="w-full py-3 px-4 rounded-xl bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text)] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Preview Live Prompts & Behavior →
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
                Theme: {activeWorkspace?.chatbot_theme || "dark"}
              </span>
              <button
                type="button"
                onClick={() => setMobileTab("settings")}
                className="lg:hidden text-xs text-[var(--fn-accent)] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                ← Edit Prompts
              </button>
            </div>
          </div>

          {/* Canonical ChatInterface Component with live prompts preview */}
          <div className="w-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <ChatInterface
              config={{
                chatbot_name: chatbotName || "FoxxNuts Assistant",
                chatbot_description: activeWorkspace?.chatbot_description || "Powered by FoxxNuts",
                primary_color: primaryColor,
                chatbot_theme: activeWorkspace?.chatbot_theme === "light" ? "light" : "dark",
                welcome_message: welcomeMessage || "Hello! How can I help you today?",
                suggested_questions: parsedQuestions,
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
