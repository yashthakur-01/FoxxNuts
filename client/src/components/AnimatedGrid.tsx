"use client";

import React, { useRef, useEffect, useCallback } from "react";

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

    const draw = (now: number) => {
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      const cols = Math.ceil(w / CELL) + 1;
      const rows = Math.ceil(h / CELL) + 1;

      // ── 1. Draw Grid Lines with Vibrant Red Baseline & Mouse Aura ──
      for (let col = 0; col <= cols; col++) {
        const x = col * CELL;
        const normX = x / w;

        for (let row = 0; row <= rows; row++) {
          const y = row * CELL;
          const normY = y / h;

          // Subtle diagonal fade for cinematic depth
          const depthFade = Math.max(0.2, 1 - (normX * 0.45 + normY * 0.45));
          const baseAlpha = 0.14 * depthFade; // Crisp, visible baseline

          // Interactive mouse proximity illumination
          let glowAlpha = 0;

          if (mouseRef.current) {
            const dx = x - mouseRef.current.x;
            const dy = y - mouseRef.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 240;

            if (dist < radius) {
              const proximity = Math.pow(1 - dist / radius, 1.8);
              glowAlpha = 0.55 * proximity;
            }
          }

          const totalAlpha = baseAlpha + glowAlpha;
          if (totalAlpha < 0.01) continue;

          // Vertical grid line segment
          if (row < rows) {
            const nextY = Math.min((row + 1) * CELL, h);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, nextY);
            ctx.strokeStyle = `rgba(${PRIMARY_RED.glow},${totalAlpha})`;
            ctx.lineWidth = glowAlpha > 0.2 ? 1.3 : 1.0;
            ctx.stroke();
          }

          // Horizontal grid line segment
          if (col < cols) {
            const nextX = Math.min((col + 1) * CELL, w);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nextX, y);
            ctx.strokeStyle = `rgba(${PRIMARY_RED.glow},${totalAlpha})`;
            ctx.lineWidth = glowAlpha > 0.2 ? 1.3 : 1.0;
            ctx.stroke();
          }

          // Intersection point dots with vibrant red glow
          if (totalAlpha > 0.04) {
            ctx.beginPath();
            ctx.arc(x, y, glowAlpha > 0.1 ? 2.0 : 1.5, 0, Math.PI * 2);
            ctx.fillStyle = glowAlpha > 0.15 
              ? `rgba(255, 255, 255, ${Math.min(1, totalAlpha * 1.4)})` 
              : `rgba(${PRIMARY_RED.glow}, ${totalAlpha * 1.8})`;
            ctx.fill();
          }
        }
      }

      // ── 2. Auto-Spawn Vibrant Red Light Packets ────────────────────
      if (now - lastSpawnRef.current > PACKET_INTERVAL) {
        lastSpawnRef.current = now;
        if (packetsRef.current.length < 22) {
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

        // Radiant Outer Glow Halo
        const glowRadius = p.size * 4.5;
        const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        haloGrad.addColorStop(0, `rgba(${glowColor}, ${0.95 * p.opacity * fade})`);
        haloGrad.addColorStop(0.4, `rgba(${glowColor}, ${0.40 * p.opacity * fade})`);
        haloGrad.addColorStop(1, `rgba(${glowColor}, 0)`);

        ctx.beginPath();
        ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = haloGrad;
        ctx.fill();

        // Ultra Bright Core
        ctx.beginPath();
        ctx.arc(cx, cy, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.98 * p.opacity * fade})`;
        ctx.fill();

        // Vivid Tail Gradient Trail
        const tailLen = Math.min(p.progress, p.trailLength);
        const tailX = p.x + (p.targetX - p.x) * Math.max(0, p.progress - tailLen);
        const tailY = p.y + (p.targetY - p.y) * Math.max(0, p.progress - tailLen);

        const trailGrad = ctx.createLinearGradient(tailX, tailY, cx, cy);
        trailGrad.addColorStop(0, `rgba(${glowColor}, 0)`);
        trailGrad.addColorStop(0.6, `rgba(${glowColor}, ${0.60 * p.opacity * fade})`);
        trailGrad.addColorStop(1, `rgba(${glowColor}, ${0.95 * p.opacity * fade})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = p.size * 1.2;
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
