'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronLeft, ChevronRight, LogOut, Plus } from 'lucide-react';

import { adminNav } from '@/lib/admin-nav';
import { apiGet } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const RAIL_EXPANDED_KEY = 'ddm-admin-rail-expanded';

type MeUser = {
  id?: string;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
};

function navActive(href: string, pathname: string): boolean {
  if (href === '/admin') return pathname === '/admin' || pathname === '/admin/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageHeading(pathname: string): { eyebrow: string; title: string } {
  const sorted = [...adminNav].sort((a, b) => b.href.length - a.href.length);
  const hit = sorted.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  if (!hit) return { eyebrow: 'DDM Verify Admin', title: 'Admin' };
  if (pathname === '/admin' || pathname === '/admin/') {
    return { eyebrow: 'Operations center', title: 'Dashboard' };
  }
  return { eyebrow: 'Admin workspace', title: hit.label };
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [railExpanded, setRailExpanded] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(RAIL_EXPANDED_KEY) === '1') setRailExpanded(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth < 900) setRailExpanded(false);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [userMenuOpen]);

  function toggleRail() {
    setRailExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RAIL_EXPANDED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function requestLogout() {
    setUserMenuOpen(false);
    if (typeof window !== 'undefined' && !window.confirm('Sign out of DDM Verify Admin?')) return;
    void handleLogout();
  }

  const displayName = me?.full_name?.trim() || me?.email?.split('@')[0] || 'Admin';
  const { eyebrow, title } = pageHeading(pathname);

  return (
    <div className={`admin-app${railExpanded ? ' rail-expanded' : ''}`}>
      <aside className="admin-rail" aria-label="Primary navigation">
        <button
          type="button"
          className="rail-expand-toggle"
          onClick={toggleRail}
          aria-expanded={railExpanded}
          aria-label={railExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {railExpanded ? <ChevronLeft size={18} strokeWidth={2} /> : <ChevronRight size={18} strokeWidth={2} />}
        </button>

        <div className="rail-brand">
          <Link href="/admin" className="rail-brand-link" title="DDM Verify Admin home">
            <img src="/ddm-logo-mark.svg" alt="DDM Verify" className="rail-logo" width={34} height={34} />
            {railExpanded && <span className="rail-brand-text">DDM Verify</span>}
          </Link>
        </div>

        <nav className="rail-nav">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={`rail-link${navActive(href, pathname) ? ' active' : ''}`}
            >
              <Icon size={17} strokeWidth={2} className="rail-link-icon" aria-hidden />
              {railExpanded && <span className="rail-label">{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="rail-footer">
          <Link href="/admin/payment-methods" className="rail-add" title="Payment controls">
            <Plus size={17} strokeWidth={2} />
            {railExpanded && <span className="rail-label">Payments</span>}
          </Link>
        </div>
      </aside>

      <div className="admin-frame">
        <header className="admin-topbar">
          <div className="topbar-left">
            <span className="topbar-eyebrow">{eyebrow}</span>
            <span className="topbar-title">{title}</span>
            <span className="topbar-accent-line" aria-hidden />
          </div>
          <div className="topbar-right">
            <Link href="/admin/notifications" className="topbar-bell" title="Notifications">
              <Bell size={18} strokeWidth={2} />
            </Link>
            <div className="topbar-user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="topbar-user-trigger"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                onClick={() => setUserMenuOpen((o) => !o)}
              >
                <span className="topbar-avatar" aria-hidden>
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="topbar-user-text">
                  <span className="topbar-name">{displayName}</span>
                  <span className="topbar-role">Administrator</span>
                </span>
              </button>
              {userMenuOpen && (
                <div className="topbar-dropdown" role="menu">
                  <button type="button" className="topbar-dropdown-item danger" role="menuitem" onClick={requestLogout}>
                    <LogOut size={16} strokeWidth={2} aria-hidden />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
