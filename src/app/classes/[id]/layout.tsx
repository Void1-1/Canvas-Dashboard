'use client';

import CollapsedSidebar from '@/components/CollapsedSidebar';
import CourseNavSidebar from '@/components/CourseNavSidebar';
import CourseMobileHeader from '@/components/CourseMobileHeader';
import { motion } from 'framer-motion';
import React from 'react';

export default function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  // Only render CollapsedSidebar and CourseNavSidebar, not the main Sidebar
  // Removed AnimatePresence and exit animations to prevent memory leaks
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <motion.div
        key="collapsed-sidebar"
        initial={{ width: 64, opacity: 0, x: -20 }}
        animate={{ width: 64, opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-40"
      >
        <CollapsedSidebar />
      </motion.div>
      <motion.div
        key="course-nav-sidebar"
        initial={{ width: 192, opacity: 0, x: -20 }}
        animate={{ width: 192, opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative z-30"
      >
        <CourseNavSidebar courseId={id} />
      </motion.div>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile-only sticky header with back button + course section nav */}
        <CourseMobileHeader courseId={id} />
        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
} 