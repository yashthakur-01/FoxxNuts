"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import AnimatedGrid from "../components/AnimatedGrid";
import PlanetHeroBackground from "../components/PlanetHeroBackground";
import AnimatedFoxMascot, { FoxMood } from "../components/AnimatedFoxMascot";
import ThemeToggle from "../components/ui/ThemeToggle";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================================
// Interactive Demo Questions Database (100% Factual to RAG Engine)
// ============================================================
const DEMO_PRESETS = [
  {
    id: "remote-work",
    question: "What is our policy on remote work equipment reimbursement?",
    answer:
      "Full-time employees receive a one-time $1,000 home-office stipend upon onboarding, plus a $75/month internet and utility allowance reimbursed via payroll. All receipts must be submitted via the finance portal within 30 days of purchase.",
    source: "Employee_Handbook_2026.pdf (Page 14, Section 3.2)",
    nodeTrajectory: [
      "start_node",
      "genuine_generic_router",
      "context_retriver",
      "chatbot_node",
      "evalator_node",
    ],
    latency: "340ms",
    tokens: 86,
    confidence: "99.4%",
  },
  {
    id: "leave-policy",
    question: "How many annual leave days do employees get?",
    answer:
      "All full-time employees are entitled to 20 days of paid annual leave per calendar year, accrued monthly at 1.67 days. A maximum of 5 unused days can be carried over into the following fiscal year.",
    source: "HR_Leave_Policy_v4.pdf (Page 3, Section 1.1)",
    nodeTrajectory: [
      "start_node",
      "genuine_generic_router",
      "context_retriver",
      "chatbot_node",
      "evalator_node",
    ],
    latency: "290ms",
    tokens: 72,
    confidence: "99.8%",
  },
  {
    id: "security",
    question: "What are the mandatory password and 2FA requirements?",
    answer:
      "Passwords must be at least 14 characters with a mix of alphanumeric and special characters, rotated every 90 days. Hardware security keys (YubiKey) or authenticator apps (TOTP) are strictly mandatory across all internal tools.",
    source: "InfoSec_Compliance_Guide.md (Section 4.5)",
    nodeTrajectory: [
      "start_node",
      "genuine_generic_router",
      "context_retriver",
      "chatbot_node",
      "evalator_node",
    ],
    latency: "380ms",
    tokens: 94,
    confidence: "99.1%",
  },
];

