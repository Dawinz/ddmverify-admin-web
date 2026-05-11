'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formatAdminDateTime } from '@/lib/format-datetime';
import { useAdminQuery } from '@/lib/use-admin-query';

type AuditRow = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  actor_ip?: string | null;
  actor_user_agent?: string | null;
  created_at: string;
};

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const auditQ = useAdminQuery<{ items: AuditRow[]; page?: number; limit?: number; total?: number }>({
    key: ['admin', 'audit-logs', String(page), String(limit)],
    path: `/admin/audit-logs?page=${page}&limit=${limit}`,
  });

  const items = auditQ.data?.items ?? [];
  const total = auditQ.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (auditQ.isLoading) return <p className="muted">Loading audit log…</p>;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Link href="/admin" className="link-sm">
          ← Dashboard
        </Link>
      </div>
      <h1 className="page-title">Audit log</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 16 }}>
        Append-only admin actions from Railway (<code>admin_audit_logs</code>). Source of truth for compliance review.
      </p>

      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Rows per page
            <select
              value={String(limit)}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{
                marginLeft: 8,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '0.45rem 0.65rem',
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
        </div>
      </div>

      {auditQ.error && (
        <p style={{ color: '#dc2626', marginBottom: 16 }}>{(auditQ.error as Error).message}</p>
      )}

      <div className="panel panel-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Target</th>
              <th>IP</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24 }} className="muted">
                  No audit entries yet.
                </td>
              </tr>
            )}
            {items.map((row) => (
              <tr key={row.id}>
                <td className="muted td-nowrap" style={{ fontSize: '0.82rem' }}>
                  {formatAdminDateTime(row.created_at)}
                </td>
                <td>{row.action}</td>
                <td style={{ fontSize: '0.82rem', wordBreak: 'break-all' }}>{row.actor_user_id}</td>
                <td style={{ fontSize: '0.82rem' }}>
                  {row.target_type ?? '—'}
                  {row.target_id ? (
                    <>
                      <br />
                      <span className="muted">{row.target_id}</span>
                    </>
                  ) : null}
                </td>
                <td style={{ fontSize: '0.75rem', maxWidth: 120 }} className="muted">
                  {row.actor_ip ?? '—'}
                </td>
                <td style={{ fontSize: '0.75rem', maxWidth: 280, verticalAlign: 'top' }}>
                  <pre
                    style={{
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'ui-monospace, monospace',
                    }}
                  >
                    {row.details && Object.keys(row.details).length > 0
                      ? JSON.stringify(row.details, null, 0).slice(0, 400)
                      : '—'}
                    {row.details && JSON.stringify(row.details).length > 400 ? '…' : ''}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <span className="muted">
          Page {page} of {totalPages} ({total} events)
        </span>
        <div className="actions-inline">
          <button type="button" className="btn btn-neutral" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
