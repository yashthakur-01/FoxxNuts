import React from "react";
import type { SessionGroup, Trace } from "../../types";
import Badge from "../ui/Badge";
import { SkeletonRow } from "../ui/Skeleton";

export interface SessionChatThreadProps {
  filteredSessions: SessionGroup[];
  loading: boolean;
  selectedSessionId: string | null;
  currentSelectedSession: SessionGroup | null;
  setSelectedSessionId: (id: string | null) => void;
  setSelectedTrace: (trace: Trace) => void;
  setConfirmDeleteSession: (sessionId: string) => void;
}

/**
 * Dual-pane conversation session thread viewer:
 * - Left Pane: Filtered conversation list with last timestamp, message count, tokens, and quick delete.
 * - Right Pane: Turn-by-turn conversation messages with user bubble, AI bubble, latency, tokens, and inspect action.
 */
export default function SessionChatThread({
  filteredSessions,
  loading,
  selectedSessionId,
  currentSelectedSession,
  setSelectedSessionId,
  setSelectedTrace,
  setConfirmDeleteSession,
}: SessionChatThreadProps) {
  return (
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
  );
}
