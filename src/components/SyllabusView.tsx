'use client';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import { sanitizeCanvasHtml } from '@/lib/sanitize';

interface SyllabusViewProps {
  course: {
    name?: string;
    syllabus_body?: string | null;
  };
}

export default function SyllabusView({ course }: SyllabusViewProps) {
  const hasSyllabus = !!course.syllabus_body?.trim();

  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="text-2xl md:text-3xl font-bold mb-6"
          style={{ color: 'var(--color-text)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Syllabus
        </motion.h1>

        {course.name && (
          <motion.p
            className="text-sm font-medium mb-4"
            style={{ color: 'var(--color-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {course.name}
          </motion.p>
        )}

        <motion.div
          className="glass rounded-xl p-6 md:p-8"
          style={{ background: 'var(--color-surface)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {hasSyllabus ? (
            <div
              className="prose prose-sm max-w-none assignment-description"
              style={{ color: 'var(--color-text)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(course.syllabus_body!) }}
            />
          ) : (
            <p style={{ color: 'var(--color-muted)' }}>No syllabus available for this course.</p>
          )}
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
