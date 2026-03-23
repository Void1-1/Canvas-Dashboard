'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import AssignmentModal from './AssignmentModal';

export default function ClassModulesView({ modules }: { modules: any[] }) {
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
  return (
    <PageTransition>
      <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <motion.h1 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--color-text)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          Modules
        </motion.h1>
        {modules.length === 0 ? (
          <div className="glass p-6 rounded-xl" style={{ background: 'var(--color-surface)' }}>
            <p style={{ color: 'var(--color-muted)' }}>No modules found for this course.</p>
          </div>
        ) : (
          <div className="space-y-4 px-1">
            {modules.map((mod: any, index: number) => (
              <ModuleItem 
                key={mod.id} 
                module={mod} 
                index={index}
                onAssignmentClick={handleAssignmentClick}
              />
            ))}
          </div>
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

function ModuleItem({ module, index, onAssignmentClick }: { module: any; index: number; onAssignmentClick: (assignment: any) => void }) {
  const [open, setOpen] = useState(false);
  
  const handleItemClick = async (item: any) => {
    if (item.type === 'Assignment' && item.content_id && module.course_id) {
      try {
        // Fetch full assignment details
        const response = await fetch(`/api/assignments/${item.content_id}?course_id=${module.course_id}`);
        if (response.ok) {
          const assignment = await response.json();
          onAssignmentClick(assignment);
        } else {
          // Fallback to basic assignment info from module item
          const assignment = {
            id: item.content_id,
            name: item.title || item.name,
            description: item.html_url ? null : undefined,
            due_at: item.due_at,
            points_possible: item.points_possible,
            html_url: item.html_url,
            course: module.course_id ? { id: module.course_id } : null
          };
          onAssignmentClick(assignment);
        }
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
        // Fallback to basic assignment info from module item
        const assignment = {
          id: item.content_id,
          name: item.title || item.name,
          description: item.html_url ? null : undefined,
          due_at: item.due_at,
          points_possible: item.points_possible,
          html_url: item.html_url,
          course: module.course_id ? { id: module.course_id } : null
        };
        onAssignmentClick(assignment);
      }
    }
  };
  
  return (
    <motion.div
      className="glass rounded-xl overflow-hidden relative z-0"
      style={{ background: 'var(--color-surface)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ zIndex: 10 }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-4 md:p-6 text-left focus:outline-none hover:opacity-80 transition-opacity"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="inline-block w-5 text-center" style={{ color: 'var(--color-accent)' }}>
            {open ? '▼' : '▶'}
          </span>
          <h2 className="font-semibold text-lg" style={{ color: 'var(--color-text)' }}>
            {module.name}
          </h2>
        </div>
        {module.items_count !== undefined && (
          <span className="text-sm px-2 py-1 rounded" style={{ 
            background: 'rgba(156, 163, 175, 0.1)',
            color: 'var(--color-muted)'
          }}>
            {module.items_count} {module.items_count === 1 ? 'item' : 'items'}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && module.items && module.items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <ul className="px-4 md:px-6 pb-4 md:pb-6 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              {module.items.map((item: any, itemIndex: number) => {
                const isSubHeader = item.type === 'SubHeader';
                const isAssignment = item.type === 'Assignment';
                const isClickable = isAssignment && item.content_id;
                
                return (
                  <motion.li
                    key={item.id}
                    className={isSubHeader ? "mt-4 mb-2 first:mt-0" : ""}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: itemIndex * 0.05 }}
                  >
                    {isSubHeader ? (
                      <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text)' }}>
                        {item.title || item.name}
                      </h3>
                    ) : isClickable ? (
                      <motion.button
                        onClick={() => handleItemClick(item)}
                        className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer relative"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-sm mt-1" style={{ color: 'var(--color-accent)' }}>•</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            {item.title || item.name || 'Untitled Item'}
                          </p>
                          {item.type && (
                            <p className="text-xs mt-1 capitalize" style={{ color: 'var(--color-muted)' }}>
                              {item.type.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </motion.button>
                    ) : (
                      <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <span className="text-sm mt-1" style={{ color: 'var(--color-accent)' }}>•</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                            {item.title || item.name || 'Untitled Item'}
                          </p>
                          {item.type && (
                            <p className="text-xs mt-1 capitalize" style={{ color: 'var(--color-muted)' }}>
                              {item.type.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      {open && (!module.items || module.items.length === 0) && (
        <div className="px-4 md:px-6 pb-4 md:pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>No items in this module.</p>
        </div>
      )}
    </motion.div>
  );
} 