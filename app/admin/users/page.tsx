'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type User = { id: string; email: string; phone: string | null; full_name: string | null; role: string; banned: boolean; created_at: string };

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const usersQ = useAdminQuery<{ items: User[] }>({ key: ['admin', 'users'], path: '/admin/users' });
  const items = usersQ.data?.items ?? [];

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
    </div>
  );
}
