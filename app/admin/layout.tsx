import { Suspense } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { AdminRouteGuard } from '@/components/admin-route-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <Suspense fallback={<div className="admin-main"><p className="muted">Loading admin…</p></div>}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </AdminRouteGuard>
  );
}
