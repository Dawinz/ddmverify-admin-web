'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiGet, apiPatch } from '@/lib/api';

type User = { id: string; email: string; phone: string | null; full_name: string | null; role: string; banned: boolean; created_at: string };

export default function AdminUsersPage() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const data = await apiGet<{ items: User[] }>('/admin/users', session.access_token);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleBan(user: User) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      await apiPatch(`/admin/users/${user.id}`, session.access_token, { banned: !user.banned });
      setItems((prev) => prev.map((u) => u.id === user.id ? { ...u, banned: !u.banned } : u));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  if (loading) return <p>Loading users…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Users</h1>
      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
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
                  <button type="button" className={`btn ${u.banned ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleBan(u)}>
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
