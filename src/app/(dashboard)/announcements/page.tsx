import { getCourses, getAnnouncements } from '@/lib/canvas';
import AnnouncementsView from '@/components/AnnouncementsView';
import { getCurrentUserId } from '@/lib/session';

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; from?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { open } = await searchParams;
  const openId = open ? parseInt(open, 10) : undefined;
  try {
    const courses = await getCourses(userId);
    const announcementsArrays = await Promise.all(
      courses.map(async (course: any) => {
        const announcements = await getAnnouncements(userId, course.id);
        return announcements.map((announcement: any) => ({
          ...announcement,
          course_name: course.name,
          course_code: course.course_code,
          course_id: course.id,
        }));
      })
    );
    const announcements = announcementsArrays.flat();
    return <AnnouncementsView announcements={announcements} openId={openId} />;
  } catch (error) {
    console.error('Failed to fetch Canvas announcements', error);
    return <AnnouncementsView announcements={[]} />;
  }
}
