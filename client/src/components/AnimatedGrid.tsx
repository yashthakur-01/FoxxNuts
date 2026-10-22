"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { useTheme } from "../lib/ThemeContext";

// ── Types & Palettes (Exclusively Shades of Vibrant Red) ──────────────
interface ColorRGB {
  r: number;
  g: number;
  b: number;
  glow: string;
}

const RED_SHADES: ColorRGB[] = [
  { r: 255, g: 0, b: 30, glow: "255, 0, 30" },       // Signature Brand Neon Red
  { r: 255, g: 25, b: 55, glow: "255, 25, 55" },     // Radiant Crimson
  { r: 255, g: 40, b: 70, glow: "255, 40, 70" },     // Vivid Scarlet
  { r: 235, g: 10, b: 35, glow: "235, 10, 35" },     // Deep Ruby Red
];

const PRIMARY_RED: ColorRGB = RED_SHADES[0];

interface Packet {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  horizontal: boolean;
  length: number;
  opacity: number;
  color: ColorRGB;
  trailLength: number;
  size: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: ColorRGB;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  decay: number;
  color: ColorRGB;
}

interface AnimatedGridProps {
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────
export default function AnimatedGrid({ className = "" }: AnimatedGridProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const packetsRef = useRef<Packet[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);

  // ── Grid Dimensions & Constants ────────────────────────────────────
  const CELL = 42;             // grid cell size in px
  const PACKET_INTERVAL = 240; // ms between auto-spawns for steady flow

  const getRandomRed = useCallback((): ColorRGB => {
    return RED_SHADES[Math.floor(Math.random() * RED_SHADES.length)];
  }, []);

  const spawnPacket = useCallback(
    (cols: number, rows: number, originX?: number, originY?: number) => {
      const horizontal = Math.random() > 0.5;
      let startCol: number, startRow: number;

      if (originX !== undefined && originY !== undefined) {
        startCol = Math.round(originX / CELL);
        startRow = Math.round(originY / CELL);
      } else {
        startCol = Math.floor(Math.random() * cols);
        startRow = Math.floor(Math.random() * rows);
      }

      const length = 2 + Math.floor(Math.random() * 5); // 2–6 cells
      const speed = 0.010 + Math.random() * 0.016;      // smooth, energetic glide
      const color = getRandomRed();
      const trailLength = 0.35 + Math.random() * 0.25;

      if (horizontal) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const endCol = Math.max(0, Math.min(startCol + length * direction, cols));
        packetsRef.current.push({
          x: startCol * CELL,
          y: startRow * CELL,
          targetX: endCol * CELL,
          targetY: startRow * CELL,
          progress: 0,
          speed,
          horizontal: true,
          length,
          opacity: 0.85 + Math.random() * 0.15,
          color,
          trailLength,
          size: 2.2 + Math.random() * 1.0,
        });
      } else {
        const direction = Math.random() > 0.5 ? 1 : -1;
        const endRow = Math.max(0, Math.min(startRow + length * direction, rows));
        packetsRef.current.push({
          x: startCol * CELL,
          y: startRow * CELL,
          targetX: startCol * CELL,
          targetY: endRow * CELL,
          progress: 0,
          speed,
          horizontal: false,
          length,
          opacity: 0.85 + Math.random() * 0.15,
          color,
          trailLength,
          size: 2.2 + Math.random() * 1.0,
        });
      }
    },
    [getRandomRed],
  );

