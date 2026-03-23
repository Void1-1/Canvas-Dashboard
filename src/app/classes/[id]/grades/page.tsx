import { getUserGrades, getAssignments, getCourses } from '@/lib/canvas';
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
  let assignments = [];
  
  try {
    assignments = await getAssignments(userId, courseId);
    const submissions = await getUserGrades(userId, courseId);
    
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
  
  return <ClassGradesView grades={grades} />;
} 