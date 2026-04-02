'use client';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import GlassEmptyState from './GlassEmptyState';
import { Clock, Lock, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface CanvasQuiz {
  id: number;
  title?: string;
  quiz_type?: string;
  time_limit?: number | null;
  points_possible?: number | null;
  due_at?: string | null;
  published?: boolean;
  locked_for_user?: boolean;
  lock_at?: string | null;
  unlock_at?: string | null;
  allowed_attempts?: number;
  html_url?: string;
  description?: string;
}

function formatQuizType(quizType?: string): string {
  switch (quizType) {
    case 'assignment':
      return 'Quiz';
    case 'practice_quiz':
      return 'Practice Quiz';
    case 'graded_survey':
      return 'Graded Survey';
    case 'survey':
      return 'Survey';
    default:
      return quizType ? quizType.replace(/_/g, ' ') : 'Quiz';
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return null as any;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null as any;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function AttemptsLabel({ allowed }: { allowed?: number }) {
  if (allowed == null) return null;
  const label = allowed === -1 ? 'Unlimited attempts' : `${allowed} attempt${allowed === 1 ? '' : 's'}`;
  return (
    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
      {label}
    </span>
  );
}

export default function CourseQuizzesView({ quizzes }: { quizzes: CanvasQuiz[] }) {
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
          Quizzes
        </motion.h1>

        {quizzes.length === 0 ? (
          <GlassEmptyState message="No quizzes available for this course." />
        ) : (
          <div className="space-y-3 px-1">
            {quizzes.map((quiz, index) => {
              const dueDate = formatDate(quiz.due_at);
              const unlockDate = formatDate(quiz.unlock_at);
              const lockDate = formatDate(quiz.lock_at);
              const isLocked = quiz.locked_for_user;
              const isPublished = quiz.published !== false;

              return (
                <motion.div
                  key={quiz.id}
                  className="glass rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-surface)' }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ scale: 1.005 }}
                >
                  <div className="p-4 md:p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isLocked ? (
                          <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                        ) : isPublished ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                        ) : (
                          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                        )}
                        <h2
                          className="font-semibold text-base truncate"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {quiz.title || 'Untitled Quiz'}
                        </h2>
                      </div>

                      {quiz.html_url && (
                        <a
                          href={quiz.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70 flex-shrink-0"
                          style={{
                            background: 'rgba(200,155,123,0.15)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          Open
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Quiz type */}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(200,155,123,0.12)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        {formatQuizType(quiz.quiz_type)}
                      </span>

                      {/* Points */}
                      {quiz.points_possible != null && (
                        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                          {quiz.points_possible} {quiz.points_possible === 1 ? 'pt' : 'pts'}
                        </span>
                      )}

                      {/* Time limit */}
                      {quiz.time_limit != null && (
                        <span
                          className="flex items-center gap-1 text-xs"
                          style={{ color: 'var(--color-muted)' }}
                        >
                          <Clock className="w-3 h-3" />
                          {quiz.time_limit} min
                        </span>
                      )}

                      {/* Attempts */}
                      <AttemptsLabel allowed={quiz.allowed_attempts} />

                      {/* Published status */}
                      {!isPublished && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(156,163,175,0.12)',
                            color: 'var(--color-muted)',
                          }}
                        >
                          Unpublished
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    {(dueDate || unlockDate || lockDate) && (
                      <div className="mt-3 flex flex-col gap-1">
                        {dueDate && (
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            <span className="font-medium">Due:</span> {dueDate}
                          </p>
                        )}
                        {unlockDate && (
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            <span className="font-medium">Available from:</span> {unlockDate}
                          </p>
                        )}
                        {lockDate && (
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            <span className="font-medium">Closes:</span> {lockDate}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
}
