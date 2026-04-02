'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PageTransition from './PageTransition';
import AssignmentModal from './AssignmentModal';
import { sanitizeCanvasHtml } from '@/lib/sanitize';

export default function ClassHomeView({ course, announcements = [], assignments = [], frontPage = null, syllabus = null }: { course: any; announcements?: any[]; assignments?: any[]; frontPage?: any; syllabus?: any }) {
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  };
  
  // Get recent announcements (limit to 5 most recent)
  const recentAnnouncements = announcements.slice(0, 5);
  
  // Get upcoming assignments (limit to 5)
  const upcomingAssignments = assignments
    .filter((a: any) => a.due_at && new Date(a.due_at) >= new Date())
    .sort((a: any, b: any) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5);
  
  return (
    <PageTransition>
      <nav className="flex items-center gap-1 text-xs mb-4" style={{ color: 'var(--color-muted)' }}>
        <Link href="/classes" className="hover:underline">Classes</Link>
        <span>/</span>
        <span style={{ color: 'var(--color-text)' }}>{course.name}</span>
      </nav>
      <motion.div className="space-y-6 sm:space-y-8 md:space-y-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        {course.image_url && (
          <motion.div className="rounded-xl overflow-hidden shadow mb-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <img src={course.image_url} alt={course.name + ' banner'} className="w-full h-56 object-cover" />
          </motion.div>
        )}
        <motion.div className="glass p-5 sm:p-7 md:p-10 rounded-xl shadow" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ background: 'var(--color-surface)' }}>
          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>{course.name}</h1>
            <div className="text-sm mb-1" style={{ color: 'var(--color-muted)' }}>{course.course_code}</div>
            {course.start_at && course.end_at && (
              <div className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>
                {new Date(course.start_at).toLocaleDateString()} – {new Date(course.end_at).toLocaleDateString()}
              </div>
            )}
            {course.description && (
              <div className="text-base mb-3 whitespace-pre-line" style={{ color: 'var(--color-text)' }}>{course.description}</div>
            )}
          </div>
        </motion.div>

        {frontPage?.body && (
          <motion.section className="glass p-6 md:p-8 rounded-xl shadow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>{frontPage.title || 'Course Home'}</h2>
            <div
              className="prose prose-sm max-w-none"
              style={{ color: 'var(--color-text)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(frontPage.body) }}
            />
          </motion.section>
        )}

        {course.default_view === 'syllabus' && syllabus?.syllabus_body && (
          <motion.section className="glass p-6 md:p-8 rounded-xl shadow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Syllabus</h2>
            <div
              className="prose prose-sm max-w-none"
              style={{ color: 'var(--color-text)' }}
              dangerouslySetInnerHTML={{ __html: sanitizeCanvasHtml(syllabus.syllabus_body) }}
            />
          </motion.section>
        )}

        {recentAnnouncements.length > 0 && (
          <motion.section className="glass p-6 md:p-8 rounded-xl shadow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Recent Announcements</h2>
            <div className="space-y-4">
              {recentAnnouncements.map((announcement: any, index: number) => (
                <motion.article key={announcement.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-medium" style={{ color: 'var(--color-text)' }}>{announcement.title}</h3>
                    {announcement.posted_at && (
                      <time className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {new Date(announcement.posted_at).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                  {announcement.message && (
                    <div 
                      className="text-sm prose prose-sm max-w-none"
                      style={{ color: 'var(--color-text)' }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeCanvasHtml(announcement.message),
                      }}
                    />
                  )}
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}

        {upcomingAssignments.length > 0 && (
          <motion.section className="glass p-6 md:p-8 rounded-xl shadow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ background: 'var(--color-surface)' }}>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Upcoming Assignments</h2>
            <div className="space-y-3 px-1">
              {upcomingAssignments.map((assignment: any, index: number) => (
                <motion.div 
                  key={assignment.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity relative z-0" 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                  onClick={() => handleAssignmentClick(assignment)}
                  whileHover={{ scale: 1.02, zIndex: 10 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-1">
                    <h3 className="font-medium" style={{ color: 'var(--color-text)' }}>{assignment.name}</h3>
                    {assignment.due_at && (
                      <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                        Due: {new Date(assignment.due_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {assignment.points_possible && (
                    <span className="text-sm font-medium ml-4" style={{ color: 'var(--color-muted)' }}>
                      {assignment.points_possible} pts
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </motion.div>
      
      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </PageTransition>
  );
} 