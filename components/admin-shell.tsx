'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, LogOut, Plus } from 'lucide-react';

import { adminNav } from '@/lib/admin-nav';
import { apiGet } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type MeUser = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      try {
        const data = await apiGet<{ user: MeUser }>('/users/me', token);
        if (!cancelled) setMe(data.user ?? null);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const displayName = me?.full_name?.trim() || me?.email?.split('@')[0] || 'Admin';

  return (
    <div className="admin-app">
      <aside className="admin-rail" aria-label="Primary navigation">
        <div className="rail-brand">
          <Link href="/admin" title="DDM Verify Admin home">
            <img src="/ddm-icon.png" alt="DDM Verify" width={40} height={40} className="rail-logo" />
          </Link>
        </div>
        <nav className="rail-nav">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={`rail-link${pathname === href ? ' active' : ''}`}
            >
              <Icon size={22} strokeWidth={1.75} />
            </Link>
          ))}
        </nav>
        <div className="rail-footer">
          <Link href="/admin/payment-methods" className="rail-add" title="Payment controls">
            <Plus size={22} />
          </Link>
          <button type="button" className="rail-logout" title="Sign out" onClick={() => void handleLogout()}>
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      <div className="admin-frame">
        <header className="admin-topbar">
          <div className="topbar-left">
            <span className="topbar-eyebrow">DDM Verify</span>
            <span className="topbar-title">Operations dashboard</span>
          </div>
          <div className="topbar-right">
            <Link href="/admin/notifications" className="topbar-bell" title="Notifications">
              <Bell size={22} />
            </Link>
            <div className="topbar-user">
              <div className="topbar-avatar" aria-hidden>
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="topbar-user-text">
                <span className="topbar-name">{displayName}</span>
                <span className="topbar-role">Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
