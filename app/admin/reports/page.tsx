'use client';

import Link from 'next/link';
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

type RiskGroup = { agency_key: string; agent_count: number; agent_ids: string[]; emails: string[] };
type VelocityRow = { agent_id: string; agency_name: string | null; email: string; listings_last_7d: number };
type DupPropertySignals = {
  coordinate_duplicates: Array<{ property_count: number }>;
  title_number_duplicates: Array<{ property_count: number }>;
  owner_name_duplicates: Array<{ property_count: number }>;
  image_reuse_duplicates: Array<{ property_count: number }>;
};

export default function AdminReportsPage() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ReportRow['status']>('all');
  const q = useAdminQuery<{ items: ReportRow[] }>({
    key: ['admin', 'reports', statusFilter],
    path: `/admin/reports?status=${statusFilter}`,
  });
  const dupAgenciesQ = useAdminQuery<{ groups: RiskGroup[]; count: number }>({
    key: ['admin', 'risk', 'duplicate-agencies'],
    path: '/admin/risk/duplicate-agencies',
  });
  const velocityQ = useAdminQuery<{ agents: VelocityRow[]; count: number }>({
    key: ['admin', 'risk', 'agent-listing-velocity'],
    path: '/admin/risk/agent-listing-velocity',
  });
  const dupPropsQ = useAdminQuery<DupPropertySignals>({
    key: ['admin', 'risk', 'duplicate-property-signals'],
    path: '/admin/risk/duplicate-property-signals',
  });

  const rows = q.data?.items ?? [];

  return (
    <div>
      <h1 className="page-title">Reports & moderation</h1>
      <div className="panel" style={{ marginBottom: 14, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Agent risk (heuristics)</h2>
        <p className="muted" style={{ marginTop: 4, marginBottom: 10 }}>
          Duplicate agency names and high listing velocity are signals only — review in{' '}
          <Link href="/admin/agents" className="link-sm">
            Agents
          </Link>
          .
        </p>
        {dupAgenciesQ.error && <p style={{ color: '#dc2626' }}>{(dupAgenciesQ.error as Error).message}</p>}
        {velocityQ.error && <p style={{ color: '#dc2626' }}>{(velocityQ.error as Error).message}</p>}
        {!dupAgenciesQ.isLoading && !dupAgenciesQ.error && (
          <p className="muted" style={{ marginBottom: 8 }}>
            Duplicate agency keys: <strong>{dupAgenciesQ.data?.count ?? 0}</strong>
          </p>
        )}
        {!velocityQ.isLoading && !velocityQ.error && (
          <p className="muted" style={{ marginBottom: 8 }}>
            High listing velocity (7d, ≥6): <strong>{velocityQ.data?.count ?? 0}</strong> agents
          </p>
        )}
        {!dupPropsQ.isLoading && !dupPropsQ.error && (
          <p className="muted" style={{ marginBottom: 0 }}>
            Property duplicate signals:{' '}
            <strong>
              {(dupPropsQ.data?.coordinate_duplicates.length ?? 0) +
                (dupPropsQ.data?.title_number_duplicates.length ?? 0) +
                (dupPropsQ.data?.owner_name_duplicates.length ?? 0) +
                (dupPropsQ.data?.image_reuse_duplicates.length ?? 0)}
            </strong>{' '}
            groups (
            {dupPropsQ.data?.coordinate_duplicates.length ?? 0} coords,{' '}
            {dupPropsQ.data?.title_number_duplicates.length ?? 0} title numbers,{' '}
            {dupPropsQ.data?.owner_name_duplicates.length ?? 0} owners,{' '}
            {dupPropsQ.data?.image_reuse_duplicates.length ?? 0} image reuse)
          </p>
        )}
      </div>
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
