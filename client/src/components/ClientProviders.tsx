"use client";

import React from "react";
import { ThemeProvider } from "../lib/ThemeContext";
import { ToastProvider } from "../lib/ToastContext";
import QueryProvider from "../lib/QueryProvider";
import ToastRenderer from "./ui/Toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          {children}
          <ToastRenderer />
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
