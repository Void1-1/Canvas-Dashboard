"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { sanitizeCanvasHtml } from "@/lib/sanitize";
import SubmissionPanel from "@/components/SubmissionPanel";
import CommentsPanel from "@/components/CommentsPanel";

interface SubmissionAttempt {
  attempt: number;
  submission_type: string | null;
  submitted_at: string | null;
  score: number | null;
  workflow_state: string;
}

interface AssignmentModalProps {
  assignment: any | null;
  isOpen: boolean;
  onClose: () => void;
  /** Render the submission form when the assignment has submittable types. Default: true. */
  showSubmission?: boolean;
  /** Render the comments button and side panel. Default: true. */
  showComments?: boolean;
}

export default function AssignmentModal({
  assignment,
  isOpen,
  onClose,
  showSubmission = true,
  showComments = true,
}: AssignmentModalProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const assignmentRef = useRef<HTMLDivElement>(null);
  const [assignmentHeight, setAssignmentHeight] = useState<number | undefined>(undefined);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionAttempt[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Measure the assignment panel's rendered height whenever the modal opens so
  // the comments panel can be capped to exactly that height.
  useEffect(() => {
    if (!isOpen || !assignmentRef.current) return;
    setAssignmentHeight(assignmentRef.current.offsetHeight);
  }, [isOpen]);

  // Fetch submission history when a full assignment (with course_id) is open
  useEffect(() => {
    if (!isOpen || !assignment?.course_id || !assignment?.id) {
      setSubmissionHistory(null);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/assignments/${assignment.id}/history?course_id=${assignment.course_id}`
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          const history: SubmissionAttempt[] = Array.isArray(data.submission_history)
            ? data.submission_history
            : [];
          setSubmissionHistory(history);
        }
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, assignment?.id, assignment?.course_id]);

  // Reset comments panel when the modal closes or a new assignment opens
  const handleClose = () => {
    setCommentsOpen(false);
    setSubmissionHistory(null);
    onClose();
  };

  if (!assignment) return null;

  const canComment = showComments && !!assignment.course_id;

  return (
    <AnimatePresence onExitComplete={() => setCommentsOpen(false)}>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Outer centering container */}
          <div
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-x-hidden"
            onClick={handleClose}
          >
            {/* Side-by-side panel row */}
            <div
              className="flex items-start gap-3 w-full justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Main assignment panel */}
              <motion.div
                ref={assignmentRef}
                className="glass rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-scroll flex-shrink-0"
                style={{ background: "var(--color-surface)" }}
                initial={{ scale: 0.92, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.92, y: 24, opacity: 0 }}
                transition={{ type: "spring", damping: 26, stiffness: 300 }}
              >
                {/* Header */}
                <div
                  className="sticky top-0 p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4"
                  style={{ background: "var(--color-surface)" }}
                >
                  <div className="flex-1">
                    <h2
                      className="text-xl md:text-2xl font-bold mb-2"
                      style={{ color: "var(--color-text)" }}
                    >
                      {assignment.name}
                    </h2>
                    {assignment.course && (
                      <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                        {typeof assignment.course === "string"
                          ? assignment.course
                          : assignment.course.name ||
                            (assignment.course.id
                              ? `Course ${assignment.course.id}`
                              : "")}
                      </p>
                    )}
                  </div>
                  <motion.button
                    onClick={handleClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" style={{ color: "var(--color-text)" }} />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-6">
                  {/* Due Date & Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assignment.due_at && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: "var(--color-muted)" }}>
                          Due Date
                        </p>
                        <p className="text-base" style={{ color: "var(--color-text)" }}>
                          {new Date(assignment.due_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {assignment.points_possible !== null &&
                      assignment.points_possible !== undefined && (
                        <div>
                          <p className="text-sm font-medium mb-1" style={{ color: "var(--color-muted)" }}>
                            Points
                          </p>
                          <p className="text-base" style={{ color: "var(--color-text)" }}>
                            {assignment.points_possible}{" "}
                            {assignment.points_possible === 1 ? "point" : "points"}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Description */}
                  {assignment.description && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                        Description
                      </p>
                      <div
                        className="prose prose-sm max-w-none assignment-description"
                        style={{ color: "var(--color-text)" }}
                        dangerouslySetInnerHTML={{
                          __html: sanitizeCanvasHtml(assignment.description),
                        }}
                      />
                    </div>
                  )}

                  {/* Submission Panel */}
                  {showSubmission &&
                    Array.isArray(assignment.submission_types) &&
                    assignment.submission_types.length > 0 && (
                      <SubmissionPanel
                        assignment={assignment}
                        onOpenComments={canComment ? () => setCommentsOpen((v) => !v) : undefined}
                      />
                    )}

                  {/* Lock Information */}
                  {assignment.lock_info && (
                    <div
                      className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      style={{ background: "rgba(234, 179, 8, 0.1)" }}
                    >
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                        Locked
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                        {assignment.lock_info.unlock_at
                          ? `Unlocks at ${new Date(assignment.lock_info.unlock_at).toLocaleString()}`
                          : "This assignment is locked"}
                      </p>
                    </div>
                  )}

                  {/* External Tool Info */}
                  {assignment.external_tool_tag_attributes &&
                    (() => {
                      const url = assignment.external_tool_tag_attributes.url ?? "";
                      if (!url.startsWith("https://") && !url.startsWith("http://"))
                        return null;
                      return (
                        <div>
                          <p className="text-sm font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                            External Tool
                          </p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm underline"
                            style={{ color: "var(--color-accent)" }}
                          >
                            {url}
                          </a>
                        </div>
                      );
                    })()}

                  {/* Attempts Remaining */}
                  {assignment.allowed_attempts != null && assignment.allowed_attempts > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-muted)" }}>
                        Attempts
                      </p>
                      <p className="text-base" style={{ color: "var(--color-text)" }}>
                        {(() => {
                          const used = assignment.submission?.attempt ?? 0;
                          const allowed = assignment.allowed_attempts;
                          return `${used} of ${allowed} used`;
                        })()}
                      </p>
                    </div>
                  )}

                  {/* Late Policy */}
                  {(() => {
                    if (!assignment.due_at) return null;
                    const due = new Date(assignment.due_at);
                    const now = new Date();
                    const isPastDue = due < now;
                    const workflowState = assignment.submission?.workflow_state;
                    const isMissing = isPastDue && (!workflowState || workflowState === 'unsubmitted');
                    const isLate = assignment.submission?.late === true;

                    if (!isMissing && !isLate) return null;

                    return (
                      <div className="flex flex-wrap gap-2 items-center">
                        {isMissing && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(220,38,38,0.12)', color: 'rgb(220,38,38)' }}
                          >
                            Missing
                          </span>
                        )}
                        {isLate && !isMissing && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'rgba(234,179,8,0.15)', color: 'rgb(161,128,0)' }}
                          >
                            Late
                          </span>
                        )}
                        {assignment.late_policy_status && (
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            Late policy: {assignment.late_policy_status}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Submission History */}
                  {assignment.course_id && (historyLoading || (submissionHistory && submissionHistory.length > 0)) && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: "var(--color-muted)" }}>
                        Submission History
                      </p>
                      {historyLoading ? (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-muted)' }}>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span className="text-sm">Loading history…</span>
                        </div>
                      ) : submissionHistory && submissionHistory.length > 0 ? (
                        <ul className="space-y-2">
                          {submissionHistory.map((attempt) => (
                            <li
                              key={attempt.attempt}
                              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm p-2 rounded-lg border"
                              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                            >
                              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                                Attempt {attempt.attempt}
                              </span>
                              {attempt.submission_type && (
                                <span style={{ color: 'var(--color-muted)' }}>
                                  {attempt.submission_type.replace(/_/g, ' ')}
                                </span>
                              )}
                              {attempt.submitted_at && (
                                <span style={{ color: 'var(--color-muted)' }}>
                                  {new Date(attempt.submitted_at).toLocaleString()}
                                </span>
                              )}
                              {attempt.score != null && (
                                <span
                                  className="ml-auto font-medium"
                                  style={{ color: 'var(--color-accent)' }}
                                >
                                  {attempt.score} pts
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                          No prior submissions.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Comments side panel */}
              <AnimatePresence>
                {commentsOpen && canComment && (
                  <motion.div
                    key="comments-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "20rem", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 280 }}
                    className="glass rounded-xl shadow-xl overflow-hidden flex-shrink-0 hidden sm:block"
                    style={{ background: "var(--color-surface)", height: assignmentHeight }}
                  >
                    <CommentsPanel
                      assignment={assignment}
                      onClose={() => setCommentsOpen(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile comments sheet — slides up from bottom */}
            <AnimatePresence>
              {commentsOpen && canComment && (
                <motion.div
                  key="comments-sheet"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 280 }}
                  className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-2xl shadow-2xl sm:hidden"
                  style={{ background: "var(--color-surface)", height: "65vh" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CommentsPanel
                    assignment={assignment}
                    onClose={() => setCommentsOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
