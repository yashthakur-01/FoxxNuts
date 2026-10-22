"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useTheme } from "../lib/ThemeContext";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PlanetHeroBackgroundProps {
  className?: string;
}

/**
 * PlanetHeroBackground
 * 
 * Cinematic CRIMZON-inspired atmospheric dark planet hero background.
 * Powered by GSAP ScrollTrigger for 60-120fps hardware-accelerated setting moon animation.
 */
export default function PlanetHeroBackground({ className = "" }: PlanetHeroBackgroundProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const coronaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Buttery smooth scroll-driven setting moon animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=650",
          scrub: 1.2, // Smooth inertia scrub
        },
      });

      // Sphere sinks downward as setting moon, subtly scales, and smoothly fades
      tl.to(
        sphereRef.current,
        {
          y: 180,
          scale: 0.94,
          opacity: 0,
          ease: "power1.out",
        },
        0
      );

      // Corona halo sinks slightly slower for rich parallax depth
      tl.to(
        coronaRef.current,
        {
          y: 110,
          opacity: 0,
          ease: "power1.out",
        },
        0
      );
    },
    { scope: containerRef, dependencies: [isLight] }
  );

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
    >
      {/* ── LAYER 1: AMBIENT CORONA & VOLUMETRIC FLANK GLOWS (CENTERED) ───── */}
      <div
        ref={coronaRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] sm:w-[980px] sm:h-[980px] md:w-[1100px] md:h-[1100px] lg:w-[1220px] lg:h-[1220px] pointer-events-none z-[1] will-change-transform"
      >
        {/* Top Arc Atmospheric Corona Halo */}
        <div
          className={`absolute -top-24 sm:-top-32 left-1/2 -translate-x-1/2 w-[850px] sm:w-[1100px] lg:w-[1300px] h-[360px] sm:h-[460px] rounded-full blur-[60px] sm:blur-[95px] ${
            isLight
              ? "bg-[radial-gradient(ellipse_at_center,_rgba(255,40,60,0.18)_0%,_rgba(255,80,100,0.08)_40%,_transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_center,_rgba(255,30,45,0.45)_0%,_rgba(215,12,28,0.22)_38%,_rgba(140,5,18,0.08)_62%,_transparent_78%)]"
          }`}
        />

        {/* Left Flank Atmosphere Glow */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -left-12 sm:-left-24 w-[380px] sm:w-[500px] h-[520px] sm:h-[650px] rounded-full blur-[65px] sm:blur-[95px] ${
            isLight
              ? "bg-[radial-gradient(ellipse_at_center,_rgba(255,50,70,0.10)_0%,_transparent_65%)]"
              : "bg-[radial-gradient(ellipse_at_center,_rgba(235,20,35,0.25)_0%,_rgba(160,8,20,0.09)_45%,_transparent_72%)]"
          }`}
        />

        {/* Right Flank Atmosphere Glow */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -right-12 sm:-right-24 w-[380px] sm:w-[500px] h-[520px] sm:h-[650px] rounded-full blur-[65px] sm:blur-[95px] ${
            isLight
              ? "bg-[radial-gradient(ellipse_at_center,_rgba(255,50,70,0.10)_0%,_transparent_65%)]"
              : "bg-[radial-gradient(ellipse_at_center,_rgba(235,20,35,0.25)_0%,_rgba(160,8,20,0.09)_45%,_transparent_72%)]"
          }`}
        />
      </div>

      {/* ── LAYER 2: THE CELESTIAL PLANET SPHERE (CENTERED IN HERO) ───────── */}
      <div
        ref={sphereRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] sm:w-[980px] sm:h-[980px] md:w-[1100px] md:h-[1100px] lg:w-[1220px] lg:h-[1220px] pointer-events-none z-[2] will-change-transform origin-center"
      >
        {!isLight ? (
          /* Planet Solid Body (Dark Mode: Deep rich burgundy-charcoal surface) */
          <div
            className="relative w-full h-full rounded-full transition-colors duration-300"
            style={{
              background:
                "radial-gradient(circle at 50% 8%, #240810 0%, #1a060d 22%, #120509 45%, #0b0306 70%, #060204 100%)",
              boxShadow:
                "0 -4px 30px rgba(255, 35, 50, 0.6), 0 -12px 65px rgba(255, 15, 30, 0.4), inset 0 3px 6px -1px rgba(255, 140, 150, 0.6), inset 0 16px 45px -8px rgba(255, 35, 50, 0.5), inset 0 45px 95px -20px rgba(200, 10, 25, 0.3)",
            }}
          >
            {/* Planet Surface Ambient Vignette */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 12%, transparent 35%, rgba(4, 2, 4, 0.55) 70%, rgba(2, 1, 2, 0.92) 100%)",
              }}
            />
          </div>
        ) : (
          /* Planet Body (Light Mode: Ethereal translucent warm rose wash preserving 100% text readability) */
          <div
            className="relative w-full h-full rounded-full transition-colors duration-300"
            style={{
              background:
                "radial-gradient(circle at 50% 12%, rgba(255, 230, 235, 0.40) 0%, rgba(255, 245, 247, 0.12) 50%, transparent 80%)",
              boxShadow: "0 -4px 25px rgba(220, 38, 38, 0.18), 0 -10px 50px rgba(220, 38, 38, 0.08)",
            }}
          />
        )}

        {/* ── LAYER 3: HIGH-CONTRAST ATMOSPHERIC RIM SVG ───────────────── */}
        <svg
          viewBox="0 0 1200 1200"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Smooth linear gradient for the upper rim stroke */}
            <linearGradient id="planetRimGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF4A58" stopOpacity="1" />
              <stop offset="18%" stopColor="#FF1E28" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#E50914" stopOpacity="0.8" />
              <stop offset="62%" stopColor="#99000D" stopOpacity="0.4" />
              <stop offset="82%" stopColor="#330004" stopOpacity="0.08" />
              <stop offset="95%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Gradient for full circle side flanks */}
            <linearGradient id="planetFullCircleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF3344" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#E50914" stopOpacity="0.6" />
              <stop offset="65%" stopColor="#99000D" stopOpacity="0.3" />
              <stop offset="85%" stopColor="#440005" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Crest highlight gradient: peaks brilliantly at top apex */}
            <radialGradient id="crestHighlightGrad" cx="50%" cy="0%" r="50%">
              <stop offset="0%" stopColor="#FFAAB2" stopOpacity="1" />
              <stop offset="35%" stopColor="#FF5A68" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#FF1E28" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
            </radialGradient>

            {/* Radial mask to ensure soft, natural falloff towards the sides */}
            <radialGradient id="rimArcRadialMask" cx="50%" cy="0%" r="68%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="72%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="92%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>

            <mask id="planetRimArcMask">
              <rect x="0" y="0" width="1200" height="1200" fill="url(#rimArcRadialMask)" />
            </mask>

            {/* Optical Glow Filters */}
            <filter id="coronaWideBloom" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
            <filter id="atmosphereMidGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="crestSoftGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="1.8" />
            </filter>
          </defs>

          {/* Full circle subtle perimeter definition down the flanks */}
          <circle
            cx="600"
            cy="600"
            r="594"
            fill="none"
            stroke="url(#planetFullCircleGradient)"
            strokeWidth="1.5"
            opacity="0.45"
          />

          {/* Stroke 1: Broad Volumetric Corona Flare (Blurred 18px) */}
          <path
            d="M 6,600 A 594,594 0 0,1 1194,600"
            fill="none"
            stroke="url(#planetRimGradient)"
            strokeWidth="36"
            opacity="0.65"
            filter="url(#coronaWideBloom)"
            mask="url(#planetRimArcMask)"
          />

          {/* Stroke 2: Atmospheric Mid-Glow (Blurred 6px) */}
          <path
            d="M 6,600 A 594,594 0 0,1 1194,600"
            fill="none"
            stroke="url(#planetRimGradient)"
            strokeWidth="14"
            opacity="0.9"
            filter="url(#atmosphereMidGlow)"
            mask="url(#planetRimArcMask)"
          />

          {/* Stroke 3: High-Intensity Core Rim Arc (Blurred 1.8px) */}
          <path
            d="M 6,600 A 594,594 0 0,1 1194,600"
            fill="none"
            stroke="url(#planetRimGradient)"
            strokeWidth="4"
            opacity="1"
            filter="url(#crestSoftGlow)"
            mask="url(#planetRimArcMask)"
          />

          {/* Stroke 4: Razor Crest Highlight along the apex */}
          <path
            d="M 6,600 A 594,594 0 0,1 1194,600"
            fill="none"
            stroke="url(#crestHighlightGrad)"
            strokeWidth="1.8"
            opacity="1"
            mask="url(#planetRimArcMask)"
          />
        </svg>
      </div>

      {/* ── LAYER 4: DEDICATED BOTTOM GRADIENT DISSOLVE OVERLAY (DARK MODE ONLY) ── */}
      {!isLight && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-[3]"
          style={{
            height: "38%",
            background:
              "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--fn-bg) 30%, transparent) 35%, color-mix(in srgb, var(--fn-bg) 85%, transparent) 70%, var(--fn-bg) 100%)",
          }}
        />
      )}
    </div>
  );
}
