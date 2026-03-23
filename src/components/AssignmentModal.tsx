"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { sanitizeCanvasHtml } from "@/lib/sanitize";

interface AssignmentModalProps {
  assignment: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssignmentModal({
  assignment,
  isOpen,
  onClose,
}: AssignmentModalProps) {
  if (!assignment) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="glass rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              style={{ background: "var(--color-surface)" }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div
                className="sticky top-0 p-6 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-4"
                style={{ background: "var(--color-surface)" }}
              >
                <div className="flex-1">
                  <h2
                    className="text-2xl font-bold mb-2"
                    style={{ color: "var(--color-text)" }}
                  >
                    {assignment.name}
                  </h2>
                  {assignment.course && (
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {typeof assignment.course === "string"
                        ? assignment.course
                        : assignment.course.name ||
                          (assignment.course.id
                            ? `Course ${assignment.course.id}`
                            : "")}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <X
                    className="w-5 h-5"
                    style={{ color: "var(--color-text)" }}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Due Date & Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignment.due_at && (
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: "var(--color-muted)" }}
                      >
                        Due Date
                      </p>
                      <p
                        className="text-base"
                        style={{ color: "var(--color-text)" }}
                      >
                        {new Date(assignment.due_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {assignment.points_possible !== null &&
                    assignment.points_possible !== undefined && (
                      <div>
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: "var(--color-muted)" }}
                        >
                          Points
                        </p>
                        <p
                          className="text-base"
                          style={{ color: "var(--color-text)" }}
                        >
                          {assignment.points_possible}{" "}
                          {assignment.points_possible === 1
                            ? "point"
                            : "points"}
                        </p>
                      </div>
                    )}
                </div>

                {/* Description */}
                {assignment.description && (
                  <div>
                    <p
                      className="text-sm font-medium mb-2"
                      style={{ color: "var(--color-muted)" }}
                    >
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

                {/* Submission Types */}
                {/* TODO: Add submission options to the assignment and send back to canvas*/}
                {Array.isArray(assignment.submission_types) &&
                  assignment.submission_types.length > 0 && (
                    <div>
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: "var(--color-muted)" }}
                      >
                        Submission Types
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {assignment.submission_types.map(
                          (type: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: "rgba(156, 163, 175, 0.1)",
                                color: "var(--color-text)",
                              }}
                            >
                              {type.replace("_", " ")}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Lock Information */}
                {assignment.lock_info && (
                  <div
                    className="p-4 rounded-lg border border-yellow-200 dark:border-yellow-800"
                    style={{ background: "rgba(234, 179, 8, 0.1)" }}
                  >
                    <p
                      className="text-sm font-medium mb-1"
                      style={{ color: "var(--color-text)" }}
                    >
                      Locked
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {assignment.lock_info.unlock_at
                        ? `Unlocks at ${new Date(
                            assignment.lock_info.unlock_at
                          ).toLocaleString()}`
                        : "This assignment is locked"}
                    </p>
                  </div>
                )}

                {/* External Tool Info */}
                {assignment.external_tool_tag_attributes && (() => {
                  const url = assignment.external_tool_tag_attributes.url ?? '';
                  if (!url.startsWith('https://') && !url.startsWith('http://')) return null;
                  return (
                    <div>
                      <p
                        className="text-sm font-medium mb-2"
                        style={{ color: "var(--color-muted)" }}
                      >
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
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
