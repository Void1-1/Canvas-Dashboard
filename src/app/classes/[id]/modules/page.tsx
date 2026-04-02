import { getModules, getCourses } from '@/lib/canvas';
import ClassModulesView from '@/components/ClassModulesView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function ModulesPage({ params }: { params: Promise<{ id: string }> }) {
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
  const modules = await getModules(userId, Number(id));
  // Add course_id to each module for assignment clicks
  const modulesWithCourseId = modules.map((mod: any) => ({
    ...mod,
    course_id: Number(id)
  }));
  return <ClassModulesView modules={modulesWithCourseId} />;
} 