"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../supabase/browserClient";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { useToast } from "../../lib/ToastContext";
import Skeleton from "../../components/ui/Skeleton";
import Tabs from "../../components/ui/Tabs";
import WorkspaceDropdown from "../../components/WorkspaceDropdown";
import ChatInterface, { ChatMessage } from "../../components/ChatInterface";
import PageHeader from "../../components/layout/PageHeader";
import FoxMascotLoader from "../../components/ui/FoxMascotLoader";
import { useChatHistory } from "../../hooks/useChat";

export default function DashboardChatbotHome() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined" && activeWorkspaceId) {
      return localStorage.getItem(`fn_dashboard_session_${activeWorkspaceId}`) || "";
    }
    return "";
  });
  const [embedTab, setEmbedTab] = useState("html");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "embed">("chat");

  // Initialize Session ID if needed
  useEffect(() => {
    if (!activeWorkspaceId) return;

    let savedSid = sessionId;
    if (!savedSid && typeof window !== "undefined") {
      savedSid = localStorage.getItem(`fn_dashboard_session_${activeWorkspaceId}`) || "";
      if (!savedSid) {
        savedSid = `session-${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(`fn_dashboard_session_${activeWorkspaceId}`, savedSid);
      }
      setSessionId(savedSid);
    }
  }, [activeWorkspaceId, sessionId]);

  const { data: historyData, isLoading: isHistoryLoading } = useChatHistory(activeWorkspaceId, sessionId || null);

  // Sync loaded history from TanStack Query
  useEffect(() => {
    if (historyData?.messages && historyData.messages.length > 0) {
      setMessages(historyData.messages);
    } else if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: activeWorkspace?.welcome_message || "Hello! How can I help you today?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [historyData, activeWorkspace?.welcome_message]);

  const handleStartNewSession = () => {
    const newSid = `session-${Math.random().toString(36).substring(2, 10)}`;
    setSessionId(newSid);
    if (typeof window !== "undefined" && activeWorkspaceId) {
      localStorage.setItem(`fn_dashboard_session_${activeWorkspaceId}`, newSid);
    }
    setMessages([
      {
        id: "welcome-" + Date.now(),
        role: "ai",
        content: activeWorkspace?.welcome_message || "Hello! How can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopChatting = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (query: string) => {
    if (!query || isChatting || !activeWorkspaceId) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "human",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatting(true);

    const botMsgId = (Date.now() + 1).toString();
    const botMsgPlaceholder: ChatMessage = {
      id: botMsgId,
      role: "ai",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, botMsgPlaceholder]);

    let fullResponse = "";
    abortControllerRef.current = new AbortController();

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
          session_id: sessionId,
          message: query,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to get response from AI engine");
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const isAborted = err?.name === "AbortError";

      if (!isAborted) {
        toast.error(err?.message || "Failed to send message");
      }

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== botMsgId) return msg;
          if (isAborted) {
            return {
              ...msg,
              content: fullResponse.trim()
                ? `${fullResponse}\n\n*[Response stopped by user]*`
                : "*[Response stopped by user]*",
            };
          }
          return {
            ...msg,
            content: fullResponse.trim()
              ? `${fullResponse}\n\n*[Response interrupted]*`
              : "Sorry, an error occurred while generating the response. Please ensure your documents are indexed in Knowledge Base.",
          };
        })
      );
    } finally {
      setIsChatting(false);
      abortControllerRef.current = null;
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com";

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const htmlSnippet = `<!-- FoxxNuts AI Chatbot Embed -->
<script 
  src="${origin}/widget.v1.js" 
  data-workspace-id="${activeWorkspaceId || "YOUR_WORKSPACE_ID"}"
  data-position="${activeWorkspace?.widget_position || "bottom-right"}"
  async
></script>`;

  const reactSnippet = `// In your React root layout or App component:
import { useEffect } from 'react';

export function FoxxNutsChatbot() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${origin}/widget.v1.js';
    script.setAttribute('data-workspace-id', '${activeWorkspaceId || "YOUR_WORKSPACE_ID"}');
    script.setAttribute('data-position', '${activeWorkspace?.widget_position || "bottom-right"}');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`;

  const nextjsSnippet = `// In your Next.js app/layout.tsx:
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${origin}/widget.v1.js"
          data-workspace-id="${activeWorkspaceId || "YOUR_WORKSPACE_ID"}"
          data-position="${activeWorkspace?.widget_position || "bottom-right"}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`;

  const chatbotName = activeWorkspace?.chatbot_name || "AI Assistant";
  const chatbotDescription = activeWorkspace?.chatbot_description || "Powered by FoxxNuts";
  const primaryColor = activeWorkspace?.primary_color || "#E50914";
  const chatbotTheme = activeWorkspace?.chatbot_theme || "dark";
  const isDark = chatbotTheme === "dark";
  const suggestedQuestions =
    Array.isArray(activeWorkspace?.suggested_questions) && activeWorkspace.suggested_questions.length > 0
      ? activeWorkspace.suggested_questions
      : [
        "What topics are covered in our documents?",
        "Can you summarize key policies?",
        "How does the retrieval search work?",
      ];

  if (wsLoading) {
    return <FoxMascotLoader variant="page" message="Connecting to interactive chat assistant..." />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      <PageHeader
        title={chatbotName}
        eyebrow="Interactive Chat Playground"
        description={
          <span className="flex items-center gap-1.5 sm:gap-2">
            <span className="hidden sm:inline">Workspace: <span className="font-semibold text-[var(--fn-text)]">{activeWorkspace?.workspace_name}</span> · </span>
            <span className="hidden md:inline">Model: <span className="font-mono text-[var(--fn-text)]">{activeWorkspace?.model_name || "llama-3.3-70b"}</span></span>
            <span className="sm:hidden text-xs text-[var(--fn-text-secondary)]">Test and interact with your AI assistant</span>
          </span>
        }
      >
        <WorkspaceDropdown />
        <span className="hidden sm:inline-flex px-2.5 py-1.5 rounded-lg bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text-secondary)] text-xs font-mono">
          Session: {sessionId.slice(0, 10)}
        </span>

        <button
          onClick={handleStartNewSession}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[var(--fn-elevated)] text-[var(--fn-text)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] text-xs font-medium transition-all shadow-sm cursor-pointer active:scale-95"
          title="Reset Session"
        >
          <svg className="w-3.5 h-3.5 text-[var(--fn-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          <span className="hidden sm:inline">Reset Session</span>
          <span className="sm:hidden">Reset</span>
        </button>
      </PageHeader>

      {/* Mobile Mode Switcher (Playground vs Embed Code) */}
      <div className="sm:hidden px-3 py-1.5 border-b border-[var(--fn-border)] bg-[var(--fn-surface)]/80 flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mobileTab === "chat"
            ? "bg-[var(--fn-accent)] text-white shadow-xs"
            : "bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Chat Playground
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("embed")}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${mobileTab === "embed"
            ? "bg-[var(--fn-accent)] text-white shadow-xs"
            : "bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
            }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          Embed Script
        </button>
      </div>

      {/* Main Content Area: Keypad-safe viewport container on mobile, scrollable on desktop */}
      <div className={`flex-1 min-h-0 w-full ${mobileTab === "chat" ? "overflow-hidden sm:overflow-y-auto" : "overflow-y-auto"} px-2 sm:px-6 lg:px-8 py-2 sm:py-5 flex flex-col`}>
        <div className={`w-full max-w-5xl mx-auto ${mobileTab === "chat" ? "flex-1 min-h-0 flex flex-col sm:block sm:space-y-8" : "space-y-6 sm:space-y-8"}`}>

          {/* ============================================================
              1. DIRECT INTERACTIVE CHATBOT WINDOW (INTERNAL SCROLL)
              ============================================================ */}
          <div className={`${mobileTab === "chat" ? "flex-1 min-h-0 h-full sm:h-[580px] lg:h-[640px] flex flex-col" : "hidden sm:flex sm:h-[580px] lg:h-[640px] flex-col"}`}>
            <ChatInterface
              config={{
                chatbot_name: chatbotName,
                chatbot_description: chatbotDescription,
                primary_color: primaryColor,
                welcome_message: activeWorkspace?.welcome_message,
                suggested_questions: suggestedQuestions,
                chatbot_theme: isDark ? "dark" : "light",
              }}
              messages={messages}
              isChatting={isChatting}
              isLoading={isHistoryLoading && messages.length <= 1}
              onSendMessage={handleSendMessage}
              onStopChatting={handleStopChatting}
              showLiveBadge={true}
              placeholder="Ask a question..."
            />
          </div>

          {/* ============================================================
              2. DIRECT IN-PAGE EMBED SCRIPT & CODE INTEGRATION PANEL
              ============================================================ */}
          <div className={`${mobileTab === "embed" ? "block" : "hidden sm:block"} border border-[var(--fn-border)] rounded-xl sm:rounded-2xl bg-[var(--fn-surface)] shadow-md overflow-hidden space-y-4 sm:space-y-6 p-3.5 sm:p-6 lg:p-7`}>
            <div className="border-b border-[var(--fn-border)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center font-bold text-sm">
                  &lt;/&gt;
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--fn-text)]">
                    Embed Script & Integration Code
                  </h3>
                  <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                    Copy and paste the snippet directly into your website HTML or application
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono bg-[var(--fn-elevated)] border border-[var(--fn-border)] px-3 py-1.5 rounded-lg text-[var(--fn-text-secondary)]">
                  Alignment: {activeWorkspace?.widget_position || "bottom-right"}
                </span>
              </div>
            </div>

            {/* Quick Identifier Cards */}
            <div className="p-4 border border-[var(--fn-border)] rounded-xl bg-[var(--fn-elevated)] space-y-1.5">
              <p className="text-[11px] font-bold text-[var(--fn-text-tertiary)] uppercase tracking-wider">
                Workspace ID
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-[var(--fn-text)] truncate">{activeWorkspaceId || "None"}</span>
                <button
                  onClick={() => copyToClipboard(activeWorkspaceId || "", "inpage-id")}
                  className="text-xs text-[var(--fn-accent)] hover:underline font-semibold shrink-0 cursor-pointer"
                >
                  {copiedKey === "inpage-id" ? "✓ Copied" : "Copy Workspace ID"}
                </button>
              </div>
            </div>

            {/* Snippet Tabs */}
            <div className="border border-[var(--fn-border)] rounded-xl overflow-hidden bg-[var(--fn-elevated)]/40">
              <div className="px-3.5 sm:px-4 py-2.5 border-b border-[var(--fn-border)] bg-[var(--fn-elevated)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Tabs
                  tabs={[
                    { id: "html", label: "HTML Script" },
                    { id: "react", label: "React" },
                    { id: "nextjs", label: "Next.js" },
                  ]}
                  activeTab={embedTab}
                  onChange={setEmbedTab}
                />

                <button
                  onClick={() =>
                    copyToClipboard(
                      embedTab === "html" ? htmlSnippet : embedTab === "react" ? reactSnippet : nextjsSnippet,
                      "inpage-snippet"
                    )
                  }
                  className="px-3.5 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-900 border border-white/20 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 self-end sm:self-auto"
                >
                  {copiedKey === "inpage-snippet" ? "✓ Copied" : "Copy Code"}
                </button>
              </div>

              <div className="p-4 bg-[var(--fn-bg)] font-mono text-xs overflow-x-auto">
                <pre className="text-emerald-400 leading-relaxed">
                  {embedTab === "html" ? htmlSnippet : embedTab === "react" ? reactSnippet : nextjsSnippet}
                </pre>
              </div>
            </div>

            {/* Callout Notice */}
            <div className="p-4 border border-[var(--fn-border)] rounded-xl bg-[var(--fn-elevated)]/50 flex items-start gap-3 text-xs text-[var(--fn-text-secondary)]">
              <div className="w-5 h-5 rounded-md bg-[var(--fn-accent)]/10 text-[var(--fn-accent)] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
                </svg>
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-[var(--fn-text)]">
                  Non-blocking, asynchronous & zero-collision loader
                </p>
                <p>
                  The widget runs asynchronously without impacting your website page load speed or SEO score. Chat interactions run inside an isolated sandbox.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
