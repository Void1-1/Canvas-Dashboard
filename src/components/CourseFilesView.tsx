'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import GlassEmptyState from './GlassEmptyState';
import {
  File,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Lock,
  Download,
  Search,
  ChevronDown,
} from 'lucide-react';

interface CanvasFile {
  id: number;
  display_name?: string;
  filename?: string;
  size?: number;
  'content-type'?: string;
  url?: string;
  updated_at?: string;
  locked?: boolean;
}

type SortKey = 'name' | 'date' | 'size';

function formatFileSize(bytes?: number): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType?: string) {
  if (!contentType) return <File className="w-5 h-5 flex-shrink-0" />;
  if (contentType.startsWith('image/')) return <Image className="w-5 h-5 flex-shrink-0" />;
  if (contentType.startsWith('video/')) return <Video className="w-5 h-5 flex-shrink-0" />;
  if (contentType.startsWith('audio/')) return <Music className="w-5 h-5 flex-shrink-0" />;
  if (
    contentType === 'application/pdf' ||
    contentType.startsWith('text/') ||
    contentType.includes('word') ||
    contentType.includes('document')
  )
    return <FileText className="w-5 h-5 flex-shrink-0" />;
  if (
    contentType.includes('zip') ||
    contentType.includes('tar') ||
    contentType.includes('rar') ||
    contentType.includes('compressed')
  )
    return <Archive className="w-5 h-5 flex-shrink-0" />;
  return <File className="w-5 h-5 flex-shrink-0" />;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

interface SortButtonProps {
  label: string;
  sortId: SortKey;
  sortKey: SortKey;
  sortAsc: boolean;
  onSort: (key: SortKey) => void;
}

function SortButton({ label, sortId, sortKey, sortAsc, onSort }: SortButtonProps) {
  return (
    <button
      onClick={() => onSort(sortId)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-opacity hover:opacity-70"
      style={{ color: sortKey === sortId ? 'var(--color-accent)' : 'var(--color-muted)' }}
    >
      {label}
      {sortKey === sortId && (
        <ChevronDown
          className="w-3 h-3 transition-transform"
          style={{ transform: sortAsc ? 'rotate(0deg)' : 'rotate(180deg)' }}
        />
      )}
    </button>
  );
}

interface CourseFilesViewProps {
  files: CanvasFile[];
  courseName?: string;
}

export default function CourseFilesView({ files, courseName }: CourseFilesViewProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => {
    const filtered = files.filter((f) => {
      const name = (f.display_name || f.filename || '').toLowerCase();
      return name.includes(search.toLowerCase());
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') {
        const nameA = (a.display_name || a.filename || '').toLowerCase();
        const nameB = (b.display_name || b.filename || '').toLowerCase();
        cmp = nameA.localeCompare(nameB);
      } else if (sortKey === 'date') {
        const da = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const db = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        cmp = da - db;
      } else if (sortKey === 'size') {
        cmp = (a.size ?? 0) - (b.size ?? 0);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [files, search, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-2xl md:text-3xl font-bold mb-2"
          style={{ color: 'var(--color-text)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Files
        </motion.h1>

        {courseName && (
          <motion.p
            className="text-sm font-medium mb-4"
            style={{ color: 'var(--color-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {courseName}
          </motion.p>
        )}

        {/* Search bar */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--color-muted)' }}
          />
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-shadow"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </motion.div>

        {/* Sort controls */}
        <motion.div
          className="flex items-center gap-4 px-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            Sort:
          </span>
          <SortButton label="Name" sortId="name" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortButton label="Date" sortId="date" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <SortButton label="Size" sortId="size" sortKey={sortKey} sortAsc={sortAsc} onSort={handleSort} />
          <span className="ml-auto text-xs" style={{ color: 'var(--color-muted)' }}>
            {sorted.length} {sorted.length === 1 ? 'file' : 'files'}
          </span>
        </motion.div>

        {/* File list */}
        {sorted.length === 0 ? (
          <GlassEmptyState
            message={search ? 'No files match your search.' : 'No files available for this course.'}
          />
        ) : (
          <div className="space-y-2 px-1">
            {sorted.map((file, index) => {
              const name = file.display_name || file.filename || 'Unnamed file';
              const contentType = file['content-type'];
              const isLocked = file.locked;

              return (
                <motion.div
                  key={file.id}
                  className="glass rounded-xl flex items-center gap-4 px-4 py-3"
                  style={{ background: 'var(--color-surface)' }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  whileHover={{ scale: 1.005 }}
                >
                  {/* Icon */}
                  <span style={{ color: 'var(--color-accent)' }}>
                    {getFileIcon(contentType)}
                  </span>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                      {contentType || 'Unknown type'} &middot; {formatFileSize(file.size)} &middot;{' '}
                      {formatDate(file.updated_at)}
                    </p>
                  </div>

                  {/* Locked badge */}
                  {isLocked && (
                    <span
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg flex-shrink-0"
                      style={{
                        background: 'rgba(156,163,175,0.12)',
                        color: 'var(--color-muted)',
                      }}
                    >
                      <Lock className="w-3 h-3" />
                      Locked
                    </span>
                  )}

                  {/* Download */}
                  {file.url && !isLocked ? (
                    <a
                      href={file.url}
                      download={name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0"
                      style={{
                        background: 'rgba(200,155,123,0.15)',
                        color: 'var(--color-accent)',
                      }}
                      title="Download file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}
