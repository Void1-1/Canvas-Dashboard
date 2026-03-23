'use client';

import type { FC } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import AssignmentModal from './AssignmentModal';
import AnnouncementModal from './AnnouncementModal';

interface Props {
  courses: any[];
  upcoming: any[];
  announcements: any[];
}

const HomeView: FC<Props> = ({ courses, upcoming, announcements }) => {
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const handleAssignmentClick = async (item: any) => {
    // Check if it's an assignment (from upcoming_events or todo_item)
    const assignmentId = item.assignment?.id || item.assignment_id || item.todo_item?.assignment_id;
    const courseId = item.course_id || item.context?.id || item.todo_item?.course_id;
    
    if (assignmentId && courseId) {
      try {
        const response = await fetch(`/api/assignments/${assignmentId}?course_id=${courseId}`);
        if (response.ok) {
          const assignment = await response.json();
          setSelectedAssignment(assignment);
          setIsModalOpen(true);
          return;
        }
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
      }
    }
    
    // Fallback: create basic assignment object
    const assignment = {
      id: assignmentId || item.id,
      name: item.title || item.name || item.todo_item?.title,
      due_at: item.due_at || item.all_day_date || item.todo_item?.due_at,
      course: item.context_name ? { name: item.context_name } : null
    };
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignment(null);
  };

  const handleAnnouncementClick = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
  };

  const handleCloseAnnouncementModal = () => {
    setIsAnnouncementModalOpen(false);
    setSelectedAnnouncement(null);
  };
  return (
    <motion.div 
      className="space-y-4 md:space-y-6 pt-4 md:pt-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{ color: 'var(--color-text)' }}
    >
      {/* Main Content Grid */}
      <motion.div 
        className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        {/* Current Courses */}
        <motion.section 
          className="rounded-lg p-4 md:p-6 col-span-1 md:col-span-2 min-h-[200px] flex flex-col shadow-sm"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Current Courses</h2>
            <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {courses.length} active
            </span>
          </div>
          {courses.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="italic" style={{ color: 'var(--color-muted)' }}>No active courses found.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto space-y-2 px-2 py-1">
              {courses.map((c, index) => (
                <motion.li 
                  key={c.id}
                  className="relative z-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                >
                  <Link href={`/classes/${c.id}`}>
                    <motion.div
                      className="rounded-lg p-3 transition-colors cursor-pointer relative"
                      style={{ border: '1px solid var(--color-border)', background: 'var(--color-glass)', position: 'relative' }}
                      whileHover={{ x: 5, scale: 1.02, zIndex: 10 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="font-medium" style={{ color: 'var(--color-text)' }}>{c.name}</p>
                          {c.course_code && (
                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{c.course_code}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
                            Active
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>

        {/* Upcoming & To-Dos */}
        <motion.section 
          className="rounded-lg p-4 md:p-6 min-h-[200px] flex flex-col shadow-sm"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Upcoming & To-Dos</h2>
            <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              {upcoming.length} items
            </span>
          </div>
          {upcoming.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="italic" style={{ color: 'var(--color-muted)' }}>Nothing due soon.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto space-y-2 px-2 py-1">
              {upcoming.map((u, index) => {
                // Handle both regular upcoming items and todos
                const isTodo = u.todo_item;
                const item = isTodo ? u.todo_item : u;
                const title = item.title || item.name;
                const dueDate = item.due_at || item.all_day_date;
                const contextName = item.context_name || (isTodo ? 'Personal Todo' : null);
                const type = isTodo ? 'todo' : (item.type || 'item');
                
                const isAssignment = type === 'assignment' || item.type === 'assignment' || item.todo_item?.type === 'assignment';
                const isClickable = isAssignment && (item.assignment?.id || item.assignment_id || item.todo_item?.assignment_id);
                
                return (
                  <motion.li 
                    key={u.id} 
                    className={`rounded-lg p-3 transition-colors relative z-0 ${isClickable ? 'cursor-pointer' : ''}`}
                    style={{ border: '1px solid var(--color-border)', background: 'var(--color-glass)' }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                    whileHover={isClickable ? { x: 5, zIndex: 10, scale: 1.02 } : { x: 5, zIndex: 10 }}
                    onClick={isClickable ? () => handleAssignmentClick(item) : undefined}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{title}</p>
                        {contextName && (
                          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{contextName}</p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                          {type === 'assignment' ? '📝 Assignment' : 
                           type === 'event' ? '📅 Event' : 
                           type === 'quiz' ? '📋 Quiz' : 
                           type === 'todo' ? '✅ Todo' : '📌 Item'}
                        </p>
                      </div>
                      <div className="text-right">
                        {dueDate ? (
                          <>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>
                              {new Date(dueDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                              {new Date(dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>No due date</p>
                        )}
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {/* Announcements */}
        <motion.section 
          className="rounded-lg p-4 md:p-6 col-span-1 md:col-span-2 min-h-[200px] flex flex-col shadow-sm"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Announcements</h2>
            <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {announcements.length} new
            </span>
          </div>
          {announcements.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="italic" style={{ color: 'var(--color-muted)' }}>No announcements.</p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto space-y-2 px-2 py-1">
              {announcements.map((a, index) => (
                <motion.li 
                  key={a.id} 
                  className="rounded-lg p-3 transition-colors relative z-0 cursor-pointer hover:opacity-80"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-glass)' }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  whileHover={{ x: 5, zIndex: 10, scale: 1.02 }}
                  onClick={() => handleAnnouncementClick(a)}
                >
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>{a.title}</p>
                  {a.message && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                      {a.message.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().substring(0, 150)}
                      {a.message.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                    </p>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </motion.section>
      </motion.div>
      
      <AssignmentModal
        assignment={selectedAssignment}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      
      <AnnouncementModal
        announcement={selectedAnnouncement}
        isOpen={isAnnouncementModalOpen}
        onClose={handleCloseAnnouncementModal}
      />
    </motion.div>
  );
};

export default HomeView; 