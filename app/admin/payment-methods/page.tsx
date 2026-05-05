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

type PaymentOptions = {
  payment_options?: {
    enabled: boolean;
    total_methods: number;
    enabled_methods: number;
  };
};

export default function AdminPaymentMethodsPage() {
  const queryClient = useQueryClient();
  const optionsQ = useAdminQuery<PaymentOptions>({
    key: ['admin', 'payment-options'],
    path: '/admin/payment-options',
    fallback: { payment_options: { enabled: false, total_methods: 0, enabled_methods: 0 } },
  });
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
  const globalToggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPatch('/admin/payment-options', token, { enabled });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'payment-options'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'payment-methods'] });
    },
  });

  const globalEnabled = optionsQ.data?.payment_options?.enabled ?? false;
  const enabledCount = optionsQ.data?.payment_options?.enabled_methods ?? 0;
  const totalCount = optionsQ.data?.payment_options?.total_methods ?? 0;

  if (methodsQ.isLoading) return <p className="muted">Loading payment methods...</p>;

  return (
    <div>
      <h1 className="page-title">Payment Methods</h1>
      {methodsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(methodsQ.error as Error).message}</p>}
      {optionsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(optionsQ.error as Error).message}</p>}
      {toggleMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(toggleMutation.error as Error).message}</p>}
      {globalToggleMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(globalToggleMutation.error as Error).message}</p>}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700 }}>Global Payments</div>
            <div className="muted">Status: {globalEnabled ? 'Enabled' : 'Disabled'} ({enabledCount}/{totalCount} methods enabled)</div>
          </div>
          <button
            type="button"
            className={`btn ${globalEnabled ? 'btn-danger' : 'btn-success'}`}
            onClick={() => globalToggleMutation.mutate(!globalEnabled)}
          >
            {globalEnabled ? 'Disable All Payments' : 'Enable All Payments'}
          </button>
        </div>
      </div>
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Channel</th>
              <th>Enabled</th>
              <th className="actions-col">Actions</th>
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
                <td className="actions-col">
                  <div className="actions-inline">
                  <button type="button" className={`btn ${m.enabled === false ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleMutation.mutate(m)}>
                    {m.enabled === false ? 'Enable' : 'Disable'}
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
