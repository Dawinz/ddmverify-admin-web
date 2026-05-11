'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type ViewingBooking = {
  id: string;
  property_title?: string | null;
  user_name?: string | null;
  status?: string | null;
  viewing_slot?: string | null;
  viewing_state?: string | null;
  dispute_reason?: string | null;
  attendance_evidence_url?: string | null;
};

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ViewingBooking | null>(null);
  const bookingsQ = useAdminQuery<{ items: ViewingBooking[] }>({
    key: ['admin', 'bookings', 'viewings'],
    path: '/bookings/viewings',
    fallback: { items: [] },
  });
  const items = bookingsQ.data?.items ?? [];
  const filtered = items.filter((b) => {
    const q = query.trim().toLowerCase();
    const state = (b.viewing_state ?? 'pending').toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      (b.property_title ?? '').toLowerCase().includes(q) ||
      (b.user_name ?? '').toLowerCase().includes(q) ||
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
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) minmax(140px, 180px)', gap: 10 }}>
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
              <th>Status</th>
              <th>State</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                  No matching viewing schedules
                </td>
              </tr>
            )}
            {filtered.map((b) => {
              const actionsVisible = actionsOpenForId === b.id;
              return (
                <>
                  <tr key={b.id}>
                    <td>{b.property_title ?? '—'}</td>
                    <td>{b.user_name ?? '—'}</td>
                    <td>{b.viewing_slot ?? '—'}</td>
                    <td>{b.status ?? 'pending'}</td>
                    <td>{b.viewing_state ?? 'pending'}</td>
                    <td className="actions-col">
                      <div className="actions-inline">
                        <button type="button" className="btn btn-neutral" onClick={() => setSelected(b)}>
                          View details
                        </button>
                        <button type="button" className="btn btn-neutral" onClick={() => setActionsOpenForId((prev) => (prev === b.id ? null : b.id))}>
                          {actionsVisible ? 'Hide actions' : 'View actions'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {actionsVisible && (
                    <tr key={`${b.id}-actions`}>
                      <td colSpan={6} style={{ background: '#f8fafc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, padding: 10 }}>
                          <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: b.id, state: 'scheduled' })}>
                            Schedule
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: b.id, state: 'confirmed' })}>
                            Confirm
                          </button>
                          <button type="button" className="btn btn-success" onClick={() => updateMutation.mutate({ id: b.id, state: 'completed' })}>
                            Complete
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: b.id, state: 'rescheduled' })}>
                            Reschedule
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: b.id, state: 'disputed' })}>
                            Dispute
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: b.id, state: 'no_show' })}>
                            No-show
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => updateMutation.mutate({ id: b.id, state: 'cancelled' })}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }} onClick={() => setSelected(null)}>
          <div className="panel" style={{ width: 'min(700px, 100%)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Booking details</h2>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>Booking ID:</strong> <code>{selected.id}</code></div>
              <div><strong>Status:</strong> {selected.status ?? 'pending'}</div>
              <div><strong>State:</strong> {selected.viewing_state ?? 'pending'}</div>
              <div><strong>Property:</strong> {selected.property_title ?? '—'}</div>
              <div><strong>Buyer:</strong> {selected.user_name ?? '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Viewing slot:</strong> {selected.viewing_slot ?? '—'}</div>
              {selected.dispute_reason ? <div style={{ gridColumn: '1 / -1' }}><strong>Dispute reason:</strong> {selected.dispute_reason}</div> : null}
              {selected.attendance_evidence_url ? <div style={{ gridColumn: '1 / -1' }}><strong>Attendance evidence:</strong> <a href={selected.attendance_evidence_url} target="_blank" rel="noreferrer">Open file</a></div> : null}
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
