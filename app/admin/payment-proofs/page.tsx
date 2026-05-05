'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type PaymentProof = {
  id: string;
  booking_id?: string | null;
  control_number?: string | null;
  receipt_reference?: string | null;
  screenshot_url?: string | null;
  status?: string | null;
  created_at?: string | null;
};

export default function AdminPaymentProofsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PaymentProof | null>(null);
  const proofsQ = useAdminQuery<{ items: PaymentProof[] }>({
    key: ['admin', 'payment-proofs'],
    path: '/payments/proofs',
    fallback: { items: [] },
  });
  const items = proofsQ.data?.items ?? [];
  const filtered = items.filter((p) => {
    const q = query.trim().toLowerCase();
    const status = (p.status ?? 'pending').toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      (p.booking_id ?? '').toLowerCase().includes(q) ||
      (p.control_number ?? '').toLowerCase().includes(q) ||
      (p.receipt_reference ?? '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPost('/payments/proofs/update-status', token, { proof_id: id, status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payment-proofs'] }),
  });

  if (proofsQ.isLoading) return <p className="muted">Loading payment proofs...</p>;

  return (
    <div>
      <h1 className="page-title">Payment Proofs</h1>
      {proofsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(proofsQ.error as Error).message}</p>}
      {statusMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(statusMutation.error as Error).message}</p>}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(140px, 180px)', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search booking, control, receipt..."
              style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>
        </div>
      </div>
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Booking</th>
              <th>Control Number</th>
              <th>Receipt</th>
              <th>Screenshot</th>
              <th>Status</th>
              <th>Submitted</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
                  No matching payment proofs
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const actionsVisible = actionsOpenForId === p.id;
              return (
                <>
                  <tr key={p.id}>
                    <td>{p.booking_id ?? '—'}</td>
                    <td>{p.control_number ?? '—'}</td>
                    <td>{p.receipt_reference ?? '—'}</td>
                    <td>
                      {p.screenshot_url ? (
                        <a href={p.screenshot_url} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{p.status ?? 'pending'}</td>
                    <td>{p.created_at ? new Date(p.created_at).toLocaleString() : '—'}</td>
                    <td className="actions-col">
                      <div className="actions-inline">
                        <button type="button" className="btn btn-neutral" onClick={() => setSelected(p)}>
                          View details
                        </button>
                        <button type="button" className="btn btn-neutral" onClick={() => setActionsOpenForId((prev) => (prev === p.id ? null : p.id))}>
                          {actionsVisible ? 'Hide actions' : 'View actions'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {actionsVisible && (
                    <tr key={`${p.id}-actions`}>
                      <td colSpan={7} style={{ background: '#f8fafc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, padding: 10 }}>
                          <button type="button" className="btn btn-success" onClick={() => statusMutation.mutate({ id: p.id, status: 'approved' })}>
                            Approve
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => statusMutation.mutate({ id: p.id, status: 'rejected' })}>
                            Reject
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
          <div className="panel" style={{ width: 'min(760px, 100%)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Payment proof details</h2>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>Proof ID:</strong> <code>{selected.id}</code></div>
              <div><strong>Status:</strong> {selected.status ?? 'pending'}</div>
              <div><strong>Booking:</strong> {selected.booking_id ?? '—'}</div>
              <div><strong>Control number:</strong> {selected.control_number ?? '—'}</div>
              <div><strong>Receipt reference:</strong> {selected.receipt_reference ?? '—'}</div>
              <div><strong>Submitted:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Screenshot:</strong>{' '}
                {selected.screenshot_url ? (
                  <a href={selected.screenshot_url} target="_blank" rel="noreferrer">
                    {selected.screenshot_url}
                  </a>
                ) : (
                  '—'
                )}
              </div>
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
