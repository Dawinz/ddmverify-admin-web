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
  const statsQ = useAdminQuery<{ stats: Stats }>({
    key: ['admin', 'stats'],
    path: '/admin/stats',
  });
  const stats = statsQ.data?.stats ?? {
    users: 0,
    agents: 0,
    properties: 0,
    pending: 0,
    viewings: 0,
    proofs: 0,
    deals: 0,
    paymentMethods: 0,
  };
  if (statsQ.isLoading) return <p className="muted">Loading dashboard...</p>;

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
      {statsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(statsQ.error as Error).message}</p>}
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
