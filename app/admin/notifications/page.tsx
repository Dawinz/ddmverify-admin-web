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

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();
  const feedQ = useAdminQuery<{ items: NotificationRow[] }>({
    key: ['admin', 'notifications-feed'],
    path: '/admin/notifications-feed?limit=100',
  });

  const [testUserId, setTestUserId] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testMsg, setTestMsg] = useState('');

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
      setTestMsg('Test queued — new row should appear below if FCM env and tokens are set.');
    },
    onError: (e: Error) => {
      setTestMsg(e.message);
    },
  });

  const items = feedQ.data?.items ?? [];

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
