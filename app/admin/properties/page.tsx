'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiDelete } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/format-datetime';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type Property = {
  id: string;
  title: string;
  location: string | null;
  category: string;
  verification_status: string;
  listing_status?: string;
  created_at: string;
  agency_name: string | null;
  agent_email: string;
};

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const createdFrom = searchParams.get('created_from');
  const createdTo = searchParams.get('created_to');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const propertiesPath = useMemo(() => {
    const p = new URLSearchParams();
    p.set('page', String(page));
    p.set('limit', String(limit));
    if (createdFrom && createdTo) {
      p.set('created_from', createdFrom);
      p.set('created_to', createdTo);
    }
    return `/admin/properties?${p.toString()}`;
  }, [page, limit, createdFrom, createdTo]);

  const propertiesQ = useAdminQuery<{ items: Property[]; total: number }>({
    key: ['admin', 'properties', propertiesPath],
    path: propertiesPath,
  });
  const allItems = propertiesQ.data?.items ?? [];
  const items = allItems.filter((p) => {
    const q = search.trim().toLowerCase();
    const status = p.verification_status.toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      p.title.toLowerCase().includes(q) ||
      (p.location ?? '').toLowerCase().includes(q) ||
      p.agent_email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const total = propertiesQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
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
      {createdFrom && createdTo && (
        <p className="muted" style={{ marginBottom: 12 }}>
          Filtered by created date {createdFrom} → {createdTo} (
          <Link href="/admin/properties" className="link-sm">
            clear
          </Link>
          )
        </p>
      )}
      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(130px, 170px) minmax(120px, 160px)', gap: 10 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, location, agent..."
            style={{ maxWidth: '100%' }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '0.6rem 0.75rem' }}
          >
            <option value="all">All status</option>
            <option value="pending">pending</option>
            <option value="verified">verified</option>
            <option value="rejected">rejected</option>
          </select>
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
      {propertiesQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(propertiesQ.error as Error).message}</p>}
      {removeMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(removeMutation.error as Error).message}</p>}
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Category</th>
              <th>Verification</th>
              <th>Listing</th>
              <th>Agent</th>
              <th>Created</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>
                  No matching properties
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.location ?? '—'}</td>
                <td>{p.category}</td>
                <td>{p.verification_status}</td>
                <td>{p.listing_status ?? 'active'}</td>
                <td>{p.agent_email}</td>
                <td>{formatAdminDateTime(p.created_at)}</td>
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
                  <Link href={`/admin/properties/${p.id}`} className="btn btn-neutral" title={`Open admin detail for ${p.title}`}>
                    View
                  </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span className="muted">
          Page {page} of {totalPages} ({total} total properties)
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
