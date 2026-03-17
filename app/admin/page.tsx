'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

type Stats = {
  users: number;
  agents: number;
  properties: number;
  pending: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // Temporarily allow dashboard to render even without auth
        setStats({ users: 0, agents: 0, properties: 0, pending: 0 });
        setLoading(false);
        return;
      }
      try {
        const [usersRes, agentsRes, propertiesRes, pendingRes] = await Promise.all([
          apiGet<{ items: unknown[] }>('/admin/users', session.access_token),
          apiGet<{ items: unknown[] }>('/admin/agents', session.access_token),
          apiGet<{ items: unknown[]; total: number }>('/admin/properties?limit=1', session.access_token),
          apiGet<{ items: unknown[] }>('/verification/pending', session.access_token),
        ]);
        setStats({
          users: usersRes.items.length,
          agents: agentsRes.items.length,
          properties: (propertiesRes as { total?: number }).total ?? propertiesRes.items.length,
          pending: (pendingRes as { items: unknown[] }).items.length,
        });
      } catch {
        setStats({ users: 0, agents: 0, properties: 0, pending: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p>Loading dashboard…</p>;
  if (!stats) return <p>Failed to load stats.</p>;

  const cards = [
    { label: 'Users', value: stats.users, href: '/admin/users' },
    { label: 'Agents', value: stats.agents, href: '/admin/agents' },
    { label: 'Properties', value: stats.properties, href: '/admin/properties' },
    { label: 'Pending verification', value: stats.pending, href: '/admin/verification' },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {cards.map(({ label, value, href }) => (
          <Link key={href} href={href} style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 14, color: '#64748b' }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
