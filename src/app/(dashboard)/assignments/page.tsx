import { Suspense } from 'react';
import { getCourses, getAssignments, getUpcoming } from '@/lib/canvas';
import AssignmentsView from '@/components/AssignmentsView';
import { getCurrentUserId } from '@/lib/session';

type ViewMode = 'upcoming' | 'past' | 'all';

/** Filter assignments based on the selected view mode. */
function filterAssignments(assignments: any[], viewMode: ViewMode): any[] {
  const now = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  if (viewMode === 'all') {
    return assignments;
  }

  if (viewMode === 'past') {
    return assignments.filter((a) => {
      if (!a.due_at) return false;
      const due = new Date(a.due_at);
      return due < now && due.toDateString() !== now.toDateString();
    });
  }

  // 'upcoming' — due today or in the future (up to 6 months)
  return assignments.filter((a) => {
    if (!a.due_at) return false;
    const due = new Date(a.due_at);
    const isToday = due.toDateString() === now.toDateString();
    return (due > now || isToday) && due <= sixMonthsFromNow;
  });
}

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ open?: string; course_id?: string; from?: string; view?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { open, course_id, view } = await searchParams;
  const viewMode: ViewMode =
    view === 'past' ? 'past' : view === 'all' ? 'all' : 'upcoming';
  const openId = open ? parseInt(open, 10) : undefined;
  const openCourseId = course_id ? parseInt(course_id, 10) : undefined;

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
          const assignments = filterAssignments(all, viewMode);
          
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

    return (
      <Suspense fallback={null}>
        <AssignmentsView assignmentsData={mergedData} openId={openId} openCourseId={openCourseId} viewMode={viewMode} />
      </Suspense>
    );
  } catch (error) {
    return (
      <Suspense fallback={null}>
        <AssignmentsView assignmentsData={[]} openId={openId} openCourseId={openCourseId} viewMode={viewMode} />
      </Suspense>
    );
  }
}