"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export type FoxMood = "paradox" | "accuracy" | "visibility";

interface AnimatedFoxMascotProps {
  mood: FoxMood;
  className?: string;
}

/**
 * AnimatedFoxMascot
 * 
 * Bespoke Cybernetic Red Fox mascot tailored specifically for FoxxNuts AI.
 * Enhanced with adorable anime/Pixar-level proportions (sparkling catchlight eyes,
 * glowing cheek blush, cute ':3' fox smile, fluffy cheek tufts, and soft pink toe-beans).
 * Powered by GSAP for buttery smooth 60-120fps hardware-accelerated animations.
 */
export default function AnimatedFoxMascot({ mood, className = "" }: AnimatedFoxMascotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const leftEarRef = useRef<SVGGElement>(null);
  const rightEarRef = useRef<SVGGElement>(null);
  const leftPupilRef = useRef<SVGGElement>(null);
  const rightPupilRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const tongueRef = useRef<SVGGElement>(null);
  const tailRef = useRef<SVGGElement>(null);
  const leftPawRef = useRef<SVGGElement>(null);
  const rightPawRef = useRef<SVGGElement>(null);
  const visorRef = useRef<SVGGElement>(null);
  const visorScanlineRef = useRef<SVGLineElement>(null);
  const questionBadgeRef = useRef<SVGGElement>(null);
  const telemetryBadgeRef = useRef<SVGGElement>(null);
  const radarSweepRef = useRef<SVGLineElement>(null);
  const orbsGroupRef = useRef<SVGGElement>(null);
  const circuitsRef = useRef<SVGGElement>(null);
  const chestSensorRef = useRef<SVGCircleElement>(null);
  const blushRef = useRef<SVGGElement>(null);
  const [clickCount, setClickCount] = useState(0);

  // ── GSAP Continuous Micro-Animations (Idle breathing, tail sway, blinks, circuits, radar) ──
  useGSAP(
    () => {
      // 1. Silky Smooth Tail Sway (Organic 3.2s sine oscillation)
      gsap.to(tailRef.current, {
        rotation: 12,
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "bottom left",
      });

      // 2. Synchronized Organic Breathing (Body expands gently while head bobs in harmony)
      if (bodyRef.current) {
        gsap.to(bodyRef.current, {
          scaleY: 1.025,
          scaleX: 0.99,
          duration: 2.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "bottom center",
        });
      }

      gsap.to(headRef.current, {
        y: -3.5,
        duration: 2.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        transformOrigin: "center bottom",
      });

      // 3. Natural Sweet Eye Blinking (Smooth squash with gentle ease)
      const blinkTimeline = gsap.timeline({
        repeat: -1,
        repeatDelay: 3.8,
      });
      blinkTimeline
        .to([leftPupilRef.current, rightPupilRef.current], {
          scaleY: 0.06,
          duration: 0.09,
          ease: "power1.inOut",
          transformOrigin: "center center",
        })
        .to([leftPupilRef.current, rightPupilRef.current], {
          scaleY: 1,
          duration: 0.15,
          ease: "power2.out",
          transformOrigin: "center center",
        });

      // 4. Subtle Ear Micro-Twitches (Cute natural fox curiosity every ~5.5s)
      const earTwitchTl = gsap.timeline({
        repeat: -1,
        repeatDelay: 5.2,
      });
      earTwitchTl
        .to(rightEarRef.current, {
          rotation: "+=6",
          duration: 0.12,
          yoyo: true,
          repeat: 1,
          ease: "power1.inOut",
          transformOrigin: "bottom left",
        })
        .to(
          leftEarRef.current,
          {
            rotation: "-=5",
            duration: 0.12,
            yoyo: true,
            repeat: 1,
            ease: "power1.inOut",
            transformOrigin: "bottom right",
          },
          "+=1.8"
        );

      // 5. Orbital LangGraph Orbs Rotation with gentle quantum drift
      if (orbsGroupRef.current) {
        gsap.to(orbsGroupRef.current, {
          rotation: 360,
          duration: 12,
          ease: "none",
          repeat: -1,
          transformOrigin: "160px 140px",
        });
      }

      // 6. Visor Holographic Laser Scanline (Smooth sweep)
      if (visorScanlineRef.current) {
        gsap.fromTo(
          visorScanlineRef.current,
          { attr: { x1: 115, x2: 115 } },
          {
            attr: { x1: 205, x2: 205 },
            duration: 1.6,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          }
        );
      }

      // 7. Telemetry Radar Needle Sweep
      if (radarSweepRef.current) {
        gsap.to(radarSweepRef.current, {
          rotation: 360,
          duration: 2.2,
          ease: "none",
          repeat: -1,
          transformOrigin: "228px 87px",
        });
      }

      // 8. Pulsing Chest Cyber Sensor Core
      if (chestSensorRef.current) {
        gsap.to(chestSensorRef.current, {
          scale: 1.3,
          opacity: 0.8,
          duration: 1.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          transformOrigin: "center center",
        });
      }

      // 9. Cybernetic Circuit Current Flow (Dash offset cycling)
      if (circuitsRef.current) {
        gsap.to(circuitsRef.current.querySelectorAll(".circuit-path"), {
          strokeDashoffset: -24,
          duration: 2,
          ease: "none",
          repeat: -1,
        });
      }
    },
    { scope: containerRef }
  );

  // ── Liquid Cursor Follow Physics (Liquid smooth gaze & head tilt) ─────────
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !leftPupilRef.current || !rightPupilRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);

      // Clamp pupil travel between -4px and +4px
      const pupilX = Math.max(-4, Math.min(4, deltaX * 4));
      const pupilY = Math.max(-3, Math.min(3, deltaY * 3));

      // Gentle head tilt following cursor (-3deg to +3deg)
      const headTilt = Math.max(-3, Math.min(3, deltaX * 3));

      gsap.to([leftPupilRef.current, rightPupilRef.current], {
        x: pupilX,
        y: pupilY,
        duration: 0.5,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (headRef.current && mood !== "paradox") {
        gsap.to(headRef.current, {
          rotation: headTilt,
          duration: 0.75,
          ease: "sine.out",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mood]);

  // ── GSAP Mood State Machine (Silky 0.75s expressions & gestures) ───────────
  useGSAP(
    () => {
      if (!headRef.current) return;

      const tl = gsap.timeline({ defaults: { duration: 0.75, ease: "power2.out" } });

      if (mood === "paradox") {
        // STATE 1: SKEPTICAL & PERPLEXED (Support Bot Paradox)
        // Quizzical head tilt, one ear drooping, skeptical cute mouth, chin-scratch paw
        tl.to(headRef.current, { rotation: -6, transformOrigin: "center bottom" }, 0)
          .to(leftEarRef.current, { rotation: -18, transformOrigin: "bottom right" }, 0)
          .to(rightEarRef.current, { rotation: 8, transformOrigin: "bottom left" }, 0)
          .to(
            mouthRef.current,
            {
              attr: { d: "M 152 184 Q 160 180 168 185" }, // Cute skeptical smirk
              duration: 0.6,
            },
            0
          )
          .to(tongueRef.current, { opacity: 0, scale: 0.5, duration: 0.3 }, 0)
          .to(leftPawRef.current, { y: -16, rotation: -12, transformOrigin: "bottom left" }, 0)
          .to(rightPawRef.current, { y: 0, rotation: 0 }, 0)
          // Props: Show Question Badge, hide others
          .to(questionBadgeRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.55 }, 0.05)
          .to(visorRef.current, { opacity: 0, scale: 0.85, y: -10, duration: 0.4 }, 0)
          .to(telemetryBadgeRef.current, { opacity: 0, scale: 0.7, y: 10, duration: 0.4 }, 0)
          .to(orbsGroupRef.current, { opacity: 0, scale: 0.75, duration: 0.4 }, 0);
      } else if (mood === "accuracy") {
        // STATE 2: INTELLECTUAL & FOCUSED (LangGraph Multi-Node Accuracy)
        // Upright ears, cybernetic HUD visor sliding into place, confident ':3' smile
        tl.to(headRef.current, { rotation: 1, transformOrigin: "center bottom" }, 0)
          .to(leftEarRef.current, { rotation: 4, transformOrigin: "bottom right" }, 0)
          .to(rightEarRef.current, { rotation: -4, transformOrigin: "bottom left" }, 0)
          .to(
            mouthRef.current,
            {
              attr: { d: "M 152 182 Q 156 186 160 183 Q 164 186 168 182" }, // Confident cute :3 smile
              duration: 0.6,
            },
            0
          )
          .to(tongueRef.current, { opacity: 0, scale: 0.5, duration: 0.3 }, 0)
          .to(leftPawRef.current, { y: -8, rotation: 8, transformOrigin: "bottom left" }, 0)
          .to(rightPawRef.current, { y: -8, rotation: -8, transformOrigin: "bottom right" }, 0)
          // Props: Slide in Cyber Visor & LangGraph Orbs
          .to(questionBadgeRef.current, { opacity: 0, scale: 0.7, y: -10, duration: 0.4 }, 0)
          .to(visorRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.55 }, 0.05)
          .to(telemetryBadgeRef.current, { opacity: 0, scale: 0.7, duration: 0.4 }, 0)
          .to(orbsGroupRef.current, { opacity: 1, scale: 1, duration: 0.6 }, 0.1);
      } else if (mood === "visibility") {
        // STATE 3: MISSION COMMANDER (Full Operational Visibility)
        // Joyful open ':3' smile with pink tongue, triumphant thumbs-up, telemetry badge
        tl.to(headRef.current, { rotation: 0, transformOrigin: "center bottom" }, 0)
          .to(leftEarRef.current, { rotation: 0, transformOrigin: "bottom right" }, 0)
          .to(rightEarRef.current, { rotation: 0, transformOrigin: "bottom left" }, 0)
          .to(
            mouthRef.current,
            {
              attr: { d: "M 150 180 Q 155 186 160 183 Q 165 186 170 180" }, // Joyful open :3 mouth
              duration: 0.6,
            },
            0
          )
          .to(tongueRef.current, { opacity: 1, scale: 1, duration: 0.5 }, 0.1)
          .to(leftPawRef.current, { y: 0, rotation: 0 }, 0)
          .to(rightPawRef.current, { y: -24, rotation: -20, transformOrigin: "bottom right" }, 0) // Crisp thumbs-up
          // Props: Show Telemetry Radar Badge & active telemetry visor
          .to(questionBadgeRef.current, { opacity: 0, scale: 0.7, duration: 0.4 }, 0)
          .to(visorRef.current, { opacity: 0.85, scale: 1, y: 0, duration: 0.4 }, 0)
          .to(telemetryBadgeRef.current, { opacity: 1, scale: 1, y: 0, duration: 0.55 }, 0.1)
          .to(orbsGroupRef.current, { opacity: 0.4, scale: 0.9, duration: 0.5 }, 0);
      }
    },
    { dependencies: [mood], scope: containerRef }
  );

  // ── Interactive Mascot Squish & Cheer on Click ───────────────────────────
  const handleMascotClick = () => {
    setClickCount((c) => c + 1);
    if (!headRef.current || !leftEarRef.current || !rightEarRef.current) return;

    gsap.timeline()
      .to(headRef.current, { scaleY: 0.92, scaleX: 1.06, duration: 0.12, ease: "power1.in" })
      .to(headRef.current, {
        y: -10,
        scaleY: 1.06,
        scaleX: 0.96,
        duration: 0.28,
        ease: "back.out(2)",
      })
      .to(leftEarRef.current, { rotation: "+=16", duration: 0.12, yoyo: true, repeat: 2 }, 0.1)
      .to(rightEarRef.current, { rotation: "-=16", duration: 0.12, yoyo: true, repeat: 2 }, 0.1)
      .to(blushRef.current, { opacity: 0.9, scale: 1.15, duration: 0.2, yoyo: true, repeat: 1 }, 0.1)
      .to(headRef.current, { y: 0, scaleY: 1, scaleX: 1, duration: 0.4, ease: "power2.out" });
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center select-none ${className}`}
    >
      {/* ── AMBIENT CYBER GLOW BACKDROP ───────────────────────────────── */}
      <div
        className={`absolute -inset-6 rounded-full blur-3xl opacity-40 transition-all duration-700 pointer-events-none ${
          mood === "paradox"
            ? "bg-gradient-to-b from-red-600/35 via-amber-600/20 to-transparent"
            : mood === "accuracy"
            ? "bg-gradient-to-b from-[#FF1E27]/45 via-cyan-500/20 to-transparent"
            : "bg-gradient-to-b from-emerald-500/40 via-[#FF1E27]/30 to-transparent"
        }`}
      />

      {/* ── THE MASTER SVG SCENE GRAPH ────────────────────────────────── */}
      <svg
        viewBox="0 0 320 360"
        className="w-full h-auto max-w-[360px] sm:max-w-[400px] drop-shadow-2xl overflow-visible relative z-10"
      >
        <defs>
          {/* Fox Coat Primary Linear Gradient (Vibrant Crimson, never fading to black) */}
          <linearGradient id="foxCoatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF4D5A" />
            <stop offset="30%" stopColor="#FF1E27" />
            <stop offset="70%" stopColor="#E50914" />
            <stop offset="100%" stopColor="#B3000A" />
          </linearGradient>

          {/* Cyber Crimson Outline Gradient */}
          <linearGradient id="foxOutlineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF7A88" />
            <stop offset="50%" stopColor="#FF1E27" />
            <stop offset="100%" stopColor="#FF3848" />
          </linearGradient>

          {/* Eye Iris Multi-Stop Radiant Ruby Gradient */}
          <linearGradient id="eyeIrisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF7A88" />
            <stop offset="45%" stopColor="#FF1E27" />
            <stop offset="80%" stopColor="#A80812" />
            <stop offset="100%" stopColor="#590007" />
          </linearGradient>

          {/* Inner Ear Velvet Gradient (Warm Rose Burgundy) */}
          <linearGradient id="foxInnerEarGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF8A96" />
            <stop offset="40%" stopColor="#6B121C" />
            <stop offset="100%" stopColor="#290408" />
          </linearGradient>

          {/* Chest Fur Gradient (Soft Creamy White) */}
          <linearGradient id="foxChestGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#FFF0F2" />
            <stop offset="100%" stopColor="#FED7DC" />
          </linearGradient>

          {/* Cyber Visor Hologram Gradient */}
          <linearGradient id="cyberVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF1E27" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FF4A58" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.9" />
          </linearGradient>

          {/* Soft Glow filter */}
          <filter id="neonGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Cute Blush Soft Glow */}
          <filter id="blushGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── 1. GROUND SHADOW ────────────────────────────────────────── */}
        <ellipse cx="160" cy="336" rx="96" ry="14" fill="#000000" opacity="0.38" />

        {/* ── 2. TAIL (BEHIND BODY - FLUFFY & PLUSH) ──────────────────── */}
        <g ref={tailRef} id="fox-tail">
          {/* Tail Plush Red Silhouette */}
          <path
            d="M 120 270 C 72 284, 15 248, 30 182 C 42 142, 95 156, 116 220 Z"
            fill="url(#foxCoatGrad)"
            stroke="url(#foxOutlineGrad)"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Tail Cloud-like White Tip */}
          <path
            d="M 30 182 C 36 158, 58 148, 76 162 C 60 184, 46 194, 30 182 Z"
            fill="#FFFFFF"
            stroke="#FFBCC4"
            strokeWidth="1.2"
          />
          {/* Tail Flank Shadow Accent */}
          <path
            d="M 120 270 C 95 276, 46 256, 48 226 C 62 250, 96 265, 120 270 Z"
            fill="#8A000A"
            opacity="0.45"
          />
        </g>

        {/* ── 3. BODY & CHEST ─────────────────────────────────────────── */}
        <g ref={bodyRef} id="fox-body">
          {/* Torso Base with Vivid Cyber Crimson Outline */}
          <path
            d="M 115 210 Q 95 280 110 325 L 210 325 Q 225 280 205 210 Z"
            fill="url(#foxCoatGrad)"
            stroke="url(#foxOutlineGrad)"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* Chest White Fluff (Fox Signature Cute Bib) */}
          <path
            d="M 132 215 C 130 255, 145 295, 160 305 C 175 295, 190 255, 188 215 C 178 230, 168 235, 160 235 C 152 235, 142 230, 132 215 Z"
            fill="url(#foxChestGrad)"
            stroke="#FFD5DA"
            strokeWidth="1.2"
          />

          {/* Subtle Tech Collar Line */}
          <path
            d="M 124 212 Q 160 226 196 212"
            stroke="#FF2E3E"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          {/* Pulsing Central Cyber Sensor */}
          <circle
            ref={chestSensorRef}
            cx="160"
            cy="220"
            r="4.5"
            fill="#FF1E27"
            stroke="#FF7A88"
            strokeWidth="1.2"
            filter="url(#neonGlow)"
          />
        </g>

        {/* ── 4. HEAD GROUP (CUTE PROPORTIONS, TILTS & MORPHS) ───────── */}
        <g
          ref={headRef}
          id="fox-head"
          className="cursor-pointer"
          onClick={handleMascotClick}
        >
          {/* Left Fluffy Ear */}
          <g ref={leftEarRef} id="ear-left">
            <path
              d="M 114 135 L 75 58 Q 112 68 130 115 Z"
              fill="url(#foxCoatGrad)"
              stroke="url(#foxOutlineGrad)"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Inner Ear Rose Velvet */}
            <path
              d="M 108 124 L 84 72 Q 106 80 120 112 Z"
              fill="url(#foxInnerEarGrad)"
              stroke="#6B121C"
              strokeWidth="1"
            />
            {/* Soft Ear Fluff Tufts */}
            <path d="M 96 104 L 115 109 L 103 118 Z" fill="#FFFFFF" />
          </g>

          {/* Right Fluffy Ear */}
          <g ref={rightEarRef} id="ear-right">
            <path
              d="M 206 135 L 245 58 Q 208 68 190 115 Z"
              fill="url(#foxCoatGrad)"
              stroke="url(#foxOutlineGrad)"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Inner Ear Rose Velvet */}
            <path
              d="M 212 124 L 236 72 Q 214 80 200 112 Z"
              fill="url(#foxInnerEarGrad)"
              stroke="#6B121C"
              strokeWidth="1"
            />
            {/* Soft Ear Fluff Tufts */}
            <path d="M 224 104 L 205 109 L 217 118 Z" fill="#FFFFFF" />
          </g>

          {/* Master Face Skull Silhouette (Rounded Cute Fox Head) */}
          <path
            d="M 96 142 C 80 176, 108 210, 135 214 L 160 219 L 185 214 C 212 210, 240 176, 224 142 C 218 106, 102 106, 96 142 Z"
            fill="url(#foxCoatGrad)"
            stroke="url(#foxOutlineGrad)"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Upper Head Rim Soft Highlight */}
          <path
            d="M 108 133 C 122 114, 198 114, 212 133"
            stroke="#FFA8B2"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />

          {/* White Cheek Fluff Tufts (Left & Right - Chubby & Soft) */}
          <path
            d="M 98 152 Q 72 184 108 196 C 120 199, 134 196, 144 190 C 124 180, 108 168, 98 152 Z"
            fill="url(#foxChestGrad)"
            stroke="#FFBCC4"
            strokeWidth="1.2"
          />
          <path
            d="M 222 152 Q 248 184 212 196 C 200 199, 186 196, 176 190 C 196 180, 212 168, 222 152 Z"
            fill="url(#foxChestGrad)"
            stroke="#FFBCC4"
            strokeWidth="1.2"
          />

          {/* ── ADORABLE KAWAII CHEEK BLUSH (ROSY SOFT GLOW) ─────────── */}
          <g ref={blushRef} id="fox-cheek-blush">
            {/* Left Cheek Blush */}
            <ellipse
              cx="114"
              cy="174"
              rx="12.5"
              ry="7.5"
              fill="#FF2E55"
              opacity="0.42"
              filter="url(#blushGlow)"
            />
            <circle cx="110" cy="173" r="1.5" fill="#FFC2CF" opacity="0.85" />

            {/* Right Cheek Blush */}
            <ellipse
              cx="206"
              cy="174"
              rx="12.5"
              ry="7.5"
              fill="#FF2E55"
              opacity="0.42"
              filter="url(#blushGlow)"
            />
            <circle cx="210" cy="173" r="1.5" fill="#FFC2CF" opacity="0.85" />
          </g>

          {/* ── Cybernetic Circuit Traces (Animated Glow Current) ─────── */}
          <g ref={circuitsRef} id="cyber-circuits" opacity="0.85">
            {/* Left cheek data trace */}
            <path
              className="circuit-path"
              d="M 104 166 L 114 172 L 124 168"
              stroke="#FF2E3E"
              strokeWidth="1.3"
              strokeDasharray="4 3"
              fill="none"
              filter="url(#neonGlow)"
            />
            <circle cx="104" cy="166" r="1.6" fill="#FF7A88" />
            {/* Right cheek data trace */}
            <path
              className="circuit-path"
              d="M 216 166 L 206 172 L 196 168"
              stroke="#FF2E3E"
              strokeWidth="1.3"
              strokeDasharray="4 3"
              fill="none"
              filter="url(#neonGlow)"
            />
            <circle cx="216" cy="166" r="1.6" fill="#FF7A88" />
          </g>

          {/* Snout White Center Bridge with Soft Contour */}
          <path
            d="M 144 166 Q 160 156 176 166 L 169 196 Q 160 200 151 196 Z"
            fill="#FFFFFF"
            stroke="#FFCCD2"
            strokeWidth="1"
          />

          {/* Cute Rounded Heart-Button Nose */}
          <path
            d="M 154 174 Q 160 170 166 174 Q 160 182 154 174 Z"
            fill="#180306"
            stroke="#FF4D5A"
            strokeWidth="1"
          />
          {/* Nose Cute Gloss Highlight */}
          <ellipse cx="158" cy="173" rx="1.6" ry="0.8" fill="#FFAAB4" opacity="0.95" />

          {/* ── CUTE FOX MOUTH (ICONIC ':3' CURVED SMILE & TONGUE) ────── */}
          {/* Cute Pink Tongue (Pops open in Visibility mode) */}
          <g ref={tongueRef} id="fox-tongue" opacity="0">
            <path
              d="M 154 182 Q 160 193 166 182 Z"
              fill="#990B18"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            <ellipse cx="160" cy="188" rx="3.6" ry="2.4" fill="#FF758F" />
          </g>

          {/* Mouth Path (Morphed smoothly by GSAP into cute smiles) */}
          <path
            ref={mouthRef}
            d="M 152 182 Q 156 186 160 183 Q 164 186 168 182"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Delicate Dainty Whiskers */}
          <path d="M 130 181 L 102 179 M 128 185 L 105 189" stroke="#FFAAB4" strokeWidth="1.3" opacity="0.8" />
          <path d="M 190 181 L 218 179 M 192 185 L 215 189" stroke="#FFAAB4" strokeWidth="1.3" opacity="0.8" />

          {/* ── BIG SPARKLING EYES (KAWAII CATCHLIGHTS & GAZE TRACKING) ─ */}
          {/* Left Eye */}
          <g id="eye-left-socket">
            {/* Eye Sclera / Socket */}
            <ellipse
              cx="132"
              cy="149"
              rx="13.5"
              ry="15.5"
              fill="#180205"
              stroke="#FF2E3E"
              strokeWidth="1.5"
            />
            {/* Left Pupil Group (Blinks & Follows Cursor smoothly) */}
            <g ref={leftPupilRef} id="eye-left-pupil">
              {/* Rich Ruby Iris */}
              <ellipse cx="132" cy="149" rx="10.5" ry="12.5" fill="url(#eyeIrisGrad)" />
              {/* Deep Pupil Core */}
              <ellipse cx="132" cy="149" rx="5.5" ry="7" fill="#0C0204" />
              {/* Lower Iris Crescent Rim Light */}
              <path
                d="M 125 155 Q 132 161 139 155"
                stroke="#FFAAB2"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              {/* Major Glossy Catchlight */}
              <circle cx="129" cy="145" r="3.6" fill="#FFFFFF" />
              {/* Sweet Secondary Catchlight */}
              <circle cx="135" cy="152" r="1.8" fill="#FFFFFF" />
              {/* Tiny Tertiary Star Twinkle */}
              <circle cx="130" cy="153" r="1.1" fill="#FFFFFF" opacity="0.95" />
            </g>
          </g>

          {/* Right Eye */}
          <g id="eye-right-socket">
            {/* Eye Sclera / Socket */}
            <ellipse
              cx="188"
              cy="149"
              rx="13.5"
              ry="15.5"
              fill="#180205"
              stroke="#FF2E3E"
              strokeWidth="1.5"
            />
            {/* Right Pupil Group (Blinks & Follows Cursor smoothly) */}
            <g ref={rightPupilRef} id="eye-right-pupil">
              {/* Rich Ruby Iris */}
              <ellipse cx="188" cy="149" rx="10.5" ry="12.5" fill="url(#eyeIrisGrad)" />
              {/* Deep Pupil Core */}
              <ellipse cx="188" cy="149" rx="5.5" ry="7" fill="#0C0204" />
              {/* Lower Iris Crescent Rim Light */}
              <path
                d="M 181 155 Q 188 161 195 155"
                stroke="#FFAAB2"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              {/* Major Glossy Catchlight */}
              <circle cx="185" cy="145" r="3.6" fill="#FFFFFF" />
              {/* Sweet Secondary Catchlight */}
              <circle cx="191" cy="152" r="1.8" fill="#FFFFFF" />
              {/* Tiny Tertiary Star Twinkle */}
              <circle cx="186" cy="153" r="1.1" fill="#FFFFFF" opacity="0.95" />
            </g>
          </g>

          {/* ── PROP: CYBERNETIC HOLOGRAPHIC VISOR (ACCURACY STATE) ───── */}
          <g ref={visorRef} id="cyber-visor" opacity="0">
            {/* Visor Lens Ribbon */}
            <path
              d="M 112 142 Q 160 135 208 142 L 205 160 Q 160 153 115 160 Z"
              fill="url(#cyberVisorGrad)"
              opacity="0.8"
              filter="url(#neonGlow)"
            />
            {/* Visor Top Trim */}
            <path
              d="M 110 142 Q 160 134 210 142"
              stroke="#00E5FF"
              strokeWidth="2.2"
              fill="none"
              opacity="0.95"
            />
            {/* Mini HUD Reticle on right eye */}
            <circle cx="188" cy="149" r="8" stroke="#00E5FF" strokeWidth="1" fill="none" opacity="0.85" />
            <line x1="188" y1="138" x2="188" y2="160" stroke="#00E5FF" strokeWidth="0.8" opacity="0.7" />
            {/* Animated Laser Scanline across Visor */}
            <line
              ref={visorScanlineRef}
              x1="115"
              y1="140"
              x2="115"
              y2="162"
              stroke="#00E5FF"
              strokeWidth="2"
              filter="url(#neonGlow)"
              opacity="0.85"
            />
          </g>
        </g>

        {/* ── 5. CHUBBY PAWS & PINK TOE-BEANS ─────────────────────────── */}
        {/* Left Paw with soft pink toe-beans */}
        <g ref={leftPawRef} id="paw-left">
          <ellipse cx="130" cy="275" rx="16" ry="13" fill="#3D060D" stroke="#FF2E3E" strokeWidth="2.2" />
          {/* Main cushion palm bean */}
          <path d="M 126 276 Q 130 273 134 276 Q 130 281 126 276 Z" fill="#FF6B85" opacity="0.95" />
          {/* 3 cute pink toe-beans */}
          <ellipse cx="124" cy="271" rx="2.5" ry="2" fill="#FF8FA3" />
          <ellipse cx="130" cy="268" rx="2.5" ry="2" fill="#FF8FA3" />
          <ellipse cx="136" cy="271" rx="2.5" ry="2" fill="#FF8FA3" />
        </g>

        {/* Right Paw with soft pink toe-beans (Gestures & Thumbs Up) */}
        <g ref={rightPawRef} id="paw-right">
          <ellipse cx="190" cy="275" rx="16" ry="13" fill="#3D060D" stroke="#FF2E3E" strokeWidth="2.2" />
          {/* Main cushion palm bean */}
          <path d="M 186 276 Q 190 273 194 276 Q 190 281 186 276 Z" fill="#FF6B85" opacity="0.95" />
          {/* 3 cute pink toe-beans */}
          <ellipse cx="184" cy="271" rx="2.5" ry="2" fill="#FF8FA3" />
          <ellipse cx="190" cy="268" rx="2.5" ry="2" fill="#FF8FA3" />
          <ellipse cx="196" cy="271" rx="2.5" ry="2" fill="#FF8FA3" />
          {/* Thumbs up nub (visible when raised) */}
          <path
            d="M 194 266 Q 200 250 207 254 Q 205 268 194 270 Z"
            fill="#3D060D"
            stroke="#FF2E3E"
            strokeWidth="1.6"
          />
          {/* Thumbs up pink pad */}
          <ellipse cx="202" cy="257" rx="2" ry="2.4" fill="#FF8FA3" />
        </g>

        {/* ── 6. FLOATING HUD PROPS & BADGES ───────────────────────────── */}
        {/* State 1: Perplexed Question Bubble */}
        <g ref={questionBadgeRef} id="question-badge" opacity="0">
          <rect
            x="215"
            y="65"
            width="82"
            height="46"
            rx="14"
            fill="#1A070B"
            stroke="#FF1E27"
            strokeWidth="2"
            filter="url(#neonGlow)"
          />
          <text x="256" y="94" textAnchor="middle" fill="#FF4A58" fontSize="22" fontWeight="900" fontFamily="monospace">
            ?!
          </text>
          <polygon points="225,111 236,111 228,122" fill="#FF1E27" />
        </g>

        {/* State 2: Orbiting LangGraph State Nodes */}
        <g ref={orbsGroupRef} id="langgraph-orbs" opacity="0">
          <circle cx="85" cy="115" r="7.5" fill="#FF1E27" filter="url(#neonGlow)" />
          <circle cx="235" cy="115" r="7.5" fill="#00E5FF" filter="url(#neonGlow)" />
          <circle cx="160" cy="65" r="8.5" fill="#22C55E" filter="url(#neonGlow)" />
          {/* Connecting Data Network Path */}
          <polygon
            points="85,115 160,65 235,115"
            stroke="#FF1E27"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.45"
          />
          <ellipse cx="160" cy="140" rx="90" ry="75" stroke="#FF1E27" strokeWidth="0.8" strokeDasharray="3 4" fill="none" opacity="0.3" />
        </g>

        {/* State 3: Operational Telemetry Radar & Shield Badge */}
        <g ref={telemetryBadgeRef} id="telemetry-badge" opacity="0">
          <rect
            x="208"
            y="58"
            width="102"
            height="56"
            rx="14"
            fill="#09140E"
            stroke="#22C55E"
            strokeWidth="2"
            filter="url(#neonGlow)"
          />
          {/* Radar circle & sweep needle */}
          <circle cx="228" cy="86" r="14" stroke="#22C55E" strokeWidth="1" fill="none" opacity="0.4" />
          <circle cx="228" cy="86" r="7" stroke="#22C55E" strokeWidth="0.8" fill="none" opacity="0.3" />
          <line
            ref={radarSweepRef}
            x1="228"
            y1="86"
            x2="228"
            y2="73"
            stroke="#22C55E"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.95"
          />
          <circle cx="228" cy="86" r="2.5" fill="#22C55E" />
          <text x="248" y="80" fill="#22C55E" fontSize="9" fontWeight="800" fontFamily="monospace">
            VERIFIED
          </text>
          <text x="248" y="93" fill="#A6ADBB" fontSize="8" fontWeight="600" fontFamily="monospace">
            380ms · 96%
          </text>
          <text x="248" y="103" fill="#22C55E" fontSize="7" fontWeight="700" fontFamily="monospace">
            ● 0 ERRORS
          </text>
        </g>
      </svg>

      {/* ── THEMATIC TELEMETRY COCKPIT HUD CARD (ENLARGED & HIGH CONTRAST) ── */}
      <div className="w-full max-w-[360px] sm:max-w-[400px] mt-4 rounded-2xl border border-[var(--fn-border)] bg-[var(--fn-surface)]/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-3.5 relative overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between border-b border-[var(--fn-border)] pb-2.5 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                mood === "paradox"
                  ? "bg-amber-400 animate-pulse"
                  : mood === "accuracy"
                  ? "bg-[#FF1E27] animate-pulse"
                  : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span className="font-bold text-[var(--fn-text)] tracking-wider uppercase text-xs sm:text-sm">
              {mood === "paradox"
                ? "Diagnostic Watch"
                : mood === "accuracy"
                ? "LangGraph Agent"
                : "Telemetry Live"}
            </span>
          </div>

          <span
            className={`text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full ${
              mood === "paradox"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : mood === "accuracy"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {mood === "paradox" ? "TRAPPING ERRORS" : mood === "accuracy" ? "SELF-CORRECTING" : "100% GROUNDED"}
          </span>
        </div>

        {/* Mascot Dynamic Live Remark */}
        <p className="text-sm sm:text-base text-[var(--fn-text-secondary)] font-medium leading-relaxed italic">
          {mood === "paradox" &&
            '"Standard single-pass LLMs make up pricing & policies. FoxxNuts halts hallucinations before they reach users."'}
          {mood === "accuracy" &&
            '"Our multi-node LangGraph loop verifies drafted responses against your PDFs with hybrid Cohere + BM25 search."'}
          {mood === "visibility" &&
            '"Every execution trace is logged. If customers ask about unindexed topics, our telemetry turns it into your doc roadmap."'}
        </p>

        {/* Live Status Metric Bar */}
        <div className="flex items-center justify-between text-xs font-mono text-[var(--fn-text-tertiary)] pt-2 border-t border-[var(--fn-border)]">
          <span className="flex items-center gap-1.5 truncate pr-2">
            <svg className="w-3.5 h-3.5 text-[#FF1E27] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            <span className="truncate">Target: {mood === "paradox" ? "Zero Hallucination" : mood === "accuracy" ? "Self-Evaluation Loop" : "Global Telemetry"}</span>
          </span>
          <button
            type="button"
            onClick={handleMascotClick}
            className="text-xs font-mono text-[var(--fn-text-secondary)] hover:text-[#FF1E27] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg bg-[var(--fn-surface-hover)] border border-[var(--fn-border)]"
            title="Click mascot to cheer"
          >
            <span className="text-emerald-400 font-bold">● Live</span>
            <span className="text-[10px] opacity-75">
              {clickCount > 0 ? `×${clickCount}` : "poke"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
