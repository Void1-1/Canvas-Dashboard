import { getAssignments, getCourses, getUpcoming } from '@/lib/canvas';
import ClassAssignmentsView from '@/components/ClassAssignmentsView';
import ErrorCard from '@/components/ErrorCard';
import { getCurrentUserId } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AssignmentsPage({ params }: { params: Promise<{ id: string }> }) {
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
  
  let assignments = await getAssignments(userId, Number(id));
  
  try {
    const upcoming = await getUpcoming(userId);
    
    const upcomingForThisCourse = upcoming
      .filter((event: any) => {
        if (event.type !== 'assignment') return false;
        
        // Extract course ID from context_code (format: "course_2970")
        if (event.context_code && event.context_code.startsWith('course_')) {
          const courseId = parseInt(event.context_code.replace('course_', ''));
          return courseId === Number(id);
        }
        return false;
      })
      .map((event: any) => {
        const assignment = event.assignment || {};
        const dueDate = assignment.due_at || event.end_at || event.start_at || event.due_at;
        
        return {
          id: assignment.id || event.id,
          name: event.title || assignment.name,
          due_at: dueDate,
          html_url: event.html_url || assignment.html_url,
          points_possible: assignment.points_possible,
          description: event.description || assignment.description,
        };
      });
    
    // Merge assignments, avoiding duplicates
    const assignmentMap = new Map();
    assignments.forEach((a: any) => assignmentMap.set(a.id, a));
    upcomingForThisCourse.forEach((a: any) => {
      if (!assignmentMap.has(a.id)) {
        assignmentMap.set(a.id, a);
      }
    });
    
    assignments = Array.from(assignmentMap.values());
  } catch (error) {
    // If upcoming events fail, just use what we have
  }
  
  // Sort by due date (oldest to newest)
  assignments.sort((a: any, b: any) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });
  
  return <ClassAssignmentsView assignments={assignments} courseId={Number(id)} />;
}