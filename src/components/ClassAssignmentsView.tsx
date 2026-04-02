"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import PageTransition from "./PageTransition";
import AssignmentModal from "./AssignmentModal";
import SubmissionStatusBadge from "./SubmissionStatusBadge";
import GlassEmptyState from "./GlassEmptyState";
import { stripHtmlTags } from "@/lib/sanitize";

export default function ClassAssignmentsView({
  assignments,
  courseId,
}: {
  assignments: any[];
  courseId: number;
}) {
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);

  const handleAssignmentClick = async (assignment: any) => {
    const cid = courseId ?? assignment.course_id;
    if (assignment.id && cid) {
      try {
        const res = await fetch(`/api/assignments/${assignment.id}?course_id=${cid}`);
        if (res.ok) {
          setSelectedAssignment(await res.json());
          setIsModalOpen(true);
          return;
        }
      } catch {
        // fall through to raw data
      }
    }
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  };

  // Show all assignments, sorted oldest to newest
  const sortedAssignments = [...assignments].sort((a: any, b: any) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1; // No due date goes to end
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  // Find the first assignment due today or in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const firstUpcomingIndex = sortedAssignments.findIndex((assignment: any) => {
    if (!assignment.due_at) return false;
    const dueDate = new Date(assignment.due_at);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today;
  });

  // Auto-scroll to today's assignments on mount
  useEffect(() => {
    if (todayRef.current && firstUpcomingIndex !== -1) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [firstUpcomingIndex]);

  return (
    <>
      <PageTransition>
        <motion.div
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-xl md:text-2xl font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Assignments
          </motion.h1>
          {sortedAssignments.length === 0 ? (
            <GlassEmptyState message="No assignments found for this course." />
          ) : (
            <div className="space-y-4 px-1">
              {sortedAssignments.map((assignment: any, index: number) => {
                const isFirstUpcoming = index === firstUpcomingIndex;
                
                return (
                  <motion.div
                    key={assignment.id}
                    ref={isFirstUpcoming ? todayRef : null}
                    className="glass p-4 md:p-6 rounded-xl cursor-pointer hover:opacity-80 transition-opacity relative z-0"
                    style={{ background: "var(--color-surface)" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    onClick={() => handleAssignmentClick(assignment)}
                    whileHover={{ scale: 1.02, zIndex: 10 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <h3
                          className="font-semibold text-lg mb-1"
                          style={{ color: "var(--color-text)" }}
                        >
                          {assignment.name}
                        </h3>
                        {assignment.description && (() => {
                          const preview = stripHtmlTags(assignment.description).trim();
                          return (
                            <p
                              className="text-sm line-clamp-2 mt-1"
                              style={{ color: "var(--color-muted)" }}
                            >
                              {preview.substring(0, 100)}
                              {preview.length > 100 ? "..." : ""}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        {assignment.due_at && (
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--color-text)" }}
                          >
                            Due:{" "}
                            {new Date(assignment.due_at).toLocaleDateString()}
                          </span>
                        )}
                        {assignment.points_possible !== null &&
                          assignment.points_possible !== undefined && (
                            <span
                              className="text-xs px-2 py-1 rounded"
                              style={{
                                background: "rgba(156, 163, 175, 0.1)",
                                color: "var(--color-muted)",
                              }}
                            >
                              {assignment.points_possible}{" "}
                              {assignment.points_possible === 1
                                ? "point"
                                : "points"}
                            </span>
                          )}
                        <SubmissionStatusBadge state={assignment.submission?.workflow_state} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </PageTransition>

      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}