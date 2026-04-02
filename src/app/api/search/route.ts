import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/session';
import {
  getCourses,
  getAssignments,
  getAnnouncements,
  getDiscussions,
  getPages,
} from '@/lib/canvas';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ courses: [], assignments: [], announcements: [], discussions: [], pages: [] });
  }

  try {
    const courses = await getCourses(userId);

    // Filter courses by name/code
    const matchedCourses = courses
      .filter((c: any) =>
        c.name?.toLowerCase().includes(q) || c.course_code?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c: any) => ({
        id: c.id,
        name: c.name,
        subtitle: c.course_code,
        href: `/classes/${c.id}`,
        type: 'course',
      }));

    // Search across first 8 courses to keep latency reasonable
    const searchCourses = courses.slice(0, 8);

    const [assignmentResults, announcementResults, discussionResults, pageResults] =
      await Promise.all([
        Promise.all(searchCourses.map((c: any) => getAssignments(userId, c.id).catch(() => []))),
        Promise.all(searchCourses.map((c: any) => getAnnouncements(userId, c.id).catch(() => []))),
        Promise.all(searchCourses.map((c: any) => getDiscussions(userId, c.id).catch(() => []))),
        Promise.all(searchCourses.map((c: any) => getPages(userId, c.id).catch(() => []))),
      ]);

    const courseMap: Record<number, string> = {};
    for (const c of courses) courseMap[c.id] = c.name;

    const matchedAssignments = assignmentResults
      .flat()
      .filter((a: any) => a.name?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        subtitle: courseMap[a.course_id] ?? `Course ${a.course_id}`,
        href: `/assignments`,
        type: 'assignment',
      }));

    const matchedAnnouncements = announcementResults
      .flat()
      .filter((a: any) => a.title?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((a: any) => {
        const courseId = a.context_code?.replace('course_', '');
        return {
          id: a.id,
          name: a.title,
          subtitle: courseId ? courseMap[Number(courseId)] : undefined,
          href: courseId ? `/classes/${courseId}/announcements` : '/announcements',
          type: 'announcement',
        };
      });

    const matchedDiscussions = discussionResults
      .flat()
      .filter((d: any) => d.title?.toLowerCase().includes(q))
      .slice(0, 5)
      .map((d: any) => ({
        id: d.id,
        name: d.title,
        subtitle: d.course_id ? courseMap[d.course_id] : undefined,
        href: d.course_id ? `/classes/${d.course_id}/discussions/${d.id}` : '/classes',
        type: 'discussion',
      }));

    const matchedPages = pageResults
      .flatMap((coursePages: any[], idx: number) => {
        const courseId = searchCourses[idx]?.id;
        return (coursePages as any[])
          .filter((p: any) => p.title?.toLowerCase().includes(q))
          .map((p: any) => ({
            id: p.page_id ?? p.url,
            name: p.title,
            subtitle: courseId ? courseMap[courseId] : undefined,
            href: courseId ? `/classes/${courseId}/pages/${p.url}` : '/classes',
            type: 'page' as const,
          }));
      })
      .slice(0, 5);

    return NextResponse.json({
      courses: matchedCourses,
      assignments: matchedAssignments,
      announcements: matchedAnnouncements,
      discussions: matchedDiscussions,
      pages: matchedPages,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
