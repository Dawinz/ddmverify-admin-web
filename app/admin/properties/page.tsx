'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiGet, apiDelete } from '@/lib/api';

type Property = { id: string; title: string; location: string | null; category: string; verification_status: string; created_at: string; agency_name: string | null; agent_email: string };

export default function AdminPropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const data = await apiGet<{ items: Property[]; total: number }>('/admin/properties?limit=100', session.access_token);
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm('Delete this property?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      await apiDelete(`/admin/properties/${id}`, session.access_token);
      setItems((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  if (loading) return <p>Loading properties…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Properties ({total})</h1>
      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Category</th>
              <th>Status</th>
              <th>Agent</th>
              <th>Created</th>
              <th>Actions</th>
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
                <td>
                  <button type="button" className="btn btn-danger" onClick={() => remove(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
