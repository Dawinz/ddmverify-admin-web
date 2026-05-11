'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type ViewingBooking = {
  id: string;
  property_id?: string | null;
  buyer_user_id?: string | null;
  property_title?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  created_at?: string | null;
  status?: string | null;
  viewing_slot?: string | null;
  viewing_state?: string | null;
  dispute_reason?: string | null;
  attendance_evidence_url?: string | null;
};

function stateTone(state: string): { bg: string; fg: string } {
  const s = state.toLowerCase();
  if (s === 'completed') return { bg: '#dcfce7', fg: '#166534' };
  if (s === 'confirmed' || s === 'scheduled') return { bg: '#dbeafe', fg: '#1d4ed8' };
  if (s === 'rescheduled') return { bg: '#e0e7ff', fg: '#4338ca' };
  if (s === 'disputed') return { bg: '#ffedd5', fg: '#9a3412' };
  if (s === 'cancelled' || s === 'no_show') return { bg: '#fee2e2', fg: '#991b1b' };
  return { bg: '#f1f5f9', fg: '#334155' };
}

function labelCell(v?: string | null): string {
  const s = (v ?? '').trim();
  return s.length > 0 ? s : '—';
}

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [selected, setSelected] = useState<ViewingBooking | null>(null);
  const bookingsQ = useAdminQuery<{ items: ViewingBooking[] }>({
    key: ['admin', 'bookings', 'viewings'],
    path: '/bookings/viewings',
    fallback: { items: [] },
  });
  const items = bookingsQ.data?.items ?? [];
  const filtered = items.filter((b) => {
    const q = query.trim().toLowerCase();
    const state = (b.viewing_state ?? b.status ?? 'pending').toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      (b.property_title ?? '').toLowerCase().includes(q) ||
      (b.user_name ?? '').toLowerCase().includes(q) ||
      (b.user_email ?? '').toLowerCase().includes(q) ||
      (b.property_id ?? '').toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q);
    const matchesState = stateFilter === 'all' || state === stateFilter;
    return matchesQuery && matchesState;
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, state }: { id: string; state: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPost('/bookings/update-viewing-state', token, { booking_id: id, state });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'bookings', 'viewings'] }),
  });

  if (bookingsQ.isLoading) return <p className="muted">Loading viewing schedules...</p>;

  return (
    <div>
      <h1 className="page-title">Bookings & Viewings</h1>
      {bookingsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(bookingsQ.error as Error).message}</p>}
      {updateMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(updateMutation.error as Error).message}</p>}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(160px, 200px)', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search property, buyer, booking id..."
              style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">State</span>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="pending">pending</option>
              <option value="scheduled">scheduled</option>
              <option value="confirmed">confirmed</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
              <option value="rescheduled">rescheduled</option>
              <option value="disputed">disputed</option>
              <option value="no_show">no_show</option>
            </select>
          </label>
        </div>
      </div>
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Buyer</th>
              <th>Viewing Slot</th>
              <th>Lifecycle</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  No matching viewing schedules
                </td>
              </tr>
            )}
            {filtered.map((b) => {
              const lifecycle = (b.viewing_state ?? b.status ?? 'pending').toLowerCase();
              const tone = stateTone(lifecycle);
              return (
                <tr key={b.id}>
                  <td>
                    {b.property_id ? (
                      <Link href={`/admin/properties/${encodeURIComponent(b.property_id)}`} className="link-sm">
                        {labelCell(b.property_title)}
                      </Link>
                    ) : (
                      labelCell(b.property_title)
                    )}
                    {b.property_id ? <div className="muted" style={{ fontSize: 12 }}>{b.property_id}</div> : null}
                  </td>
                  <td>
                    <strong>{labelCell(b.user_name)}</strong>
                    <div className="muted" style={{ fontSize: 12 }}>{labelCell(b.user_email)}</div>
                  </td>
                  <td>{labelCell(b.viewing_slot)}</td>
                  <td>
                    <span style={{ background: tone.bg, color: tone.fg, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>
                      {lifecycle}
                    </span>
                  </td>
                  <td className="actions-col">
                    <div className="actions-inline">
                      <button type="button" className="btn btn-neutral" onClick={() => setSelected(b)}>
                        View details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }} onClick={() => setSelected(null)}>
          <div className="panel" style={{ width: 'min(860px, 100%)', borderRadius: 16, padding: 18 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>Booking details</h2>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  Booking ID <code>{selected.id}</code>
                </p>
              </div>
              <button type="button" className="btn btn-neutral" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div className="panel" style={{ padding: 12 }}>
                <h3 style={{ marginTop: 0, fontSize: 15 }}>Context</h3>
                <p><strong>Property:</strong> {labelCell(selected.property_title)}</p>
                <p><strong>Buyer:</strong> {labelCell(selected.user_name)}</p>
                <p><strong>Email:</strong> {labelCell(selected.user_email)}</p>
                <p><strong>Created:</strong> {labelCell(selected.created_at)}</p>
                <p><strong>Viewing slot:</strong> {labelCell(selected.viewing_slot)}</p>
                <p><strong>Status:</strong> {labelCell(selected.status)}</p>
                <p><strong>State:</strong> {labelCell(selected.viewing_state)}</p>
                {selected.property_id ? (
                  <p>
                    <strong>Property link:</strong>{' '}
                    <Link href={`/admin/properties/${encodeURIComponent(selected.property_id)}`} className="link-sm">
                      open property
                    </Link>
                  </p>
                ) : null}
              </div>

              <div className="panel" style={{ padding: 12 }}>
                <h3 style={{ marginTop: 0, fontSize: 15 }}>Lifecycle actions</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: selected.id, state: 'scheduled' })}>Schedule</button>
                  <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: selected.id, state: 'confirmed' })}>Confirm</button>
                  <button type="button" className="btn btn-success" onClick={() => updateMutation.mutate({ id: selected.id, state: 'completed' })}>Complete</button>
                  <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: selected.id, state: 'rescheduled' })}>Reschedule</button>
                  <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: selected.id, state: 'disputed' })}>Dispute</button>
                  <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: selected.id, state: 'no_show' })}>No-show</button>
                  <button type="button" className="btn btn-danger" style={{ gridColumn: '1 / -1' }} onClick={() => updateMutation.mutate({ id: selected.id, state: 'cancelled' })}>Cancel</button>
                </div>
              </div>
            </div>

            {(selected.dispute_reason || selected.attendance_evidence_url) && (
              <div className="panel" style={{ marginTop: 12, padding: 12 }}>
                <h3 style={{ marginTop: 0, fontSize: 15 }}>Evidence & notes</h3>
                {selected.dispute_reason ? (
                  <p><strong>Dispute reason:</strong> {selected.dispute_reason}</p>
                ) : (
                  <p className="muted">No dispute reason recorded.</p>
                )}
                {selected.attendance_evidence_url ? (
                  <p>
                    <strong>Attendance evidence:</strong>{' '}
                    <a href={selected.attendance_evidence_url} target="_blank" rel="noreferrer" className="link-sm">
                      open file
                    </a>
                  </p>
                ) : (
                  <p className="muted">No attendance evidence uploaded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
