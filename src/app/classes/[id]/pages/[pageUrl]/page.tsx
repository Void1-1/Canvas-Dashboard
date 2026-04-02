import { getPage } from '@/lib/canvas';
import CoursePageView from '@/components/CoursePageView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function CoursePageDetailPage({
  params,
}: {
  params: Promise<{ id: string; pageUrl: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const { id, pageUrl } = await params;

  let page: any = null;
  try {
    page = await getPage(userId, Number(id), decodeURIComponent(pageUrl));
  } catch {
    return <ErrorCard message="Failed to load page. Please try again later." />;
  }

  if (!page) {
    return <ErrorCard message="Page not found." />;
  }

  return <CoursePageView page={page} courseId={id} />;
}
