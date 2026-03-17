'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiGet, apiPatch } from '@/lib/api';

type Agent = { id: string; user_id: string; agency_name: string | null; verified: boolean; created_at: string; email: string; full_name: string | null; banned: boolean };

export default function AdminAgentsPage() {
  const [items, setItems] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const data = await apiGet<{ items: Agent[] }>('/admin/agents', session.access_token);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleVerified(agent: Agent) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      await apiPatch(`/admin/agents/${agent.id}`, session.access_token, { verified: !agent.verified });
      setItems((prev) => prev.map((a) => a.id === agent.id ? { ...a, verified: !a.verified } : a));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  if (loading) return <p>Loading agents…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Agents</h1>
      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Agency</th>
              <th>Verified</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{a.email}</td>
                <td>{a.agency_name ?? '—'}</td>
                <td>{a.verified ? 'Yes' : 'No'}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td>
                  <button type="button" className={`btn ${a.verified ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleVerified(a)}>
                    {a.verified ? 'Unverify' : 'Approve'}
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