  // ── Main Animation & Interaction Loop ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect();
      w = rect?.width ?? window.innerWidth;
      h = rect?.height ?? window.innerHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let currentScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const onScroll = () => {
      currentScrollY = window.scrollY || 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const draw = (now: number) => {
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;

      // ── Intensity Ramp: Whisper-soft in Hero, Rich & Vibrant in Post-Hero Sections ──
      const vh = window.innerHeight || 800;
      // 0 in first section (hero), smoothly ramps to 1.0 as user scrolls past hero into section 2+
      const pastHero = Math.min(1, Math.max(0, (currentScrollY - vh * 0.25) / (vh * 0.45)));

      // Dynamic Grid Boost after the first section (Hero Landing entry)
      const intensityBoost = 1 + pastHero * 2.6; // Ramps up to 3.6x intensity
      const depthFadeFloor = 0.18 + pastHero * 0.42; // Keeps entire grid luminous (floor 0.60) after hero
      const depthXWeight = 0.5 - pastHero * 0.22;
      const depthYWeight = 0.5 - pastHero * 0.22;
      const activeLineWidth = 1.0 + pastHero * 0.35; // 1.35px crisper stroke

      // ── 1. Draw Grid Lines with Vibrant Red Baseline & Mouse Aura ──
      for (let col = 0; col <= cols; col++) {
        const x = col * CELL;
        const normX = x / w;

        for (let row = 0; row <= rows; row++) {
          const y = row * CELL;
          const normY = y / h;

          // Subtle diagonal fade in hero, high-clarity luminous grid after hero
          const depthFade = Math.max(depthFadeFloor, 1 - (normX * depthXWeight + normY * depthYWeight));
          const baseAlpha = (isLight ? 0.045 : 0.055) * intensityBoost * depthFade;

          // Interactive mouse proximity illumination
          let glowAlpha = 0;

          if (mouseRef.current) {
            const dx = x - mouseRef.current.x;
            const dy = y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 200;

            if (dist < radius) {
              const proximity = Math.pow(1 - dist / radius, 1.8);
              glowAlpha = 0.28 * proximity; // Soft atmospheric halo
            }
          }

          const totalAlpha = baseAlpha + glowAlpha;
          if (totalAlpha < 0.008) continue;

          // Vertical grid line segment
          if (row < rows) {
            const nextY = Math.min((row + 1) * CELL, h);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, nextY);
            ctx.strokeStyle = `rgba(${PRIMARY_RED.glow},${totalAlpha})`;
            ctx.lineWidth = activeLineWidth;
            ctx.stroke();
          }

          // Horizontal grid line segment
          if (col < cols) {
            const nextX = Math.min((col + 1) * CELL, w);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nextX, y);
            ctx.strokeStyle = `rgba(${PRIMARY_RED.glow},${totalAlpha})`;
            ctx.lineWidth = activeLineWidth;
            ctx.stroke();
          }

          // Intersection point dots with radiant crimson glow
          const showDot = totalAlpha > 0.038 || (pastHero > 0.25 && (col % 2 === 0 || row % 2 === 0));
          if (showDot) {
            ctx.beginPath();
            const dotRadius = glowAlpha > 0.1 ? (1.5 + pastHero * 0.3) : (1.0 + pastHero * 0.4);
            ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = glowAlpha > 0.12 
              ? (isLight ? `rgba(220, 25, 45, ${Math.min(0.75, totalAlpha * 1.3)})` : `rgba(255, 210, 220, ${Math.min(0.75, totalAlpha * 1.3)})`) 
              : `rgba(${PRIMARY_RED.glow}, ${Math.min(0.85, (baseAlpha + 0.03) * 1.4)})`;
            ctx.fill();
          }
        }
      }

      // ── 2. Auto-Spawn Vibrant Red Light Packets (Higher Density Post-Hero) ───
      const activeInterval = PACKET_INTERVAL * (1.4 - pastHero * 0.6);
      const maxPackets = Math.floor(12 + pastHero * 8);
      if (now - lastSpawnRef.current > activeInterval) {
        lastSpawnRef.current = now;
        if (packetsRef.current.length < maxPackets) {
          spawnPacket(cols, rows);
        }
      }

