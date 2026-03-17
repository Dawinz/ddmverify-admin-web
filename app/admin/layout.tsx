'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

const nav = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/agents', label: 'Agents' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/verification', label: 'Verification' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.replace('/login');
        return;
      }
      try {
        const { user } = await apiGet<{ user: { role: string } }>('/users/me', session.access_token);
        if (user?.role !== 'admin') {
          setDenied(true);
          setReady(true);
          return;
        }
      } catch {
        router.replace('/login');
        return;
      }
      setReady(true);
    })();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  if (!ready) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>Loading…</div>
    );
  }
  if (denied) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p>Access denied. Admin role required.</p>
        <button type="button" className="btn btn-primary" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#1e293b', color: 'white', padding: 24 }}>
        <h2 style={{ margin: '0 0 24px', fontSize: 18 }}>DDM Verify</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                color: pathname === href ? '#93c5fd' : '#e2e8f0',
                padding: '8px 12px',
                borderRadius: 6,
                background: pathname === href ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={signOut}
          className="btn"
          style={{ marginTop: 32, background: 'rgba(255,255,255,0.15)', color: 'white' }}
        >
          Sign out
        </button>
      </aside>
      <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
