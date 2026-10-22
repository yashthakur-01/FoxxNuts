"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface FoxMascotLoaderProps {
  variant?: "fullscreen" | "page" | "section" | "inline";
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

/**
 * FoxMascotLoader
 * 
 * Distinctive, branded Fox mascot loading indicator for FoxxNuts AI.
 * Built with precision vector geometry, GSAP hardware-accelerated motion,
 * full reduced-motion support, and seamless light/dark theme adaptation.
 */
export default function FoxMascotLoader({
  variant = "page",
  size = "md",
  message,
  className = "",
}: FoxMascotLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const leftEarRef = useRef<SVGGElement>(null);
  const rightEarRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  useGSAP(
    () => {
      if (reducedMotion || !containerRef.current) return;

      // 1. Gentle floating bob
      if (headRef.current) {
        gsap.to(headRef.current, {
          y: -3,
          duration: 1.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "center bottom",
        });
      }

      // 2. Silky tail swish
      if (tailRef.current) {
        gsap.to(tailRef.current, {
          rotation: 9,
          duration: 2.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "bottom left",
        });
      }

      // 3. Subtle ear curiosity twitch
      if (leftEarRef.current && rightEarRef.current) {
        gsap.to([leftEarRef.current, rightEarRef.current], {
          rotation: (i) => (i === 0 ? -4 : 4),
          duration: 2.2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "bottom center",
        });
      }

      // 4. Autonomous natural blink
      if (eyesRef.current) {
        gsap.timeline({ repeat: -1, repeatDelay: 3.2 })
          .to(eyesRef.current, {
            scaleY: 0.1,
            duration: 0.08,
            ease: "power1.in",
            transformOrigin: "center center",
          })
          .to(eyesRef.current, {
            scaleY: 1,
            duration: 0.12,
            ease: "power2.out",
            transformOrigin: "center center",
          });
      }
    },
    { scope: containerRef, dependencies: [reducedMotion] }
  );

  const dimensionMap = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const svgDimensions = dimensionMap[size];

  // ── Standalone Mascot Vector SVG Graphic ──
  const mascotSvg = (
    <svg
      viewBox="0 0 160 160"
      className={`${svgDimensions} drop-shadow-sm shrink-0 overflow-visible`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="FoxxNuts mascot loading"
    >
      <defs>
        <linearGradient id="loaderFoxRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF3848" />
          <stop offset="50%" stopColor="#E50914" />
          <stop offset="100%" stopColor="#B3000A" />
        </linearGradient>
        <linearGradient id="loaderInnerEar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#540810" />
          <stop offset="100%" stopColor="#220306" />
        </linearGradient>
      </defs>

      {/* Ground Soft Shadow */}
      <ellipse cx="80" cy="148" rx="42" ry="7" fill="#000000" opacity="0.25" />

      {/* Tail (Curled & Swishing) */}
      <g ref={tailRef} id="loader-tail">
        <path
          d="M 64 120 C 42 128, 14 112, 22 84 C 28 66, 52 72, 62 100 Z"
          fill="url(#loaderFoxRed)"
          stroke="#FF4A58"
          strokeWidth="1.2"
        />
        <path
          d="M 22 84 C 24 72, 36 68, 44 75 C 36 86, 30 90, 22 84 Z"
          fill="#FFFFFF"
          stroke="#FFD5DA"
          strokeWidth="0.8"
        />
      </g>

      {/* Body Torso */}
      <path
        d="M 58 95 Q 48 126 56 144 L 104 144 Q 112 126 102 95 Z"
        fill="url(#loaderFoxRed)"
        stroke="#FF4A58"
        strokeWidth="1.2"
      />
      {/* Chest White Bib */}
      <path
        d="M 68 98 C 66 116, 74 134, 80 138 C 86 134, 94 116, 92 98 C 87 104, 83 106, 80 106 C 77 106, 73 104, 68 98 Z"
        fill="#FFFFFF"
        stroke="#FFE4E8"
        strokeWidth="0.8"
      />

      {/* Head Group */}
      <g ref={headRef} id="loader-head">
        {/* Left Ear */}
        <g ref={leftEarRef} id="loader-ear-left">
          <path
            d="M 56 65 L 38 30 Q 56 34 65 56 Z"
            fill="url(#loaderFoxRed)"
            stroke="#FF4A58"
            strokeWidth="1.2"
          />
          <path d="M 54 60 L 42 36 Q 52 40 60 55 Z" fill="url(#loaderInnerEar)" />
        </g>

        {/* Right Ear */}
        <g ref={rightEarRef} id="loader-ear-right">
          <path
            d="M 104 65 L 122 30 Q 104 34 95 56 Z"
            fill="url(#loaderFoxRed)"
            stroke="#FF4A58"
            strokeWidth="1.2"
          />
          <path d="M 106 60 L 118 36 Q 108 40 100 55 Z" fill="url(#loaderInnerEar)" />
        </g>

        {/* Face Mask */}
        <path
          d="M 50 68 C 42 85, 56 102, 70 104 L 80 107 L 90 104 C 104 102, 118 85, 110 68 C 107 50, 53 50, 50 68 Z"
          fill="url(#loaderFoxRed)"
          stroke="#FF4A58"
          strokeWidth="1.4"
        />

        {/* White Cheek Tufts */}
        <path
          d="M 51 74 Q 38 90 56 96 C 62 97, 69 95, 74 92 C 64 87, 56 81, 51 74 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 109 74 Q 122 90 104 96 C 98 97, 91 95, 86 92 C 96 87, 104 81, 109 74 Z"
          fill="#FFFFFF"
        />

        {/* White Snout */}
        <path d="M 72 80 Q 80 75 88 80 L 84 95 Q 80 97 76 95 Z" fill="#FFFFFF" />

        {/* Nose Tip */}
        <path d="M 77 86 Q 80 84 83 86 Q 80 90 77 86 Z" fill="#120406" />

        {/* Cute Smile */}
        <path
          d="M 76 91 Q 78 93 80 91 Q 82 93 84 91"
          stroke="#120406"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Eyes Group (Blinks with GSAP) */}
        <g ref={eyesRef} id="loader-eyes">
          {/* Left Eye */}
          <ellipse cx="66" cy="72" rx="4.5" ry="5.5" fill="#150204" />
          <circle cx="66" cy="72" r="3.2" fill="#E50914" />
          <circle cx="65" cy="70.5" r="1.3" fill="#FFFFFF" />

          {/* Right Eye */}
          <ellipse cx="94" cy="72" rx="4.5" ry="5.5" fill="#150204" />
          <circle cx="94" cy="72" r="3.2" fill="#E50914" />
          <circle cx="93" cy="70.5" r="1.3" fill="#FFFFFF" />
        </g>
      </g>

      {/* Front Paws */}
      <ellipse cx="68" cy="143" rx="7" ry="5" fill="#3D060D" stroke="#FF4A58" strokeWidth="0.8" />
      <ellipse cx="92" cy="143" rx="7" ry="5" fill="#3D060D" stroke="#FF4A58" strokeWidth="0.8" />
    </svg>
  );

  // ── VARIANT 1: Fullscreen / Viewport Loading ──
  if (variant === "fullscreen") {
    return (
      <div
        ref={containerRef}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--fn-bg)]/90 backdrop-blur-md transition-colors select-none ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center px-4 animate-fn-fade-in">
          {mascotSvg}
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[var(--fn-text)] tracking-tight">
              FoxxNuts
            </h3>
            {message && (
              <p className="text-xs text-[var(--fn-text-secondary)] font-medium">
                {message}
              </p>
            )}
          </div>
          <div className="w-24 h-1 bg-[var(--fn-border)] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[var(--fn-accent)] animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── VARIANT 2: Full Page / Route Transition Loading ──
  if (variant === "page") {
    return (
      <div
        ref={containerRef}
        className={`w-full min-h-[420px] flex-1 flex flex-col items-center justify-center py-12 px-4 select-none ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center space-y-3 max-w-xs text-center animate-fn-fade-in">
          {mascotSvg}
          {message && (
            <p className="text-xs font-medium text-[var(--fn-text-secondary)]">
              {message}
            </p>
          )}
          <div className="w-20 h-0.5 bg-[var(--fn-border)] rounded-full overflow-hidden">
            <div className="w-full h-full bg-[var(--fn-accent)] animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // ── VARIANT 3: Section / Card Loading ──
  if (variant === "section") {
    return (
      <div
        ref={containerRef}
        className={`w-full py-8 flex flex-col items-center justify-center space-y-2.5 select-none ${className}`}
        role="status"
        aria-live="polite"
      >
        {mascotSvg}
        {message && (
          <p className="text-xs text-[var(--fn-text-secondary)] font-medium">
            {message}
          </p>
        )}
      </div>
    );
  }

  // ── VARIANT 4: Inline / Compact ──
  return (
    <div
      ref={containerRef}
      className={`inline-flex items-center gap-2 select-none ${className}`}
      role="status"
      aria-live="polite"
    >
      {mascotSvg}
      {message && (
        <span className="text-xs text-[var(--fn-text-secondary)] font-medium">
          {message}
        </span>
      )}
    </div>
  );
}