export default function LandingPage() {
  const [selectedDemo, setSelectedDemo] = useState(DEMO_PRESETS[0]);
  const [streamedText, setStreamedText] = useState(DEMO_PRESETS[0].answer);
  const [isTyping, setIsTyping] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Auto-Cycling Interactive Demo State ─────────────────────────────
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [autoTimerProgress, setAutoTimerProgress] = useState(0);

  // ── Pinned Fox Mascot Mood State (Paradox ↔ Accuracy ↔ Visibility) ──
  const [foxMood, setFoxMood] = useState<FoxMood>("paradox");
  const mascotContainerRef = useRef<HTMLDivElement>(null);

  // ── GSAP Pinned 3-Step Pipeline Scroll & Highlighting ──────────────────
  const stepsSectionRef = useRef<HTMLDivElement>(null);
  const stepProgressFillRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useGSAP(
    () => {
      if (!stepsSectionRef.current) return;

      // Pinned 3-step timeline with smooth hardware scrub
      const stepTl = gsap.timeline({
        scrollTrigger: {
          trigger: stepsSectionRef.current,
          start: "top top",
          end: "+=1600",
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            const nextStep = p < 0.35 ? 0 : p < 0.70 ? 1 : 2;
            setActiveStep((prev) => (prev !== nextStep ? nextStep : prev));
          },
        },
      });

      // Synchronous Red Progress Bar filling along the milestone track line as you scroll
      if (stepProgressFillRef.current) {
        stepTl.fromTo(
          stepProgressFillRef.current,
          { width: "0%" },
          { width: "100%", ease: "none" },
          0
        );
      }

      // Pinned Fox Mascot Mood Switches across the 3 left deep-dive sections
      ScrollTrigger.create({
        trigger: "#paradox-section",
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setFoxMood("paradox"),
        onEnterBack: () => setFoxMood("paradox"),
      });

      ScrollTrigger.create({
        trigger: "#accuracy-section",
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setFoxMood("accuracy"),
        onEnterBack: () => setFoxMood("accuracy"),
      });

      ScrollTrigger.create({
        trigger: "#visibility-section",
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setFoxMood("visibility"),
        onEnterBack: () => setFoxMood("visibility"),
      });

      // ── 1. INITIAL HERO MOUNT ANIMATION (Staggered entrance on page load) ──
      const heroTl = gsap.timeline({ defaults: { ease: "power3.out" } });
      heroTl
        .fromTo(".hero-eyebrow", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.5 })
        .fromTo(".hero-title", { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.75 }, "-=0.25")
        .fromTo(".hero-subtitle", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, "-=0.35")
        .fromTo(".hero-cta", { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, "-=0.3")
        .fromTo(".hero-badges", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, "-=0.3")
        .fromTo(".hero-demo-window", { opacity: 0, y: 40, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, "-=0.2");

      // ── 2. UNIVERSAL SCROLL REVEAL FOR HEADINGS, BADGES & TEXTS ───────────
      gsap.utils.toArray<HTMLElement>(".scroll-reveal-header").forEach((header) => {
        const elements = header.children;
        if (elements.length > 0) {
          gsap.fromTo(
            elements,
            { opacity: 0, y: 32 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: header,
                start: "top 88%",
                toggleActions: "play none none none",
                once: true,
              },
            }
          );
        }
      });

      // ── 3. UNIVERSAL SCROLL REVEAL FOR CARDS (Staggered Fade & Lift) ─────
      gsap.utils.toArray<HTMLElement>(".scroll-reveal-cards").forEach((container) => {
        const cards = container.children;
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 38, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.75,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: container,
                start: "top 85%",
                toggleActions: "play none none none",
                once: true,
              },
            }
          );
        }
      });

      // ── 4. STANDALONE INTERACTIVE COMPONENT REVEALS ───────────────────────
      gsap.fromTo(
        ".embed-code-card",
        { opacity: 0, y: 35, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".embed-code-card",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".comparison-table-wrapper",
        { opacity: 0, y: 35, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".comparison-table-wrapper",
            start: "top 85%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".cta-banner-card",
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".cta-banner-card",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Force refresh of coordinate offsets after pin registration
      ScrollTrigger.refresh();
    },
    { dependencies: [] }
  );

  const handleScrollToStep = (stepIndex: number) => {
    const st = ScrollTrigger.getAll().find((s) => s.trigger === stepsSectionRef.current);
    if (st) {
      const targetProgress = stepIndex === 0 ? 0.15 : stepIndex === 1 ? 0.50 : 0.85;
      const targetScrollY = st.start + targetProgress * (st.end - st.start);
      window.scrollTo({ top: targetScrollY, behavior: "smooth" });
    }
  };

  // ── Auto-Cycling Timer for Interactive Demo ───────────────────────────
  useEffect(() => {
    if (isAutoPaused || isTyping) return;
    const intervalTime = 60; // ticks every 60ms
    const totalTime = 6500; // 6.5s per question
    const timer = setInterval(() => {
      setAutoTimerProgress((prev) => {
        if (prev >= 100) {
          setSelectedDemo((current) => {
            const currentIndex = DEMO_PRESETS.findIndex((p) => p.id === current.id);
            const nextIndex = (currentIndex + 1) % DEMO_PRESETS.length;
            const nextPreset = DEMO_PRESETS[nextIndex];
            triggerTypewriter(nextPreset);
            return nextPreset;
          });
          return 0;
        }
        return prev + (intervalTime / totalTime) * 100;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoPaused, isTyping]);

  const handleSelectDemoManual = (preset: (typeof DEMO_PRESETS)[0]) => {
    setAutoTimerProgress(0);
    triggerTypewriter(preset);
  };

  // ── LangGraph Multi-Node Self-Correction Animation ────────────────────
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const langGraphCardRef = useRef<HTMLDivElement>(null);
  const [isLangGraphInView, setIsLangGraphInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsLangGraphInView(entry.isIntersecting);
      },
      { threshold: 0.25 }
    );
    if (langGraphCardRef.current) {
      observer.observe(langGraphCardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isLangGraphInView) return;
    const interval = setInterval(() => {
      setActiveNodeIndex((prev) => (prev + 1) % 4);
    }, 2400);
    return () => clearInterval(interval);
  }, [isLangGraphInView]);

  // ── Typewriter effect when selecting demo questions ─────────────────
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

  // ── Trigger Live Chatbot Widget From Hero ───────────────────────────
  const handleOpenLiveDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      let opened = false;
      if ((window as any).FoxxNuts?.open) {
        (window as any).FoxxNuts.open();
        opened = true;
      }
      window.postMessage({ type: "FOXXNUTS_OPEN_WIDGET" }, "*");
      const iframe = document.querySelector("#foxxnuts-widget iframe") as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "FOXXNUTS_OPEN" }, "*");
        opened = true;
      }

      setToastMessage("✨ Live AI Chatbot expanded in bottom-right corner!");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // ── HTML Script Snippet ─────────────────────────────────────────────
  const htmlSnippet = `<!-- 1. Paste anywhere before the closing </body> tag -->
<script
  src="https://foxxnuts.ai/widget.v1.js"
  data-workspace-id="yourWorkspaceID"
  data-position="bottom-right"
  async
></script>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--fn-bg)] text-[var(--fn-text)] font-sans antialiased overflow-x-clip selection:bg-[var(--fn-accent)] selection:text-white relative">
      {/* ============================================================
          FIXED FULL-PAGE INTERACTIVE GRID BACKGROUND
          ============================================================ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatedGrid />
      </div>

      {/* ============================================================
          1. STICKY TOP NAVBAR (CLEAN, NO RED RIBBON, SINGLE SIGN IN/LOGIN)
          ============================================================ */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl bg-[var(--fn-bg)]/85 border-b border-[var(--fn-border)] transition-colors">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
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
              className="px-4 py-2 rounded-[var(--fn-radius)] bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-xs sm:text-sm font-bold tracking-tight shadow-md hover:shadow-[0_0_20px_rgba(255,30,39,0.35)] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Sign In / Login
            </Link>
          </div>
        </header>
      </div>

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--fn-surface)] border border-[var(--fn-accent)] text-[var(--fn-text)] text-xs sm:text-sm font-medium shadow-2xl animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================
          2. HERO SECTION WITH CELESTIAL MOON RING
          ============================================================ */}
      <section
        id="landing-hero-entry"
        className="relative min-h-screen flex flex-col justify-center items-center py-20 sm:py-28 overflow-hidden bg-transparent z-10"
      >
        {/* ── CRIMZON-INSPIRED ATMOSPHERIC PLANET SPHERE ─────────────── */}
        <PlanetHeroBackground />

        {/* Hero Foreground Content */}
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8 sm:space-y-10 my-auto">
          {/* Eyebrow Badge */}
          <div className="hero-eyebrow inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface)]/80 backdrop-blur-md shadow-xs animate-fn-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)] animate-pulse" />
            <span className="text-xs sm:text-sm font-mono font-medium text-[var(--fn-text)] tracking-wider">
              SELF-EVALUATING ENTERPRISE RAG · LANGGRAPH &amp; PINECONE HYBRID
            </span>
          </div>

          {/* Master H1 Headline */}
          <h1 className="hero-title text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-[var(--fn-text)] tracking-tight leading-[1.08] max-w-5xl mx-auto">
            Turn Company Documents into an{" "}
            <span className="bg-gradient-to-r from-[#FF001E] via-[#FF2E48] to-[#E50914] bg-clip-text text-transparent">
              Autonomous AI Assistant
            </span>{" "}
            That Never Hallucinates.
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle text-lg sm:text-2xl text-[var(--fn-text-secondary)] max-w-3xl mx-auto leading-relaxed font-normal">
            Upload your PDF and Markdown manuals, SOPs, and handbooks. FoxxNuts indexes them with hybrid
            Cohere dense + BM25 sparse search, verifies every response through a self-correcting LangGraph loop, and
            embeds on your website with one line of code.
          </p>

          {/* Dual Action CTAs */}
          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-5 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-9 py-5 rounded-2xl bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-lg font-bold shadow-xl hover:shadow-[0_8px_35px_rgba(255,30,39,0.4)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <span>Create Free Workspace</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            <button
              onClick={handleOpenLiveDemo}
              className="w-full sm:w-auto px-8 py-5 rounded-2xl border border-[#FF1E27]/40 bg-[var(--fn-surface)]/85 hover:bg-[var(--fn-elevated)] hover:border-[var(--fn-accent)] text-[var(--fn-text)] text-lg font-semibold shadow-lg hover:shadow-[0_0_28px_rgba(255,30,39,0.25)] transition-all duration-200 flex items-center justify-center gap-2.5 backdrop-blur-md cursor-pointer group"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 group-hover:animate-ping" />
              <span>Explore Live Demo</span>
              <svg className="w-5 h-5 text-[var(--fn-accent)] group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Reassurance Value Badges */}
          <div className="hero-badges flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-3 text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)]">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Cohere Dense + BM25 Sparse Hybrid
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              LangGraph Self-Correction Loop
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Automated Knowledge Gap Detection
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Direct R2 Upload with AWS SigV4
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          INTERACTIVE HERO PRODUCT DEMO (STANDALONE FULL SCREEN SECTION)
          ============================================================ */}
      <section
        id="interactive-demo"
        className="relative min-h-screen flex flex-col justify-center items-center py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-[var(--fn-border)]/80 bg-transparent z-10 scroll-mt-20"
        onMouseEnter={() => setIsAutoPaused(true)}
        onMouseLeave={() => setIsAutoPaused(false)}
      >
        <div className="max-w-6xl w-full mx-auto space-y-8 my-auto">
          {/* Demo Header */}
          <div className="scroll-reveal-header text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface)]/80 backdrop-blur-md text-xs sm:text-sm font-mono text-[var(--fn-accent)] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)] animate-pulse" />
              <span>LIVE INTERACTIVE SHOWCASE</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
              See the Self-Correction Engine in Action.
            </h2>
            <p className="text-base sm:text-lg text-[var(--fn-text-secondary)]">
              Select any preloaded document to inspect real-time hybrid retrieval, dense reranking, and reflection loop.
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-2xl shadow-2xl p-5 sm:p-8 lg:p-10 text-left space-y-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-[#FF1E27]/40 before:to-transparent">

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
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[10px] font-mono text-[var(--fn-text-tertiary)]">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAutoPaused ? "bg-amber-400" : "bg-emerald-400 animate-pulse"}`} />
                    <span>{isAutoPaused ? "Paused on Hover" : "Auto-Cycling Demo"}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LangGraph Evaluator Active
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

                    {(() => {
                      const demoFileName = selectedDemo.source.split(" ")[0];
                      const isDemoMd = demoFileName.toLowerCase().endsWith(".md");
                      return (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[var(--fn-surface)] border border-[var(--fn-border)]">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isDemoMd
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}
                          >
                            {isDemoMd ? "MD" : "PDF"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--fn-text)] truncate">
                              {demoFileName}
                            </p>
                            <p className="text-[10px] text-[var(--fn-text-tertiary)] font-mono">
                              {isDemoMd
                                ? "Native Markdown AST · BM25 Sparse Index"
                                : "PyMuPDF Ingestion · Cohere Dense + BM25"}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="space-y-1.5 text-[11px] font-mono text-[var(--fn-text-secondary)]">
                      <div className="flex justify-between">
                        <span>Vector Store</span>
                        <span className="text-[var(--fn-text)] font-semibold">Pinecone Serverless</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dense Embeddings</span>
                        <span className="text-[var(--fn-text)] font-semibold">Cohere embed-english-v3.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sparse Lexical</span>
                        <span className="text-[var(--fn-text)] font-semibold">BM25 Encoder</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Neural Reranker</span>
                        <span className="text-[var(--fn-text)] font-semibold">Jina Multilingual v2</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Agent Orchestrator</span>
                        <span className="text-[var(--fn-text)] font-semibold">LangGraph State Graph</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Query Selectors */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)]">
                        Select Sample Question:
                      </p>
                      <span className="text-[10px] font-mono text-[var(--fn-accent)]">Interactive / Auto</span>
                    </div>
                    <div className="space-y-1.5">
                      {DEMO_PRESETS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectDemoManual(item)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                            selectedDemo.id === item.id
                              ? "border-[var(--fn-accent)] bg-[var(--fn-accent-subtle)] text-[var(--fn-text)] shadow-xs ring-1 ring-[var(--fn-accent)]/30"
                              : "border-[var(--fn-border)] bg-[var(--fn-surface)] text-[var(--fn-text-secondary)] hover:bg-[var(--fn-elevated)]"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            {selectedDemo.id === item.id && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--fn-accent)] animate-pulse shrink-0" />
                            )}
                            <span className="truncate">{item.question}</span>
                          </div>
                          <span className="text-[10px] font-mono shrink-0 opacity-70">
                            {item.latency}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Pane: Live Verified Chat Assistant */}
                <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-[var(--fn-border)] bg-[var(--fn-elevated)]/70 p-4 sm:p-5 space-y-4">
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
                          Verified Grounded ({selectedDemo.latency})
                        </span>
                        <span className="px-2 py-1 rounded-md bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text-secondary)]">
                          Source: {selectedDemo.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Input Mockup with Trigger Action */}
                  <div className="pt-2 border-t border-[var(--fn-border)] flex items-center gap-2">
                    <input
                      type="text"
                      disabled
                      value={selectedDemo.question}
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--fn-surface)] border border-[var(--fn-border)] text-xs text-[var(--fn-text-secondary)] focus:outline-none cursor-not-allowed"
                    />
                    <button
                      onClick={handleOpenLiveDemo}
                      className="px-3.5 py-2 rounded-lg bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Open Live
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* ============================================================
          3. 1-LINE INTEGRATION SECTION (STANDALONE FULL SCREEN)
          ============================================================ */}
      <section
        id="embed-section"
        className="min-h-screen flex flex-col justify-center items-center py-24 sm:py-36 border-t border-[var(--fn-border)]/80 bg-transparent relative z-10 scroll-mt-20"
      >
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10 my-auto">
          <div className="scroll-reveal-header flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm sm:text-base font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
                1-LINE INTEGRATION
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--fn-text)] tracking-tight">
                Embed Anywhere in Seconds.
              </h3>
              <p className="text-base sm:text-lg text-[var(--fn-text-secondary)] max-w-2xl leading-relaxed">
                Universally compatible with Plain HTML, React, Next.js, Vue, WordPress, Shopify, Webflow, and custom dashboards.
              </p>
            </div>

            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-sm sm:text-base font-mono text-[var(--fn-text-secondary)] shadow-sm shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Universal HTML &lt;script&gt; Embed</span>
            </div>
          </div>

          {/* Copyable Code Block (Large & High Contrast) */}
          <div className="embed-code-card relative rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)] p-7 sm:p-9 font-mono text-base sm:text-lg text-[var(--fn-text)] overflow-x-auto shadow-2xl">
            <button
              onClick={handleCopyCode}
              className="absolute top-6 right-6 px-5 py-2.5 rounded-xl bg-[var(--fn-elevated)] hover:bg-[var(--fn-border)] border border-[var(--fn-border)] text-sm sm:text-base font-mono font-bold transition-all flex items-center gap-2.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
            >
              {copiedSnippet ? (
                <>
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-[var(--fn-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
            <pre className="text-red-500 dark:text-red-400 font-mono leading-relaxed text-base sm:text-lg">{htmlSnippet}</pre>
          </div>

          <div className="scroll-reveal-cards grid grid-cols-1 sm:grid-cols-3 gap-6 pt-3 text-sm sm:text-base text-[var(--fn-text-secondary)] font-medium">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--fn-surface)]/60 border border-[var(--fn-border)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Zero external npm package dependencies</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--fn-surface)]/60 border border-[var(--fn-border)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Sandboxed iframe prevents CSS conflicts</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--fn-surface)]/60 border border-[var(--fn-border)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Async non-blocking load (0ms LCP impact)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. HOW IT WORKS (PINNED GSAP 3-STEP PIPELINE)
          ============================================================ */}
      <section
        id="how-it-works"
        ref={stepsSectionRef}
        className="relative w-full min-h-screen flex flex-col justify-center items-center py-24 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--fn-border)]/80 bg-transparent scroll-mt-20 z-10"
      >
        <div className="max-w-6xl w-full mx-auto space-y-8 sm:space-y-10 flex flex-col justify-center my-auto">
          {/* Header */}
          <div className="scroll-reveal-header text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface)]/80 backdrop-blur-md text-xs sm:text-sm font-mono text-[var(--fn-accent)] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--fn-accent)] animate-pulse" />
              <span>FAST-TRACK DEPLOYMENT</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
              From Raw PDF to Live Embed in 3 Steps.
            </h2>
            <p className="text-base sm:text-lg text-[var(--fn-text-secondary)]">
              Scroll to animate through the autonomous indexing and deployment pipeline.
            </p>
          </div>

          {/* Horizontal Timeline Track (Centered Between Numbers, With Red Progress Bar) */}
          <div className="w-full max-w-3xl mx-auto pt-2 pb-4">
            <div className="relative flex items-start justify-between">
              {/* Background track line centered on milestone number circles */}
              <div className="absolute top-6 left-6 right-6 sm:left-[88px] sm:right-[88px] -translate-y-1/2 h-1.5 bg-[var(--fn-border)] z-0 rounded-full overflow-hidden">
                {/* Active Red Progress Bar filling as you scroll through the 3 steps */}
                <div
                  ref={stepProgressFillRef}
                  id="step-progress-fill"
                  className="h-full bg-gradient-to-r from-[#FF1E27] via-red-500 to-[#FF4A58] shadow-[0_0_14px_rgba(255,30,39,0.95)] rounded-full origin-left w-0"
                />
              </div>

              {/* Milestone 1 */}
              <button
                type="button"
                onClick={() => handleScrollToStep(0)}
                className="relative z-10 w-12 sm:w-44 flex flex-col items-center gap-2.5 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm sm:text-base transition-all duration-300 ${
                    activeStep === 0
                      ? "bg-[var(--fn-accent)] text-white ring-4 ring-red-500/30 scale-110 shadow-lg shadow-red-500/40"
                      : activeStep > 0
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-[var(--fn-surface)] border-2 border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                  }`}
                >
                  {activeStep > 0 ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm font-mono font-bold text-center leading-tight hidden sm:block transition-colors ${
                    activeStep === 0 ? "text-[var(--fn-accent)]" : "text-[var(--fn-text-secondary)]"
                  }`}
                >
                  1. Ingest Documents
                </span>
              </button>

              {/* Milestone 2 */}
              <button
                type="button"
                onClick={() => handleScrollToStep(1)}
                className="relative z-10 w-12 sm:w-44 flex flex-col items-center gap-2.5 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm sm:text-base transition-all duration-300 ${
                    activeStep === 1
                      ? "bg-[var(--fn-accent)] text-white ring-4 ring-red-500/30 scale-110 shadow-lg shadow-red-500/40"
                      : activeStep > 1
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-[var(--fn-surface)] border-2 border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                  }`}
                >
                  {activeStep > 1 ? (
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm font-mono font-bold text-center leading-tight hidden sm:block transition-colors ${
                    activeStep === 1 ? "text-[var(--fn-accent)]" : "text-[var(--fn-text-secondary)]"
                  }`}
                >
                  2. Vectorize &amp; Tune
                </span>
              </button>

              {/* Milestone 3 */}
              <button
                type="button"
                onClick={() => handleScrollToStep(2)}
                className="relative z-10 w-12 sm:w-44 flex flex-col items-center gap-2.5 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm sm:text-base transition-all duration-300 ${
                    activeStep === 2
                      ? "bg-[var(--fn-accent)] text-white ring-4 ring-red-500/30 scale-110 shadow-lg shadow-red-500/40"
                      : "bg-[var(--fn-surface)] border-2 border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-xs sm:text-sm font-mono font-bold text-center leading-tight hidden sm:block transition-colors ${
                    activeStep === 2 ? "text-[var(--fn-accent)]" : "text-[var(--fn-text-secondary)]"
                  }`}
                >
                  3. Embed &amp; Telemetry
                </span>
              </button>
            </div>
          </div>

          {/* The 3 Sequential Highlight Cards (Zoomed in) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative w-full items-stretch">
            {/* Step 1 */}
            <div
              onClick={() => handleScrollToStep(0)}
              className={`p-7 sm:p-9 rounded-3xl border transition-all duration-500 space-y-5 relative cursor-pointer ${
                activeStep === 0
                  ? "bg-[var(--fn-surface)] border-[var(--fn-accent)] shadow-[0_0_40px_rgba(255,30,39,0.25)] scale-[1.02] ring-1 ring-[var(--fn-accent)]/40 z-10 opacity-100"
                  : activeStep > 0
                  ? "bg-[var(--fn-surface)]/85 backdrop-blur-md border-[var(--fn-border)] opacity-85 hover:opacity-100"
                  : "bg-[var(--fn-surface)]/60 backdrop-blur-md border-[var(--fn-border)] opacity-60 hover:opacity-85"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center transition-all duration-300 ${
                    activeStep === 0
                      ? "bg-[var(--fn-accent)] text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/20"
                      : activeStep > 0
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                  }`}
                >
                  {activeStep > 0 ? (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    "1"
                  )}
                </div>
                {activeStep === 0 ? (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[var(--fn-accent)]" />
                    ACTIVE STEP
                  </span>
                ) : activeStep > 0 ? (
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ COMPLETED
                  </span>
                ) : null}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)]">
                Upload Knowledge Documents
              </h3>
              <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] leading-relaxed">
                Upload your policy manuals, SOPs, and handbooks in PDF or Markdown (.md) format. Files are securely uploaded directly to
                Cloudflare R2 with AWS SigV4 signed lengths, parsed by PyMuPDF or native Markdown AST chunking.
              </p>
              <div className="pt-2 text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>PyMuPDF &amp; Markdown AST Preprocessor</span>
              </div>
            </div>

            {/* Step 2 */}
            <div
              onClick={() => handleScrollToStep(1)}
              className={`p-7 sm:p-9 rounded-3xl border transition-all duration-500 space-y-5 relative cursor-pointer ${
                activeStep === 1
                  ? "bg-[var(--fn-surface)] border-[var(--fn-accent)] shadow-[0_0_40px_rgba(255,30,39,0.25)] scale-[1.02] ring-1 ring-[var(--fn-accent)]/40 z-10 opacity-100"
                  : activeStep > 1
                  ? "bg-[var(--fn-surface)]/85 backdrop-blur-md border-[var(--fn-border)] opacity-85 hover:opacity-100"
                  : "bg-[var(--fn-surface)]/60 backdrop-blur-md border-[var(--fn-border)] opacity-60 hover:opacity-85"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center transition-all duration-300 ${
                    activeStep === 1
                      ? "bg-[var(--fn-accent)] text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/20"
                      : activeStep > 1
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                  }`}
                >
                  {activeStep > 1 ? (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    "2"
                  )}
                </div>
                {activeStep === 1 ? (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[var(--fn-accent)]" />
                    ACTIVE STEP
                  </span>
                ) : activeStep > 1 ? (
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ COMPLETED
                  </span>
                ) : null}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)]">
                Vectorize &amp; Tune Engine
              </h3>
              <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] leading-relaxed">
                Dedicated Celery workers compute Cohere dense embeddings (1024-dim) and BM25 sparse encodings into Pinecone.
                Fine-tune hybrid weighting (alpha), cosine similarity thresholds, and custom agent instructions.
              </p>
              <div className="pt-2 text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Pinecone Hybrid + Jina Cross-Encoder</span>
              </div>
            </div>

            {/* Step 3 */}
            <div
              onClick={() => handleScrollToStep(2)}
              className={`p-7 sm:p-9 rounded-3xl border transition-all duration-500 space-y-5 relative cursor-pointer ${
                activeStep === 2
                  ? "bg-[var(--fn-surface)] border-[var(--fn-accent)] shadow-[0_0_40px_rgba(255,30,39,0.25)] scale-[1.02] ring-1 ring-[var(--fn-accent)]/40 z-10 opacity-100"
                  : "bg-[var(--fn-surface)]/60 backdrop-blur-md border-[var(--fn-border)] opacity-60 hover:opacity-85"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center transition-all duration-300 ${
                    activeStep === 2
                      ? "bg-[var(--fn-accent)] text-white shadow-lg shadow-red-500/30 ring-4 ring-red-500/20"
                      : "bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                  }`}
                >
                  3
                </div>
                {activeStep === 2 && (
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[var(--fn-accent)]" />
                    ACTIVE STEP
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)]">
                Embed &amp; Inspect Telemetry
              </h3>
              <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] leading-relaxed">
                Copy the 1-line script tag with domain CORS allowlisting. Monitor real-time RPM, latency, token consumption,
                and knowledge gaps from your centralized telemetry dashboard.
              </p>
              <div className="pt-2 text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>1-Line Script · Supabase Traces</span>
              </div>
            </div>
          </div>

          {/* Footer Scroll cue */}
          <div className="flex items-center justify-center gap-3 pt-2 text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)]">
            <span>Step {activeStep + 1} of 3</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              Scroll to advance
              <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. DEEP DIVE ARCHITECTURE SHOWCASE
             (LEFT: 3 SECTIONS | RIGHT: PINNED REACTIVE RED FOX MASCOT)
          ============================================================ */}
      <section
        id="deep-dive-showcase"
        className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 bg-transparent"
      >
        {/* Mobile Sticky Mascot Status Widget */}
        <div className="md:hidden sticky top-20 z-30 py-3 px-5 bg-[var(--fn-surface)]/95 backdrop-blur-xl rounded-2xl border border-[var(--fn-border)] shadow-xl flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                foxMood === "paradox"
                  ? "bg-amber-400"
                  : foxMood === "accuracy"
                  ? "bg-[#FF1E27]"
                  : "bg-emerald-400"
              } animate-pulse`}
            />
            <span className="text-xs font-mono font-bold text-[var(--fn-text)] tracking-wider uppercase">
              {foxMood === "paradox"
                ? "Diagnostic Watch"
                : foxMood === "accuracy"
                ? "LangGraph Agent"
                : "Telemetry Live"}
            </span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
              foxMood === "paradox"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : foxMood === "accuracy"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {foxMood === "paradox"
              ? "TRAPPING ERRORS"
              : foxMood === "accuracy"
              ? "SELF-CORRECTING"
              : "100% GROUNDED"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-20 xl:gap-24 items-start relative justify-between">
          {/* ── LEFT COLUMN: THE 3 SECTIONS ─────────────────── */}
          <div className="md:col-span-7 lg:col-span-7 xl:col-span-7 space-y-28 sm:space-y-36">
            {/* ── SECTION 1: THE SUPPORT BOT PARADOX ─────────────────── */}
            <div
              id="paradox-section"
              className="min-h-screen flex flex-col justify-center py-20 sm:py-28 space-y-8 scroll-mt-20 relative"
            >
              <div id="problem" className="absolute -top-28 left-0 pointer-events-none" />
              <div className="scroll-reveal-header space-y-3">
                <p className="text-sm sm:text-base font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
                  THE SUPPORT BOT PARADOX
                </p>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Generic AI Chatbots Were Never Built for Business Documentation.
                </h2>
                <p className="text-base sm:text-lg text-[var(--fn-text-secondary)] leading-relaxed">
                  Most bots are naive single-pass wrappers. When real customers ask technical or
                  nuanced policy questions, standard AI chatbots fail in three dangerous ways:
                </p>
              </div>

              <div className="scroll-reveal-cards grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Paradox Card 1 */}
                <div className="reveal-card p-7 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/90 backdrop-blur-md space-y-4 relative overflow-hidden group hover:border-[#FF1E27]/40 hover:shadow-[0_8px_30px_rgba(255,30,39,0.15)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--fn-text)]">The Hallucination Danger</h3>
                  <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                    When a generic bot cannot find facts, it makes them up. In business support, a false
                    refund policy, invented warranty, or incorrect pricing destroys trust and loses customers.
                  </p>
                </div>

                {/* Paradox Card 2 */}
                <div className="reveal-card p-7 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/90 backdrop-blur-md space-y-4 relative overflow-hidden group hover:border-[#FF1E27]/40 hover:shadow-[0_8px_30px_rgba(255,30,39,0.15)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.83-5.83m0 0a5.25 5.25 0 00-7.42-7.42m7.42 7.42L12 13.5m0 0l-1.5 1.5m-5.25-5.25a5.25 5.25 0 00-7.42 7.42L3.75 21A2.67 2.67 0 007.5 17.25l-5.83-5.83" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--fn-text)]">The RAG Engineering Tax</h3>
                  <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                    Building reliable RAG in-house requires PyMuPDF and Markdown AST chunking, dense vector DBs, BM25
                    sparse encoders, rerankers, Celery task workers, and Redis caches—months of infrastructure plumbing.
                  </p>
                </div>

                {/* Paradox Card 3 */}
                <div className="reveal-card p-7 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/90 backdrop-blur-md space-y-4 relative overflow-hidden group hover:border-[#FF1E27]/40 hover:shadow-[0_8px_30px_rgba(255,30,39,0.15)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--fn-text)]">The Blind Box Dilemma</h3>
                  <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                    You deploy a chatbot, but have zero visibility into what customers asked that failed.
                    You cannot improve your documentation because you don't know where the knowledge gaps are.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: ENGINEERED FOR ACCURACY (KEY CAPABILITIES BENTO) ── */}
            <div
              id="accuracy-section"
              className="min-h-screen flex flex-col justify-center py-20 sm:py-28 space-y-8 scroll-mt-20 relative"
            >
              <div id="features" className="absolute -top-28 left-0 pointer-events-none" />
              <div id="architecture" className="absolute -top-28 left-0 pointer-events-none" />
              <div className="scroll-reveal-header space-y-3">
                <p className="text-sm sm:text-base font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
                  ENGINEERED FOR ACCURACY
                </p>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Key Capabilities That Make FoxxNuts Uniquely Reliable.
                </h2>
                <p className="text-base sm:text-lg text-[var(--fn-text-secondary)] leading-relaxed">
                  Four purpose-built architectural pillars designed from the ground up for zero hallucinations and enterprise resilience.
                </p>
              </div>

              <div className="scroll-reveal-cards grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Bento Card 1: LangGraph Workflow Engine (Wide 2-col) */}
                <div
                  ref={langGraphCardRef}
                  className="feature-bento-card sm:col-span-2 p-8 sm:p-10 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-md space-y-6 relative overflow-hidden group hover:border-[#FF1E27]/40 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
                      LANGGRAPH WORKFLOW ENGINE
                    </span>
                    <span className="text-xs sm:text-sm font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
                      Multi-Node Self-Correction
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[var(--fn-text)]">
                    Autonomous Self-Evaluating Reflection Loop
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] leading-relaxed">
                    Unlike single-pass chatbots, FoxxNuts routes queries through a compiled LangGraph state machine.
                    An autonomous judge node evaluates the drafted response against retrieved document chunks.
                    If ungrounded or incomplete, it self-corrects through query rephrasing or revision before returning the approved answer.
                  </p>

                  {/* Visual Workflow Diagram */}
                  <div className="p-5 rounded-2xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm font-mono">
                    <div
                      className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                        activeNodeIndex === 0
                          ? "bg-red-500/20 border-red-500 text-red-400 font-bold shadow-[0_0_15px_rgba(255,30,39,0.3)]"
                          : "bg-[var(--fn-surface)] border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                      }`}
                    >
                      <div className="text-[11px] opacity-75">Step 1</div>
                      <div className="font-bold">Intent Router</div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                        activeNodeIndex === 1
                          ? "bg-red-500/20 border-red-500 text-red-400 font-bold shadow-[0_0_15px_rgba(255,30,39,0.3)]"
                          : "bg-[var(--fn-surface)] border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                      }`}
                    >
                      <div className="text-[11px] opacity-75">Step 2</div>
                      <div className="font-bold">Hybrid Retrieve</div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                        activeNodeIndex === 2
                          ? "bg-red-500/20 border-red-500 text-red-400 font-bold shadow-[0_0_15px_rgba(255,30,39,0.3)]"
                          : "bg-[var(--fn-surface)] border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                      }`}
                    >
                      <div className="text-[11px] opacity-75">Step 3</div>
                      <div className="font-bold">Generator &amp; Tools</div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border text-center transition-all duration-300 ${
                        activeNodeIndex === 3
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                          : "bg-[var(--fn-surface)] border-[var(--fn-border)] text-[var(--fn-text-secondary)]"
                      }`}
                    >
                      <div className="text-[11px] opacity-75">Step 4</div>
                      <div className="font-bold">Judge Evaluator</div>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] flex items-center justify-between">
                    <span>Current Node: {["genuine_generic_router", "context_retriver (Pinecone)", "chatbot_node (+Tavily fallback)", "evalator_node (Self-Correction Loop)"][activeNodeIndex]}</span>
                    <span className="text-emerald-400 font-bold">● 100% Grounded</span>
                  </div>
                </div>

                {/* Bento Card 2: Hybrid Search */}
                <div className="feature-bento-card p-7 sm:p-8 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-md space-y-4 hover:border-[#FF1E27]/40 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
                    RETRIEVAL ACCURACY
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)]">Hybrid Vector + Jina Neural Rerank</h3>
                  <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                    Combines deep semantic comprehension (Cohere 1024-dim dense embeddings) with exact keyword
                    precision (BM25 sparse index) on Pinecone, refined by a Jina multilingual cross-encoder.
                  </p>
                </div>

                {/* Bento Card 3: Celery & Redis */}
                <div className="feature-bento-card p-7 sm:p-8 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-md space-y-4 hover:border-[#FF1E27]/40 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
                    DISTRIBUTED ARCHITECTURE
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)]">Celery Workers &amp; Redis Cache</h3>
                  <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                    Asynchronous task queues handle document parsing and embedding safely in the background. Redis caching delivers sub-5ms lookups for active sessions and telemetry.
                  </p>
                </div>

                {/* Bento Card 4: Knowledge Gap Detector (Wide 2-col) */}
                <div className="feature-bento-card sm:col-span-2 p-7 sm:p-8 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-md space-y-4 hover:border-[#FF1E27]/40 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-[var(--fn-accent)] font-bold">
                    DOCUMENTATION ROADMAP
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--fn-text)]">Automated Knowledge Gap Detection</h3>
                  <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] leading-relaxed">
                    Isolates every customer question where no matching context could be retrieved from your PDFs or Markdown documents.
                    Turns missed queries into an actionable checklist of documentation to write next.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: FULL OPERATIONAL VISIBILITY ──────────────── */}
            <div
              id="visibility-section"
              className="min-h-screen flex flex-col justify-center py-20 sm:py-28 space-y-8 scroll-mt-20 relative"
            >
              <div id="observability" className="absolute -top-28 left-0 pointer-events-none" />
              <div className="scroll-reveal-header space-y-3">
                <p className="text-sm sm:text-base font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
                  FULL OPERATIONAL VISIBILITY
                </p>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
                  Don't Fly Blind. Inspect Every Execution Trace in Real Time.
                </h2>
                <p className="text-base sm:text-lg text-[var(--fn-text-secondary)] leading-relaxed">
                  Enterprise AI demands accountability. FoxxNuts gives you real-time throughput metrics,
                  token consumption rates, and granular trajectory inspection.
                </p>
              </div>

              {/* Live Telemetry KPI Cards */}
              <div className="scroll-reveal-cards grid grid-cols-2 gap-5 sm:gap-6">
                <div className="telemetry-metric-card p-6 sm:p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-2">
                  <span className="text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] uppercase font-semibold">Total Queries</span>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--fn-text)]">14,820</p>
                  <span className="text-xs sm:text-sm text-emerald-400 font-mono font-bold">↑ 24% this week</span>
                </div>

                <div className="telemetry-metric-card p-6 sm:p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-2">
                  <span className="text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] uppercase font-semibold">Context Found Rate</span>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400">98.6%</p>
                  <span className="text-xs sm:text-sm text-[var(--fn-text-secondary)] font-mono">Hybrid Threshold ≥ 0.65</span>
                </div>

                <div className="telemetry-metric-card p-6 sm:p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-2">
                  <span className="text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] uppercase font-semibold">Avg Response Time</span>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--fn-text)]">380 ms</p>
                  <span className="text-xs sm:text-sm text-blue-400 font-mono font-bold">Optimized Stream Pipeline</span>
                </div>

                <div className="telemetry-metric-card p-6 sm:p-7 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-2">
                  <span className="text-xs sm:text-sm font-mono text-[var(--fn-text-tertiary)] uppercase font-semibold">CSAT Satisfaction</span>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--fn-text)]">96.2%</p>
                  <span className="text-xs sm:text-sm text-emerald-400 font-mono font-bold">Based on user ratings</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: PINNED DYNAMIC RED FOX MASCOT ─── */}
          <div
            ref={mascotContainerRef}
            className="hidden md:flex md:col-span-5 lg:col-span-5 xl:col-span-5 justify-end pl-4 lg:pl-10 xl:pl-14 sticky top-28 lg:top-[max(5rem,calc(50vh-270px))] self-start z-20"
          >
            <AnimatedFoxMascot mood={foxMood} />
          </div>
        </div>
      </section>

      {/* ============================================================
          8. OBJECTIVE COMPARISON MATRIX
          ============================================================ */}
      <section
        id="comparison"
        className="min-h-screen flex flex-col justify-center items-center py-24 sm:py-36 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 scroll-mt-20 relative z-10 bg-transparent"
      >
        <div className="scroll-reveal-header text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
            WHY FOXXNUTS WINS
          </p>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
            How FoxxNuts Compares.
          </h2>
          <p className="text-base sm:text-lg text-[var(--fn-text-secondary)]">
            See how our LangGraph RAG architecture outperforms generic chat platforms and raw API calls.
          </p>
        </div>

        <div className="comparison-table-wrapper w-full rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)] overflow-x-auto shadow-2xl">
          <table className="w-full text-left text-sm sm:text-base">
            <thead>
              <tr className="border-b border-[var(--fn-border)] bg-[var(--fn-elevated)] text-[var(--fn-text)] font-bold">
                <th className="p-5 sm:p-6">Capability / Architecture</th>
                <th className="p-5 sm:p-6 text-red-500 font-extrabold">FoxxNuts AI (v1.0)</th>
                <th className="p-5 sm:p-6 text-[var(--fn-text-secondary)]">Generic LLM Wrappers</th>
                <th className="p-5 sm:p-6 text-[var(--fn-text-secondary)]">Building In-House</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--fn-border)] text-[var(--fn-text-secondary)] font-medium">
              <tr>
                <td className="p-5 sm:p-6 font-bold text-[var(--fn-text)]">Self-Evaluating RAG Loop</td>
                <td className="p-5 sm:p-6 text-emerald-400 font-bold">✓ Multi-node LangGraph Engine</td>
                <td className="p-5 sm:p-6">✗ Single-pass prompt injection</td>
                <td className="p-5 sm:p-6">Requires custom agent dev</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-[var(--fn-text)]">Retrieval Technology</td>
                <td className="p-5 sm:p-6 text-emerald-400 font-bold">✓ Hybrid (Cohere + BM25) + Jina Rerank</td>
                <td className="p-5 sm:p-6">Naive dense search only</td>
                <td className="p-5 sm:p-6">Requires 4+ vector tools</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-[var(--fn-text)]">Knowledge Gap Detection</td>
                <td className="p-5 sm:p-6 text-emerald-400 font-bold">✓ Automatic telemetry isolation</td>
                <td className="p-5 sm:p-6">✗ None (Blind box)</td>
                <td className="p-5 sm:p-6">Manual log parsing</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-[var(--fn-text)]">Inference Speed</td>
                <td className="p-5 sm:p-6 text-emerald-400 font-bold">✓ Sub-500ms streaming</td>
                <td className="p-5 sm:p-6">2.5s – 5.0s standard API</td>
                <td className="p-5 sm:p-6">Depends on setup</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-[var(--fn-text)]">Time to Production</td>
                <td className="p-5 sm:p-6 text-emerald-400 font-bold">✓ Instant 1-line embed</td>
                <td className="p-5 sm:p-6">15 – 30 minutes</td>
                <td className="p-5 sm:p-6">2 – 3 months engineering</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================
          9. SECURITY & ENTERPRISE GOVERNANCE
          ============================================================ */}
      <section
        id="security"
        className="min-h-screen flex flex-col justify-center items-center py-24 sm:py-36 border-t border-[var(--fn-border)]/80 bg-transparent scroll-mt-20 relative z-10"
      >
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-12 my-auto">
          <div className="scroll-reveal-header text-center space-y-3 max-w-2xl mx-auto">
            <p className="text-sm sm:text-base font-mono uppercase tracking-widest text-[var(--fn-accent)] font-bold">
              ENTERPRISE GOVERNANCE
            </p>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--fn-text)] tracking-tight">
              Isolated, Encrypted, and Compliant.
            </h2>
            <p className="text-base sm:text-lg text-[var(--fn-text-secondary)] leading-relaxed">
              Your proprietary manuals, code, and customer policies are safeguarded with bank-grade tenant isolation.
            </p>
          </div>

          <div className="scroll-reveal-cards grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="security-card p-8 sm:p-10 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4 hover:border-[#FF1E27]/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg sm:text-xl text-[var(--fn-text)]">SigV4 Signed Storage</h4>
              <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                Direct uploads to Cloudflare R2 with AWS SigV4 cryptographic length locks preventing tampering.
              </p>
            </div>

            <div className="security-card p-8 sm:p-10 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4 hover:border-[#FF1E27]/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h4 className="font-bold text-lg sm:text-xl text-[var(--fn-text)]">Supabase RLS Isolation</h4>
              <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                Row-Level Security ensures your company documents and chat histories remain strictly tenant-isolated.
              </p>
            </div>

            <div className="security-card p-8 sm:p-10 rounded-3xl border border-[var(--fn-border)] bg-[var(--fn-surface)] space-y-4 hover:border-[#FF1E27]/40 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h4 className="font-bold text-lg sm:text-xl text-[var(--fn-text)]">Domain CORS Allowlisting</h4>
              <p className="text-sm text-[var(--fn-text-secondary)] leading-relaxed">
                Lock widget embeds strictly to your official company domains, preventing third-party unauthorized use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          10. FINAL BOTTOM CONVERSION CTA BANNER
          ============================================================ */}
      <section
        id="cta-banner"
        className="min-h-screen flex flex-col justify-center items-center py-24 sm:py-36 relative overflow-hidden bg-transparent z-10 scroll-mt-20"
      >
        <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
          <div className="cta-banner-card scroll-reveal-header rounded-3xl border border-red-500/30 bg-gradient-to-br from-[#1C0508] via-[#140306] to-[#0A0002] p-10 sm:p-16 lg:p-20 text-center space-y-8 shadow-2xl relative overflow-hidden">
            {/* Ambient Radial Accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--fn-accent)]/20 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Ready to Turn Your Business Knowledge into an Autonomous AI Assistant?
            </h2>

            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Create your free workspace, upload your first PDF policy or Markdown guide, and embed the chatbot on your site today.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/login"
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-lg font-bold shadow-2xl hover:shadow-[0_8px_35px_rgba(255,30,39,0.4)] transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Start Building Free &rarr;</span>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 font-mono pt-2">
              No credit card required · Free tier includes 5 PDF or Markdown documents &amp; full telemetry
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          11. GLOBAL FOOTER
          ============================================================ */}
      <footer className="border-t border-[var(--fn-border)]/80 py-16 sm:py-20 bg-transparent text-xs text-[var(--fn-text-secondary)] relative z-10">
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
            <a href="#how-it-works" className="hover:text-[var(--fn-text)] transition-colors">
              How It Works
            </a>
            <a href="#observability" className="hover:text-[var(--fn-text)] transition-colors">
              Observability
            </a>
            <Link href="/login" className="hover:text-[var(--fn-text)] transition-colors">
              Sign In / Login
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
