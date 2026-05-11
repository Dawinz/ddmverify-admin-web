'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch, apiPost } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/format-datetime';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type Agent = {
  id: string;
  user_id: string;
  agency_name: string | null;
  verified: boolean;
  verification_badge_status?: string | null;
  verification_document_url?: string | null;
  business_license_url?: string | null;
  selfie_verification_url?: string | null;
  gov_id_validation_status?: string | null;
  badge_rejection_reason?: string | null;
  kyc_tier?: string | null;
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
    onSuccess: (_data, agent) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agent', agent.id] });
    },
  });
  const badgeMutation = useMutation({
    mutationFn: async (args: { agent: Agent; status: string; reason?: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      const body: Record<string, string> = { status: args.status };
      if (args.reason) body.reason = args.reason;
      await apiPost(`/admin/agents/${args.agent.id}/badge-review`, token, body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'agent', variables.agent.id] });
    },
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
              <th>KYC</th>
              <th>Verified</th>
              <th>Badge Status</th>
              <th>Documents</th>
              <th>Created</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>{a.agency_name ?? '—'}</td>
                <td>{a.kyc_tier ?? '—'}</td>
                <td>{a.verified ? 'Yes' : 'No'}</td>
                <td>
                  <div>{a.verification_badge_status ?? 'unverified'}</div>
                  {a.badge_rejection_reason ? (
                    <div className="muted" style={{ fontSize: '0.8rem', marginTop: 4, maxWidth: 220 }}>
                      {a.badge_rejection_reason}
                    </div>
                  ) : null}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {a.verification_document_url ? (
                      <a href={a.verification_document_url} target="_blank" rel="noreferrer">
                        ID / passport
                      </a>
                    ) : null}
                    {a.business_license_url ? (
                      <a href={a.business_license_url} target="_blank" rel="noreferrer">
                        Business license
                      </a>
                    ) : null}
                    {a.selfie_verification_url ? (
                      <a href={a.selfie_verification_url} target="_blank" rel="noreferrer">
                        Selfie
                      </a>
                    ) : null}
                    {!a.verification_document_url && !a.business_license_url && !a.selfie_verification_url ? '—' : null}
                  </div>
                </td>
                <td>{formatAdminDateTime(a.created_at)}</td>
                <td className="actions-col">
                  <div className="actions-inline">
                  <Link href={`/admin/agents/${a.id}`} className="link-sm" style={{ marginRight: 8 }}>
                    Inspect
                  </Link>
                  <button type="button" className={`btn ${a.verified ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleMutation.mutate(a)}>
                    {a.verified ? 'Unverify' : 'Approve'}
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => badgeMutation.mutate({ agent: a, status: 'approved' })}>
                    Badge Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      const reason = window.prompt('Rejection reason (required):') ?? '';
                      if (!reason.trim()) return;
                      badgeMutation.mutate({ agent: a, status: 'rejected', reason: reason.trim() });
                    }}
                  >
                    Badge Reject
                  </button>
                  <button type="button" className="btn btn-neutral" onClick={() => badgeMutation.mutate({ agent: a, status: 'suspended' })}>
                    Suspend
                  </button>
                  <button type="button" className="btn btn-neutral" onClick={() => badgeMutation.mutate({ agent: a, status: 'expired' })}>
                    Expired
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
