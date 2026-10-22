"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ThemeToggle from "../components/ui/ThemeToggle";

/**
 * Custom Fox-Themed 404 Page
 * 
 * Elegant, branded not-found experience featuring the FoxxNuts Fox mascot,
 * GSAP entrance motion, theme toggle, and recovery navigation.
 */
export default function NotFound() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<SVGSVGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const earRef = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      // Coordinated entrance animation
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.fromTo(
        ".notfound-badge",
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.4 }
      )
        .fromTo(
          mascotRef.current,
          { opacity: 0, scale: 0.9, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "back.out(1.5)" },
          "-=0.2"
        )
        .fromTo(
          ".notfound-text",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.1 },
          "-=0.3"
        )
        .fromTo(
          ".notfound-actions",
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4 },
          "-=0.2"
        );

      // Subtle inquisitive head tilt loop
      if (headRef.current) {
        gsap.to(headRef.current, {
          rotation: -5,
          duration: 2.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "center bottom",
        });
      }

      if (earRef.current) {
        gsap.to(earRef.current, {
          rotation: -10,
          duration: 1.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "bottom right",
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex flex-col justify-between bg-[var(--fn-bg)] text-[var(--fn-text)] font-sans antialiased p-6 sm:p-10 selection:bg-[var(--fn-accent)] selection:text-white transition-colors"
    >
      {/* Top Navigation Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <img
              src="/light_without_text.png"
              alt="FoxxNuts Logo"
              className="w-7 h-7 object-contain hidden [.light_&]:block transition-transform group-hover:scale-105"
            />
            <img
              src="/dark_without_text.png"
              alt="FoxxNuts Logo"
              className="w-7 h-7 object-contain block [.light_&]:hidden transition-transform group-hover:scale-105"
            />
          </div>
          <span className="text-base font-bold tracking-tight text-[var(--fn-text)]">
            FoxxNuts<span className="text-[var(--fn-accent)]">.</span>
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Main 404 Hero Composition */}
      <main className="w-full max-w-xl mx-auto my-auto flex flex-col items-center text-center space-y-7 py-12">
        {/* Subtle Status Pill */}
        <div className="notfound-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--fn-border)] bg-[var(--fn-surface)]/80 backdrop-blur-md text-xs font-mono text-[var(--fn-text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--fn-accent)]" />
          <span>ERROR 404 · PAGE NOT FOUND</span>
        </div>

        {/* Custom Quizzical Vector Fox Mascot */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-44 h-44 rounded-full bg-[var(--fn-accent)]/10 blur-2xl pointer-events-none" />

          <svg
            ref={mascotRef}
            viewBox="0 0 200 200"
            className="w-40 h-40 sm:w-48 sm:h-48 drop-shadow-md overflow-visible relative z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="fox404Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3848" />
                <stop offset="50%" stopColor="#E50914" />
                <stop offset="100%" stopColor="#B3000A" />
              </linearGradient>
              <linearGradient id="fox404InnerEar" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#540810" />
                <stop offset="100%" stopColor="#220306" />
              </linearGradient>
            </defs>

            {/* Ground Shadow */}
            <ellipse cx="100" cy="180" rx="55" ry="9" fill="#000000" opacity="0.25" />

            {/* Fox Tail Drooping Inquiringly */}
            <path
              d="M 80 148 C 52 158, 20 138, 28 104 C 36 80, 65 90, 76 125 Z"
              fill="url(#fox404Grad)"
              stroke="#FF4A58"
              strokeWidth="1.5"
            />
            <path
              d="M 28 104 C 31 88, 46 84, 56 92 C 46 106, 38 112, 28 104 Z"
              fill="#FFFFFF"
              stroke="#FFD5DA"
              strokeWidth="0.8"
            />

            {/* Fox Torso */}
            <path
              d="M 72 118 Q 60 156 70 178 L 130 178 Q 140 156 128 118 Z"
              fill="url(#fox404Grad)"
              stroke="#FF4A58"
              strokeWidth="1.5"
            />
            {/* White Chest Bib */}
            <path
              d="M 84 122 C 82 144, 92 166, 100 172 C 108 166, 118 144, 116 122 C 110 130, 104 132, 100 132 C 96 132, 90 130, 84 122 Z"
              fill="#FFFFFF"
              stroke="#FFE4E8"
              strokeWidth="1"
            />

            {/* Paws */}
            <ellipse cx="85" cy="176" rx="9" ry="6" fill="#3D060D" stroke="#FF4A58" strokeWidth="1" />
            <ellipse cx="115" cy="176" rx="9" ry="6" fill="#3D060D" stroke="#FF4A58" strokeWidth="1" />

            {/* Animated Head (Tilted Quizzically) */}
            <g ref={headRef} id="fox-404-head">
              {/* Left Drooping Perplexed Ear */}
              <g ref={earRef} id="fox-404-ear-left">
                <path
                  d="M 70 82 L 46 38 Q 70 44 82 72 Z"
                  fill="url(#fox404Grad)"
                  stroke="#FF4A58"
                  strokeWidth="1.5"
                />
                <path d="M 68 76 L 52 46 Q 64 52 76 70 Z" fill="url(#fox404InnerEar)" />
              </g>

              {/* Right Alert Ear */}
              <g id="fox-404-ear-right">
                <path
                  d="M 130 82 L 154 38 Q 130 44 118 72 Z"
                  fill="url(#fox404Grad)"
                  stroke="#FF4A58"
                  strokeWidth="1.5"
                />
                <path d="M 132 76 L 148 46 Q 136 52 124 70 Z" fill="url(#fox404InnerEar)" />
              </g>

              {/* Face Mask */}
              <path
                d="M 62 86 C 52 108, 70 128, 88 132 L 100 135 L 112 132 C 130 128, 148 108, 138 86 C 134 62, 66 62, 62 86 Z"
                fill="url(#fox404Grad)"
                stroke="#FF4A58"
                strokeWidth="1.8"
              />

              {/* White Cheek Tufts */}
              <path
                d="M 63 94 Q 48 114 70 122 C 78 124, 86 120, 92 116 C 80 110, 70 102, 63 94 Z"
                fill="#FFFFFF"
              />
              <path
                d="M 137 94 Q 152 114 130 122 C 122 124, 114 120, 108 116 C 120 110, 130 102, 137 94 Z"
                fill="#FFFFFF"
              />

              {/* White Snout */}
              <path d="M 90 102 Q 100 96 110 102 L 105 120 Q 100 124 95 120 Z" fill="#FFFFFF" />

              {/* Nose */}
              <path d="M 96 110 Q 100 107 104 110 Q 100 115 96 110 Z" fill="#120406" />

              {/* Perplexed Wavy Smirk */}
              <path
                d="M 95 116 Q 100 113 105 117"
                stroke="#120406"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Whiskers */}
              <path d="M 82 112 L 62 110 M 80 116 L 64 118" stroke="#FFA4AC" strokeWidth="1" opacity="0.8" />
              <path d="M 118 112 L 138 110 M 120 116 L 136 118" stroke="#FFA4AC" strokeWidth="1" opacity="0.8" />

              {/* Quizzical Asymmetrical Eyes */}
              {/* Left Eye (Wide Questioning) */}
              <ellipse cx="82" cy="92" rx="6" ry="7.5" fill="#150204" />
              <circle cx="82" cy="92" r="4.2" fill="#E50914" />
              <circle cx="80.5" cy="90" r="1.8" fill="#FFFFFF" />

              {/* Right Eye (Narrowed Curious) */}
              <ellipse cx="118" cy="92" rx="5" ry="4.5" fill="#150204" />
              <circle cx="118" cy="92" r="3.2" fill="#E50914" />
              <circle cx="117" cy="91" r="1.4" fill="#FFFFFF" />
            </g>

            {/* Floating Mini Holographic Question Badge */}
            <g id="fox-404-bubble" transform="translate(138, 52)">
              <rect
                x="0"
                y="0"
                width="32"
                height="22"
                rx="6"
                fill="#14171D"
                stroke="#E50914"
                strokeWidth="1.2"
              />
              <text
                x="16"
                y="15"
                textAnchor="middle"
                fill="#E50914"
                fontSize="12"
                fontWeight="900"
                fontFamily="monospace"
              >
                ?
              </text>
            </g>
          </svg>
        </div>

        {/* Typography */}
        <div className="space-y-3">
          <h1 className="notfound-text text-3xl sm:text-4xl font-extrabold text-[var(--fn-text)] tracking-tight">
            Looks like this trail went cold.
          </h1>
          <p className="notfound-text text-sm sm:text-base text-[var(--fn-text-secondary)] max-w-md mx-auto leading-relaxed">
            Our fox searched the knowledge index, but this page seems to have wandered off or does not exist.
          </p>
        </div>

        {/* Recovery Actions */}
        <div className="notfound-actions flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--fn-radius)] bg-[var(--fn-accent)] hover:bg-[var(--fn-accent-hover)] text-white text-sm font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Dashboard
          </Link>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--fn-radius)] bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] text-[var(--fn-text)] border border-[var(--fn-border)] text-sm font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[var(--fn-radius)] text-xs text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] transition-colors"
          >
            Return to Homepage →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto flex items-center justify-between text-xs text-[var(--fn-text-tertiary)] pt-6 border-t border-[var(--fn-border)]/60">
        <span>FoxxNuts AI Knowledge Platform</span>
        <span>Status: All Core Systems Operational</span>
      </footer>
    </div>
  );
}
