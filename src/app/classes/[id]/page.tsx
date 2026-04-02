import { getCourses, getAnnouncements, getAssignments, getFrontPage, getSyllabus } from '@/lib/canvas';
import ClassHomeView from '@/components/ClassHomeView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function ClassHomePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const { id } = await params;
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

  const courseId = Number(id);
  const [announcements, assignments, frontPage, syllabus] = await Promise.all([
    getAnnouncements(userId, courseId).catch(() => []),
    getAssignments(userId, courseId).catch(() => []),
    course.default_view === 'wiki' ? getFrontPage(userId, courseId).catch(() => null) : Promise.resolve(null),
    course.default_view === 'syllabus' ? getSyllabus(userId, courseId).catch(() => null) : Promise.resolve(null),
  ]);

  return <ClassHomeView course={course} announcements={announcements} assignments={assignments} frontPage={frontPage} syllabus={syllabus} />;
} 