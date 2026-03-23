import { getCourses, getUpcoming, getAnnouncements } from '@/lib/canvas';
import HomeView from '@/components/HomeView';
import { getCurrentUserId } from '@/lib/session';

export default async function HomePage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    const courses = await getCourses(userId);
    const upcoming = await getUpcoming(userId);
    const announcementsArrays = await Promise.all(
      courses.map((course: any) => getAnnouncements(userId, course.id))
    );
    const announcements = announcementsArrays.flat();

    return (
      <HomeView
        courses={courses}
        upcoming={upcoming}
        announcements={announcements}
      />
    );
  } catch (error) {
    console.error('Failed to fetch Canvas data', error);
    return (
      <div className="glass p-6 max-w-lg mx-auto mt-10 text-center">
        <h2 className="card-title">Unable to load Canvas data</h2>
        <p className="text-muted text-sm">
          An unexpected error occurred. Please try again later.
        </p>
      </div>
    );
  }
} 