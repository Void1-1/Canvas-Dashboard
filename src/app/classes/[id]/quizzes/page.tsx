import { getQuizzes } from '@/lib/canvas';
import CourseQuizzesView from '@/components/CourseQuizzesView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function QuizzesPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const { id } = await params;

  let quizzes: any[] = [];
  try {
    quizzes = await getQuizzes(userId, Number(id));
  } catch {
    return <ErrorCard message="Failed to load quizzes. Please try again later." />;
  }

  return <CourseQuizzesView quizzes={quizzes} />;
}
