'use client';

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
  const proofsQ = useAdminQuery<{ items: PaymentProof[] }>({
    key: ['admin', 'payment-proofs'],
    path: '/payments/proofs',
    fallback: { items: [] },
  });
  const items = proofsQ.data?.items ?? [];
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>
                  No payment proofs yet
                </td>
              </tr>
            )}
            {items.map((p) => (
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
                <td>
                  <button type="button" className="btn btn-success" style={{ marginRight: 8 }} onClick={() => statusMutation.mutate({ id: p.id, status: 'approved' })}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => statusMutation.mutate({ id: p.id, status: 'rejected' })}>
                    Reject
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
