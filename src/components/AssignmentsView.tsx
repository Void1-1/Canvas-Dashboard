"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import AssignmentModal from "./AssignmentModal";
import { sanitizeCanvasHtml } from "@/lib/sanitize";

const STORAGE_KEY = "done_assignment_ids";

function loadDoneIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDoneIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

export default function AssignmentsView({
  assignmentsData,
}: {
  assignmentsData: { course: any; assignments: any[] }[];
}) {
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    setDoneIds(loadDoneIds());
  }, []);

  const toggleDone = (e: React.MouseEvent, assignmentId: string) => {
    e.stopPropagation();
    setDoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(assignmentId)) {
        next.delete(assignmentId);
      } else {
        next.add(assignmentId);
      }
      saveDoneIds(next);
      return next;
    });
  };

  const handleAssignmentClick = async (assignment: any, course: any) => {
    if (assignment.id && course.id) {
      try {
        const response = await fetch(`/api/assignments/${assignment.id}?course_id=${course.id}`);
        if (response.ok) {
          const assignmentData = await response.json();
          setSelectedAssignment(assignmentData);
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
      }
    }

    const basicAssignment = {
      id: assignment.id,
      name: assignment.name,
      due_at: assignment.due_at,
      description: assignment.description || '',
      course: { name: course.name },
      html_url: assignment.html_url,
      points_possible: assignment.points_possible,
      submission_types: Array.isArray(assignment.submission_types) ? assignment.submission_types : [],
    };
    setSelectedAssignment(basicAssignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  };

  const totalDone = [...doneIds].length;

  // Filter data based on showDone
  const visibleData = assignmentsData.map(({ course, assignments }) => ({
    course,
    assignments: assignments.filter((a) => showDone || !doneIds.has(String(a.id))),
  })).filter(({ assignments }) => assignments.length > 0 || showDone);

  return (
    <PageTransition>
      <motion.div
        className="space-y-4 md:space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Assignments
          </h1>
          {totalDone > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs px-3 py-1.5 rounded-full border transition-colors"
              style={{
                color: showDone ? 'var(--color-accent)' : 'var(--color-muted)',
                borderColor: showDone ? 'var(--color-accent)' : 'var(--color-border)',
              }}
              onClick={() => setShowDone((v) => !v)}
            >
              {showDone ? 'Hide' : 'Show'} {totalDone} done
            </motion.button>
          )}
        </div>

        {assignmentsData.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-lg font-medium">
              No courses or assignments found.
            </span>
            <span className="text-sm mt-2">
              You are not enrolled in any courses, or there are no assignments
              to display.
            </span>
          </motion.div>
        ) : visibleData.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
          >
            <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>All caught up!</span>
            <span className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              You&apos;ve marked everything as done.{' '}
              <button className="underline" style={{ color: 'var(--color-accent)' }} onClick={() => setShowDone(true)}>
                View completed
              </button>
            </span>
          </motion.div>
        ) : (
          visibleData.map(({ course, assignments }, index) => (
            <motion.section
              key={course.id}
              className="glass p-4 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <h2 className="card-title">{course.name}</h2>
              {assignments.length === 0 ? (
                <p className="italic" style={{ color: "var(--color-muted)" }}>
                  No assignments found.
                </p>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence>
                    {assignments.map((assignment, assignmentIndex) => {
                      const isDone = doneIds.has(String(assignment.id));
                      return (
                        <motion.li
                          key={assignment.id}
                          className="border-b pb-3 last:border-b-0"
                          style={{ borderColor: "var(--color-border)" }}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: isDone ? 0.5 : 1, x: 0 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0, paddingBottom: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.1 + assignmentIndex * 0.05,
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Done checkbox */}
                            <button
                              className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                              style={{
                                borderColor: isDone ? 'var(--color-accent)' : 'var(--color-border)',
                                background: isDone ? 'var(--color-accent)' : 'transparent',
                              }}
                              onClick={(e) => toggleDone(e, String(assignment.id))}
                              aria-label={isDone ? 'Mark as not done' : 'Mark as done'}
                            >
                              {isDone && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>

                            {/* Assignment details */}
                            <div
                              className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleAssignmentClick(assignment, course)}
                            >
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div className="flex-1">
                                  <h3
                                    className={`font-medium transition-all ${isDone ? 'line-through' : ''}`}
                                    style={{ color: isDone ? 'var(--color-muted)' : "var(--color-text)" }}
                                  >
                                    {assignment.name}
                                  </h3>
                                  {assignment.description && !isDone && (
                                    <div
                                      className="text-sm mt-1 line-clamp-2 assignment-description"
                                      style={{ color: "var(--color-muted)" }}
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeCanvasHtml(assignment.description),
                                      }}
                                    />
                                  )}
                                </div>
                                {assignment.due_at && (
                                  <span
                                    className="text-sm sm:whitespace-nowrap"
                                    style={{ color: "var(--color-muted)" }}
                                  >
                                    {new Date(assignment.due_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </motion.section>
          ))
        )}
      </motion.div>

      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
}
