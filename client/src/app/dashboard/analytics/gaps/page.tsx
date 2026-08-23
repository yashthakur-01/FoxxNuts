"use client";

import { useWorkspace } from "../../../../lib/WorkspaceContext";
import ObservabilitySection from "../../../../components/ObservabilitySection";
import Skeleton from "../../../../components/ui/Skeleton";

export default function AnalyticsGapsPage() {
  const { activeWorkspaceId, activeWorkspace, loading } = useWorkspace();

  if (loading || !activeWorkspaceId) {
    return (
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        <Skeleton height={48} width="30%" />
        <Skeleton height={500} />
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
            Knowledge Gaps Analysis
          </h1>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Identify questions that could not find relevant context in your knowledge documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black/40 text-white border border-white/20 text-xs font-mono font-medium shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Gap Telemetry
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-5 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <ObservabilitySection
            workspaceId={activeWorkspaceId}
            activeTabProp="gaps"
            hideTabHeader={true}
          />
        </div>
      </div>
    </div>
  );
}
