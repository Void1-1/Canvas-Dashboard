'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, ClipboardList, CalendarDays, Megaphone, CheckSquare, MessageSquare } from 'lucide-react';
import AssignmentModal from './AssignmentModal';
import AnnouncementModal from './AnnouncementModal';
import { stripHtmlTags } from '@/lib/sanitize';

interface Props {
  courses: any[];
  upcoming: any[];
  announcements: any[];
  recentFeedback?: any[];
}

const TYPE_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  assignment: { icon: <ClipboardList size={12} />, label: 'Assignment', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  event: { icon: <CalendarDays size={12} />, label: 'Event', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
  quiz: { icon: <CheckSquare size={12} />, label: 'Quiz', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' },
  todo: { icon: <CheckSquare size={12} />, label: 'Todo', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
  announcement: { icon: <Megaphone size={12} />, label: 'Announcement', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
};

function TypeBadge({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? { icon: null, label: type, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

function DateBlock({ dateStr }: { dateStr: string | null | undefined }) {
  if (!dateStr) return <div className="w-10 flex-shrink-0" />;
  const d = new Date(dateStr);
  return (
    <div className="flex-shrink-0 w-10 flex flex-col items-center justify-center rounded-lg py-1.5"
      style={{ background: 'var(--color-glass)', border: '1px solid var(--color-border)' }}>
      <span className="text-[10px] font-medium uppercase leading-none" style={{ color: 'var(--color-muted)' }}>
        {d.toLocaleString('default', { month: 'short' })}
      </span>
      <span className="text-lg font-bold leading-none mt-0.5" style={{ color: 'var(--color-text)' }}>
        {d.getDate()}
      </span>
    </div>
  );
}

const COURSE_ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const HomeView: FC<Props> = ({ courses, upcoming, announcements, recentFeedback }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAssignmentId, setLoadingAssignmentId] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const handleAssignmentClick = async (item: any) => {
    const assignmentId = item.assignment?.id || item.assignment_id || item.todo_item?.assignment_id;
    const courseId = item.course_id || item.context?.id || item.todo_item?.course_id;
    const loadingKey = String(assignmentId || item.id || Math.random());
    setLoadingAssignmentId(loadingKey);

    if (assignmentId && courseId) {
      try {
        const response = await fetch(`/api/assignments/${assignmentId}?course_id=${courseId}`);
        if (response.ok) {
          const assignment = await response.json();
          setLoadingAssignmentId(null);
          setSelectedAssignment(assignment);
          setIsModalOpen(true);
          return;
        }
      } catch {
        // fall through
      }
    }
    setLoadingAssignmentId(null);
    setSelectedAssignment({
      id: assignmentId || item.id,
      name: item.title || item.name || item.todo_item?.title,
      due_at: item.due_at || item.all_day_date || item.todo_item?.due_at,
      course: item.context_name ? { name: item.context_name } : null,
    });
    setIsModalOpen(true);
  };

  return (
    <motion.div
      className="space-y-4 md:space-y-6 md:pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      style={{ color: 'var(--color-text)' }}
    >
      {/* Row 1: Courses + Upcoming */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">

        {/* Current Courses */}
        <motion.section
          className="lg:col-span-2 rounded-xl p-4 md:p-6 shadow-sm"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>Current Courses</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              {courses.length} active
            </span>
          </div>

          {courses.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>No active courses found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {courses.map((c, index) => {
                const accent = COURSE_ACCENT_COLORS[index % COURSE_ACCENT_COLORS.length];
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.08 + index * 0.04 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link href={`/classes/${c.id}`}>
                      <div
                        className="rounded-lg p-3.5 flex items-center gap-3 cursor-pointer transition-colors"
                        style={{ border: '1px solid var(--color-border)', background: 'var(--color-glass)' }}
                      >
                        <div
                          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: `${accent}22` }}
                        >
                          <BookOpen size={16} style={{ color: accent }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>{c.name}</p>
                          {c.course_code && (
                            <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{c.course_code}</p>
                          )}
                        </div>
                        <div
                          className="flex-shrink-0 w-1.5 self-stretch rounded-full"
                          style={{ background: accent }}
                        />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Upcoming & To-Dos */}
        <motion.section
          className="rounded-xl p-4 md:p-6 shadow-sm flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.08 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>Upcoming</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
              {upcoming.length}
            </span>
          </div>

          {upcoming.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>Nothing due soon.</p>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto max-h-72">
              {upcoming.map((u, index) => {
                const isTodo = u.todo_item;
                const item = isTodo ? u.todo_item : u;
                const title = item.title || item.name;
                const dueDate = item.due_at || item.all_day_date;
                const contextName = item.context_name || (isTodo ? 'Personal Todo' : null);
                const type = isTodo ? 'todo' : (item.type || 'item');
                const assignmentId = item.assignment?.id || item.assignment_id || item.todo_item?.assignment_id;
                const isClickable = (type === 'assignment' || item.type === 'assignment') && assignmentId;
                const isLoading = loadingAssignmentId === String(assignmentId || u.id);

                return (
                  <motion.div
                    key={u.id}
                    className={`flex items-start gap-2.5 ${isClickable ? 'cursor-pointer' : ''} ${isLoading ? 'opacity-60' : ''}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 + index * 0.04 }}
                    whileHover={isClickable ? { x: 3 } : {}}
                    whileTap={isClickable ? { scale: 0.97 } : {}}
                    onClick={isClickable && !isLoading ? () => handleAssignmentClick(item) : undefined}
                  >
                    <DateBlock dateStr={dueDate} />
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--color-text)' }}>{title}</p>
                        {isLoading && (
                          <svg className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <TypeBadge type={type} />
                        {contextName && (
                          <span className="text-[10px] truncate" style={{ color: 'var(--color-muted)' }}>{contextName}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* Row 2: Announcements + Feedback */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">

        {/* Announcements */}
        <motion.section
          className="lg:col-span-2 rounded-xl p-4 md:p-6 shadow-sm"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>Announcements</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
              {announcements.length} new
            </span>
          </div>

          {announcements.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>No announcements.</p>
          ) : (
            <div className="space-y-2">
              {announcements.map((a, index) => {
                const preview = a.message ? stripHtmlTags(a.message).replace(/&nbsp;/g, ' ').trim() : '';
                return (
                  <motion.div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg p-3 cursor-pointer"
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-glass)' }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: 0.14 + index * 0.04 }}
                    whileHover={{ x: 4, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedAnnouncement(a); setIsAnnouncementModalOpen(true); }}
                  >
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: 'var(--color-accent)', opacity: 0.85 }}
                    >
                      <MessageSquare size={14} className="text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug" style={{ color: 'var(--color-text)' }}>{a.title}</p>
                      {preview && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                          {preview.substring(0, 140)}{preview.length > 140 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>

        {/* Recent Feedback */}
        <motion.section
          className="rounded-xl p-4 md:p-6 shadow-sm flex flex-col"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text)' }}>Recent Grades</h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
              14 days
            </span>
          </div>

          {!recentFeedback || recentFeedback.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--color-muted)' }}>No recent feedback.</p>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
              {recentFeedback.map((item: any, index: number) => {
                const assignmentName = item.assignment?.name ?? 'Assignment';
                const score = item.score !== null && item.score !== undefined ? item.score : null;
                const pointsPossible = item.assignment?.points_possible;
                const grade = item.grade;
                const isNumeric = score !== null && pointsPossible != null;
                const percentage = isNumeric ? Math.round((score / pointsPossible) * 100) : null;
                const barColor = percentage === null ? 'var(--color-accent)'
                  : percentage >= 90 ? '#10b981'
                  : percentage >= 70 ? '#f59e0b'
                  : '#ef4444';

                return (
                  <motion.div
                    key={`${item.assignment_id}-${index}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.16 + index * 0.04 }}
                    whileHover={{ x: 3 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug truncate flex-1" style={{ color: 'var(--color-text)' }}>
                          {assignmentName}
                        </p>
                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: barColor }}>
                          {grade ?? (percentage !== null ? `${percentage}%` : '—')}
                        </span>
                      </div>
                      {isNumeric && (
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: barColor }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(percentage ?? 0, 100)}%` }}
                            transition={{ duration: 0.35, delay: 0.2 + index * 0.04, ease: 'easeOut' }}
                          />
                        </div>
                      )}
                      {score !== null && pointsPossible != null && (
                        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          {score}/{pointsPossible} pts
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      <AssignmentModal assignment={selectedAssignment} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedAssignment(null); }} />
      <AnnouncementModal announcement={selectedAnnouncement} isOpen={isAnnouncementModalOpen} onClose={() => { setIsAnnouncementModalOpen(false); setSelectedAnnouncement(null); }} />
    </motion.div>
  );
};

export default HomeView;
