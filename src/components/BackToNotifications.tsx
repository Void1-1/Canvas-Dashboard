'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

/** Shows a "Back to Notifications" bar when navigated from the notifications page. */
export default function BackToNotifications() {
  const searchParams = useSearchParams();
  if (searchParams.get('from') !== 'notifications') return null;

  return (
    <Link
      href="/notifications"
      className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-opacity hover:opacity-70"
      style={{ color: 'var(--color-muted)' }}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Notifications
    </Link>
  );
}