      // ── 3. Update & Draw Packets with Red Glowing Trails ────────────
      packetsRef.current = packetsRef.current.filter((p) => {
        p.progress += p.speed;
        if (p.progress > 1) return false;

        const cx = p.x + (p.targetX - p.x) * p.progress;
        const cy = p.y + (p.targetY - p.y) * p.progress;

        const normD = (cx / w) * 0.4 + (cy / h) * 0.4;
        const fade = Math.max(0.15, 1 - normD);

        const glowColor = p.color.glow;

        // Radiant Outer Glow Halo - subtle and delicate
        const glowRadius = p.size * 3.5;
        const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        haloGrad.addColorStop(0, `rgba(${glowColor}, ${0.60 * p.opacity * fade})`);
        haloGrad.addColorStop(0.5, `rgba(${glowColor}, ${0.20 * p.opacity * fade})`);
        haloGrad.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Core Particle
        ctx.beginPath();
        ctx.arc(cx, cy, p.size * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = isLight
          ? `rgba(${glowColor}, ${0.85 * p.opacity * fade})`
          : `rgba(255, 230, 235, ${0.85 * p.opacity * fade})`;
        ctx.fill();

        // Delicate Tail Gradient Trail
        const tailLen = Math.min(p.progress, p.trailLength * 0.85);
        const tailX = p.x + (p.targetX - p.x) * Math.max(0, p.progress - tailLen);
        const tailY = p.y + (p.targetY - p.y) * Math.max(0, p.progress - tailLen);

        const trailGrad = ctx.createLinearGradient(tailX, tailY, cx, cy);
        trailGrad.addColorStop(0, `rgba(${glowColor}, 0)`);
        trailGrad.addColorStop(0.5, `rgba(${glowColor}, ${0.30 * p.opacity * fade})`);
        trailGrad.addColorStop(1, `rgba(${glowColor}, ${0.65 * p.opacity * fade})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = p.size;
        ctx.stroke();

        return true;
      });

      // ── 4. Update & Draw Subtle Compact Shockwave Ripples ───────────
      ripplesRef.current = ripplesRef.current.filter((r) => {
        r.radius += 1.6;
        r.opacity -= 0.012;
        if (r.opacity <= 0 || r.radius >= r.maxRadius) return false;

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.color.glow}, ${r.opacity})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        return true;
      });

      // ── 5. Update & Draw Click Spark Particles (Red Tones) ──────────
      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.95;
        pt.vy *= 0.95;
        pt.opacity -= pt.decay;
        if (pt.opacity <= 0) return false;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pt.color.glow}, ${pt.opacity})`;
        ctx.fill();

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    // ── Global & Container Mouse Tracking ────────────────────────────
    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      if (x >= -60 && x <= rect.width + 60 && y >= -60 && y <= rect.height + 60) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = null;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseLeave = () => {
      mouseRef.current = null;
    };

    // ── Click / Tap: Spawns Red Packet Bursts & Subtle Compact Ring ───
    const handleInteraction = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      if (mx < -40 || mx > rect.width + 40 || my < -40 || my > rect.height + 40) return;

      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;

      // Spawn 4–6 vibrant red packets along the grid lines
      const packetCount = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < packetCount; i++) {
        spawnPacket(cols, rows, mx, my);
      }

      // Compact, subtle, delicate circular ripple ring (size capped at 65px, opacity 0.35)
      ripplesRef.current.push({
        x: mx,
        y: my,
        radius: 3,
        maxRadius: 65,
        opacity: 0.35,
        color: PRIMARY_RED,
      });

      // Subtle red sparks
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 2.2;
        particlesRef.current.push({
          x: mx,
          y: my,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.2 + Math.random() * 1.0,
          opacity: 0.7,
          decay: 0.025 + Math.random() * 0.02,
          color: getRandomRed(),
        });
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      handleInteraction(e.clientX, e.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    // Attach listeners to window so moving/clicking over hero elements still drives canvas
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [spawnPacket, getRandomRed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ display: "block" }}
    />
  );
}
