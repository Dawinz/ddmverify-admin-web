'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
  user_email: string | null;
};

type DeliveryCountRow = { channel: string; status: string; count: number };
type DeliveryRecentRow = {
  id: string;
  user_id: string;
  channel: string;
  recipient: string | null;
  status: string;
  error_class?: string | null;
  error_message?: string | null;
  created_at: string;
};

type NotificationsSummaryPayload = {
  ok?: boolean;
  counts: DeliveryCountRow[];
  recent: DeliveryRecentRow[];
};

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const feedQ = useAdminQuery<{ items: NotificationRow[] }>({
    key: ['admin', 'notifications-feed'],
    path: '/admin/notifications-feed?limit=100',
  });
  const summaryQ = useAdminQuery<NotificationsSummaryPayload>({
    key: ['admin', 'notifications-summary'],
    path: '/admin/notifications/summary',
    fallback: { counts: [], recent: [] },
  });

  const [testUserId, setTestUserId] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  const testPushMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      const uid = testUserId.trim();
      if (!uid) throw new Error('User id is required.');
      return apiPost('/admin/notifications/test-push', token, {
        user_id: uid,
        ...(testTitle.trim() ? { title: testTitle.trim() } : {}),
        ...(testBody.trim() ? { body: testBody.trim() } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications-feed'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications-summary'] });
      setTestMsg('Test queued — new row should appear below if FCM env and tokens are set.');
    },
    onError: (e: Error) => {
      setTestMsg(e.message);
    },
  });
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      const title = broadcastTitle.trim();
      const body = broadcastBody.trim();
      if (!title) throw new Error('Broadcast title is required.');
      if (!body) throw new Error('Broadcast body is required.');
      return apiPost('/admin/notifications/broadcast', token, { title, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications-feed'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications-summary'] });
      setBroadcastMsg('Broadcast submitted. Check feed below for inserted rows.');
    },
    onError: (e: Error) => {
      setBroadcastMsg(e.message);
    },
  });

  const items = feedQ.data?.items ?? [];
  const counts = summaryQ.data?.counts ?? [];
  const recentDelivery = summaryQ.data?.recent ?? [];

  if (feedQ.isLoading) return <p className="muted">Loading notifications…</p>;

  return (
    <div>
      <h1 className="page-title">Notifications</h1>
      <p className="muted" style={{ marginBottom: 16, maxWidth: 720 }}>
        Feed shows recent rows from the API <code>notifications</code> table (buyers, agents, and test
        sends). Agent alerts from inquiries or messaging appear for the recipient user — match{' '}
        <strong>User id</strong> to an agent or buyer in <strong>Users</strong>.
      </p>

      {feedQ.error && (
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{(feedQ.error as Error).message}</p>
      )}
      {summaryQ.error && (
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{(summaryQ.error as Error).message}</p>
      )}

      <div className="panel panel-scroll" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 12px' }}>Delivery telemetry (30d counts)</h2>
        {summaryQ.isLoading ? (
          <p className="muted">Loading delivery summary…</p>
        ) : counts.length === 0 ? (
          <p className="muted">No delivery log rows in the last 30 days.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Channel</th>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {counts.map((c, i) => (
                <tr key={`${c.channel}-${c.status}-${i}`}>
                  <td>{c.channel}</td>
                  <td>{c.status}</td>
                  <td>{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <h3 style={{ fontSize: '0.95rem', margin: '16px 0 8px' }}>Recent delivery events</h3>
        {recentDelivery.length === 0 ? (
          <p className="muted">No recent delivery rows.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Channel</th>
                <th>Recipient</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {recentDelivery.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ fontSize: 12 }} className="muted">
                    {r.user_id?.slice(0, 8)}…
                  </td>
                  <td>{r.channel}</td>
                  <td style={{ fontSize: 12, maxWidth: 140 }}>{r.recipient ?? '—'}</td>
                  <td>{r.status}</td>
                  <td style={{ fontSize: 12, maxWidth: 220 }}>
                    {r.error_class ?? ''} {r.error_message ? `· ${r.error_message.slice(0, 120)}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: 16 }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 12px' }}>Send notifications to all installed devices</h2>
        <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
          Sends to every user that currently has at least one registered device token.
        </p>
        <div style={{ display: 'grid', gap: 10, maxWidth: 560 }}>
          <input
            value={broadcastTitle}
            onChange={(e) => {
              setBroadcastTitle(e.target.value);
              setBroadcastMsg('');
            }}
            placeholder="Broadcast title"
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <textarea
            value={broadcastBody}
            onChange={(e) => {
              setBroadcastBody(e.target.value);
              setBroadcastMsg('');
            }}
            placeholder="Broadcast message body"
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db', minHeight: 86 }}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={broadcastMutation.isPending}
            onClick={() => {
              setBroadcastMsg('');
              broadcastMutation.mutate();
            }}
          >
            {broadcastMutation.isPending ? 'Sending…' : 'Send to all devices'}
          </button>
        </div>
        {broadcastMsg ? <p style={{ marginTop: 12, fontSize: 14 }}>{broadcastMsg}</p> : null}
      </div>

      <div className="panel" style={{ marginBottom: 20, padding: 16 }}>
        <h2 style={{ fontSize: '1rem', margin: '0 0 12px' }}>Send test push</h2>
        <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
          Inserts a notification row and attempts FCM for the user (requires Railway{' '}
          <code>FIREBASE_SERVICE_ACCOUNT_JSON</code> and a registered device token).
        </p>
        <div style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
          <input
            value={testUserId}
            onChange={(e) => {
              setTestUserId(e.target.value);
              setTestMsg('');
            }}
            placeholder="Target user UUID"
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <input
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            placeholder="Title (optional)"
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <input
            value={testBody}
            onChange={(e) => setTestBody(e.target.value)}
            placeholder="Body (optional)"
            style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={testPushMutation.isPending}
            onClick={() => {
              setTestMsg('');
              testPushMutation.mutate();
            }}
          >
            {testPushMutation.isPending ? 'Sending…' : 'Send test'}
          </button>
        </div>
        {testMsg ? <p style={{ marginTop: 12, fontSize: 14 }}>{testMsg}</p> : null}
      </div>

      <div className="panel panel-scroll">
        <table>
          <thead>
            <tr>
              <th>Created</th>
              <th>Recipient</th>
              <th>Title</th>
              <th>Body</th>
              <th>Read</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No notification rows yet.
                </td>
              </tr>
            ) : (
              items.map((n) => (
                <tr key={n.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div>{n.user_email ?? '—'}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {n.user_id}
                    </div>
                  </td>
                  <td>{n.title}</td>
                  <td style={{ maxWidth: 320, fontSize: 13 }}>{n.body ?? '—'}</td>
                  <td>{n.read ? 'Yes' : 'No'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
