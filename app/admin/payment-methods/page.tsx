'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type PaymentMethod = {
  id: string;
  name: string;
  channel: string;
  enabled?: boolean;
};

export default function AdminPaymentMethodsPage() {
  const queryClient = useQueryClient();
  const methodsQ = useAdminQuery<{ items: PaymentMethod[] }>({
    key: ['admin', 'payment-methods'],
    path: '/admin/payment-methods',
    fallback: { items: [] },
  });
  const items = methodsQ.data?.items ?? [];
  const toggleMutation = useMutation({
    mutationFn: async (method: PaymentMethod) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPatch(`/admin/payment-methods/${method.id}`, token, { enabled: !(method.enabled ?? true) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'payment-methods'] }),
  });

  if (methodsQ.isLoading) return <p className="muted">Loading payment methods...</p>;

  return (
    <div>
      <h1 className="page-title">Payment Methods</h1>
      {methodsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(methodsQ.error as Error).message}</p>}
      {toggleMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(toggleMutation.error as Error).message}</p>}
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 24 }}>No methods found</td>
              </tr>
            )}
            {items.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.channel}</td>
                <td>{m.enabled === false ? 'No' : 'Yes'}</td>
                <td>
                  <button type="button" className={`btn ${m.enabled === false ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleMutation.mutate(m)}>
                    {m.enabled === false ? 'Enable' : 'Disable'}
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
