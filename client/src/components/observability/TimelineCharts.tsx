import React from "react";
import type { Metrics } from "../../types";
import InteractiveGraphCard from "./InteractiveGraphCard";

export interface TimelineChartsProps {
  metrics: Metrics | null;
}

/**
 * 4 Interactive SVG Throughput & Token Graphs with Hover Scanner:
 * 1. RPM (Requests Per Minute)
 * 2. TPM (Tokens Per Minute)
 * 3. RPD (Requests Per Day)
 * 4. TPD (Tokens Per Day)
 */
export default function TimelineCharts({ metrics }: TimelineChartsProps) {
  return (
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
  );
}
