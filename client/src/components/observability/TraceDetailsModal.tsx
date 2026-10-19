import React from "react";
import type { Trace } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export interface TraceDetailsModalProps {
  selectedTrace: Trace | null;
  onClose: () => void;
  onDeleteTrace: (trace: Trace) => void;
}

/**
 * Detailed Execution Trace Inspection Modal:
 * - Top KPI strip (Latency, Tokens, Context Status, CSAT Rating)
 * - User Query and Final AI Response
 * - Retrieved Vector Knowledge Chunks (`query_context_pairs`)
 * - LangGraph Node Trajectory Pipeline with per-node duration
 */
export default function TraceDetailsModal({
  selectedTrace,
  onClose,
  onDeleteTrace,
}: TraceDetailsModalProps) {
  if (!selectedTrace) return null;

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
    <Modal
      isOpen={!!selectedTrace}
      onClose={onClose}
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
              onClick={() => onDeleteTrace(selectedTrace)}
            >
              Delete Trace
            </Button>
            <Button size="sm" onClick={onClose}>
              Close Trace
            </Button>
          </div>
        </div>
      }
    >
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
    </Modal>
  );
}
