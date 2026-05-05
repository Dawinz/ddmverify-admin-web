'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { adminNav } from '@/lib/admin-nav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-row">
          <div className="brand-logo">DDM</div>
          <div className="brand-title">
            <strong>DDM Verify</strong>
            <span>Admin Control Center</span>
          </div>
        </div>
        <nav className="side-nav">
          {adminNav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`side-link${pathname === href ? ' active' : ''}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
