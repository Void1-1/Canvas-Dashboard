import { getSyllabus } from '@/lib/canvas';
import SyllabusView from '@/components/SyllabusView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function SyllabusPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const { id } = await params;

  let course = null;
  try {
    course = await getSyllabus(userId, Number(id));
  } catch {
    return <ErrorCard message="Failed to load syllabus. Please try again later." />;
  }

  if (!course) {
    return <ErrorCard message="Course not found." />;
  }

  return <SyllabusView course={course} />;
}
