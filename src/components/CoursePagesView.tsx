'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PageTransition from './PageTransition';
import GlassEmptyState from './GlassEmptyState';

type SortKey = 'title' | 'updated_at';

export default function CoursePagesView({
  pages = [],
  courseId,
}: {
  pages: any[];
  courseId: string;
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');

  const filtered = pages
    .filter((p: any) =>
      p.title?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sortKey === 'title') {
        return (a.title ?? '').localeCompare(b.title ?? '');
      }
      // updated_at — most recent first
      return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
    });

  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-xl md:text-2xl font-semibold"
          style={{ color: 'var(--color-text)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Pages
        </motion.h1>

        {/* Search & sort controls */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <input
            type="text"
            placeholder="Search pages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border text-sm outline-none focus:ring-2"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
            }}
          />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-4 py-2 rounded-lg border text-sm outline-none"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              borderColor: 'var(--color-border)',
            }}
          >
            <option value="title">Sort: Title</option>
            <option value="updated_at">Sort: Last Updated</option>
          </select>
        </motion.div>

        {filtered.length === 0 ? (
          <GlassEmptyState
            message={
              search
                ? 'No pages match your search.'
                : 'No pages found for this course.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((page: any, index: number) => (
              <motion.div
                key={page.url ?? page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
                whileHover={{ scale: 1.01, y: -1 }}
              >
                <Link
                  href={`/classes/${courseId}/pages/${encodeURIComponent(page.url)}`}
                  className="glass block p-4 md:p-5 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--color-surface)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h2
                        className="text-base md:text-lg font-medium truncate"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {page.title}
                      </h2>
                      {page.front_page && (
                        <span
                          className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: 'var(--color-accent)',
                            color: 'var(--color-surface)',
                          }}
                        >
                          Front Page
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-1 shrink-0">
                      {page.updated_at && (
                        <time
                          className="text-xs"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          Updated {new Date(page.updated_at).toLocaleDateString()}
                        </time>
                      )}
                      {page.last_edited_by?.display_name && (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          by {page.last_edited_by.display_name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}
