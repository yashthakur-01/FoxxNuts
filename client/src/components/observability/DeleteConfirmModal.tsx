import React from "react";
import type { Trace } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

export interface DeleteConfirmModalProps {
  confirmDeleteSession: string | null;
  confirmDeleteTrace: Trace | null;
  deletingSession: boolean;
  deletingTrace: boolean;
  onCloseSession: () => void;
  onCloseTrace: () => void;
  onConfirmDeleteSession: (sessionId: string) => void;
  onConfirmDeleteTrace: (traceId: string) => void;
}

/**
 * Modals for confirming deletion of either:
 * 1. An entire session thread and its associated traces
 * 2. An individual execution trace
 */
export default function DeleteConfirmModal({
  confirmDeleteSession,
  confirmDeleteTrace,
  deletingSession,
  deletingTrace,
  onCloseSession,
  onCloseTrace,
  onConfirmDeleteSession,
  onConfirmDeleteTrace,
}: DeleteConfirmModalProps) {
  return (
    <>
      {/* ============================================================
          MODAL: CONFIRM DELETE SESSION TRACES
          ============================================================ */}
      <Modal
        isOpen={!!confirmDeleteSession}
        onClose={() => !deletingSession && onCloseSession()}
        title="Delete Session Traces"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCloseSession}
              disabled={deletingSession}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => confirmDeleteSession && onConfirmDeleteSession(confirmDeleteSession)}
              loading={deletingSession}
            >
              Delete Session
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--fn-text)] leading-relaxed">
            Are you sure you want to delete all execution traces and conversation messages for session{" "}
            <span className="font-mono font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)] select-all">
              {confirmDeleteSession}
            </span>?
          </p>
          <p className="text-xs text-[var(--fn-text-secondary)]">
            This will permanently remove the conversation history from PostgreSQL and invalidate the Redis chat memory and observability caches. This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* ============================================================
          MODAL: CONFIRM DELETE INDIVIDUAL TRACE
          ============================================================ */}
      <Modal
        isOpen={!!confirmDeleteTrace}
        onClose={() => !deletingTrace && onCloseTrace()}
        title="Delete Execution Trace"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={onCloseTrace}
              disabled={deletingTrace}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => confirmDeleteTrace && onConfirmDeleteTrace(confirmDeleteTrace.id)}
              loading={deletingTrace}
            >
              Delete Trace
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--fn-text)] leading-relaxed">
            Are you sure you want to delete the execution trace for query:{" "}
            <span className="font-semibold text-[var(--fn-text)] bg-[var(--fn-surface)] px-1.5 py-0.5 rounded border border-[var(--fn-border)]">
              "{confirmDeleteTrace?.query}"
            </span>?
          </p>
          <p className="text-xs text-[var(--fn-text-secondary)]">
            This will permanently purge this execution record from the database and refresh the telemetry metrics cache.
          </p>
        </div>
      </Modal>
    </>
  );
}
