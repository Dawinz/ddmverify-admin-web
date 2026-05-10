import { AdminShell } from '@/components/admin-shell';
import { AdminRouteGuard } from '@/components/admin-route-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <AdminShell>{children}</AdminShell>
    </AdminRouteGuard>
  );
}
