'use client';

import Link from 'next/link';
import { Home, ShieldCheck } from 'lucide-react';
import { useAdminQuery } from '@/lib/use-admin-query';

type Stats = {
  users: number;
  agents: number;
  properties: number;
  pending: number;
  viewings: number;
  proofs: number;
  deals: number;
  paymentMethods: number;
};

export default function AdminDashboard() {
  const usersQ = useAdminQuery<{ items: unknown[] }>({ key: ['admin', 'users'], path: '/admin/users' });
  const agentsQ = useAdminQuery<{ items: unknown[] }>({ key: ['admin', 'agents'], path: '/admin/agents' });
  const propertiesQ = useAdminQuery<{ items: unknown[]; total: number }>({
    key: ['admin', 'properties', 'count'],
    path: '/admin/properties?limit=1',
  });
  const pendingQ = useAdminQuery<{ items: unknown[] }>({ key: ['admin', 'verification', 'pending'], path: '/verification/pending' });
  const viewingsQ = useAdminQuery<{ items: unknown[] }>({
    key: ['admin', 'bookings', 'viewings'],
    path: '/bookings/viewings',
    fallback: { items: [] },
  });
  const proofsQ = useAdminQuery<{ items: unknown[] }>({
    key: ['admin', 'payments', 'proofs'],
    path: '/payments/proofs',
    fallback: { items: [] },
  });
  const dealsQ = useAdminQuery<{ items: unknown[] }>({
    key: ['admin', 'deals'],
    path: '/admin/deals',
    fallback: { items: [] },
  });
  const methodsQ = useAdminQuery<{ items: unknown[] }>({
    key: ['admin', 'payment-methods'],
    path: '/admin/payment-methods',
    fallback: { items: [] },
  });

  const loading = [usersQ, agentsQ, propertiesQ, pendingQ, viewingsQ, proofsQ, dealsQ, methodsQ].some((q) => q.isLoading);
  const anyError = [usersQ, agentsQ, propertiesQ, pendingQ, viewingsQ, proofsQ, dealsQ, methodsQ]
    .map((q) => q.error)
    .find(Boolean) as Error | undefined;

  const stats: Stats = {
    users: usersQ.data?.items.length ?? 0,
    agents: agentsQ.data?.items.length ?? 0,
    properties: propertiesQ.data?.total ?? propertiesQ.data?.items.length ?? 0,
    pending: pendingQ.data?.items.length ?? 0,
    viewings: viewingsQ.data?.items.length ?? 0,
    proofs: proofsQ.data?.items.length ?? 0,
    deals: dealsQ.data?.items.length ?? 0,
    paymentMethods: methodsQ.data?.items.length ?? 0,
  };

  if (loading) return <p className="muted">Loading dashboard...</p>;

  const cards = [
    { label: 'Users', value: stats.users, href: '/admin/users' },
    { label: 'Agents', value: stats.agents, href: '/admin/agents' },
    { label: 'Properties', value: stats.properties, href: '/admin/properties' },
    { label: 'Viewing schedules', value: stats.viewings, href: '/admin/bookings' },
    { label: 'Deals', value: stats.deals, href: '/admin/deals' },
    { label: 'Payment methods', value: stats.paymentMethods, href: '/admin/payment-methods' },
    { label: 'Payment proofs', value: stats.proofs, href: '/admin/payment-proofs' },
    { label: 'Pending verification', value: stats.pending, href: '/admin/verification' },
  ];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ShieldCheck size={16} />
        DDM Verify admin overview with cached live data.
      </p>
      {anyError && <p style={{ color: '#dc2626', marginBottom: 16 }}>{anyError.message}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {cards.map(({ label, value, href }) => (
          <Link
            key={href}
            href={href}
            className="panel"
            style={{ padding: 20, display: 'block', transition: 'transform 120ms ease' }}
          >
            <div style={{ fontSize: 14, color: '#64748b' }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4, color: '#1d6db9' }}>{value}</div>
            <div className="muted" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Home size={14} />
              Open section
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
