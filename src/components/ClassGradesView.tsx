'use client';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';

export default function ClassGradesView({ grades }: { grades: any[] }) {
  return (
    <PageTransition>
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Grades
        </motion.h1>
        {grades.length === 0 ? (
          <div className="glass p-6 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-muted)' }}>No assignments found for this course.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grades.map((assignment: any, index: number) => {
              const submission = assignment.submission;
              const hasGrade = submission && (submission.score !== null || submission.grade);
              
              return (
                <motion.div
                  key={assignment.id}
                  className="glass p-4 md:p-6 rounded-xl"
                  style={{ background: 'var(--color-surface)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                        {assignment.name || 'Unknown Assignment'}
                      </h3>
                      {assignment.due_at && (
                        <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
                          Due: {new Date(assignment.due_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:items-end gap-1">
                      {hasGrade ? (
                        submission.score !== null && assignment.points_possible ? (
                          <>
                            <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                              {submission.score} / {assignment.points_possible}
                            </span>
                            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                              {((submission.score / assignment.points_possible) * 100).toFixed(1)}%
                            </span>
                          </>
                        ) : submission.grade ? (
                          <span className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                            {submission.grade}
                          </span>
                        ) : null
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Not graded</span>
                      )}
                      {submission?.workflow_state && (
                        <span className="text-xs px-2 py-1 rounded" style={{ 
                          background: submission.workflow_state === 'graded' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                          color: submission.workflow_state === 'graded' ? 'rgb(34, 197, 94)' : 'var(--color-muted)'
                        }}>
                          {submission.workflow_state}
                        </span>
                      )}
                    </div>
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