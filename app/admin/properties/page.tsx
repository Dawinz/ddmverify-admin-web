'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { apiDelete } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type Property = { id: string; title: string; location: string | null; category: string; verification_status: string; created_at: string; agency_name: string | null; agent_email: string };

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const propertiesQ = useAdminQuery<{ items: Property[]; total: number }>({
    key: ['admin', 'properties'],
    path: '/admin/properties?limit=100',
  });
  const items = propertiesQ.data?.items ?? [];
  const total = propertiesQ.data?.total ?? 0;
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiDelete(`/admin/properties/${id}`, token);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
  });

  if (propertiesQ.isLoading) return <p className="muted">Loading properties...</p>;

  return (
    <div>
      <h1 className="page-title">Properties ({total})</h1>
      {propertiesQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(propertiesQ.error as Error).message}</p>}
      {removeMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(removeMutation.error as Error).message}</p>}
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Category</th>
              <th>Status</th>
              <th>Agent</th>
              <th>Created</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.location ?? '—'}</td>
                <td>{p.category}</td>
                <td>{p.verification_status}</td>
                <td>{p.agent_email}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="actions-col">
                  <div className="actions-inline">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      if (!confirm('Delete this property?')) return;
                      removeMutation.mutate(p.id);
                    }}
                  >
                    Delete
                  </button>
                  <a
                    href={`https://www.ddmverify.com`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-neutral"
                    title={`Property ID: ${p.id}`}
                  >
                    <ExternalLink size={13} />
                    View
                  </a>
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
