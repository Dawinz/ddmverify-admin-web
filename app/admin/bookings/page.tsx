'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type ViewingBooking = {
  id: string;
  property_title?: string | null;
  user_name?: string | null;
  viewing_slot?: string | null;
  viewing_state?: string | null;
};

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const bookingsQ = useAdminQuery<{ items: ViewingBooking[] }>({
    key: ['admin', 'bookings', 'viewings'],
    path: '/bookings/viewings',
    fallback: { items: [] },
  });
  const items = bookingsQ.data?.items ?? [];
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
      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Buyer</th>
              <th>Viewing Slot</th>
              <th>State</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>
                  No viewing schedules yet
                </td>
              </tr>
            )}
            {items.map((b) => (
              <tr key={b.id}>
                <td>{b.property_title ?? '—'}</td>
                <td>{b.user_name ?? '—'}</td>
                <td>{b.viewing_slot ?? '—'}</td>
                <td>{b.viewing_state ?? 'pending'}</td>
                <td className="actions-col">
                  <div className="actions-inline">
                  <button type="button" className="btn btn-neutral" onClick={() => updateMutation.mutate({ id: b.id, state: 'scheduled' })}>
                    Schedule
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => updateMutation.mutate({ id: b.id, state: 'completed' })}>
                    Complete
                  </button>
                  <button type="button" className="btn btn-danger" onClick={() => updateMutation.mutate({ id: b.id, state: 'cancelled' })}>
                    Cancel
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
