"use client";

import React from "react";
import { ThemeProvider } from "../lib/ThemeContext";
import { ToastProvider } from "../lib/ToastContext";
import ToastRenderer from "./ui/Toast";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>
        {children}
        <ToastRenderer />
      </ToastProvider>
    </ThemeProvider>
  );
}
