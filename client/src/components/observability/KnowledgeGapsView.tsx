import React from "react";
import type { GapItem } from "../../types";
import FoxMascotLoader from "../ui/FoxMascotLoader";

export interface KnowledgeGapsViewProps {
  gaps: GapItem[];
  loading?: boolean;
  setSelectedSessionId: (id: string) => void;
  setTraceViewMode: (mode: "sessions" | "flat") => void;
  setActiveTab: (tab: "metrics" | "traces" | "gaps") => void;
  setConfirmDeleteSession: (sessionId: string) => void;
}

/**
 * Knowledge Base Gaps view showing queries where vector search found no relevant context,
 * along with deep links to their session conversation and deletion action.
 */
export default function KnowledgeGapsView({
  gaps,
  loading = false,
  setSelectedSessionId,
  setTraceViewMode,
  setActiveTab,
  setConfirmDeleteSession,
}: KnowledgeGapsViewProps) {
  return (
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

      {loading ? (
        <div className="bg-[var(--fn-elevated)] border border-[var(--fn-border)] rounded-[var(--fn-radius)] p-12 text-center">
          <FoxMascotLoader
            variant="section"
            size="md"
            message="Analyzing query telemetry and identifying knowledge gaps..."
          />
        </div>
      ) : gaps.length === 0 ? (
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
  );
}
