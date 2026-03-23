'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';

function getLetterGrade(score: number): string {
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 60) return 'D';
  return 'F';
}

function getGradeColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#84cc16';
  if (score >= 70) return '#f59e0b';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

function ScoreBar({ score, label, delay }: { score: number; label: string; delay: number }) {
  const color = getGradeColor(score);
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function GradesView({ gradesData }: { gradesData: { course: any, enrollments: any[] }[] }) {
  return (
    <PageTransition>
      <motion.div className="space-y-4 md:space-y-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Grades</h1>
        {gradesData.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-16 text-center text-gray-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <span className="text-lg font-medium">No courses or grades found.</span>
            <span className="text-sm mt-2">You are not enrolled in any courses, or there are no grades to display.</span>
          </motion.div>
        ) : (
          gradesData.map(({ course, enrollments }, index) => {
            const primary = enrollments.find((e: { type?: string }) => e.type === 'StudentEnrollment') ?? enrollments[0];
            const currentScore: number | null = primary?.grades?.current_score ?? null;
            const finalScore: number | null = primary?.grades?.final_score ?? null;
            const gradeColor = currentScore != null ? getGradeColor(currentScore) : 'var(--color-muted)';
            const letterGrade = currentScore != null ? getLetterGrade(currentScore) : null;
            const cardDelay = index * 0.08;

            return (
              <Link key={course.id} href={`/classes/${course.id}/grades`} className="block">
                <motion.section
                  className="glass p-4 md:p-5 cursor-pointer hover:border-accent/40 transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: cardDelay }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="card-title truncate">{course.name}</h2>
                      {course.course_code && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{course.course_code}</p>
                      )}
                    </div>
                    {letterGrade && (
                      <motion.div
                        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-sm"
                        style={{ background: gradeColor }}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: cardDelay + 0.2 }}
                      >
                        {letterGrade}
                      </motion.div>
                    )}
                  </div>

                  {!primary ? (
                    <p className="italic mt-3 text-sm" style={{ color: 'var(--color-muted)' }}>No grade data available.</p>
                  ) : currentScore == null && finalScore == null ? (
                    <p className="italic mt-3 text-sm" style={{ color: 'var(--color-muted)' }}>No score posted yet.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {currentScore != null && (
                        <ScoreBar score={currentScore} label="Current" delay={cardDelay + 0.3} />
                      )}
                      {finalScore != null && finalScore !== currentScore && (
                        <ScoreBar score={finalScore} label="Final" delay={cardDelay + 0.4} />
                      )}
                    </div>
                  )}
                </motion.section>
              </Link>
            );
          })
        )}
      </motion.div>
    </PageTransition>
  );
}
