'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PageTransition from './PageTransition';
import { sanitizeCanvasHtml } from '@/lib/sanitize';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitial(name: string | undefined): string {
  if (!name) return '?';
  return name.trim()[0].toUpperCase();
}

function EntryCard({
  entry,
  depth = 0,
  index,
}: {
  entry: any;
  depth?: number;
  index: number;
}) {
  const authorName = entry.author?.display_name || entry.user_name || 'Unknown';

  return (
    <motion.div
      className="glass rounded-xl p-4"
      style={{
        background: 'var(--color-surface)',
        marginLeft: depth > 0 ? `${depth * 20}px` : undefined,
        borderLeft: depth > 0 ? '2px solid var(--color-accent)' : undefined,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          {getInitial(authorName)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
            {authorName}
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            {formatDate(entry.created_at)}
          </span>
        </div>
      </div>

      {entry.message && (
        <div
          className="prose prose-sm max-w-none announcement-description"
          style={{ color: 'var(--color-text)' }}
          dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(entry.message) }}
        />
      )}

      {entry.replies && entry.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {entry.replies.map((reply: any, i: number) => (
            <EntryCard key={reply.id} entry={reply} depth={depth + 1} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function DiscussionThreadView({
  topic,
  entries,
  courseId,
  topicId,
}: {
  topic: any;
  entries: any[];
  courseId: number;
  topicId: number;
}) {
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const authorName =
    topic.author?.display_name || topic.author?.name || null;

  async function handleReplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(
        `/api/discussions/${courseId}/${topicId}/reply`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyMessage }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }
      setReplyMessage('');
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to post reply.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageTransition>
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href={`/classes/${courseId}/discussions`}
            className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            ← Back to Discussions
          </Link>
        </motion.div>

        {/* Topic header */}
        <motion.div
          className="glass p-5 md:p-7 rounded-xl"
          style={{ background: 'var(--color-surface)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {topic.pinned && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
              >
                Pinned
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
            {topic.assignment_id && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-accent)', color: '#fff', opacity: 0.85 }}
              >
                Graded
              </span>
            )}
          </div>

          <h1
            className="text-xl md:text-2xl font-semibold mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            {topic.title}
          </h1>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-5"
            style={{ color: 'var(--color-muted)' }}
          >
            {authorName && <span>Posted by {authorName}</span>}
            {topic.posted_at && <span>{formatDate(topic.posted_at)}</span>}
            <span>
              {topic.discussion_subentry_count ?? entries.length}{' '}
              {(topic.discussion_subentry_count ?? entries.length) === 1 ? 'reply' : 'replies'}
            </span>
          </div>

          {topic.message && (
            <div
              className="prose prose-sm max-w-none announcement-description"
              style={{ color: 'var(--color-text)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(topic.message) }}
            />
          )}
        </motion.div>

        {/* Entries */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <motion.h2
              className="text-base font-semibold"
              style={{ color: 'var(--color-text)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              Replies ({entries.length})
            </motion.h2>
            {entries.map((entry: any, i: number) => (
              <EntryCard key={entry.id} entry={entry} depth={0} index={i} />
            ))}
          </div>
        )}

        {/* Reply form */}
        {!topic.locked && (
          <motion.div
            className="glass p-5 rounded-xl"
            style={{ background: 'var(--color-surface)' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <h2
              className="text-base font-semibold mb-3"
              style={{ color: 'var(--color-text)' }}
            >
              Post a Reply
            </h2>
            <form onSubmit={handleReplySubmit} className="space-y-3">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
                className="w-full rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2"
                style={{
                  background: 'var(--color-bg)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                }}
                disabled={isSubmitting}
              />
              {submitError && (
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
                  Reply posted successfully.
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !replyMessage.trim()}
                  className="px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  style={{
                    background: 'var(--color-accent)',
                    color: '#fff',
                  }}
                >
                  {isSubmitting ? 'Posting…' : 'Post Reply'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    </PageTransition>
  );
}
