'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PageTransition from './PageTransition';
import { sanitizeCanvasHtml } from '@/lib/sanitize';

export default function CoursePageView({
  page,
  courseId,
}: {
  page: any;
  courseId: string;
}) {
  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
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
            href={`/classes/${courseId}/pages`}
            className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Pages
          </Link>
        </motion.div>

        {/* Page card */}
        <motion.article
          className="glass p-6 md:p-8 rounded-xl shadow"
          style={{ background: 'var(--color-surface)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Header */}
          <div className="mb-6 border-b pb-4" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ color: 'var(--color-text)' }}
              >
                {page.title}
              </h1>
              {page.front_page && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-surface)',
                  }}
                >
                  Front Page
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'var(--color-muted)' }}>
              {page.updated_at && (
                <span>
                  Last updated:{' '}
                  <time>{new Date(page.updated_at).toLocaleString()}</time>
                </span>
              )}
              {page.last_edited_by?.display_name && (
                <span>by {page.last_edited_by.display_name}</span>
              )}
            </div>
          </div>

          {/* Body */}
          {page.body ? (
            <div
              className="prose prose-sm max-w-none assignment-description"
              style={{ color: 'var(--color-text)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(page.body) }}
            />
          ) : (
            <p style={{ color: 'var(--color-muted)' }}>This page has no content.</p>
          )}
        </motion.article>
      </motion.div>
    </PageTransition>
  );
}
