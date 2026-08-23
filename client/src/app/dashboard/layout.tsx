"use client";

import { WorkspaceProvider } from "../../lib/WorkspaceContext";
import DashboardLayout from "../../components/layout/DashboardLayout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </WorkspaceProvider>
  );
}
