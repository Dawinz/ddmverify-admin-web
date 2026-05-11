'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { apiPatch } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/format-datetime';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type JsonRecord = Record<string, unknown>;

type UserDetailPayload = {
  ok?: boolean;
  user?: JsonRecord;
  agent?: JsonRecord | null;
  summary?: {
    bookings_total?: number;
    saved_total?: number;
    reports_filed_total?: number;
    listings_as_agent_total?: number;
  };
  bookings_recent?: JsonRecord[];
  saved_recent?: JsonRecord[];
  reports_filed?: JsonRecord[];
  device_tokens?: JsonRecord[];
  login_events?: JsonRecord[];
  audit_timeline?: JsonRecord[];
  payment_intents_recent?: JsonRecord[];
  properties_as_agent?: JsonRecord[];
  deal_events_recent?: JsonRecord[];
};

function str(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

function jsonPreview(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();

  const detailQ = useAdminQuery<UserDetailPayload>({
    key: ['admin', 'user', id],
    path: `/admin/users/${encodeURIComponent(id)}`,
    enabled: !!id,
  });

  const u = detailQ.data?.user ?? {};
  const status = str(u.account_status ?? (u.banned ? 'banned' : 'active'));
  const [moderationDraft, setModerationDraft] = useState('');
  const [riskDraft, setRiskDraft] = useState('0');
  const [riskSignalsDraft, setRiskSignalsDraft] = useState('{}');
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [recoveryLink, setRecoveryLink] = useState<string | null>(null);

  useEffect(() => {
    const user = detailQ.data?.user;
    if (!user) return;
    setModerationDraft(typeof user.moderation_message === 'string' ? user.moderation_message : '');
    setRiskDraft(String(user.risk_score ?? 0));
    const rs = user.risk_signals;
    setRiskSignalsDraft(rs != null ? jsonPreview(rs) : '{}');
  }, [detailQ.data?.user]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] });
  }, [queryClient, id]);

  const patchMutation = useMutation({
    mutationFn: async (body: object) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      return apiPatch(`/admin/users/${encodeURIComponent(id)}`, token, body);
    },
    onSuccess: () => invalidate(),
  });

  const recoveryMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      return apiPatch(`/admin/users/${encodeURIComponent(id)}`, token, {
        trigger_password_recovery: true,
      }) as Promise<{ recovery_link?: string | null; message?: string }>;
    },
    onSuccess: (data: unknown) => {
      invalidate();
      const link =
        typeof data === 'object' && data !== null && 'recovery_link' in data
          ? (data as { recovery_link?: string | null }).recovery_link
          : null;
      const safeLink = typeof link === 'string' ? link : null;
      setRecoveryLink(safeLink);
      setRecoveryMsg(
        safeLink
          ? 'Recovery link generated. Copy below; treat as sensitive.'
          : 'Recovery flow completed; check Supabase logs if no link returned.',
      );
      if (safeLink) void navigator.clipboard.writeText(safeLink).catch(() => {});
    },
  });

  if (!id) return <p className="muted">Missing user id.</p>;
  if (detailQ.isLoading) return <p className="muted">Loading user…</p>;
  if (detailQ.error) {
    return <p style={{ color: '#dc2626' }}>{(detailQ.error as Error).message}</p>;
  }

  const summary = detailQ.data?.summary ?? {};

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/users" className="link-sm">
          ← Users
        </Link>
      </div>

      <h1 className="page-title">User detail</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 16 }}>
        Trust &amp; safety inspection: lifecycle, risk, devices, logins, audit trail, and linked listings.
      </p>

      {patchMutation.error && (
        <p style={{ color: '#dc2626', marginBottom: 12 }}>{(patchMutation.error as Error).message}</p>
      )}
      {recoveryMutation.error && (
        <p style={{ color: '#dc2626', marginBottom: 12 }}>{(recoveryMutation.error as Error).message}</p>
      )}
      {recoveryMsg && <p className="muted" style={{ marginBottom: 12 }}>{recoveryMsg}</p>}
      {recoveryLink && (
        <div style={{ marginBottom: 12 }}>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Recovery link (sensitive)
          </label>
          <textarea readOnly value={recoveryLink} rows={3} style={{ width: '100%', maxWidth: 720, marginTop: 4 }} />
        </div>
      )}

      <div className="panel" style={{ marginBottom: 16, padding: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          <div>
            <span className="muted">Email</span>
            <div>{str(u.email)}</div>
          </div>
          <div>
            <span className="muted">Name</span>
            <div>{str(u.full_name)}</div>
          </div>
          <div>
            <span className="muted">Role</span>
            <div>{str(u.role)}</div>
          </div>
          <div>
            <span className="muted">Created</span>
            <div>{formatAdminDateTime(String(u.created_at ?? ''))}</div>
          </div>
          <div>
            <span className="muted">Current status</span>
            <div>
              <strong>{status}</strong> · banned flag: {u.banned ? 'yes' : 'no'}
            </div>
          </div>
          <div>
            <span className="muted">Messaging</span>
            <div>{u.messaging_disabled ? 'Disabled' : 'Enabled'}</div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Set lifecycle
            <select
              value={status}
              disabled={patchMutation.isPending}
              onChange={(e) =>
                patchMutation.mutate({
                  account_status: e.target.value as 'active' | 'pending' | 'suspended' | 'banned' | 'deleted' | 'under_review',
                })
              }
              style={{
                display: 'block',
                marginTop: 4,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '0.45rem 0.65rem',
              }}
            >
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="suspended">suspended</option>
              <option value="under_review">under_review</option>
              <option value="banned">banned</option>
              <option value="deleted">deleted</option>
            </select>
          </label>
          <button
            type="button"
            className={`btn ${u.messaging_disabled ? 'btn-success' : 'btn-neutral'}`}
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ messaging_disabled: !Boolean(u.messaging_disabled) })}
          >
            {u.messaging_disabled ? 'Enable messaging' : 'Disable messaging'}
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ identity_verification_requested: true })}
          >
            Request identity verification
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={recoveryMutation.isPending}
            onClick={() => recoveryMutation.mutate()}
          >
            Generate password recovery link
          </button>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="muted" style={{ fontSize: '0.85rem', display: 'block' }}>
            Moderation message (shown in app + pushes notification when saved)
          </label>
          <textarea
            value={moderationDraft}
            onChange={(e) => setModerationDraft(e.target.value)}
            rows={3}
            style={{ width: '100%', maxWidth: 640, marginTop: 6, padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <button
            type="button"
            className="btn btn-neutral"
            style={{ marginTop: 8 }}
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ moderation_message: moderationDraft.trim() || null })}
          >
            Save moderation message
          </button>
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 10, maxWidth: 640 }}>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Risk score (0–100)
            <input
              type="number"
              min={0}
              max={100}
              value={riskDraft}
              onChange={(e) => setRiskDraft(e.target.value)}
              style={{ display: 'block', marginTop: 4, padding: 8, borderRadius: 8, border: '1px solid #d1d5db', width: '100%' }}
            />
          </label>
          <label className="muted" style={{ fontSize: '0.85rem' }}>
            Risk signals (JSON object)
            <textarea
              value={riskSignalsDraft}
              onChange={(e) => setRiskSignalsDraft(e.target.value)}
              rows={5}
              style={{
                fontFamily: 'ui-monospace, monospace',
                marginTop: 4,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                width: '100%',
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={patchMutation.isPending}
            onClick={() => {
              let parsed: Record<string, unknown> = {};
              try {
                parsed = JSON.parse(riskSignalsDraft || '{}') as Record<string, unknown>;
              } catch {
                alert('Invalid JSON for risk_signals');
                return;
              }
              const rs = Number.parseInt(riskDraft, 10);
              patchMutation.mutate({
                risk_score: Number.isFinite(rs) ? rs : 0,
                risk_signals: parsed,
              });
            }}
          >
            Save risk metadata
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Summary</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          <span>
            Bookings: <strong>{summary.bookings_total ?? 0}</strong>
          </span>
          <span>
            Saved listings: <strong>{summary.saved_total ?? 0}</strong>
          </span>
          <span>
            Reports filed: <strong>{summary.reports_filed_total ?? 0}</strong>
          </span>
          <span>
            Listings as agent: <strong>{summary.listings_as_agent_total ?? 0}</strong>
          </span>
        </div>
      </div>

      {detailQ.data?.agent && (
        <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Agent profile</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{jsonPreview(detailQ.data.agent)}</pre>
        </div>
      )}

      <SectionTable title="Recent bookings (buyer)" rows={detailQ.data?.bookings_recent ?? []} columns={['created_at', 'status', 'property_title', 'viewing_slot']} />
      <SectionTable title="Saved properties" rows={detailQ.data?.saved_recent ?? []} columns={['created_at', 'property_title']} />
      <SectionTable
        title="Listing reports filed by user"
        rows={detailQ.data?.reports_filed ?? []}
        columns={['created_at', 'property_title', 'reason', 'status']}
      />
      <SectionTable title="Push device tokens (prefix)" rows={detailQ.data?.device_tokens ?? []} columns={['updated_at', 'token_prefix']} />
      <SectionTable title="Login / session touches" rows={detailQ.data?.login_events ?? []} columns={['created_at', 'ip', 'user_agent']} />
      <SectionTable title="Admin audit (actor or target)" rows={detailQ.data?.audit_timeline ?? []} columns={['created_at', 'action', 'target_type', 'target_id']} />
      <SectionTable title="Payment intents" rows={detailQ.data?.payment_intents_recent ?? []} columns={['created_at', 'purpose', 'amount', 'status']} />
      <SectionTable title="Properties as agent" rows={detailQ.data?.properties_as_agent ?? []} columns={['created_at', 'title', 'verification_status', 'listing_status']} />
      <SectionTable title="Deal status events" rows={detailQ.data?.deal_events_recent ?? []} columns={['created_at', 'property_title', 'previous_status', 'new_status']} />
    </div>
  );
}

function SectionTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: JsonRecord[];
  columns: string[];
}) {
  if (!rows.length) {
    return (
      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>{title}</h2>
        <p className="muted">No rows.</p>
      </div>
    );
  }
  return (
    <div className="panel panel-scroll" style={{ marginBottom: 16 }}>
      <h2 style={{ margin: '12px 12px 8px', fontSize: '1.05rem' }}>{title}</h2>
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {columns.map((c) => (
                <td key={c}>{formatCell(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  const s = String(v);
  if (s.includes('T') && s.includes(':') && s.length >= 18) {
    try {
      return formatAdminDateTime(s);
    } catch {
      return s;
    }
  }
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}
