import React from "react";
import type { Trace } from "../../types";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { SkeletonRow } from "../ui/Skeleton";

export interface TracesTableProps {
  filteredFlatTraces: Trace[];
  loading: boolean;
  setSelectedSessionId: (id: string) => void;
  setTraceViewMode: (mode: "sessions" | "flat") => void;
  setSelectedTrace: (trace: Trace) => void;
  setConfirmDeleteTrace: (trace: Trace) => void;
}

/**
 * Tabular view of all execution traces with timestamp, session ID, query preview,
 * tokens, latency, relevance status, and actions.
 */
export default function TracesTable({
  filteredFlatTraces,
  loading,
  setSelectedSessionId,
  setTraceViewMode,
  setSelectedTrace,
  setConfirmDeleteTrace,
}: TracesTableProps) {
  return (
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
  );
}
