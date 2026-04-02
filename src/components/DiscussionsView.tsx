'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PageTransition from './PageTransition';
import GlassEmptyState from './GlassEmptyState';

type FilterType = 'all' | 'announcements' | 'assignments';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DiscussionsView({
  discussions = [],
  courseId,
}: {
  discussions: any[];
  courseId: number;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = discussions.filter((topic: any) => {
    if (filter === 'announcements') return topic.is_announcement === true;
    if (filter === 'assignments') return !!topic.assignment_id;
    return true;
  });

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Announcements', value: 'announcements' },
    { label: 'Assignments', value: 'assignments' },
  ];

  return (
    <PageTransition>
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <motion.h1
            className="text-xl md:text-2xl font-semibold"
            style={{ color: 'var(--color-text)' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Discussions
          </motion.h1>

          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    filter === f.value ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: filter === f.value ? '#fff' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {f.label}
              </button>
            ))}
          </motion.div>
        </div>

        {filtered.length === 0 ? (
          <GlassEmptyState message="No discussions found for this course." />
        ) : (
          <div className="space-y-4">
            {filtered.map((topic: any, index: number) => (
              <motion.article
                key={topic.id}
                className="glass p-4 md:p-6 rounded-xl cursor-pointer"
                style={{ background: 'var(--color-surface)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() =>
                  router.push(`/classes/${courseId}/discussions/${topic.id}`)
                }
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2
                        className="text-base md:text-lg font-semibold"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {topic.title}
                      </h2>
                      {topic.pinned && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'var(--color-accent)',
                            color: '#fff',
                          }}
                        >
                          Pinned
                        </span>
                      )}
                      {topic.is_announcement && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'var(--color-muted)',
                            color: '#fff',
                          }}
                        >
                          Announcement
                        </span>
                      )}
                      {topic.assignment_id && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'var(--color-accent)',
                            color: '#fff',
                            opacity: 0.85,
                          }}
                        >
                          Graded
                        </span>
                      )}
                      {topic.locked && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: 'var(--color-border)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          Locked
                        </span>
                      )}
                    </div>

                    {topic.author?.display_name && (
                      <p
                        className="text-sm"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        by {topic.author.display_name}
                      </p>
                    )}
                  </div>

                  <div
                    className="flex flex-col items-end gap-1 shrink-0 text-sm"
                    style={{ color: 'var(--color-muted)' }}
                  >
                    {topic.last_reply_at && (
                      <span>Last reply {formatDate(topic.last_reply_at)}</span>
                    )}
                    {!topic.last_reply_at && topic.posted_at && (
                      <span>Posted {formatDate(topic.posted_at)}</span>
                    )}
                  </div>
                </div>

                <div
                  className="flex flex-wrap items-center gap-4 text-sm"
                  style={{ color: 'var(--color-muted)' }}
                >
                  <span>
                    {topic.discussion_subentry_count ?? 0}{' '}
                    {topic.discussion_subentry_count === 1 ? 'reply' : 'replies'}
                  </span>
                  {topic.assignment?.due_at && (
                    <span>Due {formatDate(topic.assignment.due_at)}</span>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}
