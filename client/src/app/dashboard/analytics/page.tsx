"use client";

import { useWorkspace } from "../../../lib/WorkspaceContext";
import ObservabilitySection from "../../../components/ObservabilitySection";
import Skeleton from "../../../components/ui/Skeleton";

export default function AnalyticsOverviewPage() {
  const { activeWorkspaceId, activeWorkspace, loading } = useWorkspace();

  if (loading || !activeWorkspaceId) {
    return (
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        <Skeleton height={48} width="30%" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={90} />
          ))}
        </div>
        <Skeleton height={350} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* ============================================================
          VIBRANT FULL-BLEED END-TO-END RED RIBBON HEADER
          ============================================================ */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Analytics & Throughput
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Real-time RPM, TPM, RPD, and TPD interactive rate timelines for <span className="font-bold text-white">{activeWorkspace?.workspace_name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black/40 text-white border border-white/20 text-xs font-mono font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Telemetry
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-5 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <ObservabilitySection
            workspaceId={activeWorkspaceId}
            activeTabProp="metrics"
            hideTabHeader={true}
          />
        </div>
      </div>
    </div>
  );
}
