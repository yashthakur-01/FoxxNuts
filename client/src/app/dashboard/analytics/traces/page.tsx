"use client";

import { useWorkspace } from "../../../../lib/WorkspaceContext";
import ObservabilitySection from "../../../../components/ObservabilitySection";
import FoxMascotLoader from "../../../../components/ui/FoxMascotLoader";
import PageHeader from "../../../../components/layout/PageHeader";
import RefreshAnalyticsButton from "../../../../components/observability/RefreshAnalyticsButton";
import { useRefreshAnalytics } from "../../../../hooks/useObservability";

export default function AnalyticsTracesPage() {
  const { activeWorkspaceId, activeWorkspace, loading } = useWorkspace();
  const { refreshTraces } = useRefreshAnalytics(activeWorkspaceId);

  if (loading || !activeWorkspaceId) {
    return <FoxMascotLoader variant="page" message="Loading sessions & execution traces..." />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      <PageHeader
        title="Sessions & Execution Traces"
        eyebrow="Multi-Node Inspection"
        description="Session-wise chat history, vector retrieval chunk inspect, and step-by-step LangGraph node trajectories."
        actions={
          <div className="flex items-center gap-2.5">
            <RefreshAnalyticsButton onRefresh={() => refreshTraces(1, 100)} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)] border border-[var(--fn-border)] text-xs font-mono font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Execution Traces
            </span>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-5 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <ObservabilitySection
            workspaceId={activeWorkspaceId}
            activeTabProp="traces"
            hideTabHeader={true}
          />
        </div>
      </div>
    </div>
  );
}
