import { getDiscussion, getDiscussionEntries, getCourses } from '@/lib/canvas';
import DiscussionThreadView from '@/components/DiscussionThreadView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function DiscussionThreadPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const { id, topicId } = await params;

  const courseId = Number(id);
  const topicIdNum = Number(topicId);

  if (!Number.isFinite(courseId) || !Number.isFinite(topicIdNum)) {
    return <ErrorCard message="Invalid course or topic ID." />;
  }

  let topic: any = null;
  let entries: any[] = [];

  try {
    topic = await getDiscussion(userId, courseId, topicIdNum);
  } catch {
    return <ErrorCard message="Failed to load discussion topic. Please try again later." />;
  }

  if (!topic || topic.errors) {
    return <ErrorCard message="Discussion topic not found." />;
  }

  try {
    entries = await getDiscussionEntries(userId, courseId, topicIdNum);
  } catch {
    // non-fatal — render thread without entries
    entries = [];
  }

  return (
    <DiscussionThreadView
      topic={topic}
      entries={entries}
      courseId={courseId}
      topicId={topicIdNum}
    />
  );
}
