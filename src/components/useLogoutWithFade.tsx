import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useLogoutWithFade() {
  const [isFading, setIsFading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsFading(true);
    setTimeout(async () => {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
    }, 500); // match fade duration
  };

  return { isFading, handleLogout };
} 