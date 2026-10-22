"use client";

import { useWorkspace } from "../../../lib/WorkspaceContext";
import ObservabilitySection from "../../../components/ObservabilitySection";
import FoxMascotLoader from "../../../components/ui/FoxMascotLoader";
import PageHeader from "../../../components/layout/PageHeader";
import RefreshAnalyticsButton from "../../../components/observability/RefreshAnalyticsButton";
import { useRefreshAnalytics } from "../../../hooks/useObservability";

export default function AnalyticsOverviewPage() {
  const { activeWorkspaceId, activeWorkspace, loading } = useWorkspace();
  const { refreshMetrics } = useRefreshAnalytics(activeWorkspaceId);

  if (loading || !activeWorkspaceId) {
    return <FoxMascotLoader variant="page" message="Loading operational telemetry & throughput..." />;
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      <PageHeader
        title="Analytics & Throughput"
        eyebrow="Operational Telemetry"
        description={
          <span>
            Real-time RPM, TPM, RPD, and TPD interactive rate timelines for <span className="font-semibold text-[var(--fn-text)]">{activeWorkspace?.workspace_name}</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <RefreshAnalyticsButton onRefresh={refreshMetrics} />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--fn-elevated)] text-[var(--fn-text-secondary)] border border-[var(--fn-border)] text-xs font-mono font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-4 sm:p-6 md:p-8">
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
