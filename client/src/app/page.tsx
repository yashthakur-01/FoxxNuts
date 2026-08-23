"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import AnimatedGrid from "../components/AnimatedGrid";
import ThemeToggle from "../components/ui/ThemeToggle";

// ============================================================
// Interactive Demo Questions Database
// ============================================================
const DEMO_PRESETS = [
  {
    id: "remote-work",
    question: "What is our policy on remote work equipment reimbursement?",
    answer:
      "Full-time employees receive a one-time $1,000 home-office stipend upon onboarding, plus a $75/month internet and utility allowance reimbursed via payroll. All receipts must be submitted via the finance portal within 30 days of purchase.",
    source: "Employee_Handbook_2026.pdf (Page 14, Section 3.2)",
    nodeTrajectory: ["intent_router", "hybrid_retriever", "jina_rerank", "chatbot_node", "evaluator_node"],
    latency: "340ms",
    tokens: 86,
  },
  {
    id: "leave-policy",
    question: "How many annual leave days do employees get?",
    answer:
      "All full-time employees are entitled to 20 days of paid annual leave per calendar year, accrued monthly at 1.67 days. A maximum of 5 unused days can be carried over into the following fiscal year.",
    source: "HR_Leave_Policy_v4.pdf (Page 3, Section 1.1)",
    nodeTrajectory: ["intent_router", "hybrid_retriever", "jina_rerank", "chatbot_node", "evaluator_node"],
    latency: "290ms",
    tokens: 72,
  },
  {
    id: "security",
    question: "What are the mandatory password and 2FA requirements?",
    answer:
      "Passwords must be at least 14 characters with a mix of alphanumeric and special characters, rotated every 90 days. Hardware security keys (YubiKey) or authenticator apps (TOTP) are strictly mandatory across all internal tools.",
    source: "InfoSec_Compliance_Guide.pdf (Page 9, Section 4.5)",
    nodeTrajectory: ["intent_router", "hybrid_retriever", "jina_rerank", "chatbot_node", "evaluator_node"],
    latency: "380ms",
    tokens: 94,
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedDemo, setSelectedDemo] = useState(DEMO_PRESETS[0]);
  const [streamedText, setStreamedText] = useState(DEMO_PRESETS[0].answer);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSnippetTab, setActiveSnippetTab] = useState<"html" | "react" | "nextjs">("html");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Typewriter effect when selecting questions
  const triggerTypewriter = (preset: (typeof DEMO_PRESETS)[0]) => {
    setSelectedDemo(preset);
    setIsTyping(true);
    setStreamedText("");

    let i = 0;
    const fullText = preset.answer;
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setStreamedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 12);
  };

  const snippets = {
    html: `<!-- 1. Paste in your website's <body> -->
<script
  src="https://foxxnuts.ai/widget.v1.js"
  data-workspace-id="yourWorkspaceID"
  data-position="bottom-right"
  async
></script>`,
    react: `// 2. React / Next.js Component
import { FoxxNutsChatbot } from '@foxxnuts/react';

export default function App() {
  return <FoxxNutsChatbot workspaceId="yourWorkspaceID" theme="dark" />;
}`,
    nextjs: `// 3. Next.js App Router (app/layout.tsx)
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://foxxnuts.ai/widget.v1.js"
          data-workspace-id="yourWorkspaceID"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(snippets[activeSnippetTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--fn-bg)] text-[var(--fn-text)] font-sans antialiased overflow-x-hidden selection:bg-[var(--fn-accent)] selection:text-white">
      {/* ============================================================
          1. TOP FIXED BAR (ANNOUNCEMENT + NAVBAR)
          ============================================================ */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        {/* Top Announcement Banner */}
        <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white py-2 px-4 text-center text-xs sm:text-sm font-medium tracking-tight flex items-center justify-center gap-2 shadow-sm">
          <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
            V1.0 Live
          </span>
          <span>
            Deploy your autonomous, self-evaluating AI knowledge assistant.
          </span>
          <Link
            href="/login"
            className="underline font-bold hover:text-white/80 transition-colors ml-1 inline-flex items-center gap-1"
          >
            Get Started &rarr;
          </Link>
        </div>

        {/* Sticky Navbar */}
        <header className="w-full backdrop-blur-xl bg-[var(--fn-bg)]/85 border-b border-[var(--fn-border)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img
                src="/light_without_text.png"
                alt="FoxxNuts Logo"
                className="w-8 h-8 object-contain hidden [.light_&]:block transition-transform group-hover:scale-105"
              />
              <img
                src="/dark_without_text.png"
                alt="FoxxNuts Logo"
                className="w-8 h-8 object-contain block [.light_&]:hidden transition-transform group-hover:scale-105"
              />
            </div>
            <span className="text-xl font-black tracking-tight text-[var(--fn-text)] font-sans">
              FoxxNuts<span className="text-[var(--fn-accent)]">.</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--fn-text-secondary)]">
            <a href="#features" className="hover:text-[var(--fn-text)] transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-[var(--fn-text)] transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-[var(--fn-text)] transition-colors">
              Architecture
            </a>
            <a href="#observability" className="hover:text-[var(--fn-text)] transition-colors">
              Observability
            </a>
            <a href="#security" className="hover:text-[var(--fn-text)] transition-colors">
              Security
            </a>
          </nav>

          {/* Nav Right Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-[var(--fn-radius)] bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-xs sm:text-sm font-bold tracking-tight shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>
      </div>

      {/* ============================================================
          3. HERO SECTION WITH ANIMATED GRID CANVAS
          ============================================================ */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Animated Background Canvas with Full Vibrancy and Interactivity */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <AnimatedGrid />
        </div>

        {/* Ambient Top Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[var(--fn-accent)]/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-7">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface)]/80 backdrop-blur-md shadow-xs animate-fn-fade-in">
            <span className="w-2 h-2 rounded-full bg-[var(--fn-accent)] animate-pulse" />
            <span className="text-xs font-mono font-medium text-[var(--fn-text)]">
              SELF-EVALUATING ENTERPRISE RAG · VERSION 1.0
            </span>
          </div>

          {/* Master H1 Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[var(--fn-text)] tracking-tight leading-[1.08] max-w-5xl mx-auto">
            Turn Company Documents into an{" "}
            <span className="bg-gradient-to-r from-[#FF001E] via-[#FF2E48] to-[#E50914] bg-clip-text text-transparent">
              Autonomous AI Support Assistant
            </span>{" "}
            That Never Hallucinates.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-[var(--fn-text-secondary)] max-w-3xl mx-auto leading-relaxed font-normal">
            Upload your PDF manuals, SOPs, and handbooks. FoxxNuts indexes them with hybrid
            vector search, verifies every response through a self-correcting LangGraph loop, and
            embeds on your website with one line of code.
          </p>

          {/* Dual Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-base font-bold shadow-xl hover:shadow-[0_8px_30px_rgba(255,30,39,0.3)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Create Free Workspace</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <a
              href="#interactive-demo"
              className="w-full sm:w-auto px-7 py-4 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/80 hover:bg-[var(--fn-elevated)] text-[var(--fn-text)] text-base font-semibold transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <span>Explore Live Demo</span>
              <svg className="w-4 h-4 text-[var(--fn-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </a>
          </div>

          {/* Reassurance Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-xs font-mono text-[var(--fn-text-tertiary)]">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Multi-Tier In-Memory Caching
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Automated Knowledge Gap Detection
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Zero credit card required
            </span>
          </div>

          {/* ============================================================
              INTERACTIVE HERO PRODUCT DEMO (DUAL PANE SHOWCASE)
              ============================================================ */}
          <div id="interactive-demo" className="pt-10 scroll-mt-28">
            <div className="rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/90 backdrop-blur-2xl shadow-2xl p-4 sm:p-6 lg:p-8 text-left space-y-6">
              {/* Demo Window Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--fn-border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="text-xs font-mono text-[var(--fn-text-secondary)] font-medium">
                    yourWorkspaceID / enterprise-knowledge-agent
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LangGraph Self-Correction Active
                  </span>
                </div>
              </div>

              {/* Dual-Pane Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Pane: Ingestion & Hyperparameter Pipeline */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text-secondary)]">
                        Indexed Knowledge File
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                        COMPLETED
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--fn-surface)] border border-[var(--fn-border)]">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center font-bold text-xs">
                        PDF
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--fn-text)] truncate">
                          Employee_Handbook_2026.pdf
                        </p>
                        <p className="text-[10px] text-[var(--fn-text-tertiary)] font-mono">
                          124 Chunks · Cohere Dense + BM25 Sparse
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono text-[var(--fn-text-secondary)]">
                      <div className="flex justify-between">
                        <span>Retrieval Engine</span>
                        <span className="text-[var(--fn-text)] font-semibold">Pinecone Hybrid</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reranker</span>
                        <span className="text-[var(--fn-text)] font-semibold">Jina Neural Cross-Encoder</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cosine Threshold</span>
                        <span className="text-[var(--fn-text)] font-semibold">0.65</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inference Engine</span>
                        <span className="text-[var(--fn-text)] font-semibold">Self-Correcting LLM</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Query Selectors */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)]">
                      Select Sample Question:
                    </p>
                    <div className="space-y-1.5">
                      {DEMO_PRESETS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => triggerTypewriter(item)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                            selectedDemo.id === item.id
                              ? "border-[var(--fn-accent)] bg-[var(--fn-accent-subtle)] text-[var(--fn-text)]"
                              : "border-[var(--fn-border)] bg-[var(--fn-surface)] text-[var(--fn-text-secondary)] hover:bg-[var(--fn-elevated)]"
                          }`}
                        >
                          <span className="truncate mr-2">{item.question}</span>
                          <span className="text-[10px] font-mono shrink-0 opacity-70">
                            {item.latency}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Pane: Live Verified Chat Assistant */}
                <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[var(--fn-border)] bg-[var(--fn-elevated)]/60 p-4 sm:p-5 space-y-4">
                  {/* Chat Message Stream */}
                  <div className="space-y-4">
                    {/* User Turn */}
                    <div className="flex flex-col items-end">
                      <div className="bg-[var(--fn-accent)] text-white px-4 py-2.5 rounded-2xl rounded-br-xs text-xs sm:text-sm font-medium shadow-sm max-w-[90%]">
                        {selectedDemo.question}
                      </div>
                      <span className="text-[10px] text-[var(--fn-text-tertiary)] font-mono mt-1">
                        Visitor · Just now
                      </span>
                    </div>

                    {/* Assistant Turn */}
                    <div className="flex flex-col items-start space-y-2">
                      <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text)] px-4 py-3 rounded-2xl rounded-bl-xs text-xs sm:text-sm leading-relaxed shadow-sm max-w-[95%] space-y-2">
                        <p className="whitespace-pre-wrap">{streamedText}</p>
                        {isTyping && <span className="inline-block w-2 h-4 bg-[var(--fn-accent)] animate-pulse ml-0.5" />}
                      </div>

                      {/* Source Citation & Verification Pill */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Verified by Evaluator Loop ({selectedDemo.latency})
                        </span>
                        <span className="px-2 py-1 rounded-md bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text-secondary)]">
                          Source: {selectedDemo.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Input Mockup */}
                  <div className="pt-2 border-t border-[var(--fn-border)] flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value={selectedDemo.question}
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--fn-surface)] border border-[var(--fn-border)] text-xs text-[var(--fn-text-secondary)] focus:outline-none cursor-not-allowed"
                    />
                    <button
                      disabled
                      className="px-3.5 py-2 rounded-lg bg-[var(--fn-accent)] text-white text-xs font-bold opacity-80 cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. INTEGRATION COMPATIBILITY TICKER & SNIPPET TABS
          ============================================================ */}
      <section className="py-12 border-y border-[var(--fn-border)] bg-[var(--fn-surface)]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
                1-LINE INTEGRATION
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--fn-text)] tracking-tight mt-0.5">
                Embeds Anywhere in Seconds.
              </h3>
            </div>

            {/* Code Snippet Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[var(--fn-elevated)] border border-[var(--fn-border)]">
              {(["html", "react", "nextjs"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSnippetTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                    activeSnippetTab === tab
                      ? "bg-[var(--fn-accent)] text-white shadow-xs"
                      : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
                  }`}
                >
                  {tab === "html" ? "HTML Script" : tab === "react" ? "React" : "Next.js"}
                </button>
              ))}
            </div>
          </div>

          {/* Copyable Code Block */}
          <div className="relative rounded-xl border border-[var(--fn-border)] bg-[var(--fn-elevated)] p-4 font-mono text-xs text-[var(--fn-text)] overflow-x-auto shadow-inner">
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-md bg-[var(--fn-surface)] hover:bg-[var(--fn-bg)] border border-[var(--fn-border)] text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSnippet ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-[var(--fn-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
            <pre className="text-[var(--fn-text-secondary)]">{snippets[activeSnippetTab]}</pre>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. THE PROBLEM / THE FRICTION SECTION
          ============================================================ */}
      <section id="problem" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
            THE SUPPORT BOT PARADOX
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
            Generic AI Chatbots Were Never Built for Business Documentation.
          </h2>
          <p className="text-base text-[var(--fn-text-secondary)] leading-relaxed">
            Most bots are naive single-pass wrappers. When real customers ask technical or
            nuanced policy questions, standard AI chatbots fail in three dangerous ways:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4 relative overflow-hidden group hover:border-[var(--fn-accent)]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--fn-text)]">The Hallucination Danger</h3>
            <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              When a generic bot cannot find facts, it makes them up. In business support, a false
              refund policy, invented warranty, or incorrect pricing destroys trust and loses customers.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4 relative overflow-hidden group hover:border-[var(--fn-accent)]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m0 0a5.25 5.25 0 00-7.42-7.42m7.42 7.42L12 13.5m0 0l-1.5 1.5m-5.25-5.25a5.25 5.25 0 00-7.42 7.42L3.75 21A2.67 2.67 0 007.5 17.25l-5.83-5.83" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--fn-text)]">The RAG Engineering Tax</h3>
            <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              Building reliable RAG in-house requires PyMuPDF chunking, dense vector DBs, BM25
              sparse encoders, rerankers, Celery task workers, and Redis caches—months of infrastructure plumbing.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4 relative overflow-hidden group hover:border-[var(--fn-accent)]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--fn-text)]">The Blind Box Dilemma</h3>
            <p className="text-xs sm:text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              You deploy a chatbot, but have zero visibility into what customers asked that failed.
              You cannot improve your documentation because you don't know where the knowledge gaps are.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          6. HOW IT WORKS (3-STEP PIPELINE)
          ============================================================ */}
      <section id="how-it-works" className="py-20 border-t border-[var(--fn-border)] bg-[var(--fn-surface)]/30 scroll-mt-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
              FAST-TRACK DEPLOYMENT
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
              From Static PDF to Live Embed in 3 Steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[var(--fn-accent)] text-white font-black text-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                1
              </div>
              <h3 className="text-xl font-bold text-[var(--fn-text)]">Upload Knowledge PDFs</h3>
              <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                Upload your policy manuals, SOPs, or specs. Files are securely uploaded directly to
                Cloudflare R2 with AWS SigV4 signed lengths, parsed by PyMuPDF, and vectorized with
                Cohere &amp; BM25.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text)] font-black text-lg flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-xl font-bold text-[var(--fn-text)]">Configure &amp; Tune Engine</h3>
              <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                Choose your preferred model provider. Fine-tune temperature, cosine similarity threshold,
                and custom system prompts with live tooltips.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="w-12 h-12 rounded-2xl bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text)] font-black text-lg flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-xl font-bold text-[var(--fn-text)]">Embed &amp; Track Telemetry</h3>
              <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                Copy the 1-line script tag with custom brand colors and domain allowlisting. Monitor
                real-time RPM, TPM, latency, and knowledge gaps from your centralized telemetry dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. CORE CAPABILITIES (BENTO GRID)
          ============================================================ */}
      <section id="features" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 scroll-mt-28">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
            ENGINEERED FOR ACCURACY
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
            Key Capabilities That Make FoxxNuts Uniquely Reliable.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Self-Evaluating LangGraph Engine (Wide 2-col) */}
          <div className="md:col-span-2 p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
                LANGGRAPH WORKFLOW ENGINE
              </span>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Multi-Node Self-Correction
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[var(--fn-text)]">
              Autonomous Self-Evaluating Revision Loop
            </h3>
            <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              Unlike single-pass chatbots, FoxxNuts routes queries through an agent graph. An
              autonomous judge node evaluates the drafted response against the retrieved document context.
              If incomplete or vague, it self-corrects up to 2 times before streaming the final approved answer.
            </p>

            {/* Visual Workflow Diagram */}
            <div className="p-4 rounded-xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="px-2.5 py-1.5 rounded-md bg-[var(--fn-surface)] border border-[var(--fn-border)]">
                1. Intent Router
              </span>
              <span>&rarr;</span>
              <span className="px-2.5 py-1.5 rounded-md bg-[var(--fn-surface)] border border-[var(--fn-border)]">
                2. Hybrid Search
              </span>
              <span>&rarr;</span>
              <span className="px-2.5 py-1.5 rounded-md bg-[var(--fn-surface)] border border-[var(--fn-border)]">
                3. Chatbot Generator
              </span>
              <span>&rarr;</span>
              <span className="px-2.5 py-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold">
                4. Judge Evaluator Loop
              </span>
            </div>
          </div>

          {/* Card 2: Hybrid Search + Jina Rerank */}
          <div className="p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
              RETRIEVAL ACCURACY
            </span>
            <h3 className="text-xl font-bold text-[var(--fn-text)]">Hybrid Vector + Jina Neural Rerank</h3>
            <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              Combines deep semantic comprehension (Cohere dense embeddings) with exact keyword
              precision (BM25 sparse index) on Pinecone, refined by a Jina multilingual cross-encoder.
            </p>
          </div>

          {/* Card 3: Multi-Tier Caching */}
          <div className="md:col-span-1 p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
              MULTI-TIER CACHING
            </span>
            <h3 className="text-xl font-bold text-[var(--fn-text)]">Sub-5ms In-Memory Caching</h3>
            <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              Session histories, workspace configurations, and telemetry metrics are cached in high-performance in-memory Redis stores for instant response times and zero redundant computation.
            </p>
          </div>

          {/* Card 4: Knowledge Gap Detector (Wide 2-col) */}
          <div className="md:col-span-2 p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
              DOCUMENTATION ROADMAP
            </span>
            <h3 className="text-xl font-bold text-[var(--fn-text)]">Automated Knowledge Gap Detection</h3>
            <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
              Isolates questions that couldn't find matching context in your uploaded PDFs. Turns missed
              queries into an actionable checklist of documentation to write next.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          8. OBSERVABILITY & TELEMETRY SECTION
          ============================================================ */}
      <section id="observability" className="py-20 border-t border-[var(--fn-border)] bg-[var(--fn-surface)]/40 scroll-mt-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
              FULL OPERATIONAL VISIBILITY
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
              Don't Fly Blind. Inspect Every Execution Trace in Real Time.
            </h2>
            <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] leading-relaxed">
              Enterprise AI demands accountability. FoxxNuts gives you real-time throughput metrics,
              token consumption rates, and granular trajectory inspection.
            </p>
          </div>

          {/* Live Telemetry KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-1">
              <span className="text-xs font-mono text-[var(--fn-text-tertiary)] uppercase">Total Queries</span>
              <p className="text-2xl sm:text-3xl font-black text-[var(--fn-text)]">14,820</p>
              <span className="text-[11px] text-emerald-400 font-mono">↑ 24% this week</span>
            </div>

            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-1">
              <span className="text-xs font-mono text-[var(--fn-text-tertiary)] uppercase">Context Found Rate</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">98.6%</p>
              <span className="text-[11px] text-[var(--fn-text-secondary)] font-mono">Hybrid Threshold ≥ 0.65</span>
            </div>

            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-1">
              <span className="text-xs font-mono text-[var(--fn-text-tertiary)] uppercase">Avg Response Time</span>
              <p className="text-2xl sm:text-3xl font-black text-[var(--fn-text)]">380 ms</p>
              <span className="text-[11px] text-blue-400 font-mono">Optimized Stream Pipeline</span>
            </div>

            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-1">
              <span className="text-xs font-mono text-[var(--fn-text-tertiary)] uppercase">CSAT Satisfaction</span>
              <p className="text-2xl sm:text-3xl font-black text-[var(--fn-text)]">96.2%</p>
              <span className="text-[11px] text-emerald-400 font-mono">Based on user ratings</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          9. OBJECTIVE COMPARISON MATRIX
          ============================================================ */}
      <section id="comparison" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-28">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
            WHY FOXXNUTS WINS
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
            How FoxxNuts Compares.
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--fn-border)] bg-[var(--fn-elevated)] text-[var(--fn-text)] font-bold">
                <th className="p-4 sm:p-5">Capability / Architecture</th>
                <th className="p-4 sm:p-5 text-red-500 font-extrabold">FoxxNuts AI (v1.0)</th>
                <th className="p-4 sm:p-5 text-[var(--fn-text-secondary)]">Generic LLM Wrappers</th>
                <th className="p-4 sm:p-5 text-[var(--fn-text-secondary)]">Building In-House</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fn-border)] text-[var(--fn-text-secondary)] font-medium">
              <tr>
                <td className="p-4 sm:p-5 font-bold text-[var(--fn-text)]">Self-Evaluating RAG Loop</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-bold">✓ Multi-node LangGraph Engine</td>
                <td className="p-4 sm:p-5">✗ Single-pass prompt injection</td>
                <td className="p-4 sm:p-5">Requires custom agent dev</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-[var(--fn-text)]">Retrieval Technology</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-bold">✓ Hybrid (Cohere + BM25) + Jina Rerank</td>
                <td className="p-4 sm:p-5">Naive dense search only</td>
                <td className="p-4 sm:p-5">Requires 4+ vector tools</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-[var(--fn-text)]">Knowledge Gap Detection</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-bold">✓ Automatic telemetry isolation</td>
                <td className="p-4 sm:p-5">✗ None (Blind box)</td>
                <td className="p-4 sm:p-5">Manual log parsing</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-[var(--fn-text)]">Inference Speed</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-bold">✓ Sub-500ms streaming</td>
                <td className="p-4 sm:p-5">2.5s – 5.0s standard API</td>
                <td className="p-4 sm:p-5">Depends on setup</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-bold text-[var(--fn-text)]">Time to Production</td>
                <td className="p-4 sm:p-5 text-emerald-400 font-bold">✓ Instant 1-line embed</td>
                <td className="p-4 sm:p-5">15 – 30 minutes</td>
                <td className="p-4 sm:p-5">2 – 3 months engineering</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================
          10. SECURITY & ENTERPRISE GOVERNANCE
          ============================================================ */}
      <section id="security" className="py-20 border-t border-[var(--fn-border)] bg-[var(--fn-surface)]/30 scroll-mt-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
              ENTERPRISE GOVERNANCE
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
              Isolated, Encrypted, and Compliant.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-[var(--fn-text)]">SigV4 Signed Storage</h4>
              <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                Direct uploads to Cloudflare R2 with AWS SigV4 cryptographic length locks preventing tampering.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-[var(--fn-text)]">Supabase RLS Isolation</h4>
              <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                Row-Level Security ensures your company documents and chat histories remain strictly tenant-isolated.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h4 className="font-bold text-sm text-[var(--fn-text)]">Domain CORS Allowlisting</h4>
              <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                Lock widget embeds strictly to your official company domains, preventing third-party unauthorized use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          11. FINAL BOTTOM CONVERSION CTA BANNER
          ============================================================ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#1A0507] via-[#140305] to-[#0A0002] p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Radial Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--fn-accent)]/20 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
              Ready to Turn Your Business Knowledge into an Autonomous AI Assistant?
            </h2>

            <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto leading-relaxed">
              Create your free workspace, upload your first PDF policy, and embed the chatbot on your site today.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-base font-bold shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Start Building Free &rarr;</span>
              </Link>
            </div>

            <p className="text-xs text-gray-400 font-mono pt-2">
              No credit card required · Free tier includes 5 PDF documents &amp; full telemetry
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          12. GLOBAL FOOTER
          ============================================================ */}
      <footer className="border-t border-[var(--fn-border)] py-12 bg-[var(--fn-bg)] text-xs text-[var(--fn-text-secondary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 flex items-center justify-center">
              <img
                src="/light_without_text.png"
                alt="FoxxNuts Logo"
                className="w-6 h-6 object-contain hidden [.light_&]:block"
              />
              <img
                src="/dark_without_text.png"
                alt="FoxxNuts Logo"
                className="w-6 h-6 object-contain block [.light_&]:hidden"
              />
            </div>
            <span className="font-bold text-[var(--fn-text)] text-sm">FoxxNuts AI</span>
            <span className="text-[var(--fn-text-tertiary)]">· Version 1.0.0</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-[var(--fn-text)] transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-[var(--fn-text)] transition-colors">
              Architecture
            </a>
            <a href="#observability" className="hover:text-[var(--fn-text)] transition-colors">
              Observability
            </a>
            <Link href="/login" className="hover:text-[var(--fn-text)] transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span>All Systems Operational</span>
          </div>
        </div>
      </footer>

      {/* FoxxNuts AI Chatbot Live Embed */}
      <Script
        src="/widget.v1.js"
        data-workspace-id="352b1319-c6ed-4b24-add2-72862b980c7d"
        data-position="bottom-right"
        strategy="lazyOnload"
      />
    </div>
  );
}
