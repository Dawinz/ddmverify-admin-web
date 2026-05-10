'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/format-datetime';

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
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('all');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PendingItem | null>(null);

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

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = items.filter((p) => {
    const stage = p.verification_stage ?? 1;
    const landSearch = p.land_search_status ?? (stage >= 4 ? 'in_progress' : 'not_started');
    const deal = p.deal_status ?? 'active';
    const matchesQuery =
      normalizedQuery.length === 0 ||
      p.title.toLowerCase().includes(normalizedQuery) ||
      (p.location ?? '').toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery);
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStage = stageFilter === 'all' || String(stage) === stageFilter;
    const matchesDeal = dealFilter === 'all' || deal === dealFilter;
    const matchesSearch = searchFilter === 'all' || landSearch === searchFilter;
    return matchesQuery && matchesCategory && matchesStage && matchesDeal && matchesSearch;
  });
  const categories = Array.from(new Set(items.map((p) => p.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <h1 className="page-title">Verification (pending)</h1>
      {error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 1fr) repeat(4, minmax(120px, 180px))',
            gap: 10,
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, location, category..."
              style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Category</span>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Stage</span>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Gov search</span>
            <select value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="not_started">not_started</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Deal</span>
            <select value={dealFilter} onChange={(e) => setDealFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="active">active</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </div>
      </div>
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
            {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>No matching verifications</td></tr>}
            {filtered.map((p) => {
              const stage = p.verification_stage ?? 1;
              const landSearch = p.land_search_status ?? (stage >= 4 ? 'in_progress' : 'not_started');
              const deal = p.deal_status ?? 'active';
              const actionsVisible = actionsOpenForId === p.id;
              return (
                <>
              <tr key={p.id}>
                <td style={{ minWidth: 170 }}>{p.title}</td>
                <td style={{ minWidth: 180 }}>{p.location ?? '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{p.category}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatAdminDateTime(p.created_at)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{stage}/7</td>
                <td style={{ whiteSpace: 'nowrap' }}>{landSearch}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{deal}</td>
                <td className="actions-col">
                  <div className="actions-inline">
                    <button type="button" className="btn btn-neutral" onClick={() => setSelected(p)}>
                      View details
                    </button>
                    <button type="button" className="btn btn-neutral" onClick={() => setActionsOpenForId((prev) => (prev === p.id ? null : p.id))}>
                      {actionsVisible ? 'Hide actions' : 'View actions'}
                    </button>
                  </div>
                </td>
              </tr>
              {actionsVisible && (
                <tr key={`${p.id}-actions`}>
                  <td colSpan={8} style={{ background: '#f8fafc' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 8, padding: 10 }}>
                      <button type="button" className="btn btn-neutral" onClick={() => moveStage(p.id, Math.min(7, stage + 1))}>
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
              )}
                </>
            );})}
          </tbody>
        </table>
      </div>
      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.45)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 60,
            padding: 16,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="panel"
            style={{ width: 'min(760px, 100%)', maxHeight: '85vh', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Verification details</h2>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>Title:</strong> {selected.title}</div>
              <div><strong>Category:</strong> {selected.category}</div>
              <div><strong>Location:</strong> {selected.location ?? '—'}</div>
              <div><strong>Created:</strong> {new Date(selected.created_at).toLocaleString()}</div>
              <div><strong>Stage:</strong> {selected.verification_stage ?? 1}/7</div>
              <div><strong>Gov search:</strong> {selected.land_search_status ?? ((selected.verification_stage ?? 1) >= 4 ? 'in_progress' : 'not_started')}</div>
              <div><strong>Deal:</strong> {selected.deal_status ?? 'active'}</div>
              <div><strong>Status:</strong> {selected.verification_status}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Property ID:</strong> <code>{selected.id}</code></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-neutral" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
