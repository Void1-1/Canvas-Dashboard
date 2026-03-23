import { getUpcoming, getCourses, getAssignments } from '@/lib/canvas';
import CalendarView from '@/components/CalendarView';
import { getCurrentUserId } from '@/lib/session';

export default async function CalendarPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    let upcoming = await getUpcoming(userId).catch(() => []);
    if (!Array.isArray(upcoming)) upcoming = [];
    
    // Process upcoming events to normalize their structure
    const processedUpcoming = upcoming.map((event: any) => {
      // Handle different event structures from Canvas API
      const plannable = event.plannable || event;
      const plannableType = event.plannable_type || event.type || plannable.type;
      const context = event.context || {};
      const contextType = event.context_type;
      
      // Determine the date field (could be start_at, due_at, all_day_date, etc.)
      const dateStr = 
        event.start_at || 
        event.due_at || 
        event.all_day_date || 
        plannable.start_at || 
        plannable.due_at || 
        plannable.all_day_date;
      
      // Determine the title
      const title = 
        event.title || 
        plannable.title || 
        plannable.name || 
        event.name;
      
      // Determine context name
      const contextName = 
        context.name || 
        event.context_name || 
        (contextType === 'Course' ? context.name : 'Personal');
      
      // Determine type
      let type = 'event';
      if (plannableType) {
        if (plannableType.toLowerCase().includes('assignment')) type = 'assignment';
        else if (plannableType.toLowerCase().includes('quiz')) type = 'quiz';
        else if (plannableType.toLowerCase().includes('event') || plannableType.toLowerCase().includes('calendar')) type = 'event';
        else if (plannableType.toLowerCase().includes('discussion')) type = 'discussion';
        else type = plannableType.toLowerCase();
      }
      
      // Better ID extraction for assignments
      let assignmentId = null;
      let courseId = null;
      
      if (type === 'assignment' || plannableType?.toLowerCase().includes('assignment')) {
        // Try multiple ways to get assignment ID
        assignmentId = 
          plannable.id || 
          event.plannable_id || 
          plannable.assignment_id ||
          event.assignment_id ||
          (plannableType === 'assignment' ? event.plannable_id : null);
        
        // Try multiple ways to get course ID
        courseId = 
          (contextType === 'Course' ? context.id : null) ||
          event.context_id ||
          plannable.course_id ||
          context.course_id ||
          (contextType === 'Course' ? event.context_id : null);
      }
      
      return {
        id: event.id || `event-${Date.now()}-${Math.random()}`,
        title,
        due_at: dateStr,
        all_day_date: event.all_day_date || plannable.all_day_date,
        start_at: event.start_at || plannable.start_at,
        type,
        html_url: event.html_url || plannable.html_url,
        context_name: contextName,
        course_id: courseId || (contextType === 'Course' ? context.id : null),
        assignment_id: assignmentId,
        plannable_type: plannableType,
        plannable: plannable,
        context: context,
        context_type: contextType,
        // Preserve original structure for compatibility
        ...event
      };
    });
    
    const courses = await getCourses(userId).catch(() => []);
    const assignmentPromises = courses.map((course: any) => 
      getAssignments(userId, course.id)
        .then((assignments: any[]) => 
          assignments.map((assignment: any) => ({
            ...assignment,
            course_id: course.id,
            course_name: course.name
          }))
        )
        .catch(() => [])
    );
    const assignmentArrays = await Promise.all(assignmentPromises);
    const allAssignments = assignmentArrays.flat();
    
    // Create a map to track existing events and prevent duplicates
    // For assignments: use assignment_id + course_id (without date) to prevent duplicates with different date formats
    // For other events: use title + context + normalized date
    const eventMap = new Map<string, any>();
    
    // Helper function to normalize date (handles all_day_date vs due_at)
    const normalizeDate = (event: any): string => {
      const dateStr = event.due_at || event.start_at || event.all_day_date || '';
      if (!dateStr) return '';
      // Normalize to just the date part (YYYY-MM-DD)
      return dateStr.slice(0, 10);
    };
    
    // First, add all processed upcoming events
    processedUpcoming.forEach((event: any) => {
      // Create unique key for duplicate detection
      let key: string;
      if (event.type === 'assignment' && event.assignment_id && event.course_id) {
        // For assignments with IDs, use assignment_id + course_id (ignore date to catch duplicates)
        key = `assignment-${event.assignment_id}-${event.course_id}`;
      } else if (event.type === 'assignment' && event.title && event.context_name) {
        // For assignments without IDs, use title + context + normalized date
        const dateKey = normalizeDate(event);
        key = `assignment-title-${event.title}-${event.context_name}-${dateKey}`;
      } else {
        // For other events, use type + title + context + normalized date
        const dateKey = normalizeDate(event);
        key = `${event.type}-${event.title}-${event.context_name || 'unknown'}-${dateKey}`;
      }
      
      // Only add if we don't already have this event
      if (!eventMap.has(key)) {
        eventMap.set(key, event);
      } else {
        // If duplicate exists, prefer the one with more complete data (has IDs, or better date info)
        const existing = eventMap.get(key);
        const hasBetterData = 
          (event.assignment_id && event.course_id && (!existing.assignment_id || !existing.course_id)) ||
          (event.due_at && !existing.due_at) ||
          (event.html_url && !existing.html_url);
        
        if (hasBetterData) {
          eventMap.set(key, event);
        }
      }
    });
    
    // Then add assignments from courses (only if not already present)
    allAssignments.forEach((assignment: any) => {
      if (!assignment.due_at) return;
      
      // Use assignment_id + course_id as key (without date)
      const key = `assignment-${assignment.id}-${assignment.course_id}`;
      
      // Only add if not already in the map
      if (!eventMap.has(key)) {
        eventMap.set(key, {
          id: `assignment-${assignment.id}`,
          title: assignment.name,
          due_at: assignment.due_at,
          type: 'assignment',
          html_url: assignment.html_url,
          context_name: assignment.course_name || 'Assignment',
          course_id: assignment.course_id,
          assignment_id: assignment.id
        });
      } else {
        // If it exists, merge/update with better data if needed
        const existing = eventMap.get(key);
        if (!existing.due_at && assignment.due_at) {
          existing.due_at = assignment.due_at;
        }
        if (!existing.html_url && assignment.html_url) {
          existing.html_url = assignment.html_url;
        }
      }
    });
    
    // Convert map values to array
    const allEvents = Array.from(eventMap.values());
    
    return <CalendarView upcoming={allEvents} />;
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    return <CalendarView upcoming={[]} />;
  }
} 