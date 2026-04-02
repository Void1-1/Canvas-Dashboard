'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PageTransition from './PageTransition';
import { sanitizeCanvasHtml } from '@/lib/sanitize';
import { parseCanvasMessage, type ParsedMessage } from '@/lib/parseCanvasMessage';
import BaseModal from './BaseModal';

// ── Type metadata ──────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string }> = {
  Announcement:      { label: 'Announcement', color: '#e67e22' },
  DiscussionTopic:   { label: 'Discussion',   color: '#2980b9' },
  Submission:        { label: 'Submission',   color: 'var(--color-accent)' },
  Conference:        { label: 'Conference',   color: '#8e44ad' },
  WebConference:     { label: 'Conference',   color: '#8e44ad' },
  Message:           { label: 'Message',      color: '#27ae60' },
  AssignmentRequest: { label: 'Peer Review',  color: '#c0392b' },
  Collaboration:     { label: 'Collaboration',color: '#16a085' },
};

// Deduplicated list for the legend (exclude WebConference alias)
const LEGEND_TYPES = Object.entries(TYPE_META)
  .filter(([key]) => key !== 'WebConference')
  .map(([key, meta]) => ({ key, ...meta }));

function getMeta(type: string) {
  return TYPE_META[type] ?? { label: type, color: 'var(--color-muted)' };
}

function canonical(type: string) {
  return type === 'WebConference' ? 'Conference' : type;
}


// ── Relative time (fixes Hydration error) ───────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Renders relative time only on client to avoid SSR/hydration mismatch. */
function TimeDisplay({ dateStr }: { dateStr: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    setLabel(relativeTime(dateStr));
    const id = setInterval(() => setLabel(relativeTime(dateStr)), 60_000);
    return () => clearInterval(id);
  }, [dateStr]);
  return (
    <time dateTime={new Date(dateStr).toISOString()}
      className="text-xs whitespace-nowrap flex-shrink-0 mt-0.5"
      style={{ color: 'var(--color-muted)' }}>
      {label}
    </time>
  );
}

// ── Date group helpers (only used when course filter active) ───────────────────

function dateGroup(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86_400_000);
  if (d >= todayStart) return 'Today';
  if (d >= yesterdayStart) return 'Yesterday';
  if (d >= weekStart) return 'This Week';
  return 'Earlier';
}

const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Earlier'];

// ── Notification detail modal ──────────────────────────────────────────────────

