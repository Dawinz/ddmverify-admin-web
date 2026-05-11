'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { apiGet } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/format-datetime';

type PendingItem = {
  id: string;
  title: string;
  location: string | null;
  category: string;
  verification_status: string;
  review_note?: string | null;
  verification_stage?: number;
  land_search_status?: string | null;
  deal_status?: string | null;
  created_at: string;
};

const PAGE_SIZE = 50;

export default function AdminVerificationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [dealFilter, setDealFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('all');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PendingItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const data = await apiGet<{ items: PendingItem[]; total: number }>(
        `/verification/pending?page=${page}&limit=${PAGE_SIZE}`,
        session.access_token,
      );
      setItems(data.items);
      setTotal(typeof data.total === 'number' ? data.total : data.items.length);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

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
      setTotal((t) => Math.max(0, t - 1));
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
      setTotal((t) => Math.max(0, t - 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject');
    }
  }

  async function applyDecision(
    propertyId: string,
    endpoint: 'needs-changes' | 'suspend' | 'request-changes' | 'reopen' | 'escalate',
    label: string,
  ) {
    const reason = window.prompt(`${label} note (optional):`) ?? '';
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ property_id: propertyId, reason: reason || undefined }),
      });
      if (!res.ok) throw new Error(`${label} failed`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${label.toLowerCase()}`);
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    const ids = filtered.map((p) => p.id);
    const allOn = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function bulkAction(action: 'approve' | 'reject' | 'needs_changes' | 'suspend') {
    const ids = filtered.filter((p) => selectedIds.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;
    const reason =
      action === 'reject' || action === 'needs_changes' || action === 'suspend'
        ? window.prompt(action === 'reject' ? 'Reason (optional):' : 'Note (optional):') ?? ''
        : '';
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verification/bulk-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, property_ids: ids, reason: reason || undefined }),
      });
      if (!res.ok) throw new Error('Bulk action failed');
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk action failed');
    }
  }

  return (
    <div>
      <h1 className="page-title">Verification (pending)</h1>
      <p className="muted" style={{ marginTop: -8, marginBottom: 12 }}>
        Moderation reports live under <strong>Reports</strong>. This queue is for <strong>listing verification</strong> only.
      </p>
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
              <option value="completed">completed</option>
              <option value="disputed">disputed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
        </div>
      </div>
      <div className="panel" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span className="muted" style={{ marginRight: 8 }}>
          {selectedIds.size} selected on this page
        </span>
        <button type="button" className="btn btn-success" disabled={selectedIds.size === 0} onClick={() => void bulkAction('approve')}>
          Bulk approve
        </button>
        <button type="button" className="btn btn-neutral" disabled={selectedIds.size === 0} onClick={() => void bulkAction('needs_changes')}>
          Bulk needs changes
        </button>
        <button type="button" className="btn btn-neutral" disabled={selectedIds.size === 0} onClick={() => void bulkAction('suspend')}>
          Bulk suspend
        </button>
        <button type="button" className="btn btn-danger" disabled={selectedIds.size === 0} onClick={() => void bulkAction('reject')}>
          Bulk reject
        </button>
      </div>
      <div className="panel panel-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  aria-label="Select all on page"
                  checked={filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id))}
                  onChange={toggleSelectAllFiltered}
                />
              </th>
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
            {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>No matching verifications</td></tr>}
            {filtered.map((p) => {
              const stage = p.verification_stage ?? 1;
              const landSearch = p.land_search_status ?? (stage >= 4 ? 'in_progress' : 'not_started');
              const deal = p.deal_status ?? 'active';
              const actionsVisible = actionsOpenForId === p.id;
              return (
                <Fragment key={p.id}>
              <tr>
                <td>
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} aria-label={`Select ${p.title}`} />
                </td>
                <td style={{ minWidth: 170 }}>
                  <Link href={`/admin/properties/${encodeURIComponent(p.id)}`} className="link-sm">
                    {p.title}
                  </Link>
                </td>
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
                <tr>
                  <td colSpan={9} style={{ background: '#f8fafc' }}>
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
                      <button type="button" className="btn btn-neutral" onClick={() => applyDecision(p.id, 'needs-changes', 'Needs changes')}>
                        Needs changes
                      </button>
                      <button type="button" className="btn btn-neutral" onClick={() => applyDecision(p.id, 'request-changes', 'Request changes')}>
                        Request changes
                      </button>
                      <button type="button" className="btn btn-neutral" onClick={() => applyDecision(p.id, 'suspend', 'Suspend')}>
                        Suspend
                      </button>
                      <button type="button" className="btn btn-neutral" onClick={() => applyDecision(p.id, 'escalate', 'Escalate')}>
                        Escalate
                      </button>
                      <button type="button" className="btn btn-neutral" onClick={() => applyDecision(p.id, 'reopen', 'Reopen')}>
                        Reopen
                      </button>
                      <button type="button" className="btn btn-danger" onClick={() => reject(p.id)}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              )}
                </Fragment>
            );})}
          </tbody>
        </table>
      </div>
      <div className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="muted">
          Page {page} of {totalPages} · {total} total pending
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-neutral" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <button type="button" className="btn btn-neutral" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
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
              <div><strong>Review note:</strong> {selected.review_note ?? '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Property ID:</strong> <code>{selected.id}</code></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong>Open property:</strong>{' '}
                <Link href={`/admin/properties/${encodeURIComponent(selected.id)}`} className="link-sm">
                  Property details
                </Link>
              </div>
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
