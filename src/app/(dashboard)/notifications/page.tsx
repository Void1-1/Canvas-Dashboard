import { getActivityStream, getCourses } from '@/lib/canvas';
import NotificationsView from '@/components/NotificationsView';
import { getCurrentUserId } from '@/lib/session';

export default async function NotificationsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    const [activities, courses] = await Promise.all([
      getActivityStream(userId),
      getCourses(userId),
    ]);
    return <NotificationsView activities={activities} courses={courses} />;
  } catch (error) {
    console.error('Failed to fetch notifications data', error);
    return <NotificationsView activities={[]} courses={[]} />;
  }
}
