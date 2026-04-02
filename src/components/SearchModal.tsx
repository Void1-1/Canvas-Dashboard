'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, BookOpen, ClipboardList, Megaphone, MessageSquare, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: number | string;
  name: string;
  subtitle?: string;
  href: string;
  type: 'course' | 'assignment' | 'announcement' | 'discussion' | 'page';
}

interface SearchResults {
  courses: SearchResult[];
  assignments: SearchResult[];
  announcements: SearchResult[];
  discussions: SearchResult[];
  pages: SearchResult[];
}

const typeConfig = {
  course: { icon: BookOpen, label: 'Courses', color: 'text-blue-500' },
  assignment: { icon: ClipboardList, label: 'Assignments', color: 'text-purple-500' },
  announcement: { icon: Megaphone, label: 'Announcements', color: 'text-orange-500' },
  discussion: { icon: MessageSquare, label: 'Discussions', color: 'text-green-500' },
  page: { icon: FileText, label: 'Pages', color: 'text-yellow-500' },
};

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const allResults: SearchResult[] = results
    ? [
        ...results.courses,
        ...results.assignments,
        ...results.announcements,
        ...results.discussions,
        ...results.pages,
      ]
    : [];

  const grouped = results
    ? (['course', 'assignment', 'announcement', 'discussion', 'page'] as const)
        .map((type) => ({
          type,
          items: results[`${type}s` as keyof SearchResults] as SearchResult[],
        }))
        .filter((g) => g.items.length > 0)
    : [];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Search (⌘K)"
        aria-label="Search"
        className="relative p-2.5 rounded-lg transition-colors hover:opacity-80 hover:bg-accent/10"
        style={{ color: 'var(--color-muted)', background: 'transparent' }}
      >
        <Search className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={close}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-xl mx-4 rounded-xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              initial={{ scale: 0.96, y: -10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Search input */}
              <div
                className="flex items-center gap-3 px-4 py-3 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses, assignments, announcements…"
                  className="flex-1 bg-transparent outline-none text-base"
                  style={{ color: 'var(--color-text)' }}
                />
                {loading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: 'var(--color-muted)' }} />}
                <button
                  onClick={close}
                  className="p-1 rounded hover:bg-accent/10 transition-colors flex-shrink-0"
                  style={{ color: 'var(--color-muted)' }}
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {!query.trim() || query.trim().length < 2 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    Type at least 2 characters to search
                    <div className="mt-2 text-xs opacity-60">
                      Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--color-glass)', border: '1px solid var(--color-border)' }}>⌘K</kbd> to toggle
                    </div>
                  </div>
                ) : loading && !results ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    Searching…
                  </div>
                ) : allResults.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                    No results for &ldquo;{query}&rdquo;
                  </div>
                ) : (
                  <div className="py-2">
                    {grouped.map(({ type, items }) => {
                      const config = typeConfig[type];
                      const Icon = config.icon;
                      return (
                        <div key={type}>
                          <div
                            className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--color-muted)' }}
                          >
                            {config.label}
                          </div>
                          {items.map((item) => (
                            <Link
                              key={`${type}-${item.id}`}
                              href={item.href}
                              onClick={close}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/10 transition-colors"
                            >
                              <Icon className={`w-4 h-4 flex-shrink-0 ${config.color}`} />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                                  {item.name}
                                </div>
                                {item.subtitle && (
                                  <div className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                                    {item.subtitle}
                                  </div>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
