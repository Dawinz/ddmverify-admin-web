'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type User = { id: string; email: string; phone: string | null; full_name: string | null; role: string; banned: boolean; created_at: string };

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const usersQ = useAdminQuery<{ items: User[]; page: number; limit: number; total: number }>({
    key: ['admin', 'users', String(page), String(limit), search],
    path: `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search.trim())}`,
  });
  const items = usersQ.data?.items ?? [];
  const total = usersQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const toggleBanMutation = useMutation({
    mutationFn: async (user: User) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPatch(`/admin/users/${user.id}`, token, { banned: !user.banned });
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  if (usersQ.isLoading) return <p className="muted">Loading users...</p>;

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(120px, 160px)', gap: 10 }}>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search email or name..."
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
      {usersQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(usersQ.error as Error).message}</p>}
      {toggleBanMutation.error && (
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{(toggleBanMutation.error as Error).message}</p>
      )}
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Banned</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.full_name ?? '—'}</td>
                <td>{u.role}</td>
                <td>{u.banned ? 'Yes' : 'No'}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    type="button"
                    className={`btn ${u.banned ? 'btn-success' : 'btn-danger'}`}
                    onClick={() => toggleBanMutation.mutate(u)}
                  >
                    {u.banned ? 'Unban' : 'Ban'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span className="muted">
          Page {page} of {totalPages} ({total} users)
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
