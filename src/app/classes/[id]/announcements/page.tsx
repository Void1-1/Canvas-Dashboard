import { getAnnouncements, getCourses } from '@/lib/canvas';
import ClassAnnouncementsView from '@/components/ClassAnnouncementsView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AnnouncementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ open?: string; from?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const { id } = await params;
  const { open } = await searchParams;
  const openId = open ? parseInt(open, 10) : undefined;
  let course = null;
  try {
    const courses = await getCourses(userId);
    course = courses.find((c) => String(c.id) === id);
  } catch (error) {
    return <ErrorCard message="Failed to load course data. Please try again later." />;
  }
  if (!course) {
    return <ErrorCard message="Course not found." />;
  }
  const announcements = await getAnnouncements(userId, Number(id));
  return <ClassAnnouncementsView announcements={announcements} openId={openId} />;
} 