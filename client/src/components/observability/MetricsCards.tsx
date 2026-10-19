import React from "react";
import type { Metrics } from "../../types";

export interface MetricsCardsProps {
  metrics: Metrics | null;
}

/**
 * 8 Primary Rate & Health KPI Cards:
 * RPM, TPM, RPD, TPD, Total Queries, Total Tokens, Avg Latency, and Context Match Rate.
 */
export default function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
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
  );
}
