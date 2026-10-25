"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "../supabase/browserClient";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { toast } from "../lib/ToastContext";
import type {
  Metrics,
  Trace,
  GapItem,
  SessionGroup,
  ObservabilitySectionProps,
} from "../types";

// Modular Sub-Components
import MetricsCards from "./observability/MetricsCards";
import TimelineCharts from "./observability/TimelineCharts";
import SessionChatThread from "./observability/SessionChatThread";
import TracesTable from "./observability/TracesTable";
import KnowledgeGapsView from "./observability/KnowledgeGapsView";
import TraceDetailsModal from "./observability/TraceDetailsModal";
import DeleteConfirmModal from "./observability/DeleteConfirmModal";
import FoxMascotLoader from "./ui/FoxMascotLoader";
import RefreshAnalyticsButton from "./observability/RefreshAnalyticsButton";
import { useQueryClient } from "@tanstack/react-query";
import {
  useObservabilityMetrics,
  useObservabilityTraces,
  useObservabilityGaps,
  useRefreshAnalytics,
} from "../hooks/useObservability";

/**
 * Observability & Analytics Section Orchestrator.
 * Decomposed into modular sub-components under `components/observability/`.
 */
export default function ObservabilitySection({
  workspaceId,
  activeTabProp,
  hideTabHeader = false,
}: ObservabilitySectionProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"metrics" | "traces" | "gaps">(activeTabProp || "metrics");

  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    }
  }, [activeTabProp]);

  const queryClient = useQueryClient();
  const { data: metricsData, isLoading: metricsLoading, isFetching: metricsFetching } = useObservabilityMetrics(workspaceId);
  const { data: tracesData, isLoading: tracesLoading, isFetching: tracesFetching } = useObservabilityTraces(workspaceId, 1, 100);
  const { data: gapsData, isLoading: gapsLoading, isFetching: gapsFetching } = useObservabilityGaps(workspaceId);
  const { refreshMetrics, refreshTraces, refreshGaps } = useRefreshAnalytics(workspaceId);

  const metrics = metricsData?.metrics ?? null;
  const traces = tracesData?.traces ?? [];
  const gaps = gapsData?.gaps ?? [];

  const loading = activeTab === "metrics" ? metricsLoading : activeTab === "traces" ? tracesLoading : gapsLoading;
  const isTabFetching = activeTab === "metrics" ? metricsFetching : activeTab === "traces" ? tracesFetching : gapsFetching;

  const handleRefreshCurrentTab = async () => {
    if (activeTab === "metrics") {
      await refreshMetrics();
    } else if (activeTab === "traces") {
      await refreshTraces(1, 100);
    } else {
      await refreshGaps(50);
    }
  };

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
      queryClient.invalidateQueries({ queryKey: ["observability_traces", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["observability_gaps", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["observability_metrics", workspaceId] });
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
      queryClient.invalidateQueries({ queryKey: ["observability_traces", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["observability_gaps", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["observability_metrics", workspaceId] });
    } catch (err: any) {
      console.error("Delete trace error:", err);
      toast.error(err.message || "Failed to delete trace");
    } finally {
      setDeletingTrace(false);
    }
  };

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

          <RefreshAnalyticsButton
            onRefresh={handleRefreshCurrentTab}
            isRefreshing={isTabFetching}
          />
        </div>
      )}

      {/* ============================================================
          TAB 1: METRICS OVERVIEW & 4 INTERACTIVE GRAPHS (HOME TAB)
          ============================================================ */}
      {activeTab === "metrics" && (
        <div className="space-y-6 animate-fn-fade-in">
          {(!metrics || metrics.total_queries === 0) && (
            <div className="p-4 rounded-xl bg-[var(--fn-surface)] border border-[var(--fn-border)] flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[var(--fn-accent)]/10 text-[var(--fn-accent)] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
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
          {loading && !metrics ? (
            <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] p-12 text-center">
              <FoxMascotLoader
                variant="section"
                size="md"
                message="Aggregating performance metrics and telemetry..."
              />
            </div>
          ) : (
            <>
              <MetricsCards metrics={metrics} />

              {/* 4 Interactive SVG Throughput & Token Graphs with Hover Scanner */}
              <TimelineCharts metrics={metrics} />
            </>
          )}
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
            <SessionChatThread
              filteredSessions={filteredSessions}
              loading={loading}
              selectedSessionId={selectedSessionId}
              currentSelectedSession={currentSelectedSession}
              setSelectedSessionId={setSelectedSessionId}
              setSelectedTrace={setSelectedTrace}
              setConfirmDeleteSession={setConfirmDeleteSession}
            />
          )}

          {/* MODE B: FLAT ALL TRACES TABLE VIEW */}
          {traceViewMode === "flat" && (
            <TracesTable
              filteredFlatTraces={filteredFlatTraces}
              loading={loading}
              setSelectedSessionId={setSelectedSessionId}
              setTraceViewMode={setTraceViewMode}
              setSelectedTrace={setSelectedTrace}
              setConfirmDeleteTrace={setConfirmDeleteTrace}
            />
          )}
        </div>
      )}

      {/* ============================================================
          TAB 3: KNOWLEDGE BASE GAPS
          ============================================================ */}
      {activeTab === "gaps" && (
        <KnowledgeGapsView
          gaps={gaps}
          loading={loading}
          setSelectedSessionId={setSelectedSessionId}
          setTraceViewMode={setTraceViewMode}
          setActiveTab={setActiveTab}
          setConfirmDeleteSession={setConfirmDeleteSession}
        />
      )}

      {/* INSPECT SINGLE TRACE MODAL */}
      <TraceDetailsModal
        selectedTrace={selectedTrace}
        onClose={() => setSelectedTrace(null)}
        onDeleteTrace={(trace) => {
          setSelectedTrace(null);
          setConfirmDeleteTrace(trace);
        }}
      />

      {/* CONFIRMATION DELETION MODALS */}
      <DeleteConfirmModal
        confirmDeleteSession={confirmDeleteSession}
        confirmDeleteTrace={confirmDeleteTrace}
        deletingSession={deletingSession}
        deletingTrace={deletingTrace}
        onCloseSession={() => !deletingSession && setConfirmDeleteSession(null)}
        onCloseTrace={() => !deletingTrace && setConfirmDeleteTrace(null)}
        onConfirmDeleteSession={handleDeleteSession}
        onConfirmDeleteTrace={handleDeleteTrace}
      />
    </div>
  );
}
