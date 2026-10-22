"use client";

import { useWorkspace } from "../../../../lib/WorkspaceContext";
import ObservabilitySection from "../../../../components/ObservabilitySection";
import FoxMascotLoader from "../../../../components/ui/FoxMascotLoader";
import PageHeader from "../../../../components/layout/PageHeader";
import RefreshAnalyticsButton from "../../../../components/observability/RefreshAnalyticsButton";
import { useRefreshAnalytics } from "../../../../hooks/useObservability";

export default function AnalyticsGapsPage() {
  const { activeWorkspaceId, activeWorkspace, loading } = useWorkspace();
  const { refreshGaps } = useRefreshAnalytics(activeWorkspaceId);

  if (loading || !activeWorkspaceId) {
    return <FoxMascotLoader variant="page" message="Loading knowledge gaps telemetry..." />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      <PageHeader
        eyebrow="Observability & Quality"
        title="Knowledge Gaps Analysis"
        description="Identify questions where retrieval scored low or context was insufficient to formulate an authoritative answer."
        actions={
          <div className="flex items-center gap-2.5">
            <RefreshAnalyticsButton onRefresh={() => refreshGaps(50)} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--fn-surface-elevated)] text-[var(--fn-text-secondary)] border border-[var(--fn-border)] text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Gap Telemetry
            </span>
          </div>
        }
      />

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
