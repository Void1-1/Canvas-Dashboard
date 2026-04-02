import { getCourseFiles, getCourse } from '@/lib/canvas';
import CourseFilesView from '@/components/CourseFilesView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function FilesPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const { id } = await params;

  let course = null;
  let files: any[] = [];

  try {
    [course, files] = await Promise.all([
      getCourse(userId, Number(id)),
      getCourseFiles(userId, Number(id)),
    ]);
  } catch {
    return <ErrorCard message="Failed to load course files. Please try again later." />;
  }

  if (!course) {
    return <ErrorCard message="Course not found." />;
  }

  return <CourseFilesView files={files} courseName={course.name} />;
}
