import React from 'react';
import Link from 'next/link';

export default function ErrorCard({ message, backHref = '/classes', backLabel = '← Back to Classes' }: { message: string; backHref?: string; backLabel?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--color-bg)' }}>
      <div className="rounded-xl shadow p-8 max-w-md w-full text-center" style={{ background: 'var(--color-surface)' }}>
        <div className="text-2xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>{message}</div>
        <Link href={backHref}>
          <button className="mt-6 px-5 py-2 rounded-lg bg-accent text-white font-medium shadow hover:bg-accent/90 transition-colors">
            {backLabel}
          </button>
        </Link>
      </div>
    </div>
  );
} 