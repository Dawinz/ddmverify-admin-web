'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';

type PendingItem = {
  id: string;
  title: string;
  location: string | null;
  category: string;
  verification_status: string;
  verification_stage?: number;
  land_search_status?: string | null;
  deal_status?: string | null;
  created_at: string;
};

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

  async function markLandSearchComplete(propertyId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/land-search/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ property_id: propertyId }),
      });
      if (!res.ok) throw new Error('Land search update failed');
      setItems((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, land_search_status: 'completed', verification_stage: Math.max(p.verification_stage ?? 1, 4) } : p)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update land search');
    }
  }

  async function moveStage(propertyId: string, stage: number) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/update-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ property_id: propertyId, stage }),
      });
      if (!res.ok) throw new Error('Stage update failed');
      setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, verification_stage: stage } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update stage');
    }
  }

  async function setDealStatus(propertyId: string, status: 'closed' | 'active') {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/deals/set-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ property_id: propertyId, status }),
      });
      if (!res.ok) throw new Error('Deal status update failed');
      setItems((prev) => prev.map((p) => (p.id === propertyId ? { ...p, deal_status: status } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update deal status');
    }
  }

  if (loading) return <p>Loading pending verifications…</p>;

  return (
    <div>
      <h1 className="page-title">Verification (pending)</h1>
      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      <div className="panel panel-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Category</th>
              <th>Created</th>
              <th>Stage</th>
              <th>Gov Search</th>
              <th>Deal</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>No pending verifications</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td style={{ minWidth: 170 }}>{p.title}</td>
                <td style={{ minWidth: 180 }}>{p.location ?? '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.category}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.verification_stage ?? 1}/7</td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.land_search_status ?? ((p.verification_stage ?? 1) >= 4 ? 'in_progress' : 'not_started')}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.deal_status ?? 'active'}</td>
                <td>
                  <div className="actions-grid">
                    <button type="button" className="btn btn-neutral" onClick={() => moveStage(p.id, Math.min(7, (p.verification_stage ?? 1) + 1))}>
                      Next Stage
                    </button>
                    <button type="button" className="btn btn-neutral" onClick={() => markLandSearchComplete(p.id)}>
                      Mark Search
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => setDealStatus(p.id, 'closed')}>
                      Close Deal
                    </button>
                    <button type="button" className="btn btn-neutral" onClick={() => setDealStatus(p.id, 'active')}>
                      Reopen
                    </button>
                    <button type="button" className="btn btn-success" onClick={() => approve(p.id)}>
                      Approve
                    </button>
                    <button type="button" className="btn btn-danger" onClick={() => reject(p.id)}>
                      Reject
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
