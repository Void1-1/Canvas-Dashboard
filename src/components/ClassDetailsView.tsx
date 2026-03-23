'use client';
import { motion } from 'framer-motion';

export default function ClassDetailsView({ course, assignments, modules, enrollments }: { course: any, assignments: any[], modules: any[], enrollments: any[] }) {
  // Announcements placeholder (Canvas API for announcements is not implemented yet)
  const announcements = [
    { id: 1, title: 'Welcome!', date: '2024-08-01', content: 'This is your class announcement area.' },
    { id: 2, title: 'First Assignment Posted', date: '2024-08-05', content: 'Check the assignments section for details.' },
  ];

  // People from enrollments
  const people = enrollments.map((e, idx) => ({
    id: idx + 1,
    name: e.user?.name || e.user?.short_name || 'Unknown',
    role: e.type || 'Student',
  }));

  return (
    <motion.div className="space-y-8 md:space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {/* Cover/Welcome Section */}
      <motion.div className="glass p-6 md:p-10 rounded-xl shadow flex flex-col md:flex-row gap-6 items-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ background: 'var(--color-surface)' }}>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{course.name}</h1>
          <div className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>{course.course_code}</div>
          <div className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>{course.start_at} – {course.end_at}</div>
          <div className="text-base mb-3" style={{ color: 'var(--color-text)' }}>{course.description}</div>
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>Instructor: <span className="font-medium" style={{ color: 'var(--color-text)' }}>{course.instructor}</span></div>
        </div>
      </motion.div>

      {/* Modules Section */}
      <motion.div className="glass p-4 md:p-6 rounded-xl shadow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ background: 'var(--color-surface)' }}>
        <h2 className="text-lg md:text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Modules</h2>
        {modules.length === 0 ? (
          <div style={{ color: 'var(--color-muted)' }}>No modules found for this course.</div>
        ) : (
          <ul className="space-y-4">
            {modules.map((mod) => (
              <li key={mod.id} className="border-b pb-2 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
                <div className="font-medium text-base mb-1" style={{ color: 'var(--color-text)' }}>{mod.name}</div>
                {mod.items && mod.items.length > 0 && (
                  <ul className="ml-4 space-y-1">
                    {mod.items.map((item: any) => (
                      <li key={item.id} className="text-sm" style={{ color: 'var(--color-muted)' }}>• {item.title}</li>
                    ))}
                  </ul>
                )}
            </li>
          ))}
        </ul>
        )}
      </motion.div>

      {/* Assignments Section */}
      <motion.div className="glass p-4 md:p-6 rounded-xl shadow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ background: 'var(--color-surface)' }}>
        <h2 className="text-lg md:text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>Assignments</h2>
        <ul className="space-y-2">
          {assignments.map(a => (
            <li key={a.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-2 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
              <span className="font-medium flex-1 min-w-0 break-words" style={{ color: 'var(--color-text)' }}>{a.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-muted)' }}>Due: {a.due_at ? new Date(a.due_at).toLocaleDateString() : 'N/A'}</span>
                {(a.state || a.status) && (
                  <span className="text-xs px-2 py-1 rounded whitespace-nowrap" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>{a.state || a.status}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* People Section */}
      <motion.div className="glass p-4 md:p-6 rounded-xl shadow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ background: 'var(--color-surface)' }}>
        <h2 className="text-lg md:text-xl font-semibold mb-3" style={{ color: 'var(--color-text)' }}>People</h2>
        <ul className="space-y-2">
          {people.map(p => (
            <li key={p.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0" style={{ borderColor: 'var(--color-border)' }}>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>{p.name}</span>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{p.role}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
} 