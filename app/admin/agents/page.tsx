'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch, apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type Agent = {
  id: string;
  user_id: string;
  agency_name: string | null;
  verified: boolean;
  verification_badge_status?: string | null;
  verification_document_url?: string | null;
  created_at: string;
  email: string;
  full_name: string | null;
  banned: boolean;
};

export default function AdminAgentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const agentsQ = useAdminQuery<{ items: Agent[]; page: number; limit: number; total: number }>({
    key: ['admin', 'agents', String(page), String(limit), search],
    path: `/admin/agents?page=${page}&limit=${limit}&search=${encodeURIComponent(search.trim())}`,
  });
  const items = agentsQ.data?.items ?? [];
  const total = agentsQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const toggleMutation = useMutation({
    mutationFn: async (agent: Agent) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPatch(`/admin/agents/${agent.id}`, token, { verified: !agent.verified });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] }),
  });
  const badgeMutation = useMutation({
    mutationFn: async ({ agent, status }: { agent: Agent; status: 'approved' | 'rejected' }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPost(`/admin/agents/${agent.id}/badge-review`, token, { status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] }),
  });

  if (agentsQ.isLoading) return <p className="muted">Loading agents...</p>;

  return (
    <div>
      <h1 className="page-title">Agents</h1>
      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(120px, 160px)', gap: 10 }}>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search email or agency..."
            style={{ maxWidth: '100%' }}
          />
          <select
            value={String(limit)}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '0.6rem 0.75rem' }}
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>
      {agentsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(agentsQ.error as Error).message}</p>}
      {toggleMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(toggleMutation.error as Error).message}</p>}
      {badgeMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(badgeMutation.error as Error).message}</p>}
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Agency</th>
              <th>Verified</th>
              <th>Badge Status</th>
              <th>Document</th>
              <th>Created</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>{a.agency_name ?? '—'}</td>
                <td>{a.verified ? 'Yes' : 'No'}</td>
                <td>{a.verification_badge_status ?? 'unverified'}</td>
                <td>
                  {a.verification_document_url ? (
                    <a href={a.verification_document_url} target="_blank" rel="noreferrer">Open</a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="actions-col">
                  <div className="actions-inline">
                  <button type="button" className={`btn ${a.verified ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleMutation.mutate(a)}>
                    {a.verified ? 'Unverify' : 'Approve'}
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => badgeMutation.mutate({ agent: a, status: 'approved' })}>
                    Badge Approve
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => badgeMutation.mutate({ agent: a, status: 'rejected' })}>
                    Badge Reject
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span className="muted">
          Page {page} of {totalPages} ({total} agents)
        </span>
        <div className="actions-inline">
          <button type="button" className="btn btn-neutral" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <button type="button" className="btn btn-neutral" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
