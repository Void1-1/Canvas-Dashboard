import { getPages, getCourses } from '@/lib/canvas';
import CoursePagesView from '@/components/CoursePagesView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function CoursePagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const { id } = await params;

  let course = null;
  try {
    const courses = await getCourses(userId);
    course = courses.find((c: any) => String(c.id) === id);
  } catch {
    return <ErrorCard message="Failed to load course data. Please try again later." />;
  }

  if (!course) {
    return <ErrorCard message="Course not found." />;
  }

  let pages: any[] = [];
  try {
    pages = await getPages(userId, Number(id));
  } catch {
    return <ErrorCard message="Failed to load pages. Please try again later." />;
  }

  return <CoursePagesView pages={pages} courseId={id} />;
}
