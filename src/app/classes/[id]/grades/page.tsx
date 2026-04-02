import { getUserGrades, getAssignments, getCourses, getStudentGrades, getGradingPeriods } from '@/lib/canvas';
import ClassGradesView from '@/components/ClassGradesView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function GradesPage({ params }: { params: Promise<{ id: string }> }) {
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

  const courseId = Number(id);
  let grades = [];
  let courseGrade: { currentScore?: number | null; finalScore?: number | null; currentGrade?: string | null; finalGrade?: string | null } | null = null;
  let gradingPeriods: any[] = [];

  try {
    const [assignments, submissions, enrollments, periods] = await Promise.all([
      getAssignments(userId, courseId),
      getUserGrades(userId, courseId),
      getStudentGrades(userId, courseId),
      getGradingPeriods(userId, courseId),
    ]);

    gradingPeriods = periods;

    // Extract overall course grade from enrollment
    const enrollment = Array.isArray(enrollments) ? enrollments[0] : null;
    if (enrollment?.grades) {
      courseGrade = {
        currentScore: enrollment.grades.current_score ?? null,
        finalScore: enrollment.grades.final_score ?? null,
        currentGrade: enrollment.grades.current_grade ?? null,
        finalGrade: enrollment.grades.final_grade ?? null,
      };
    }

    // Combine assignments with their grades
    grades = assignments.map((assignment: any) => {
      const submission = submissions.find((s: any) => s.assignment_id === assignment.id);
      return {
        ...assignment,
        submission: submission || null,
        score: submission?.score ?? null,
        grade: submission?.grade ?? null,
        workflow_state: submission?.workflow_state ?? 'unsubmitted'
      };
    });
  } catch (error) {
    console.error('Failed to fetch grades:', error);
  }

  return <ClassGradesView grades={grades} courseGrade={courseGrade} gradingPeriods={gradingPeriods} />;
} 