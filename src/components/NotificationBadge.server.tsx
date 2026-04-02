import { getActivityStream } from '@/lib/canvas';
import { getCurrentUserId } from '@/lib/session';

export default async function NotificationBadge() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const activities = await getActivityStream(userId);
    if (!Array.isArray(activities)) return null;
    const unreadCount = activities.filter((a: any) => a.read_state === 'unread').length;
    if (unreadCount === 0) return null;
    return (
      <span
        className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-white min-w-[1.5rem] text-center leading-4"
        style={{ background: '#e74c3c', border: '2px solid var(--color-bg)' }}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    );
  } catch {
    return null;
  }
}
