'use client';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import GlassEmptyState from './GlassEmptyState';

export default function ClassPeopleView({ enrollments }: { enrollments: any[] }) {
  // Group enrollments by type
  const groupedEnrollments = enrollments.reduce((acc: any, enrollment: any) => {
    const type = enrollment.type || enrollment.role || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(enrollment);
    return acc;
  }, {});

  return (
    <PageTransition>
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          People
        </motion.h1>
        {enrollments.length === 0 ? (
          <GlassEmptyState message="No people found for this course." />
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEnrollments).map(([type, group]: [string, any], groupIndex) => (
              <motion.section
                key={type}
                className="glass p-6 rounded-xl"
                style={{ background: 'var(--color-surface)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: groupIndex * 0.1 }}
              >
                <h2 className="text-lg font-semibold mb-4 capitalize" style={{ color: 'var(--color-text)' }}>
                  {type.replace('Enrollment', '').replace(/([A-Z])/g, ' $1').trim()}
                </h2>
                <ul className="space-y-3">
                  {group.map((enrollment: any, index: number) => (
                    <motion.li
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: groupIndex * 0.1 + index * 0.05 }}
                    >
                      <div className="flex-1">
                        <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                          {enrollment.user?.name || enrollment.user?.display_name || enrollment.user?.sortable_name || 'Unknown'}
                        </span>
                        {enrollment.user?.email && (
                          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                            {enrollment.user.email}
                          </p>
                        )}
                      </div>
                      {enrollment.grades?.current_grade && (
                        <span className="text-sm font-medium ml-4" style={{ color: 'var(--color-muted)' }}>
                          {enrollment.grades.current_grade}
                        </span>
                      )}
                    </motion.li>
                  ))}
                </ul>
              </motion.section>
            ))}
          </div>
        )}
      </motion.div>
    </PageTransition>
  );
} 