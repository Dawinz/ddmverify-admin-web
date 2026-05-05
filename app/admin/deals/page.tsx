'use client';

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
  const dealsQ = useAdminQuery<{ items: DealItem[] }>({
    key: ['admin', 'deals'],
    path: '/admin/deals',
    fallback: { items: [] },
  });
  const items = dealsQ.data?.items ?? [];
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>No deals found</td>
              </tr>
            )}
            {items.map((d) => (
              <tr key={d.id}>
                <td>{d.property_title ?? d.property_id}</td>
                <td>{d.buyer_email ?? '—'}</td>
                <td>{d.agent_email ?? '—'}</td>
                <td>{d.verification_stage ?? 1}/7</td>
                <td>{d.status ?? 'active'}</td>
                <td>{d.updated_at ? new Date(d.updated_at).toLocaleString() : '—'}</td>
                <td>
                  <button type="button" className="btn btn-success" style={{ marginRight: 8 }} onClick={() => statusMutation.mutate({ deal: d, status: 'closed' })}>
                    Close
                  </button>
                  <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, status: 'active' })}>
                    Reopen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
