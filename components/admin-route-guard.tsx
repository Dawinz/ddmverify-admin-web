'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.access_token) {
        router.replace(`/login?next=${encodeURIComponent(pathname || '/admin')}`);
        return;
      }
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (!ready) {
    return <p style={{ padding: 24 }}>Checking admin session...</p>;
  }
  return <>{children}</>;
}
