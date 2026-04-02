import { getCourses, getUpcoming, getAnnouncements, getUserGrades } from '@/lib/canvas';
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

    // Fetch recently graded submissions across all courses
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const submissionsArrays = await Promise.all(
      courses.map(async (course: any) => {
        const subs = await getUserGrades(userId, course.id);
        return subs
          .filter((s: any) => s.graded_at && new Date(s.graded_at).getTime() >= fourteenDaysAgo)
          .map((s: any) => ({ ...s, course_name: course.name }));
      })
    );
    const recentFeedback = submissionsArrays
      .flat()
      .sort((a: any, b: any) => new Date(b.graded_at).getTime() - new Date(a.graded_at).getTime())
      .slice(0, 5);

    return (
      <HomeView
        courses={courses}
        upcoming={upcoming}
        announcements={announcements}
        recentFeedback={recentFeedback}
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