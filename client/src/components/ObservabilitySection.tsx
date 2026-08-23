"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "../supabase/browserClient";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import Input from "./ui/Input";
import { SkeletonRow } from "./ui/Skeleton";
import { toast } from "../lib/ToastContext";

interface ObservabilitySectionProps {
  workspaceId: string;
  activeTabProp?: "metrics" | "traces" | "gaps";
  hideTabHeader?: boolean;
}

interface MinutePoint {
  time: string;
  rpm: number;
  tpm: number;
}

interface DailyPoint {
  date: string;
  rpd: number;
  tpd: number;
}

interface Metrics {
  total_queries: number;
  total_tokens: number;
  avg_duration_ms: number;
  context_found_rate: number;
  csat_score: number;
  likes: number;
  dislikes: number;
  total_rated: number;
  rpm: number;
  tpm: number;
  rpd: number;
  tpd: number;
  minute_timeline: MinutePoint[];
  daily_timeline: DailyPoint[];
}

interface Trace {
  id: string;
  session_id: string;
  query: string;
  final_response: string;
  total_tokens: number;
  total_duration_ms: number;
  trajectory: any[];
  error_messages: any[];
  query_context_pairs: Array<{
    query: string;
    context_received: string;
    context_found?: boolean;
  }>;
  query_type?: string;
  csat_rating?: number | null;
  created_at: string;
}

interface GapItem {
  trace_id: string;
  session_id: string;
  query: string;
  context_received: string;
  context_found: boolean;
  created_at: string;
}

interface SessionGroup {
  sessionId: string;
  traces: Trace[];
  totalTokens: number;
  totalDurationMs: number;
  firstTimestamp: string;
  lastTimestamp: string;
  messageCount: number;
  hasGap: boolean;
}

