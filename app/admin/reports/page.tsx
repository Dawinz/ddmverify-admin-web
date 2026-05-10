'use client';

import { useState } from 'react';
import { useAdminQuery, getAccessToken } from '@/lib/use-admin-query';

type ReportRow = {
  id: string;
  property_id: string;
  property_title: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  reason: string;
  details: string | null;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  created_at: string;
};

async function patchReportStatus(id: string, status: ReportRow['status']) {
  const token = await getAccessToken();
  if (!token) throw new Error('No active session');
  const api = (process.env.NEXT_PUBLIC_API_URL ?? '').trim();
  const res = await fetch(`${api}/admin/reports/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update report');
}

export default function AdminReportsPage() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportRow['status']>('all');
  const q = useAdminQuery<{ items: ReportRow[] }>({
    key: ['admin', 'reports', statusFilter],
    path: `/admin/reports?status=${statusFilter}`,
  });

  const rows = q.data?.items ?? [];

  return (
    <div>
      <h1 className="page-title">Reports & moderation</h1>
      <div className="panel" style={{ marginBottom: 14 }}>
        <label className="muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <option value="all">all</option>
            <option value="open">open</option>
            <option value="reviewing">reviewing</option>
            <option value="resolved">resolved</option>
            <option value="dismissed">dismissed</option>
          </select>
        </label>
      </div>
      {q.isLoading && <p>Loading reports...</p>}
      {q.error && <p style={{ color: '#dc2626' }}>{(q.error as Error).message}</p>}
      {!q.isLoading && !q.error && (
        <div className="panel panel-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Reason</th>
                <th>Property</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>
                    No reports.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.reason}</strong>
                    {r.details && <div className="muted" style={{ marginTop: 6 }}>{r.details}</div>}
                  </td>
                  <td>{r.property_title ?? r.property_id}</td>
                  <td>{r.reporter_name ?? r.reporter_email ?? 'Anonymous'}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <select
                      disabled={updatingId === r.id}
                      value={r.status}
                      onChange={async (e) => {
                        const next = e.target.value as ReportRow['status'];
                        setUpdatingId(r.id);
                        try {
                          await patchReportStatus(r.id, next);
                          await q.refetch();
                        } finally {
                          setUpdatingId(null);
                        }
                      }}
                    >
                      <option value="open">open</option>
                      <option value="reviewing">reviewing</option>
                      <option value="resolved">resolved</option>
                      <option value="dismissed">dismissed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
