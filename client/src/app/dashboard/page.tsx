"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../supabase/browserClient";
import { useWorkspace } from "../../lib/WorkspaceContext";
import { useToast } from "../../lib/ToastContext";
import Skeleton from "../../components/ui/Skeleton";
import Tabs from "../../components/ui/Tabs";
import WorkspaceDropdown from "../../components/WorkspaceDropdown";
import ChatInterface, { ChatMessage } from "../../components/ChatInterface";

export default function DashboardChatbotHome() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [embedTab, setEmbedTab] = useState("html");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Initialize Session ID & Load Previous Chat History
  useEffect(() => {
    if (!activeWorkspaceId) return;

    let savedSid = "";
    if (typeof window !== "undefined") {
      savedSid = localStorage.getItem(`fn_dashboard_session_${activeWorkspaceId}`) || "";
      if (!savedSid) {
        savedSid = `session-${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(`fn_dashboard_session_${activeWorkspaceId}`, savedSid);
      }
      setSessionId(savedSid);
    }

    const fetchHistory = async () => {
      const welcomeMsg = activeWorkspace?.welcome_message || "Hello! How can I help you today?";
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token && savedSid) {
          const res = await fetch("/api/chat/getHistory", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: session.access_token,
            },
            body: JSON.stringify({
              workspace_id: activeWorkspaceId,
              session_id: savedSid,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.messages) && data.messages.length > 0) {
              setMessages(data.messages);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard chat history:", err);
      }

      setMessages([
        {
          id: "welcome",
          role: "ai",
          content: welcomeMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    };

    fetchHistory();
  }, [activeWorkspaceId, activeWorkspace?.welcome_message]);

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
      });

      if (!res.ok) {
        throw new Error("Failed to get response from AI engine");
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

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
      toast.error(err.message || "Failed to send message");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                content:
                  "Sorry, an error occurred while generating the response. Please ensure your documents are indexed in Knowledge Base.",
              }
            : msg
        )
      );
    } finally {
      setIsChatting(false);
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
    return (
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        <Skeleton height={48} width="35%" />
        <Skeleton height={600} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* ============================================================
          VIBRANT FULL-BLEED END-TO-END RED RIBBON HEADER
          ============================================================ */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {chatbotName}
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Workspace: <span className="font-bold text-white">{activeWorkspace?.workspace_name}</span> · Model: <span className="font-mono">{activeWorkspace?.model_name || "llama-3.3-70b"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <WorkspaceDropdown />
          <span className="px-3 py-1.5 rounded-lg bg-black/40 text-white border border-white/20 text-xs font-mono">
            Session: {sessionId.slice(0, 12)}
          </span>

          <button
            onClick={handleStartNewSession}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-900 border border-white/20 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            New Session
          </button>
        </div>
      </div>

      {/* Main Content Area: Scrollable Chatbot + Direct In-Page Embed Script */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* ============================================================
              1. DIRECT INTERACTIVE CHATBOT WINDOW (INTERNAL SCROLL)
              ============================================================ */}
          <div className="w-full h-[620px] max-h-[calc(100vh-16rem)] min-h-[480px] flex flex-col">
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
              onSendMessage={handleSendMessage}
              showLiveBadge={true}
              placeholder="Ask a question..."
            />
          </div>

          {/* ============================================================
              2. DIRECT IN-PAGE EMBED SCRIPT & CODE INTEGRATION PANEL
              ============================================================ */}
          <div className="border border-[var(--fn-border)] rounded-2xl bg-[var(--fn-surface)] shadow-lg overflow-hidden space-y-6 p-6 sm:p-7">
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
              <div className="px-4 py-2.5 border-b border-[var(--fn-border)] bg-[var(--fn-elevated)] flex items-center justify-between">
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
                  className="px-3.5 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-900 border border-white/20 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
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
              <span className="text-base">💡</span>
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