function NotificationDetailModal({
  activity,
  courseName,
  courseCode,
  parsed,
  isOpen,
  onClose,
}: {
  activity: any | null;
  courseName: string;
  courseCode: string;
  parsed: ParsedMessage | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!activity) return null;
  const type = canonical(activity.type);
  const { label, color } = getMeta(activity.type);
  const displayLabel = parsed?.action ?? label;

  function handleOpenInApp() {
    if (type === 'Submission') {
      const assignmentId = activity.assignment?.id;
      const courseId = activity.course_id;
      if (assignmentId && courseId) {
        router.push(`/assignments?open=${assignmentId}&course_id=${courseId}&from=notifications`);
        onClose();
      }
      return;
    }

    if (type === 'Message' && parsed?.assignmentId && parsed?.courseId) {
      router.push(`/assignments?open=${parsed.assignmentId}&course_id=${parsed.courseId}&from=notifications`);
      onClose();
      return;
    }

    if (type === 'Announcement') {
      // activity.id is the stream item ID, NOT the announcement's discussion topic ID.
      // Extract the real ID from html_url: .../discussion_topics/456 or .../announcements/456
      const urlMatch = activity.html_url?.match(/\/(?:discussion_topics|announcements)\/(\d+)/);
      const announcementId = urlMatch ? urlMatch[1] : activity.id;
      router.push(`/announcements?open=${announcementId}&from=notifications`);
      onClose();
      return;
    }

    if (type === 'DiscussionTopic') {
      if (activity.course_id) router.push(`/classes/${activity.course_id}?from=notifications`);
      onClose();
      return;
    }
  }

  const hasOpenInApp =
    type === 'Submission' ||
    type === 'Message' ||
    type === 'Announcement' ||
    type === 'DiscussionTopic';

  // Types where in-app support is incomplete — show "View in Canvas" as an additional fallback.
  const hasCanvasFallback =
    type === 'DiscussionTopic' ||
    type === 'Conference' ||
    (type === 'Message' && !parsed?.assignmentId);   // message without a parseable assignment ID

  const openLabel =
    type === 'Submission' || (type === 'Message' && !!parsed?.assignmentId)
      ? 'Open Assignment'
      : type === 'Announcement'
      ? 'Open Announcement'
      : 'Open in App';

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="content" maxWidth="2xl">
      {/* Header */}
      <div className="sticky top-0 p-4 md:p-6 border-b flex items-start justify-between gap-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ background: `${color}22`, color }}>
              {displayLabel}
            </span>
            {courseName && (
              <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                {courseName}{courseCode ? ` (${courseCode})` : ''}
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            {parsed?.title ?? activity.title ?? '(no title)'}
          </h2>
          {(activity.updated_at || activity.created_at) && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
              {new Date(activity.updated_at || activity.created_at).toLocaleDateString(undefined, {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <button onClick={onClose} aria-label="Close"
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ background: 'transparent' }}>
          <X className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 md:p-6 space-y-4">
        {parsed ? (
          /* Structured view for parsed Canvas messages */
          <div className="space-y-3">
            {(parsed.dueText || parsed.changedToText) && (
              <div className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: 'var(--color-glass)', border: '1px solid var(--color-border)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                    style={{ color: 'var(--color-muted)' }}>
                    {parsed.changedToText ? 'New due date' : 'Due'}
                  </p>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {parsed.changedToText ?? parsed.dueText}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {hasOpenInApp && (
                <button onClick={handleOpenInApp}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-accent)' }}>
                  {openLabel}
                </button>
              )}

              {/* View in Canvas shown only for types with incomplete in-app support (see hasCanvasFallback) */}
              {hasCanvasFallback && activity.html_url && (
                <a href={activity.html_url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'var(--color-glass)', color: 'var(--color-muted)',
                    border: '1px solid var(--color-border)' }}>
                  View in Canvas ↗
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Rich HTML content for announcements / discussions */
          <>
            {activity.message ? (
              <div className="prose prose-sm max-w-none announcement-description"
                style={{ color: 'var(--color-text)' }}
                dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(activity.message) }}
              />
            ) : (
              <p className="italic text-sm" style={{ color: 'var(--color-muted)' }}>
                No content available.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {hasOpenInApp && (
                <button onClick={handleOpenInApp}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-accent)' }}>
                  Open in App
                </button>
              )}
              {/* View in Canvas shown only for types with incomplete in-app support (see hasCanvasFallback) */}
              {hasCanvasFallback && activity.html_url && (
                <a href={activity.html_url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: 'var(--color-glass)', color: 'var(--color-muted)',
                    border: '1px solid var(--color-border)' }}>
                  View in Canvas ↗
                </a>
              )}
            </div>
          </>
        )}
        {/* BackToNotifications breadcrumb is rendered on the destination page via ?from=notifications param. */}
      </div>
    </BaseModal>
  );
}

// ── Type legend (dismissable) ──────────────────────────────────────────────────

function TypeLegend({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 rounded-xl text-xs"
      style={{ background: 'var(--color-glass)', border: '1px solid var(--color-border)' }}
    >
      <span className="font-semibold mr-1" style={{ color: 'var(--color-muted)' }}>
        Type key:
      </span>
      {LEGEND_TYPES.map(({ key, label, color }) => (
        <span key={key} className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: color }} />
          <span style={{ color: 'var(--color-muted)' }}>{label}</span>
        </span>
      ))}
      <button onClick={onDismiss} aria-label="Dismiss legend"
        className="ml-auto flex-shrink-0 rounded hover:opacity-60 transition-opacity"
        style={{ color: 'var(--color-muted)' }}>
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type DateFilter = 'all' | 'today' | 'week' | 'month';

export default function NotificationsView({
  activities,
  courses,
}: {
  activities: any[];
  courses: any[];
}) {
  // Hydration guard — only render time-dependent list on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Filter state
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Legend (dismissed state from localStorage, read after mount)
  const [legendDismissed, setLegendDismissed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('notif-legend-dismissed') === 'true') setLegendDismissed(true);
  }, []);
  function dismissLegend() {
    setLegendDismissed(true);
    localStorage.setItem('notif-legend-dismissed', 'true');
  }

  // Modal state
  const [modalActivity, setModalActivity] = useState<any | null>(null);

  // Course lookup map
  const courseMap = useMemo(() => {
    const map: Record<number, { name: string; code: string }> = {};
    for (const c of courses) map[c.id] = { name: c.name || '', code: c.course_code || '' };
    return map;
  }, [courses]);

  // Available filter options derived from data
  const availableTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const a of activities) { const c = canonical(a.type); if (c) seen.add(c); }
    return Array.from(seen).sort();
  }, [activities]);

  const availableCourses = useMemo(() => {
    const seen = new Map<number, string>();
    for (const a of activities) {
      if (a.course_id && courseMap[a.course_id]) seen.set(a.course_id, courseMap[a.course_id].name);
    }
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [activities, courseMap]);

  const unreadCount = useMemo(
    () => activities.filter((a) => a.read_state === 'unread').length,
    [activities]
  );

  const activeFilterCount = [typeFilter !== 'all', dateFilter !== 'all', courseFilter !== 'all'].filter(Boolean).length;

  // Apply filters
  const filtered = useMemo(() => {
    const now = Date.now();
    const DAY = 86_400_000;
    return activities.filter((a) => {
      if (readFilter === 'unread' && a.read_state !== 'unread') return false;
      if (typeFilter !== 'all' && canonical(a.type) !== typeFilter) return false;
      if (courseFilter !== 'all' && String(a.course_id) !== courseFilter) return false;
      if (dateFilter !== 'all') {
        const age = now - new Date(a.updated_at || a.created_at).getTime();
        if (dateFilter === 'today' && age > DAY) return false;
        if (dateFilter === 'week' && age > 7 * DAY) return false;
        if (dateFilter === 'month' && age > 30 * DAY) return false;
      }
      return true;
    });
  }, [activities, readFilter, typeFilter, courseFilter, dateFilter]);

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      if (a.read_state !== b.read_state) return a.read_state === 'unread' ? -1 : 1;
      return new Date(b.updated_at || b.created_at).getTime() -
             new Date(a.updated_at || a.created_at).getTime();
    }),
    [filtered]
  );

  // Grouping: by course (default) or by date (when a single course is filtered)
  const groupByCourse = courseFilter === 'all';

  const grouped = useMemo(() => {
    const g: Record<string, typeof sorted> = {};
    if (groupByCourse) {
      for (const a of sorted) {
        const courseInfo = a.course_id ? courseMap[a.course_id] : null;
        const key = courseInfo?.name ?? 'Other';
        if (!g[key]) g[key] = [];
        g[key].push(a);
      }
    } else {
      for (const a of sorted) {
        const key = dateGroup(a.updated_at || a.created_at);
        if (!g[key]) g[key] = [];
        g[key].push(a);
      }
    }
    return g;
  }, [sorted, groupByCourse, courseMap]);

  const groupOrder = useMemo(() => {
    if (!groupByCourse) return DATE_GROUP_ORDER.filter((g) => grouped[g]?.length);
    // Sort course groups by most recent notification; "Other" always last
    return Object.keys(grouped).sort((a, b) => {
      if (a === 'Other') return 1;
      if (b === 'Other') return -1;
      const aTime = new Date(grouped[a][0]?.updated_at || grouped[a][0]?.created_at || 0).getTime();
      const bTime = new Date(grouped[b][0]?.updated_at || grouped[b][0]?.created_at || 0).getTime();
      return bTime - aTime;
    });
  }, [grouped, groupByCourse]);

  // Click handler — all types open detail modal
  function handleItemClick(activity: any) {
    setModalActivity(activity);
  }

  // Modal derived data
  const modalCourseInfo = modalActivity?.course_id ? courseMap[modalActivity.course_id] : null;
  const modalParsed = modalActivity?.type === 'Message' && modalActivity.message
    ? parseCanvasMessage(modalActivity.message, modalActivity.course_id)
    : null;

  function clearFilters() {
    setTypeFilter('all');
    setDateFilter('all');
    setCourseFilter('all');
  }

  const selectStyle = (active: boolean): React.CSSProperties => ({
    background: 'var(--color-glass)',
    color: 'var(--color-text)',
    borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '0.5rem',
    padding: '6px 10px',
    fontSize: '0.8rem',
    outline: 'none',
    cursor: 'pointer',
  });

  return (
    <PageTransition>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Notifications
          </h1>
          <div className="flex items-center gap-2">
            {/* Legend toggle */}
            {mounted && legendDismissed && (
              <button onClick={() => { setLegendDismissed(false); localStorage.removeItem('notif-legend-dismissed'); }}
                title="Show type key"
                className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: 'var(--color-muted)' }}>
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
            {unreadCount > 0 && (
              <span className="text-sm px-2.5 py-1 rounded-full font-medium text-white"
                style={{ background: '#e74c3c' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>

        {/* Type legend */}
        <AnimatePresence>
          {mounted && !legendDismissed && (
            <TypeLegend onDismiss={dismissLegend} />
          )}
        </AnimatePresence>

        {/* ── Filter bar ── */}
        <div className="space-y-2">
          {/* Row 1: always visible */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'unread'] as const).map((mode) => (
              <button key={mode} onClick={() => setReadFilter(mode)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={readFilter === mode
                  ? { background: 'var(--color-accent)', color: '#fff' }
                  : { background: 'var(--color-glass)', color: 'var(--color-muted)' }
                }>
                {mode === 'unread' ? `Unread (${unreadCount})` : 'All'}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: 'var(--color-muted)' }}>
                  Clear
                </button>
              )}
              <button onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={filtersOpen || activeFilterCount > 0
                  ? { background: 'var(--color-accent)', color: '#fff' }
                  : { background: 'var(--color-glass)', color: 'var(--color-muted)' }
                }>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.25)' }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: expandable selects */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="flex flex-wrap gap-2 pt-1 pb-0.5">
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    style={selectStyle(dateFilter !== 'all')}>
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                  {availableTypes.length > 1 && (
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                      style={selectStyle(typeFilter !== 'all')}>
                      <option value="all">All types</option>
                      {availableTypes.map((t) => (
                        <option key={t} value={t}>{getMeta(t).label}</option>
                      ))}
                    </select>
                  )}
                  {availableCourses.length > 1 && (
                    <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}
                      style={selectStyle(courseFilter !== 'all')}>
                      <option value="all">All courses</option>
                      {availableCourses.map(([id, name]) => (
                        <option key={id} value={String(id)}>{name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Notification list ── */}
        <div className="glass p-4 md:p-6 space-y-6">
          {!mounted ? (
            /* Stable skeleton — server and initial client render are identical */
            <div className="space-y-2 py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg animate-pulse"
                  style={{ background: 'var(--color-glass)' }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="italic py-4 text-center" style={{ color: 'var(--color-muted)' }}>
              {readFilter === 'unread' ? 'No unread notifications.' : 'No notifications match the current filters.'}
            </p>
          ) : (
            groupOrder.map((group) => {
              const items = grouped[group];
              if (!items?.length) return null;
              return (
                <div key={group}>
                  {/* Group heading — course name (larger) or date group (smaller) */}
                  {groupByCourse ? (
                    <h2 className="text-sm font-semibold mb-3"
                      style={{ color: 'var(--color-accent)' }}>
                      {group}
                    </h2>
                  ) : (
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2 pb-1 border-b"
                      style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)' }}>
                      {group}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {items.map((activity, index) => {
                      const isUnread = activity.read_state === 'unread';
                      const type = canonical(activity.type);
                      const { label, color } = getMeta(activity.type);
                      const timestamp = activity.updated_at || activity.created_at;

                      // Parse Message type for display label/title
                      const msgParsed = type === 'Message' && activity.message
                        ? parseCanvasMessage(activity.message, activity.course_id)
                        : null;

                      const displayLabel = msgParsed?.action ?? label;
                      const displayTitle = msgParsed?.title ?? activity.title ?? '(no title)';

                      return (
                        <motion.div
                          key={activity.id}
                          onClick={() => handleItemClick(activity)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleItemClick(activity); }}
                          role="button"
                          tabIndex={0}
                          className="flex items-start gap-3 px-3 py-3 rounded-lg transition-colors hover:opacity-90 cursor-pointer"
                          style={{ background: isUnread ? 'var(--color-glass)' : 'transparent' }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.02 }}
                          whileHover={{ x: 3 }}
                        >
                          {/* Unread dot */}
                          <div className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full" style={{
                            background: isUnread ? 'var(--color-accent)' : 'transparent',
                            border: isUnread ? 'none' : '1.5px solid var(--color-border)',
                          }} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-semibold px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ background: `${color}22`, color }}>
                                {displayLabel}
                              </span>
                              <span className={`text-sm ${isUnread ? 'font-semibold' : 'font-normal'} truncate`}
                                style={{ color: 'var(--color-text)' }}>
                                {displayTitle}
                              </span>
                            </div>

                            {/* Due date chip for parsed messages */}
                            {(msgParsed?.dueText || msgParsed?.changedToText) && (
                              <span className="inline-block text-xs px-1.5 py-0.5 rounded mt-0.5"
                                style={{ background: 'rgba(231,76,60,0.12)', color: '#e74c3c' }}>
                                {msgParsed.changedToText
                                  ? `Now due ${msgParsed.changedToText}`
                                  : `Due ${msgParsed.dueText}`}
                              </span>
                            )}

                            {/* Message preview — only for non-Message types (Message shows parsed chips instead) */}
                            {!msgParsed && activity.message && (
                              <div className="text-xs line-clamp-2 mt-0.5"
                                style={{ color: 'var(--color-muted)' }}
                                dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(activity.message) }}
                              />
                            )}
                          </div>

                          {timestamp && <TimeDisplay dateStr={timestamp} />}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-xs text-center" style={{ color: 'var(--color-muted)' }}>
          Activity stream from Canvas — click any item to view details.
        </p>
      </div>

      {/* Detail modal */}
      <NotificationDetailModal
        activity={modalActivity}
        courseName={modalCourseInfo?.name ?? ''}
        courseCode={modalCourseInfo?.code ?? ''}
        parsed={modalParsed}
        isOpen={!!modalActivity}
        onClose={() => setModalActivity(null)}
      />
    </PageTransition>
  );
}
