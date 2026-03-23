import { getUserProfile } from '@/lib/canvas';
import { getUserById } from '@/lib/users';
import ProfileView from '@/components/ProfileView';
import { getCurrentUserId } from '@/lib/session';

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const [canvasUser, accountUser] = await Promise.all([
    getUserProfile(userId),
    getUserById(userId),
  ]);
  const dashboardUsername = accountUser?.username ?? null;
  return (
    <ProfileView
      user={canvasUser}
      dashboardUsername={dashboardUsername}
    />
  );
} 