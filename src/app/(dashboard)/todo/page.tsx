import { getCourses, getAssignments, getUpcoming } from '@/lib/canvas';
import TodoView from '@/components/TodoView';
import { getCurrentUserId } from '@/lib/session';

export default async function TodoPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  try {
    let upcoming = await getUpcoming(userId).catch(() => []);
    if (!Array.isArray(upcoming)) upcoming = [];

    const upcomingAssignments = upcoming
      .filter((event: any) => event.type === 'assignment')
      .map((event: any) => {
        const assignment = event.assignment || {};
        let courseId = null;
        if (event.context_code && event.context_code.startsWith('course_')) {
          courseId = parseInt(event.context_code.replace('course_', ''));
        }
        const dueDate = assignment.due_at || event.end_at || event.start_at || event.due_at;
        return {
          id: String(assignment.id || event.id),
          name: event.title || assignment.name,
          due_at: dueDate,
          html_url: event.html_url || assignment.html_url,
          points_possible: assignment.points_possible ?? null,
          submission_types: assignment.submission_types ?? [],
          course_id: courseId,
          course_name: event.context_name ?? null,
        };
      });

    const courses = await getCourses(userId);
    const assignmentsByCourse = await Promise.all(
      courses.map(async (course) => {
        try {
          const courseAssignments = await getAssignments(userId, course.id);
          return courseAssignments.map((a: any) => ({
            id: String(a.id),
            name: a.name,
            due_at: a.due_at,
            html_url: a.html_url,
            points_possible: a.points_possible ?? null,
            submission_types: a.submission_types ?? [],
            course_id: course.id,
            course_name: course.name,
          }));
        } catch {
          return [];
        }
      })
    );

    // Flatten and deduplicate; course API data wins
    const assignmentMap = new Map<string, any>();
    for (const a of upcomingAssignments) {
      assignmentMap.set(a.id, a);
    }
    for (const list of assignmentsByCourse) {
      for (const a of list) {
        assignmentMap.set(a.id, a);
      }
    }

    const now = new Date();
    const allAssignments = Array.from(assignmentMap.values()).filter((a) => {
      if (!a.due_at) return false;
      return new Date(a.due_at) >= now;
    });

    return <TodoView assignments={allAssignments} />;
  } catch {
    return <TodoView assignments={[]} />;
  }
}
