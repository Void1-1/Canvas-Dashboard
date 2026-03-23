"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "./PageTransition";
import AssignmentModal from "./AssignmentModal";
import { is } from "date-fns/locale";

function getMonthMatrix(year: number, month: number) {
  // Returns a 2D array of weeks, each week is an array of Date objects
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const matrix = [];
  let week = [];
  let day = new Date(firstDay);
  day.setDate(day.getDate() - day.getDay()); // Start from Sunday
  // Only show days from prev/next month if needed to fill first/last week
  for (let i = 0; i < 6; i++) {
    // max 6 weeks
    week = [];
    for (let j = 0; j < 7; j++) {
      week.push(new Date(day));
      day.setDate(day.getDate() + 1);
    }
    // Only push week if it contains at least one day in the current month
    if (week.some((d) => d.getMonth() === month)) {
      matrix.push(week);
    }
  }
  return matrix;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const typeIcons: Record<string, string> = {
  assignment: "📝",
  quiz: "📋",
  event: "📅",
  discussion: "💬",
  default: "📌",
};

function getTypeIcon(type?: string) {
  if (!type) return typeIcons.default;
  if (type.toLowerCase().includes("assign")) return typeIcons.assignment;
  if (type.toLowerCase().includes("quiz")) return typeIcons.quiz;
  if (type.toLowerCase().includes("event")) return typeIcons.event;
  if (type.toLowerCase().includes("discuss")) return typeIcons.discussion;
  return typeIcons.default;
}

export default function CalendarView({ upcoming }: { upcoming: any[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState<{
    date: Date;
    events: any[];
  } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssignmentClick = async (item: any) => {
    // Extract IDs from various possible locations in the data structure
    const assignmentId =
      item.assignment_id ||
      item.assignment?.id ||
      item.todo_item?.assignment_id ||
      item.plannable?.id ||
      item.plannable_id ||
      (item.plannable_type === "assignment" ? (item.plannable?.id || item.plannable_id) : null);

    const courseId =
      item.course_id ||
      item.context?.id ||
      item.todo_item?.course_id ||
      item.plannable?.course_id ||
      (item.context_type === "Course" ? (item.context?.id || item.context_id) : null);

    // If we have both IDs, try to fetch full assignment details
    if (assignmentId && courseId) {
      try {
        const response = await fetch(
          `/api/assignments/${assignmentId}?course_id=${courseId}`
        );

        if (response.ok) {
          const assignment = await response.json();

          // Validate we got the expected data structure
          if (assignment.id && assignment.name) {
            setSelectedAssignment(assignment);
            setIsModalOpen(true);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch assignment details:", error);
        // Fall through to create basic assignment object
      }
    }

    // Fallback: create basic assignment object from available data
    // This allows the modal to open even without full API data
    const submissionTypes = item.submission_types || item.plannable?.submission_types;
    const basicAssignment = {
      id: assignmentId || item.id || `temp-${Date.now()}`,
      name: item.title || item.name || item.plannable?.name || item.plannable?.title || 'Assignment',
      due_at: item.due_at || item.start_at || item.all_day_date || item.plannable?.due_at,
      description: item.description || item.plannable?.description || '',
      course: item.context_name ? { name: item.context_name } : (item.course || null),
      html_url: item.html_url || item.plannable?.html_url,
      points_possible: item.points_possible || item.plannable?.points_possible,
      submission_types: Array.isArray(submissionTypes) ? submissionTypes : [],
    };

    setSelectedAssignment(basicAssignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  };

  // Map events to days, deduplicating assignments Canvas returns multiple times
  // (e.g. once as "assignment" plannable_type and once as a "submission" variant).
  const eventsByDay: Record<string, any[]> = {};
  const seenAssignmentIds = new Set<string>();
  for (const event of upcoming) {
    const assignmentId =
      event.assignment_id ||
      event.plannable_id ||
      event.plannable?.id ||
      event.assignment?.id;
    if (assignmentId) {
      const key = String(assignmentId);
      if (seenAssignmentIds.has(key)) continue;
      seenAssignmentIds.add(key);
    }
    // Handle different date fields for events vs assignments
    const dateStr = event.start_at || event.due_at || event.all_day_date;
    if (!dateStr) continue;
    const date = new Date(dateStr);
    const dayKey = date.toISOString().slice(0, 10);
    if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
    eventsByDay[dayKey].push(event);
  }

  const monthMatrix = getMonthMatrix(
    viewDate.getFullYear(),
    viewDate.getMonth()
  );

  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();

  // Sidebar content
  const sidebarContent = selected ? (
    <div className="p-3 md:p-4">
      <h2
        className="text-base md:text-lg font-bold mb-2 md:mb-3"
        style={{ color: "var(--color-text)" }}
      >
        <span className="hidden md:inline">
          {selected.date.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="md:hidden">
          {selected.date.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </h2>
      <div className="space-y-2 md:space-y-3 max-h-[60vh] md:max-h-none overflow-y-auto">
        {selected.events.length === 0 ? (
          <div
            className="text-center italic py-6 md:py-8 text-sm md:text-base"
            style={{ color: "var(--color-muted)" }}
          >
            No events for this day.
          </div>
        ) : (
          selected.events.map((event: any) => {
            const isAssignment = event.type === "assignment" && event.id;
            const isEvent = event.type === "event" || event.plannable_type === "calendar_event";
            
            // Better ID extraction for assignments
            const assignmentId = 
              event.assignment_id ||
              event.assignment?.id ||
              event.todo_item?.assignment_id ||
              event.plannable?.id ||
              event.plannable_id ||
              (event.plannable_type === "assignment" ? (event.plannable?.id || event.plannable_id) : null);
            
            const courseId = 
              event.course_id ||
              event.context?.id ||
              event.todo_item?.course_id ||
              event.plannable?.course_id ||
              (event.context_type === "Course" ? (event.context?.id || event.context_id) : null);
            
            const hasRequiredIds = !!(assignmentId && courseId);
            const canInteract = isAssignment && hasRequiredIds;
            const hasLink = event.html_url;

            // Get the appropriate date/time for display
            const eventDate = event.start_at || event.due_at || event.all_day_date;
            const isAllDay = !!event.all_day_date || (!event.start_at && !event.due_at);

            return (
              <div
                key={event.id}
                className={`p-2.5 md:p-3 rounded-lg border flex gap-2 md:gap-3 items-start ${
                  isAssignment || (isEvent && hasLink)
                    ? "cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
                    : ""
                }`}
                style={{
                  borderColor: "var(--color-accent)",
                  background: "var(--color-glass)",
                }}
                onClick={
                  isAssignment
                    ? () => handleAssignmentClick(event)
                    : isEvent && hasLink
                    ? () => window.open(event.html_url, '_blank', 'noopener,noreferrer')
                    : undefined
                }
              >
                <span className="text-lg md:text-xl mt-0.5 flex-shrink-0">
                  {getTypeIcon(event.type || event.plannable_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div
                    className="font-semibold mb-1 break-words text-sm md:text-base"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {isAssignment ? (
                      <span className="hover:underline cursor-pointer">{event.title}</span>
                    ) : hasLink ? (
                      <a
                        href={event.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline break-words cursor-pointer"
                        style={{ color: "var(--color-accent)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {event.title}
                      </a>
                    ) : (
                      event.title
                    )}
                  </div>
                  {event.context_name && (
                    <div
                      className="text-xs mb-1 truncate"
                      style={{ color: "var(--color-muted)" }}
                      title={event.context_name}
                    >
                      {event.context_name}
                    </div>
                  )}
                  {eventDate && (
                    <div
                      className="text-xs mb-1"
                      style={{ color: "var(--color-text)" }}
                    >
                      {isAllDay
                        ? "All day"
                        : new Date(eventDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </div>
                  )}
                  {event.type && (
                    <div
                      className="text-xs capitalize"
                      style={{ color: "var(--color-muted)" }}
                    >
                      {isEvent ? "📅 Calendar Event" : `Type: ${event.type}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full p-4 md:p-6 text-center min-h-[200px] md:min-h-[300px]">
      <svg
        className="w-6 h-6 md:w-8 md:h-8 mb-2"
        style={{ color: "var(--color-muted)" }}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <rect x="3" y="4" width="18" height="18" rx="4" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <p className="text-xs md:text-sm" style={{ color: "var(--color-muted)" }}>
        Select a day to see details
      </p>
    </div>
  );

  const todayClass = "border-accent ring-2 ring-accent/30";
  const selectedClass = "bg-accent text-white border-accent ring-2 ring-accent";

  return (
    <PageTransition>
      <div
        className="max-w-5xl mx-auto pt-4 md:pt-6 mt-12 md:mt-19 px-2 md:px-0"
        style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-stretch">
          {/* Calendar grid */}
          <div className="flex-1 min-w-0 flex flex-col">
            <motion.div
              className="flex items-center justify-between mb-4 md:mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <button
                className="px-3 py-2 md:py-1 rounded hover:bg-accent/10 text-lg md:text-base touch-manipulation"
                style={{ color: "var(--color-text)" }}
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1)
                  )
                }
                aria-label="Previous Month"
              >
                &larr;
              </button>
              <div className="flex items-center gap-2">
                <h1
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h1>
                {!isCurrentMonth && (
                  <button
                    className="ml-1 p-1.5 md:p-1 rounded-full hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation"
                    style={{ color: "var(--color-accent)" }}
                    onClick={() => {
                      setViewDate(
                        new Date(today.getFullYear(), today.getMonth(), 1)
                      );
                      setSelected({
                        date: today,
                        events:
                          eventsByDay[today.toISOString().slice(0, 10)] || [],
                      });
                    }}
                    aria-label="Go to today"
                    title="Go to today"
                    tabIndex={0}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="4" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                      <circle cx="12" cy="14" r="2.5" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                className="px-3 py-2 md:py-1 rounded hover:bg-accent/10 text-lg md:text-base touch-manipulation"
                style={{ color: "var(--color-text)" }}
                onClick={() =>
                  setViewDate(
                    new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                  )
                }
                aria-label="Next Month"
              >
                &rarr;
              </button>
            </motion.div>
            <div
              className="glass p-3 md:p-4 lg:p-6 rounded-xl shadow h-full"
              style={{ background: "var(--color-surface)" }}
            >
              <div
                className="grid grid-cols-7 gap-0.5 md:gap-1 mb-2 text-center font-semibold text-xs md:text-sm"
                style={{ color: "var(--color-text)" }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="hidden sm:block">{d}</div>
                ))}
                {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                  <div key={`${d}-${idx}`} className="sm:hidden">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                {monthMatrix.map((week, i) => (
                  <React.Fragment key={i}>
                    {week.map((date, j) => {
                      const key = date.toISOString().slice(0, 10);
                      const isCurrentMonth =
                        date.getMonth() === viewDate.getMonth();
                      const isToday = isSameDay(date, today);
                      const events = eventsByDay[key] || [];
                      const isSelected =
                        selected && isSameDay(date, selected.date);
                      return (
                        <button
                          key={j}
                          className={`relative h-16 md:h-20 w-full rounded-md md:rounded-lg flex flex-col items-center justify-start p-0.5 md:p-1 border transition-all touch-manipulation
                            ${isCurrentMonth ? "" : "cursor-pointer"}
                            ${isToday && !isSelected ? todayClass : ""}
                            ${isSelected ? selectedClass : ""}
                            ${events.length ? "shadow-accent/10 shadow-md" : ""}
                          `}
                          style={{
                            background: isSelected
                              ? "var(--color-accent)"
                              : isCurrentMonth
                              ? "var(--color-surface)"
                              : "var(--color-bg)",
                            color: isSelected
                              ? "var(--color-bg)"
                              : isCurrentMonth
                              ? "var(--color-text)"
                              : "var(--color-muted)",
                            borderColor: isSelected
                              ? "var(--color-accent)"
                              : "var(--color-border)",
                          }}
                          onClick={() => {
                            if (!isCurrentMonth) {
                              // Switch to the month of the clicked day and select it
                              setViewDate(
                                new Date(date.getFullYear(), date.getMonth(), 1)
                              );
                              setSelected({ date, events });
                            } else {
                              setSelected({ date, events });
                            }
                          }}
                          tabIndex={isCurrentMonth ? 0 : -1}
                        >
                          <span
                            className="font-semibold text-xs md:text-sm mb-0.5 md:mb-1"
                            style={{
                              color: isSelected
                                ? "var(--color-bg)"
                                : isCurrentMonth
                                ? "var(--color-text)"
                                : "var(--color-muted)",
                            }}
                          >
                            {date.getDate()}
                          </span>
                          <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                            {events.slice(0, 1).map((event, idx) => (
                              <span
                                key={event.id}
                                className="truncate text-[10px] md:text-xs px-0.5 md:px-1 py-0 md:py-0.5 rounded font-medium"
                                style={{
                                  background: isSelected
                                    ? "rgba(255,255,255,0.2)"
                                    : isCurrentMonth
                                    ? "var(--color-glass)"
                                    : "var(--color-border)",
                                  color: isSelected
                                    ? "var(--color-bg)"
                                    : isCurrentMonth
                                    ? "var(--color-accent)"
                                    : "var(--color-muted)",
                                }}
                                title={event.title}
                              >
                                {event.title}
                              </span>
                            ))}
                            {events.length > 1 && (
                              <span
                                className="text-[10px] md:text-xs truncate"
                                style={{
                                  color: isSelected
                                    ? "var(--color-bg)"
                                    : isCurrentMonth
                                    ? "var(--color-muted)"
                                    : "var(--color-border)",
                                }}
                              >
                                +{events.length - 1}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              {Object.keys(eventsByDay).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8">
                  <svg
                    className="w-8 h-8 mb-2"
                    style={{ color: "var(--color-muted)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="4" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-muted)" }}
                  >
                    No events scheduled this month
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Sidebar */}
          <div className="w-full md:w-80 flex-shrink-0 mt-4 md:mt-0">
            <div
              className="glass rounded-xl shadow flex flex-col min-h-[300px] md:h-full"
              style={{ background: "var(--color-surface)" }}
            >
              {sidebarContent}
            </div>
          </div>
        </div>
      </div>

      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
}
