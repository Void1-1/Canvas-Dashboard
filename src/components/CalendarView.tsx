"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "./PageTransition";
import AssignmentModal from "./AssignmentModal";

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
  announcement: "📢",
  wiki_page: "📄",
  page: "📄",
  submission: "📤",
  default: "📌",
};

function getTypeIcon(type?: string) {
  if (!type) return typeIcons.default;
  const t = type.toLowerCase();
  if (t.includes("assign")) return typeIcons.assignment;
  if (t.includes("quiz")) return typeIcons.quiz;
  if (t.includes("announce")) return typeIcons.announcement;
  if (t.includes("wiki") || t === "page") return typeIcons.wiki_page;
  if (t.includes("submission")) return typeIcons.submission;
  if (t.includes("discuss")) return typeIcons.discussion;
  if (t.includes("event")) return typeIcons.event;
  return typeIcons.default;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const startMonth = weekStart.toLocaleDateString(undefined, { month: "short" });
  const endMonth = weekEnd.toLocaleDateString(undefined, { month: "short" });
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const year = weekEnd.getFullYear();
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
}

export default function CalendarView({ upcoming }: { upcoming: any[] }) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today));
  const [selected, setSelected] = useState<{
    date: Date;
    events: any[];
  } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  const handleAssignmentClick = async (item: any) => {
    const eventKey = String(item.id || item.plannable_id || Math.random());
    setLoadingEventId(eventKey);
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
            setLoadingEventId(null);
            setSelectedAssignment(assignment);
            setIsModalOpen(true);
            return;
          }
        }
      } catch {
        // fall through to create basic assignment object
      }
    }

    setLoadingEventId(null);
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
  // (e.g. once as "assignment" plannable_type and once as a "submission" variant,
  //  or assignments with different IDs but same name/date/context).
  const eventsByDay: Record<string, any[]> = {};
  const seenAssignmentIds = new Set<string>();
  const seenNameDateContext = new Set<string>();
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
    // Secondary dedup: same title + same day + same course context
    const title = event.title || event.plannable?.name || event.plannable?.title || '';
    const contextName = event.context_name || '';
    const nameKey = `${title}|${dayKey}|${contextName}`;
    if (title && seenNameDateContext.has(nameKey)) continue;
    if (title) seenNameDateContext.add(nameKey);
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
            const isLoading = loadingEventId === String(event.id || event.plannable_id);

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
                  isAssignment && !isLoading
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
                    className="font-semibold mb-1 break-words text-sm md:text-base flex items-center gap-1.5"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {isAssignment ? (
                      <>
                        <span className="hover:underline cursor-pointer">{event.title}</span>
                        {isLoading && (
                          <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        )}
                      </>
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
        className="max-w-5xl mx-auto pt-2 md:pt-6 px-2 md:px-0"
        style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-stretch">
          {/* Calendar grid */}
          <div className="flex-1 min-w-0 flex flex-col">
            <motion.div
              className="flex items-center justify-between mb-4 md:mb-6 gap-2 flex-wrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Navigation arrows + title */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <button
                  className="px-3 py-2 md:py-1 rounded hover:bg-accent/10 text-lg md:text-base touch-manipulation flex-shrink-0"
                  style={{ display: viewMode === 'list' ? 'none' : undefined, color: "var(--color-text)" }}
                  onClick={() => {
                    if (viewMode === 'month') {
                      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
                    } else if (viewMode === 'week') {
                      const prev = new Date(weekStart);
                      prev.setDate(weekStart.getDate() - 7);
                      setWeekStart(prev);
                    }
                  }}
                  aria-label={viewMode === 'month' ? 'Previous Month' : viewMode === 'week' ? 'Previous Week' : undefined}
                >
                  &larr;
                </button>
                <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                  <h1
                    className="text-lg md:text-2xl font-bold truncate"
                    style={{ color: "var(--color-text)" }}
                  >
                    {viewMode === 'month'
                      ? `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`
                      : viewMode === 'week'
                      ? formatWeekRange(weekStart)
                      : 'Upcoming Events'}
                  </h1>
                  {viewMode === 'month' && !isCurrentMonth && (
                    <button
                      className="ml-1 p-1.5 md:p-1 rounded-full hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation flex-shrink-0"
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
                  className="px-3 py-2 md:py-1 rounded hover:bg-accent/10 text-lg md:text-base touch-manipulation flex-shrink-0"
                  onClick={() => {
                    if (viewMode === 'month') {
                      setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
                    } else if (viewMode === 'week') {
                      const next = new Date(weekStart);
                      next.setDate(weekStart.getDate() + 7);
                      setWeekStart(next);
                    }
                  }}
                  aria-label={viewMode === 'month' ? 'Next Month' : viewMode === 'week' ? 'Next Week' : undefined}
                  style={{ display: viewMode === 'list' ? 'none' : undefined, color: "var(--color-text)" }}
                >
                  &rarr;
                </button>
              </div>

              {/* View mode toggles */}
              <div
                className="flex items-center rounded-lg overflow-hidden border flex-shrink-0"
                style={{ borderColor: "var(--color-border)" }}
              >
                {(['month', 'week', 'list'] as const).map((mode) => (
                  <button
                    key={mode}
                    className="px-3 py-1.5 text-xs md:text-sm font-medium capitalize transition-colors touch-manipulation"
                    style={
                      viewMode === mode
                        ? { background: "var(--color-accent)", color: "#fff" }
                        : { color: "var(--color-muted)", background: "transparent" }
                    }
                    onClick={() => setViewMode(mode)}
                    aria-label={`${mode} view`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>
            {viewMode === 'month' && (
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
            )}
          </div>
          {/* Month view sidebar */}
          {viewMode === 'month' && (
            <div className="w-full md:w-80 flex-shrink-0 mt-4 md:mt-0">
              <div
                className="glass rounded-xl shadow flex flex-col min-h-[300px] md:h-full"
                style={{ background: "var(--color-surface)" }}
              >
                {sidebarContent}
              </div>
            </div>
          )}
        </div>

        {/* Week View */}
        {viewMode === 'week' && (
          <div
            className="glass p-3 md:p-4 rounded-xl shadow mt-0"
            style={{ background: "var(--color-surface)" }}
          >
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const key = day.toISOString().slice(0, 10);
                const events = eventsByDay[key] || [];
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={i}
                    className="flex flex-col rounded-lg p-1.5 md:p-2 border min-h-[140px] md:min-h-[200px]"
                    style={{
                      background: isToday ? "var(--color-glass)" : "var(--color-bg)",
                      borderColor: isToday ? "var(--color-accent)" : "var(--color-border)",
                      boxShadow: isToday ? "0 0 0 2px var(--color-accent, #6366f1)22" : undefined,
                    }}
                  >
                    {/* Day header */}
                    <div className="text-center mb-1.5">
                      <div
                        className="text-[10px] md:text-xs font-semibold uppercase tracking-wide"
                        style={{ color: isToday ? "var(--color-accent)" : "var(--color-muted)" }}
                      >
                        <span className="hidden sm:inline">
                          {day.toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                        <span className="sm:hidden">
                          {day.toLocaleDateString(undefined, { weekday: "narrow" })}
                        </span>
                      </div>
                      <div
                        className={`text-sm md:text-base font-bold ${isToday ? "rounded-full w-6 h-6 md:w-7 md:h-7 flex items-center justify-center mx-auto" : ""}`}
                        style={{
                          background: isToday ? "var(--color-accent)" : undefined,
                          color: isToday ? "#fff" : "var(--color-text)",
                        }}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                    {/* Events */}
                    <div className="flex flex-col gap-1 overflow-y-auto flex-1">
                      {events.length === 0 ? (
                        <div
                          className="text-[10px] md:text-xs text-center mt-2"
                          style={{ color: "var(--color-border)" }}
                        >
                          —
                        </div>
                      ) : (
                        events.map((event: any) => {
                          const isAssignment = event.type === "assignment" && event.id;
                          const isEvent = event.type === "event" || event.plannable_type === "calendar_event";
                          const hasLink = event.html_url;
                          const isLoading = loadingEventId === String(event.id || event.plannable_id);
                          const eventDate = event.start_at || event.due_at || event.all_day_date;
                          const isAllDay = !!event.all_day_date || (!event.start_at && !event.due_at);
                          return (
                            <div
                              key={event.id}
                              className={`p-1 md:p-1.5 rounded border flex gap-1 items-start ${
                                isAssignment || (isEvent && hasLink)
                                  ? "cursor-pointer hover:opacity-80 transition-opacity active:opacity-70"
                                  : ""
                              }`}
                              style={{
                                borderColor: "var(--color-accent)",
                                background: "var(--color-glass)",
                              }}
                              onClick={
                                isAssignment && !isLoading
                                  ? () => handleAssignmentClick(event)
                                  : isEvent && hasLink
                                  ? () => window.open(event.html_url, '_blank', 'noopener,noreferrer')
                                  : undefined
                              }
                            >
                              <span className="text-xs flex-shrink-0 mt-0.5">
                                {getTypeIcon(event.type || event.plannable_type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="font-semibold text-[10px] md:text-xs break-words flex items-center gap-1"
                                  style={{ color: "var(--color-accent)" }}
                                >
                                  <span className={isAssignment || (isEvent && hasLink) ? "hover:underline" : ""}>
                                    {event.title}
                                  </span>
                                  {isLoading && (
                                    <svg className="w-2.5 h-2.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                  )}
                                </div>
                                {event.context_name && (
                                  <div className="text-[9px] md:text-[10px] truncate" style={{ color: "var(--color-muted)" }}>
                                    {event.context_name}
                                  </div>
                                )}
                                {eventDate && (
                                  <div className="text-[9px] md:text-[10px]" style={{ color: "var(--color-text)" }}>
                                    {isAllDay ? "All day" : new Date(eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (() => {
          // Build sorted, deduplicated list from upcoming
          const seenIds = new Set<string>();
          const seenNDC = new Set<string>();
          const listEvents: any[] = [];
          for (const event of upcoming) {
            const assignmentId =
              event.assignment_id ||
              event.plannable_id ||
              event.plannable?.id ||
              event.assignment?.id;
            if (assignmentId) {
              const k = String(assignmentId);
              if (seenIds.has(k)) continue;
              seenIds.add(k);
            }
            const dateStr = event.start_at || event.due_at || event.all_day_date;
            if (!dateStr) continue;
            const dayKey = new Date(dateStr).toISOString().slice(0, 10);
            const title = event.title || event.plannable?.name || event.plannable?.title || '';
            const contextName = event.context_name || '';
            const nameKey = `${title}|${dayKey}|${contextName}`;
            if (title && seenNDC.has(nameKey)) continue;
            if (title) seenNDC.add(nameKey);
            listEvents.push(event);
          }
          listEvents.sort((a, b) => {
            const da = new Date(a.start_at || a.due_at || a.all_day_date).getTime();
            const db = new Date(b.start_at || b.due_at || b.all_day_date).getTime();
            return da - db;
          });

          if (listEvents.length === 0) {
            return (
              <div
                className="glass rounded-xl shadow p-8 text-center"
                style={{ background: "var(--color-surface)" }}
              >
                <p style={{ color: "var(--color-muted)" }}>No upcoming events.</p>
              </div>
            );
          }

          // Group by date
          const groups: { dateKey: string; date: Date; events: any[] }[] = [];
          for (const event of listEvents) {
            const dateStr = event.start_at || event.due_at || event.all_day_date;
            const date = new Date(dateStr);
            const dayKey = date.toISOString().slice(0, 10);
            const last = groups[groups.length - 1];
            if (last && last.dateKey === dayKey) {
              last.events.push(event);
            } else {
              groups.push({ dateKey: dayKey, date, events: [event] });
            }
          }

          return (
            <div
              className="glass rounded-xl shadow p-3 md:p-4 space-y-4"
              style={{ background: "var(--color-surface)" }}
            >
              {groups.map(({ dateKey, date, events }) => (
                <div key={dateKey}>
                  <div
                    className="text-xs md:text-sm font-bold uppercase tracking-wide mb-2 pb-1 border-b"
                    style={{ color: "var(--color-accent)", borderColor: "var(--color-border)" }}
                  >
                    {date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                  <div className="space-y-2">
                    {events.map((event: any) => {
                      const isAssignment = event.type === "assignment" && event.id;
                      const isEvent = event.type === "event" || event.plannable_type === "calendar_event";
                      const hasLink = event.html_url;
                      const isLoading = loadingEventId === String(event.id || event.plannable_id);
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
                            isAssignment && !isLoading
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
                              className="font-semibold mb-1 break-words text-sm md:text-base flex items-center gap-1.5"
                              style={{ color: "var(--color-accent)" }}
                            >
                              <span className={isAssignment || (isEvent && hasLink) ? "hover:underline cursor-pointer" : ""}>
                                {event.title}
                              </span>
                              {isLoading && (
                                <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
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
                              <div className="text-xs" style={{ color: "var(--color-text)" }}>
                                {isAllDay ? "All day" : new Date(eventDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
}
