'use client';

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
  const agentsQ = useAdminQuery<{ items: Agent[] }>({ key: ['admin', 'agents'], path: '/admin/agents' });
  const items = agentsQ.data?.items ?? [];
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
    </div>
  );
}
