"use client";

import React, { useRef, useState } from "react";

export interface InteractiveGraphCardProps {
  title: string;
  subtitle: string;
  unit: string;
  data: any[];
  valKey: string;
  timeKey: string;
  color: string;
  gradId: string;
}

/**
 * Reusable interactive SVG line graph with smooth bezier curve, gradient fill,
 * dynamic peak indicator, and real-time hover tooltip.
 */
export default function InteractiveGraphCard({
  title,
  subtitle,
  unit,
  data,
  valKey,
  timeKey,
  color,
  gradId,
}: InteractiveGraphCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] p-5 space-y-3">
        <div>
          <h4 className="text-sm font-semibold text-[var(--fn-text)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {title}
          </h4>
          <p className="text-xs text-[var(--fn-text-secondary)]">{subtitle}</p>
        </div>
        <div className="h-[135px] flex items-center justify-center text-xs text-[var(--fn-text-tertiary)] border border-dashed border-[var(--fn-border)] rounded-lg">
          No telemetry recorded for this timeframe
        </div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Number(d[valKey]) || 0), 1);
  const height = 135;
  const width = 600;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length <= 1) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const idx = Math.round(xRatio * (data.length - 1));
    setHoverIndex(idx);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || data.length <= 1 || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = Math.max(0, Math.min(1, (e.touches[0].clientX - rect.left) / rect.width));
    const idx = Math.round(xRatio * (data.length - 1));
    setHoverIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Calculate coordinates for all points
  const points = data.map((d, index) => {
    const val = Number(d[valKey]) || 0;
    const x = (index / (data.length - 1)) * width;
    const y = height - (val / maxVal) * (height - 24);
    return { x, y, val, label: d[timeKey] };
  });

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  // Path strings
  const areaPath =
    points.reduce((acc, pt, index) => {
      return `${acc} ${index === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    }, "") + ` L ${width} ${height} L 0 ${height} Z`;

  const linePath = points.reduce((acc, pt, index) => {
    return `${acc} ${index === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
  }, "");

  return (
    <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] p-5 space-y-3 transition-all duration-200 hover:border-[var(--fn-border)]/80 hover:shadow-[var(--fn-shadow-md)]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[var(--fn-text)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {title}
          </h4>
          <p className="text-xs text-[var(--fn-text-secondary)]">{subtitle}</p>
        </div>

        {/* Dynamic Live / Peak Badge */}
        <div
          className="text-xs font-mono px-2.5 py-1 rounded-[var(--fn-radius-sm)] border w-fit transition-all duration-150"
          style={{
            color: color,
            borderColor: `${color}40`,
            backgroundColor: `${color}12`,
          }}
        >
          {activePoint !== null ? (
            <span className="font-semibold">
              Live: {activePoint.val.toLocaleString()} {unit}
            </span>
          ) : (
            <span>
              Peak: {maxVal.toLocaleString()} {unit}
            </span>
          )}
        </div>
      </div>

      {/* Interactive SVG Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        className="relative w-full h-[135px] pt-2 cursor-crosshair select-none"
      >
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.38" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradId})`} />

          {/* Main Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair & Dot */}
          {activePoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={height}
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray="3 3"
                opacity="0.75"
              />

              {/* Glowing Outer Radar Ring */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7.5"
                fill={color}
                opacity="0.3"
              />

              {/* Solid Snapped Center Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4"
                fill={color}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Pill */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded-[var(--fn-radius)] bg-[var(--fn-elevated)] border border-[var(--fn-border)] shadow-[var(--fn-shadow-lg)] transform -translate-x-1/2 -translate-y-full text-center whitespace-nowrap animate-fn-fade-in"
            style={{
              left: `${(hoverIndex! / (data.length - 1)) * 100}%`,
              top: `${(activePoint.y / height) * 100 - 8}%`,
            }}
          >
            <p className="text-[11px] font-bold font-mono text-[var(--fn-text)] leading-tight">
              {activePoint.val.toLocaleString()} <span className="text-[9px] font-normal text-[var(--fn-text-tertiary)]">{unit}</span>
            </p>
            <p className="text-[9px] font-mono text-[var(--fn-text-tertiary)] leading-tight">
              {activePoint.label}
            </p>
          </div>
        )}
      </div>

      {/* Axis Time Labels */}
      <div className="flex justify-between text-[10px] text-[var(--fn-text-tertiary)] font-mono pt-0.5">
        <span>{data[0]?.[timeKey]}</span>
        <span>{data[Math.floor(data.length / 2)]?.[timeKey]}</span>
        <span>{data[data.length - 1]?.[timeKey]}</span>
      </div>
    </div>
  );
}
