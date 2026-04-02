import { getDiscussions, getCourses } from '@/lib/canvas';
import DiscussionsView from '@/components/DiscussionsView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DiscussionsPage({
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

  let discussions: any[] = [];
  try {
    discussions = await getDiscussions(userId, Number(id));
  } catch {
    return <ErrorCard message="Failed to load discussions. Please try again later." />;
  }

  return <DiscussionsView discussions={discussions} courseId={Number(id)} />;
}