// ============================================================
// Interactive SVG Graph Component with Real-Time Hover Tooltip
// ============================================================
function InteractiveGraphCard({
  title,
  subtitle,
  unit,
  data,
  valKey,
  timeKey,
  color,
  gradId,
}: {
  title: string;
  subtitle: string;
  unit: string;
  data: any[];
  valKey: string;
  timeKey: string;
  color: string;
  gradId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

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

export default function ObservabilitySection({ workspaceId, activeTabProp, hideTabHeader = false }: ObservabilitySectionProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"metrics" | "traces" | "gaps">(activeTabProp || "metrics");

  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [traceSearch, setTraceSearch] = useState("");

  // Trace View: "sessions" vs "flat"
  const [traceViewMode, setTraceViewMode] = useState<"sessions" | "flat">("sessions");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Selected Trace Modal
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);

  // Deletion States & Modals
  const [confirmDeleteSession, setConfirmDeleteSession] = useState<string | null>(null);
  const [confirmDeleteTrace, setConfirmDeleteTrace] = useState<Trace | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [deletingTrace, setDeletingTrace] = useState(false);

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingSession(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/observability/traces", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_id: sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete session traces");
      }

      toast.success("Session traces and history deleted successfully!");
      setConfirmDeleteSession(null);
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
      setTraces((prev) => prev.filter((t) => t.session_id !== sessionId));
      setGaps((prev) => prev.filter((g) => g.session_id !== sessionId));
      fetchObservabilityData();
    } catch (err: any) {
      console.error("Delete session error:", err);
      toast.error(err.message || "Failed to delete session traces");
    } finally {
      setDeletingSession(false);
    }
  };

  const handleDeleteTrace = async (traceId: string) => {
    setDeletingTrace(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/observability/traces", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          trace_id: traceId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete trace");
      }

      toast.success("Execution trace deleted successfully!");
      setConfirmDeleteTrace(null);
      if (selectedTrace?.id === traceId) {
        setSelectedTrace(null);
      }
      setTraces((prev) => prev.filter((t) => t.id !== traceId));
      setGaps((prev) => prev.filter((g) => g.trace_id !== traceId));
      fetchObservabilityData();
    } catch (err: any) {
      console.error("Delete trace error:", err);
      toast.error(err.message || "Failed to delete trace");
    } finally {
      setDeletingTrace(false);
    }
  };

  const fetchObservabilityData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = {
        "Content-Type": "application/json",
        "Authorization": session.access_token,
      };

      // 1. Fetch Metrics
      const resMetrics = await fetch("/api/customer/observability/metrics", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (resMetrics.ok) {
        const data = await resMetrics.json();
        setMetrics(data.metrics);
      }

      // 2. Fetch Traces
      const resTraces = await fetch("/api/customer/observability/traces", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId, page: 1, limit: 100 }),
      });

      if (resTraces.ok) {
        const data = await resTraces.json();
        setTraces(data.traces || []);
      }

      // 3. Fetch Gaps
      const resGaps = await fetch("/api/customer/observability/gaps", {
        method: "POST",
        headers,
        body: JSON.stringify({ workspace_id: workspaceId }),
      });

      if (resGaps.ok) {
        const data = await resGaps.json();
        setGaps(data.gaps || []);
      }
    } catch (err) {
      console.error("Observability fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchObservabilityData();
    }
  }, [workspaceId]);

  // Group traces into Sessions
  const sessionGroups = useMemo<SessionGroup[]>(() => {
    const map = new Map<string, Trace[]>();

    traces.forEach((t) => {
      const sId = t.session_id || "anonymous-session";
      if (!map.has(sId)) {
        map.set(sId, []);
      }
      map.get(sId)!.push(t);
    });

    const groups: SessionGroup[] = [];
    map.forEach((items, sessionId) => {
      const sorted = [...items].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const totalTokens = sorted.reduce((acc, curr) => acc + (curr.total_tokens || 0), 0);
      const totalDurationMs = sorted.reduce((acc, curr) => acc + (curr.total_duration_ms || 0), 0);

      const hasGap = sorted.some((item) => {
        const pairs = Array.isArray(item.query_context_pairs) ? item.query_context_pairs : [];
        return pairs.some((p) => p.context_found === false || !p.context_received);
      });

      groups.push({
        sessionId,
        traces: sorted,
        totalTokens,
        totalDurationMs,
        firstTimestamp: sorted[0]?.created_at || "",
        lastTimestamp: sorted[sorted.length - 1]?.created_at || "",
        messageCount: sorted.length,
        hasGap,
      });
    });

    return groups.sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );
  }, [traces]);

  const initialAutoSelectRef = useRef(false);

  // Auto-select first session only on initial load for desktop screens
  useEffect(() => {
    if (
      !initialAutoSelectRef.current &&
      typeof window !== "undefined" &&
      window.innerWidth >= 1024 &&
      sessionGroups.length > 0 &&
      !selectedSessionId
    ) {
      initialAutoSelectRef.current = true;
      setSelectedSessionId(sessionGroups[0].sessionId);
    }
  }, [sessionGroups, selectedSessionId]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    if (!traceSearch.trim()) return sessionGroups;
    const q = traceSearch.toLowerCase();
    return sessionGroups.filter(
      (sg) =>
        sg.sessionId.toLowerCase().includes(q) ||
        sg.traces.some(
          (t) =>
            t.query?.toLowerCase().includes(q) ||
            t.final_response?.toLowerCase().includes(q)
        )
    );
  }, [sessionGroups, traceSearch]);

  // Filtered Flat Traces
  const filteredFlatTraces = useMemo(() => {
    if (!traceSearch.trim()) return traces;
    const q = traceSearch.toLowerCase();
    return traces.filter(
      (t) =>
        t.query?.toLowerCase().includes(q) ||
        t.session_id?.toLowerCase().includes(q) ||
        t.final_response?.toLowerCase().includes(q)
    );
  }, [traces, traceSearch]);

  const currentSelectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessionGroups.find((s) => s.sessionId === selectedSessionId) || null;
  }, [sessionGroups, selectedSessionId]);

  return (
    <div className="space-y-6">
      {/* Professional Tab Navigation with Clean Icons */}
      {!hideTabHeader && (
        <div className="flex items-center justify-between border-b border-[var(--fn-border)] pb-px">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Tab 1: Overview & Throughput */}
            <button
              onClick={() => setActiveTab("metrics")}
              className={`
                flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-t-[var(--fn-radius)]
                transition-all duration-150 cursor-pointer border-b-2
                ${
                  activeTab === "metrics"
                    ? "border-[var(--fn-accent)] text-[var(--fn-accent)] bg-[var(--fn-accent-subtle)]"
                    : "border-transparent text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]"
                }
              `}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <span>Overview & Throughput</span>
            </button>

            {/* Tab 2: Execution Traces (Session-wise & Flat) */}
            <button
              onClick={() => setActiveTab("traces")}
              className={`
                flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-t-[var(--fn-radius)]
                transition-all duration-150 cursor-pointer border-b-2
                ${
                  activeTab === "traces"
                    ? "border-[var(--fn-accent)] text-[var(--fn-accent)] bg-[var(--fn-accent-subtle)]"
                    : "border-transparent text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]"
                }
              `}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
              <span>Sessions & Traces</span>
              <span className="text-[11px] px-1.5 py-0.2 bg-[var(--fn-elevated)] text-[var(--fn-text-tertiary)] rounded-full border border-[var(--fn-border)]">
                {sessionGroups.length} sessions ({traces.length})
              </span>
            </button>

            {/* Tab 3: Knowledge Base Gaps */}
            <button
              onClick={() => setActiveTab("gaps")}
              className={`
                flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium rounded-t-[var(--fn-radius)]
                transition-all duration-150 cursor-pointer border-b-2
                ${
                  activeTab === "gaps"
                    ? "border-[var(--fn-accent)] text-[var(--fn-accent)] bg-[var(--fn-accent-subtle)]"
                    : "border-transparent text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)] hover:bg-[var(--fn-elevated)]"
                }
              `}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>Knowledge Gaps</span>
              {gaps.length > 0 && (
                <span className="text-[11px] px-1.5 py-0.2 bg-red-500/10 text-red-500 rounded-full border border-red-500/20 font-mono">
                  {gaps.length}
                </span>
              )}
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchObservabilityData}
            loading={loading}
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            }
          >
            Refresh
          </Button>
        </div>
      )}

      {/* ============================================================
          TAB 1: METRICS OVERVIEW & 4 INTERACTIVE GRAPHS (HOME TAB)
          ============================================================ */}
      {activeTab === "metrics" && (
        <div className="space-y-6 animate-fn-fade-in">
          {(!metrics || metrics.total_queries === 0) && (
            <div className="p-4 rounded-xl bg-[var(--fn-surface)] border border-[var(--fn-border)] flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[var(--fn-accent)]/10 text-[var(--fn-accent)] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                📊
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-[var(--fn-text)]">
                  No Analytics Telemetry Recorded Yet
                </h4>
                <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                  Start conversing with your assistant in the Chatbot section or deploy your widget to see real-time requests per minute (RPM), tokens per minute (TPM), token consumption, and latency charts.
                </p>
              </div>
            </div>
          )}

          {/* Primary Rate & Health KPI Cards (8 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* RPM */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--fn-accent)]/50">
              <span className="text-[11px] text-[var(--fn-accent)] font-bold uppercase tracking-wider">RPM (Req/Min)</span>
              <div className="text-2xl font-extrabold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? metrics.rpm : 0}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">Last 60 Seconds</span>
            </div>

            {/* TPM */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-500/50">
              <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">TPM (Tokens/Min)</span>
              <div className="text-2xl font-extrabold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? metrics.tpm.toLocaleString() : 0}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">Last 60 Seconds</span>
            </div>

            {/* RPD */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/50">
              <span className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">RPD (Req/Day)</span>
              <div className="text-2xl font-extrabold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? metrics.rpd : 0}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">Last 24 Hours</span>
            </div>

            {/* TPD */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/50">
              <span className="text-[11px] text-purple-400 font-bold uppercase tracking-wider">TPD (Tokens/Day)</span>
              <div className="text-2xl font-extrabold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? metrics.tpd.toLocaleString() : 0}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">Last 24 Hours</span>
            </div>

            {/* Total Queries */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4">
              <span className="text-[11px] text-[var(--fn-text-tertiary)] font-semibold uppercase tracking-wider">Total Queries</span>
              <div className="text-xl font-bold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? metrics.total_queries.toLocaleString() : 0}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">All-time Logged</span>
            </div>

            {/* Total Tokens */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4">
              <span className="text-[11px] text-[var(--fn-text-tertiary)] font-semibold uppercase tracking-wider">Total Tokens</span>
              <div className="text-xl font-bold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? metrics.total_tokens.toLocaleString() : 0}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">Prompt + Completion</span>
            </div>

            {/* Avg Latency */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4">
              <span className="text-[11px] text-[var(--fn-text-tertiary)] font-semibold uppercase tracking-wider">Avg Latency</span>
              <div className="text-xl font-bold text-[var(--fn-text)] mt-1 font-mono">
                {metrics ? `${(metrics.avg_duration_ms / 1000).toFixed(2)}s` : "0s"}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">End-to-End Duration</span>
            </div>

            {/* Context Match Rate */}
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-4">
              <span className="text-[11px] text-[var(--fn-text-tertiary)] font-semibold uppercase tracking-wider">Context Match Rate</span>
              <div className="text-xl font-bold text-[var(--fn-success)] mt-1 font-mono">
                {metrics ? `${metrics.context_found_rate}%` : "0%"}
              </div>
              <span className="text-[11px] text-[var(--fn-text-tertiary)] mt-0.5 block">Relevance Passed</span>
            </div>
          </div>

          {/* 4 Interactive SVG Throughput & Token Graphs with Hover Scanner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph 1: RPM (Requests Per Minute) */}
            <InteractiveGraphCard
              title="Requests Per Minute (RPM)"
              subtitle="Hover along line to inspect exact per-minute request volume"
              unit="req/min"
              data={metrics?.minute_timeline || []}
              valKey="rpm"
              timeKey="time"
              color="#E50914"
              gradId="rpmGradLive"
            />

            {/* Graph 2: TPM (Tokens Per Minute) */}
            <InteractiveGraphCard
              title="Tokens Per Minute (TPM)"
              subtitle="Hover along line to inspect real-time token throughput"
              unit="tokens/min"
              data={metrics?.minute_timeline || []}
              valKey="tpm"
              timeKey="time"
              color="#06B6D4"
              gradId="tpmGradLive"
            />

            {/* Graph 3: RPD (Requests Per Day) */}
            <InteractiveGraphCard
              title="Daily Query Volume (RPD)"
              subtitle="Hover along line to inspect day-by-day request history"
              unit="req/day"
              data={metrics?.daily_timeline || []}
              valKey="rpd"
              timeKey="date"
              color="#F59E0B"
              gradId="rpdGradLive"
            />

            {/* Graph 4: TPD (Tokens Per Day) */}
            <InteractiveGraphCard
              title="Daily Token Volume (TPD)"
              subtitle="Hover along line to inspect day-by-day token generation"
              unit="tokens/day"
              data={metrics?.daily_timeline || []}
              valKey="tpd"
              timeKey="date"
              color="#A855F7"
              gradId="tpdGradLive"
            />
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: SESSIONS & EXECUTION TRACES
          ============================================================ */}
      {activeTab === "traces" && (
        <div className="space-y-4 animate-fn-fade-in">
          {/* Header Controls: View Toggle (Sessions vs Flat Table) + Search */}
          <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-[var(--fn-radius)] bg-[var(--fn-elevated)] p-1 border border-[var(--fn-border)]">
                <button
                  onClick={() => setTraceViewMode("sessions")}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-[var(--fn-radius-sm)] transition-colors cursor-pointer flex items-center gap-1.5
                    ${
                      traceViewMode === "sessions"
                        ? "bg-[var(--fn-surface)] text-[var(--fn-accent)] shadow-xs font-semibold"
                        : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
                    }
                  `}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  Session Threads
                </button>
                <button
                  onClick={() => setTraceViewMode("flat")}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-[var(--fn-radius-sm)] transition-colors cursor-pointer flex items-center gap-1.5
                    ${
                      traceViewMode === "flat"
                        ? "bg-[var(--fn-surface)] text-[var(--fn-accent)] shadow-xs font-semibold"
                        : "text-[var(--fn-text-secondary)] hover:text-[var(--fn-text)]"
                    }
                  `}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M3.75 4.5h16.5m-16.5 3.75h16.5" />
                  </svg>
                  All Traces Table
                </button>
              </div>

              <span className="text-xs text-[var(--fn-text-tertiary)] hidden md:inline">
                {sessionGroups.length} conversations logged
              </span>
            </div>

            <div className="w-full sm:w-72">
              <Input
                size="sm"
                value={traceSearch}
                onChange={(e) => setTraceSearch(e.target.value)}
                placeholder="Search sessions or queries..."
              />
            </div>
          </div>

          {/* MODE A: SESSION-WISE CHAT THREAD VIEW */}
          {traceViewMode === "sessions" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
              {/* Left Column: Sessions List (hidden on mobile when a session is active) */}
              <div
                className={`
                  ${selectedSessionId ? "hidden lg:flex" : "flex"}
                  lg:col-span-4 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)]
                  flex-col h-[65vh] min-h-[480px] overflow-hidden
                `}
              >
                <div className="p-3.5 border-b border-[var(--fn-border)] flex items-center justify-between shrink-0 bg-[var(--fn-elevated)]/40">
                  <span className="text-xs font-semibold text-[var(--fn-text)] uppercase tracking-wider">
                    Conversations
                  </span>
                  <span className="text-[11px] text-[var(--fn-text-tertiary)]">
                    {filteredSessions.length} total
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-[var(--fn-border)] no-scrollbar">
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <SkeletonRow key={i} />
                      ))}
                    </div>
                  ) : filteredSessions.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <div className="w-9 h-9 mx-auto rounded-full bg-[var(--fn-elevated)] border border-[var(--fn-border)] flex items-center justify-center text-sm">
                        💬
                      </div>
                      <p className="text-xs font-semibold text-[var(--fn-text)]">No conversations recorded yet</p>
                      <p className="text-[11px] text-[var(--fn-text-secondary)] leading-relaxed">
                        Visitor conversations and agent traces will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    filteredSessions.map((session) => {
                      const isSelected = session.sessionId === currentSelectedSession?.sessionId;
                      const firstQuery = session.traces[0]?.query || "Empty conversation";

                      return (
                        <div
                          key={session.sessionId}
                          className={`
                            group relative w-full transition-colors
                            ${
                              isSelected
                                ? "bg-[var(--fn-accent-subtle)] border-l-3 border-[var(--fn-accent)]"
                                : "hover:bg-[var(--fn-elevated)]/50"
                            }
                          `}
                        >
                          <button
                            onClick={() => setSelectedSessionId(session.sessionId)}
                            className="w-full text-left p-3.5 pr-10 cursor-pointer block"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-mono font-semibold text-[var(--fn-text)] truncate max-w-[140px]">
                                {session.sessionId}
                              </span>
                              <span className="text-[10px] text-[var(--fn-text-tertiary)] shrink-0 font-mono">
                                {new Date(session.lastTimestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <p className="text-xs text-[var(--fn-text-secondary)] truncate line-clamp-1 mb-2 font-medium">
                              "{firstQuery}"
                            </p>

                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[var(--fn-text-tertiary)]">
                                {session.messageCount} msg{session.messageCount > 1 ? "s" : ""} · {session.totalTokens} toks
                              </span>

                              {session.hasGap ? (
                                <Badge variant="warning">Gap Detected</Badge>
                              ) : (
                                <Badge variant="success">All Matched</Badge>
                              )}
                            </div>
                          </button>

                          {/* Quick Delete Session Button on Hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteSession(session.sessionId);
                            }}
                            className="absolute right-2.5 top-3 p-1.5 rounded-md text-[var(--fn-text-tertiary)] hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete session traces"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Chat History (shown on mobile when session selected, hidden when no session) */}
              <div
                className={`
                  ${!selectedSessionId ? "hidden lg:flex" : "flex"}
                  lg:col-span-8 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)]
                  flex-col h-[65vh] min-h-[480px] overflow-hidden
                `}
              >
                {currentSelectedSession ? (
                  <>
                    {/* Session Header Card */}
                    <div className="p-3.5 sm:p-4 border-b border-[var(--fn-border)] bg-[var(--fn-elevated)]/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2.5">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setSelectedSessionId(null)}
                          className="lg:hidden p-1.5 rounded-lg bg-[var(--fn-surface)] border border-[var(--fn-border)] text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold shrink-0 shadow-xs active:scale-95"
                          title="Back to conversations list"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                          </svg>
                          <span>Back</span>
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--fn-text)]">
                              Session:
                            </span>
                            <span className="font-mono text-xs text-[var(--fn-accent)] font-semibold select-all truncate max-w-[160px] sm:max-w-none">
                              {currentSelectedSession.sessionId}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-[var(--fn-text-tertiary)] mt-0.5">
                            Started at {new Date(currentSelectedSession.firstTimestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="bg-[var(--fn-surface)] border border-[var(--fn-border)] px-2.5 py-1 rounded-[var(--fn-radius-sm)] font-mono text-[var(--fn-text-secondary)] text-[10px] sm:text-[11px]">
                          Total: {currentSelectedSession.totalTokens} tokens
                        </span>
                        <span className="bg-[var(--fn-surface)] border border-[var(--fn-border)] px-2.5 py-1 rounded-[var(--fn-radius-sm)] font-mono text-[var(--fn-text-secondary)] text-[10px] sm:text-[11px]">
                          {currentSelectedSession.totalDurationMs}ms latency
                        </span>
                        <button
                          onClick={() => setConfirmDeleteSession(currentSelectedSession.sessionId)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                          title="Delete all traces and messages for this session"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          <span>Delete Session</span>
                        </button>
                      </div>
                    </div>

                    {/* Messages Thread */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      {currentSelectedSession.traces.map((trace, idx) => {
                        const pairs = Array.isArray(trace.query_context_pairs) ? trace.query_context_pairs : [];

                        return (
                          <div key={trace.id} className="space-y-3">
                            {/* User Query Turn */}
                            <div className="flex justify-end">
                              <div className="max-w-[85%] rounded-[var(--fn-radius-lg)] rounded-br-xs px-4 py-3 bg-[var(--fn-accent)] text-white text-sm shadow-xs">
                                <p className="font-medium whitespace-pre-wrap">{trace.query}</p>
                                <span className="text-[10px] text-white/70 mt-1 block text-right">
                                  Turn #{idx + 1} · {new Date(trace.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>

                            {/* AI Response Turn */}
                            <div className="flex justify-start">
                              <div className="max-w-[90%] rounded-[var(--fn-radius-lg)] rounded-bl-xs px-4 py-3.5 bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-[var(--fn-text)] text-sm space-y-3 shadow-xs">
                                <p className="whitespace-pre-wrap leading-relaxed">
                                  {trace.final_response}
                                </p>

                                {/* Micro telemetry tag bar & Inspect Action */}
                                <div className="pt-2 border-t border-[var(--fn-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] text-[var(--fn-text-tertiary)]">
                                      {trace.total_tokens} tokens · {trace.total_duration_ms}ms
                                    </span>
                                    {trace.query_type === "generic_or_repetitive" ? (
                                      <Badge variant="info" dot>Conversational</Badge>
                                    ) : pairs.some((p) => p.context_found !== false && p.context_received) ? (
                                      <Badge variant="success" dot>Context Found</Badge>
                                    ) : (
                                      <Badge variant="warning" dot>No Context</Badge>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => setSelectedTrace(trace)}
                                    className="px-2.5 py-1 rounded-lg bg-[var(--fn-surface)] hover:bg-[var(--fn-border)] text-[var(--fn-text)] border border-[var(--fn-border)] text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-95"
                                  >
                                    <svg className="w-3.5 h-3.5 text-[var(--fn-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                    Inspect Trace
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--fn-elevated)] border border-[var(--fn-border)] flex items-center justify-center text-xl shadow-xs">
                      🔍
                    </div>
                    <div className="space-y-1 max-w-sm">
                      <p className="text-sm font-bold text-[var(--fn-text)]">
                        No Conversation Selected
                      </p>
                      <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                        Select a conversation thread from the left or test your AI assistant on the Chatbot page to inspect retrieval chunks and LangGraph node trajectories.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE B: FLAT ALL TRACES TABLE VIEW */}
          {traceViewMode === "flat" && (
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] overflow-hidden">
              <div className="p-4 border-b border-[var(--fn-border)] flex justify-between items-center bg-[var(--fn-elevated)]/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fn-text)]">
                  All Logged Request Traces
                </h3>
                <span className="text-xs text-[var(--fn-text-tertiary)]">
                  Showing {filteredFlatTraces.length} requests
                </span>
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : filteredFlatTraces.length === 0 ? (
                <div className="p-12 text-center text-xs text-[var(--fn-text-secondary)]">
                  No traces matching your search filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[var(--fn-text)]">
                    <thead>
                      <tr className="border-b border-[var(--fn-border)] bg-[var(--fn-elevated)]/60 text-[11px] font-medium text-[var(--fn-text-tertiary)] uppercase tracking-wider">
                        <th className="p-3.5">Time</th>
                        <th className="p-3.5">Session ID</th>
                        <th className="p-3.5">User Query</th>
                        <th className="p-3.5">Tokens</th>
                        <th className="p-3.5">Latency</th>
                        <th className="p-3.5">Context</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--fn-border)]">
                      {filteredFlatTraces.map((trace) => {
                        const isGeneric =
                          trace.query_type === "generic_or_repetitive" ||
                          trace.trajectory?.some(
                            (s) => s.node === "generic_response_node" || s.output === "generic_or_repetitive"
                          );
                        const pairs = Array.isArray(trace.query_context_pairs) ? trace.query_context_pairs : [];
                        const hasContext = pairs.some(
                          (p) => p.context_found !== false && p.context_received && p.context_received.trim().length > 0
                        );

                        return (
                          <tr key={trace.id} className="hover:bg-[var(--fn-elevated)]/50 transition-colors">
                            <td className="p-3.5 text-xs text-[var(--fn-text-tertiary)] whitespace-nowrap font-mono">
                              {new Date(trace.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="p-3.5 font-mono text-xs text-[var(--fn-accent)] truncate max-w-[130px]">
                              <button
                                onClick={() => {
                                  setSelectedSessionId(trace.session_id);
                                  setTraceViewMode("sessions");
                                }}
                                className="hover:underline cursor-pointer text-left"
                                title="Open session conversation thread"
                              >
                                {trace.session_id}
                              </button>
                            </td>
                            <td className="p-3.5 max-w-xs truncate font-medium text-[var(--fn-text)]" title={trace.query}>
                              {trace.query}
                            </td>
                            <td className="p-3.5 font-mono text-xs text-[var(--fn-text-secondary)]">
                              {trace.total_tokens}
                            </td>
                            <td className="p-3.5 font-mono text-xs text-[var(--fn-accent)]">
                              {trace.total_duration_ms}ms
                            </td>
                            <td className="p-3.5">
                              {isGeneric ? (
                                <Badge variant="info" dot>Conversational</Badge>
                              ) : hasContext ? (
                                <Badge variant="success" dot>Context Found</Badge>
                              ) : (
                                <Badge variant="warning" dot>Low Relevance</Badge>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setSelectedTrace(trace)}
                                >
                                  Inspect
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSessionId(trace.session_id);
                                    setTraceViewMode("sessions");
                                  }}
                                  title="View full session conversation"
                                >
                                  Thread →
                                </Button>
                                <button
                                  onClick={() => setConfirmDeleteTrace(trace)}
                                  className="p-1.5 rounded-lg text-[var(--fn-text-tertiary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                  title="Delete this execution trace"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 3: KNOWLEDGE BASE GAPS
          ============================================================ */}
      {activeTab === "gaps" && (
        <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] p-6 space-y-4 animate-fn-fade-in">
          <div>
            <h3 className="text-base font-semibold text-[var(--fn-text)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--fn-error)]" />
              Unanswered Queries (Knowledge Base Gaps)
            </h3>
            <p className="text-xs text-[var(--fn-text-secondary)] mt-1">
              Queries submitted by users where semantic vector search did not discover relevant document context in your workspace knowledge base.
            </p>
          </div>

          {gaps.length === 0 ? (
            <div className="bg-[var(--fn-elevated)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-12 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-[var(--fn-text)]">Zero Knowledge Gaps Detected</h4>
              <p className="text-xs text-[var(--fn-text-secondary)] max-w-sm mx-auto">
                All visitor queries successfully matched relevant chunks within your indexed documents.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-[var(--fn-elevated)] border border-[var(--fn-border)] hover:border-rose-500/50 rounded-[var(--fn-radius-lg)] gap-4 transition-all shadow-xs"
                >
                  {/* Left: Query Message & Metadata Row */}
                  <div className="flex-1 min-w-0 space-y-3.5">
                    <p
                      className="text-sm font-medium text-[var(--fn-text)] line-clamp-2 break-words leading-relaxed"
                      title={gap.query}
                    >
                      "{gap.query}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--fn-border)]/60 text-xs text-[var(--fn-text-tertiary)]">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Logged: {new Date(gap.created_at).toLocaleString()}
                      </span>
                      <span className="text-[var(--fn-border)]">•</span>
                      <button
                        onClick={() => {
                          setSelectedSessionId(gap.session_id);
                          setTraceViewMode("sessions");
                          setActiveTab("traces");
                        }}
                        className="inline-flex items-center gap-1.5 text-[var(--fn-accent)] hover:underline font-mono cursor-pointer font-medium"
                      >
                        <svg className="w-3.5 h-3.5 opacity-80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Session: {gap.session_id}
                      </button>
                    </div>
                  </div>

                  {/* Right: Highly Highlighted Missing Doc Info Badge & Delete Action */}
                  <div className="shrink-0 self-start sm:self-center flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide bg-rose-500/15 text-rose-400 border border-rose-500/50 shadow-md shadow-rose-950/30">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      Missing Document Info
                    </span>
                    <button
                      onClick={() => setConfirmDeleteSession(gap.session_id)}
                      className="p-1.5 rounded-lg text-[var(--fn-text-tertiary)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                      title="Delete this session conversation and gap trace"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSPECT SINGLE TRACE MODAL (FULL PAGE WITH TOP/BOTTOM MARGINS & SCROLL) */}
      {selectedTrace && (
        <Modal
          isOpen={!!selectedTrace}
          onClose={() => setSelectedTrace(null)}
          size="full"
          title={
            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[var(--fn-accent)] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--fn-text)] leading-tight">
                    Execution Trace Inspection
                  </h3>
                  <p className="text-xs font-mono text-[var(--fn-text-tertiary)]">
                    Session: {selectedTrace.session_id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--fn-text-tertiary)]">
                  {new Date(selectedTrace.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          }
          footer={
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--fn-text-tertiary)]">
                Trace ID: {selectedTrace.id || "N/A"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const t = selectedTrace;
                    setSelectedTrace(null);
                    setConfirmDeleteTrace(t);
                  }}
                >
                  Delete Trace
                </Button>
                <Button size="sm" onClick={() => setSelectedTrace(null)}>
                  Close Trace
                </Button>
              </div>
            </div>
          }
        >
          {(() => {
            const modalPairs = Array.isArray(selectedTrace.query_context_pairs) ? selectedTrace.query_context_pairs : [];
            const modalIsGeneric =
              selectedTrace.query_type === "generic_or_repetitive" ||
              selectedTrace.trajectory?.some(
                (s: any) => s.node === "generic_response_node" || s.output === "generic_or_repetitive"
              );
            const modalHasContext =
              modalPairs.length > 0 &&
              modalPairs.some(
                (p: any) =>
                  p.context_found !== false &&
                  p.context_received &&
                  typeof p.context_received === "string" &&
                  p.context_received.trim().length > 0 &&
                  !p.context_received.toLowerCase().includes("no context passed")
              );
            const modalLatency =
              selectedTrace.total_duration_ms != null
                ? selectedTrace.total_duration_ms
                : (selectedTrace as any).duration_ms != null
                ? (selectedTrace as any).duration_ms
                : selectedTrace.trajectory?.reduce((acc: number, s: any) => acc + (Number(s.duration_ms) || 0), 0) || 0;

            return (
              <div className="space-y-6 text-sm">
                {/* Top KPI Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-3.5 rounded-[var(--fn-radius)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] block">
                      Total Latency
                    </span>
                    <span className="text-lg font-extrabold text-[var(--fn-text)] font-mono">
                      {modalLatency}ms
                    </span>
                  </div>

                  <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-3.5 rounded-[var(--fn-radius)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] block">
                      Token Consumption
                    </span>
                    <span className="text-lg font-extrabold text-[var(--fn-accent)] font-mono">
                      {(selectedTrace.total_tokens || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-3.5 rounded-[var(--fn-radius)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] block">
                      Context Status
                    </span>
                    <div className="pt-0.5">
                      {modalIsGeneric ? (
                        <Badge variant="info" dot>Conversational</Badge>
                      ) : modalHasContext ? (
                        <Badge variant="success" dot>Context Found</Badge>
                      ) : (
                        <Badge variant="warning" dot>No Context (Gap)</Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-3.5 rounded-[var(--fn-radius)] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] block">
                      CSAT User Rating
                    </span>
                    <span className="text-sm font-semibold text-[var(--fn-text)]">
                      {selectedTrace.csat_rating === 1
                        ? "👍 Helpful (Liked)"
                        : selectedTrace.csat_rating === -1
                        ? "👎 Unhelpful (Disliked)"
                        : "⚪ Unrated"}
                    </span>
                  </div>
                </div>

            {/* User Query & AI Answer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* User Prompt */}
              <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-4 rounded-[var(--fn-radius)] space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--fn-border)] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--fn-accent)] flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    User Query
                  </span>
                  <span className="text-[10px] font-mono text-[var(--fn-text-tertiary)]">Human Input</span>
                </div>
                <p className="text-sm text-[var(--fn-text)] font-medium leading-relaxed whitespace-pre-wrap">
                  "{selectedTrace.query}"
                </p>
              </div>

              {/* Final AI Response */}
              <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-4 rounded-[var(--fn-radius)] space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--fn-border)] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text-secondary)] flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    Final AI Response
                  </span>
                  <span className="text-[10px] font-mono text-[var(--fn-text-tertiary)]">Model Output</span>
                </div>
                <div className="max-h-56 overflow-y-auto pr-1">
                  <p className="text-xs text-[var(--fn-text)] leading-relaxed whitespace-pre-wrap">
                    {selectedTrace.final_response || "No response recorded."}
                  </p>
                </div>
              </div>
            </div>

            {/* Query:Context Pairs / Retrieved Vector Chunks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                  Retrieved Vector Knowledge Chunks (`query_context_pairs`)
                </h4>
                <span className="text-xs font-mono text-[var(--fn-text-tertiary)]">
                  {selectedTrace.query_context_pairs?.length || 0} sub-queries evaluated
                </span>
              </div>

              {selectedTrace.query_context_pairs?.length === 0 ? (
                <div className="p-4 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] text-xs text-[var(--fn-text-tertiary)] italic">
                  No vector context chunks were queried or injected for this session turn.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedTrace.query_context_pairs?.map((pair, i) => {
                    const pairHasContext =
                      pair.context_found !== false &&
                      pair.context_received &&
                      typeof pair.context_received === "string" &&
                      pair.context_received.trim().length > 0 &&
                      !pair.context_received.toLowerCase().includes("no context passed");

                    return (
                      <div key={i} className="bg-[var(--fn-surface)] border border-[var(--fn-border)] p-4 rounded-[var(--fn-radius)] space-y-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--fn-border)] pb-2.5">
                          <span className="text-xs font-semibold text-[var(--fn-text)] flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[var(--fn-elevated)] text-[var(--fn-accent)] flex items-center justify-center text-[10px] font-mono font-bold">
                              {i + 1}
                            </span>
                            Sub-Query: "{pair.query}"
                          </span>
                          {pairHasContext ? (
                            <Badge variant="success">Passed Similarity Threshold</Badge>
                          ) : (
                            <Badge variant="error">Below Threshold (Gap)</Badge>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)]">
                            Retrieved Document Context Text
                          </span>
                          <div className="text-xs text-[var(--fn-text-secondary)] font-mono bg-[var(--fn-elevated)] p-3.5 rounded-[var(--fn-radius)] max-h-52 overflow-y-auto whitespace-pre-wrap border border-[var(--fn-border)] leading-relaxed">
                            {pair.context_received || "No context chunks passed the relevance score threshold."}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LangGraph Trajectory Node Execution Flow */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text-tertiary)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                  </svg>
                  LangGraph Node Trajectory Pipeline
                </h4>
                <span className="text-xs font-mono text-[var(--fn-text-tertiary)]">
                  {selectedTrace.trajectory?.length || 0} nodes executed
                </span>
              </div>

              {selectedTrace.trajectory?.length === 0 ? (
                <div className="p-4 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] text-xs text-[var(--fn-text-tertiary)] italic">
                  No step-by-step node trajectory captured.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {selectedTrace.trajectory?.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-[var(--fn-text)] truncate">{step.node}</span>
                      </div>
                      <span className="text-[var(--fn-text-tertiary)] font-mono text-[11px] shrink-0">
                        {step.duration_ms ? `${step.duration_ms}ms` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </Modal>
  )}

  {/* ============================================================
      MODAL: CONFIRM DELETE SESSION TRACES
      ============================================================ */}
  <Modal
    isOpen={!!confirmDeleteSession}
    onClose={() => !deletingSession && setConfirmDeleteSession(null)}
    title="Delete Session Traces"
    footer={
      <>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmDeleteSession(null)}
          disabled={deletingSession}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => confirmDeleteSession && handleDeleteSession(confirmDeleteSession)}
          loading={deletingSession}
        >
          Delete Session
        </Button>
      </>
    }
  >
    <div className="space-y-3">
      <p className="text-sm text-[var(--fn-text)] leading-relaxed">
        Are you sure you want to delete all execution traces and conversation messages for session{" "}
        <span className="font-mono font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)] select-all">
          {confirmDeleteSession}
        </span>?
      </p>
      <p className="text-xs text-[var(--fn-text-secondary)]">
        This will permanently remove the conversation history from PostgreSQL and invalidate the Redis chat memory and observability caches. This action cannot be undone.
      </p>
    </div>
  </Modal>

  {/* ============================================================
      MODAL: CONFIRM DELETE INDIVIDUAL TRACE
      ============================================================ */}
  <Modal
    isOpen={!!confirmDeleteTrace}
    onClose={() => !deletingTrace && setConfirmDeleteTrace(null)}
    title="Delete Execution Trace"
    footer={
      <>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfirmDeleteTrace(null)}
          disabled={deletingTrace}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => confirmDeleteTrace && handleDeleteTrace(confirmDeleteTrace.id)}
          loading={deletingTrace}
        >
          Delete Trace
        </Button>
      </>
    }
  >
    <div className="space-y-3">
      <p className="text-sm text-[var(--fn-text)] leading-relaxed">
        Are you sure you want to delete the execution trace for query:{" "}
        <span className="font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)]">
          "{confirmDeleteTrace?.query}"
        </span>?
      </p>
      <p className="text-xs text-[var(--fn-text-secondary)]">
        This will permanently purge this execution record from the database and refresh the telemetry metrics cache.
      </p>
    </div>
  </Modal>
    </div>
  );
}
