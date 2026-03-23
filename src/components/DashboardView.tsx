'use client';
import HomeView from './HomeView';
import PageTransition from './PageTransition';

export default function DashboardView({ courses, upcoming, announcements }: { courses: any[]; upcoming: any[]; announcements: any[] }) {
  return (
    <PageTransition>
      <HomeView courses={courses} upcoming={upcoming} announcements={announcements} />
    </PageTransition>
  );
} 