import { getCourses } from '@/lib/canvas';
import ClassesView from '@/components/ClassesView';
import { getCurrentUserId } from '@/lib/session';

export default async function ClassesPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  let courses = [];
  try {
    courses = await getCourses(userId);
  } catch {}
  return <ClassesView courses={courses} />;
} 