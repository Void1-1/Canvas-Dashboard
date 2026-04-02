import { getConversations } from '@/lib/canvas';
import InboxView from '@/components/InboxView';
import { getCurrentUserId } from '@/lib/session';

export default async function InboxPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    const conversations = await getConversations(userId);
    return <InboxView conversations={conversations} />;
  } catch (error) {
    console.error('Failed to fetch Canvas conversations', error);
    return <InboxView conversations={[]} />;
  }
}
