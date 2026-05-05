'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type DealItem = {
  id: string;
  property_id: string;
  property_title?: string | null;
  buyer_email?: string | null;
  agent_email?: string | null;
  verification_stage?: number | null;
  status?: string | null;
  updated_at?: string | null;
};

export default function AdminDealsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DealItem | null>(null);
  const dealsQ = useAdminQuery<{ items: DealItem[] }>({
    key: ['admin', 'deals'],
    path: '/admin/deals',
    fallback: { items: [] },
  });
  const items = dealsQ.data?.items ?? [];
  const filtered = items.filter((d) => {
    const q = query.trim().toLowerCase();
    const status = (d.status ?? 'active').toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      (d.property_title ?? '').toLowerCase().includes(q) ||
      (d.buyer_email ?? '').toLowerCase().includes(q) ||
      (d.agent_email ?? '').toLowerCase().includes(q) ||
      d.property_id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const statusMutation = useMutation({
    mutationFn: async ({ deal, status }: { deal: DealItem; status: 'closed' | 'active' }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPost('/admin/deals/set-status', token, {
        deal_id: deal.id,
        property_id: deal.property_id,
        status,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'deals'] }),
  });

  if (dealsQ.isLoading) return <p className="muted">Loading deals...</p>;

  return (
    <div>
      <h1 className="page-title">Deals Control</h1>
      {dealsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(dealsQ.error as Error).message}</p>}
      {statusMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(statusMutation.error as Error).message}</p>}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(140px, 180px)', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search property, buyer, agent..."
              style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="active">active</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </div>
      </div>
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Buyer</th>
              <th>Agent</th>
              <th>Verification</th>
              <th>Status</th>
              <th>Updated</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>No matching deals</td>
              </tr>
            )}
            {filtered.map((d) => {
              const actionsVisible = actionsOpenForId === d.id;
              return (
                <>
                  <tr key={d.id}>
                    <td>{d.property_title ?? d.property_id}</td>
                    <td>{d.buyer_email ?? '—'}</td>
                    <td>{d.agent_email ?? '—'}</td>
                    <td>{d.verification_stage ?? 1}/7</td>
                    <td>{d.status ?? 'active'}</td>
                    <td>{d.updated_at ? new Date(d.updated_at).toLocaleString() : '—'}</td>
                    <td className="actions-col">
                      <div className="actions-inline">
                        <button type="button" className="btn btn-neutral" onClick={() => setSelected(d)}>
                          View details
                        </button>
                        <button type="button" className="btn btn-neutral" onClick={() => setActionsOpenForId((prev) => (prev === d.id ? null : d.id))}>
                          {actionsVisible ? 'Hide actions' : 'View actions'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {actionsVisible && (
                    <tr key={`${d.id}-actions`}>
                      <td colSpan={7} style={{ background: '#f8fafc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, padding: 10 }}>
                          <button type="button" className="btn btn-success" onClick={() => statusMutation.mutate({ deal: d, status: 'closed' })}>
                            Close
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, status: 'active' })}>
                            Reopen
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }} onClick={() => setSelected(null)}>
          <div className="panel" style={{ width: 'min(700px, 100%)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Deal details</h2>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>Deal ID:</strong> <code>{selected.id}</code></div>
              <div><strong>Status:</strong> {selected.status ?? 'active'}</div>
              <div><strong>Property:</strong> {selected.property_title ?? selected.property_id}</div>
              <div><strong>Property ID:</strong> <code>{selected.property_id}</code></div>
              <div><strong>Buyer:</strong> {selected.buyer_email ?? '—'}</div>
              <div><strong>Agent:</strong> {selected.agent_email ?? '—'}</div>
              <div><strong>Verification stage:</strong> {selected.verification_stage ?? 1}/7</div>
              <div><strong>Updated:</strong> {selected.updated_at ? new Date(selected.updated_at).toLocaleString() : '—'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-neutral" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
