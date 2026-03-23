import { getCourses, getAssignments, getUpcoming } from '@/lib/canvas';
import AssignmentsView from '@/components/AssignmentsView';
import { getCurrentUserId } from '@/lib/session';

/** Keep only assignments due today or upcoming, and not more than one month away. */
function filterUpcomingAssignments(assignments: any[]): any[] {
  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

  return assignments.filter((a) => {
    if (!a.due_at) return false;
    const due = new Date(a.due_at);
    const isToday = due.toDateString() === now.toDateString();
    return (due > now || isToday) && due <= oneMonthFromNow;
  });
}

export default async function AssignmentsPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    let upcoming = await getUpcoming(userId).catch(() => []);
    if (!Array.isArray(upcoming)) upcoming = [];
    
    // Extract assignments from upcoming events
    const upcomingAssignments = upcoming
      .filter((event: any) => event.type === 'assignment')
      .map((event: any) => {
        const assignment = event.assignment || {};
        
        // Extract course ID from context_code (format: "course_2970")
        let courseId = null;
        if (event.context_code && event.context_code.startsWith('course_')) {
          courseId = parseInt(event.context_code.replace('course_', ''));
        }
        
        // Get due date from multiple possible locations
        const dueDate = 
          assignment.due_at || 
          event.end_at || 
          event.start_at || 
          event.due_at;
        
        return {
          id: assignment.id || event.id,
          name: event.title || assignment.name,
          due_at: dueDate,
          html_url: event.html_url || assignment.html_url,
          points_possible: assignment.points_possible,
          description: event.description || assignment.description,
          course_id: courseId,
          course_name: event.context_name
        };
      });

    const courses = await getCourses(userId);
    const assignmentsData = await Promise.all(
      courses.map(async (course) => {
        try {
          const courseAssignments = await getAssignments(userId, course.id);
          
          // Combine with upcoming assignments for this course
          const upcomingForCourse = upcomingAssignments.filter(
            (a: any) => a.course_id === course.id
          );
          
          // Create a map to deduplicate (prefer course assignments API data)
          const assignmentMap = new Map();
          
          // Add course assignments first
          courseAssignments.forEach((a: any) => {
            assignmentMap.set(a.id, { ...a, course_name: course.name });
          });
          
          // Add upcoming assignments if not already present
          upcomingForCourse.forEach((a: any) => {
            if (!assignmentMap.has(a.id)) {
              assignmentMap.set(a.id, a);
            }
          });
          
          const all = Array.from(assignmentMap.values());
          const assignments = filterUpcomingAssignments(all);
          
          return { course, assignments };
        } catch {
          return { course, assignments: [] };
        }
      })
    );

    // Merge sections that share the same course name (Canvas can return multiple
    // sections of the same course as separate entries with identical names).
    const mergedData = assignmentsData.reduce<typeof assignmentsData>(
      (acc, { course, assignments }) => {
        const existing = acc.find((e) => e.course.name === course.name);
        if (existing) {
          const seen = new Set(existing.assignments.map((a: any) => a.id));
          for (const a of assignments) {
            if (!seen.has(a.id)) {
              existing.assignments.push(a);
              seen.add(a.id);
            }
          }
        } else {
          acc.push({ course, assignments: [...assignments] });
        }
        return acc;
      },
      []
    );

    return <AssignmentsView assignmentsData={mergedData} />;
  } catch (error) {
    return <AssignmentsView assignmentsData={[]} />;
  }
}