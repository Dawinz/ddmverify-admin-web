'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiGet, apiPatch } from '@/lib/api';

type PendingItem = { id: string; title: string; location: string | null; category: string; verification_status: string; created_at: string };

export default function AdminVerificationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const data = await apiGet<{ items: PendingItem[] }>('/verification/pending', session.access_token);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(propertyId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ property_id: propertyId }),
      });
      if (!res.ok) throw new Error('Approve failed');
      setItems((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve');
    }
  }

  async function reject(propertyId: string) {
    const reason = window.prompt('Rejection reason (optional):') ?? '';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ property_id: propertyId, reason: reason || undefined }),
      });
      if (!res.ok) throw new Error('Reject failed');
      setItems((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject');
    }
  }

  if (loading) return <p>Loading pending verifications…</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Verification (pending)</h1>
      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Category</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>No pending verifications</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.location ?? '—'}</td>
                <td>{p.category}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  <button type="button" className="btn btn-success" style={{ marginRight: 8 }} onClick={() => approve(p.id)}>Approve</button>
                  <button type="button" className="btn btn-danger" onClick={() => reject(p.id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
