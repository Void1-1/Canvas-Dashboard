'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ClassesView({ courses }: { courses: any[] }) {
  return (
    <motion.div
      className="space-y-4 md:space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ color: 'var(--color-text)' }}
    >
      <motion.h1
        className="text-xl md:text-2xl font-semibold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ color: 'var(--color-text)' }}
      >
        Classes
      </motion.h1>

      {courses.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          style={{ color: 'var(--color-muted)' }}
        >
          <span className="text-lg font-medium">No classes found.</span>
          <span className="text-sm mt-2">You are not enrolled in any classes.</span>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          {courses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              whileHover={{ y: -2 }}
            >
              <Link
                href={`/classes/${course.id}`}
                className="glass p-4 md:p-6 rounded-xl shadow flex flex-col gap-1 cursor-pointer hover:bg-accent/5 transition-colors"
                style={{ background: 'var(--color-surface)' }}
              >
                <span
                  className="font-medium text-lg"
                  style={{ color: 'var(--color-text)' }}
                >
                  {course.name}
                </span>
                {course.course_code && !course.name.includes(course.course_code) && (
                  <span className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    {course.course_code}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
