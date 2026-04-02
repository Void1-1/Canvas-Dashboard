import { getEnrollments, getCourses } from '@/lib/canvas';
import ClassPeopleView from '@/components/ClassPeopleView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function PeoplePage({ params }: { params: Promise<{ id: string }> }) {
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
  const enrollments = await getEnrollments(userId, Number(id));
  return <ClassPeopleView enrollments={enrollments} />;
} 