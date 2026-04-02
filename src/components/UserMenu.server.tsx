import { getUserProfile } from '@/lib/canvas';
import UserMenuClient from './UserMenuClient';
import { getCurrentUserId } from '@/lib/session';
import { cache } from 'react';

const getCachedUserProfile = cache(async (userId: string) => {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 2000)
    );
    return await Promise.race([
      getUserProfile(userId),
      timeoutPromise
    ]) as any;
  } catch {
    return null;
  }
});

export default async function UserMenu() {
  const userId = await getCurrentUserId();
  if (!userId) return <UserMenuClient user={null} />;
  const user = await getCachedUserProfile(userId);
  return <UserMenuClient user={user} />;
} 