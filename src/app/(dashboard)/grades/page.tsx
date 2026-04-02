import { getCourses, getStudentGrades } from '@/lib/canvas';
import GradesView from '@/components/GradesView';
import { getCurrentUserId } from '@/lib/session';

export default async function GradesPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    const courses = await getCourses(userId);
    const gradesData = await Promise.all(
      courses.map(async (course) => {
        try {
          const raw = await getStudentGrades(userId, course.id);
          const enrollments = Array.isArray(raw) ? raw : raw ? [raw] : [];
          return { course, enrollments };
        } catch {
          return { course, enrollments: [] };
        }
      })
    );

    return <GradesView gradesData={gradesData} />;
  } catch (error) {
    return <GradesView gradesData={[]} />;
  }
} 