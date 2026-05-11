'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { apiPatch, apiPost } from '@/lib/api';
import { formatAdminDateTime } from '@/lib/format-datetime';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type JsonRecord = Record<string, unknown>;

type AgentDetailPayload = {
  ok?: boolean;
  agent?: JsonRecord;
  reputation?: JsonRecord;
  properties_recent?: JsonRecord[];
  listing_reports_open?: JsonRecord[];
};

function str(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

export default function AdminAgentDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();
  const [kycTier, setKycTier] = useState('none');

  const q = useAdminQuery<AgentDetailPayload>({
    key: ['admin', 'agent', id],
    path: `/admin/agents/${encodeURIComponent(id)}`,
    enabled: !!id,
  });

  const agent = q.data?.agent ?? {};
  const rep = q.data?.reputation ?? {};

  useEffect(() => {
    if (!q.data?.agent) return;
    const kt = (q.data.agent as Record<string, unknown>)['kyc_tier'];
    if (typeof kt === 'string' && kt.length > 0) setKycTier(kt);
  }, [q.data]);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'agents'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'agent', id] });
  }, [queryClient, id]);

  const badgeMutation = useMutation({
    mutationFn: async (body: { status: string; reason?: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      return apiPost(`/admin/agents/${encodeURIComponent(id)}/badge-review`, token, body);
    },
    onSuccess: () => invalidate(),
  });

  const kycMutation = useMutation({
    mutationFn: async (tier: string) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      return apiPatch(`/admin/agents/${encodeURIComponent(id)}/kyc-tier`, token, { kyc_tier: tier });
    },
    onSuccess: () => invalidate(),
  });

  if (!id) return <p className="muted">Missing agent id.</p>;
  if (q.isLoading) return <p className="muted">Loading agent…</p>;
  if (q.error) return <p style={{ color: '#dc2626' }}>{(q.error as Error).message}</p>;

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/agents" className="link-sm">
          ← Agents
        </Link>
      </div>
      <h1 className="page-title">Agent detail</h1>
      <p className="muted" style={{ marginTop: 8, marginBottom: 16 }}>
        Trust module: documents, badge lifecycle, KYC tier, reputation signals, and open listing reports.
      </p>

      {(badgeMutation.error || kycMutation.error) && (
        <p style={{ color: '#dc2626', marginBottom: 12 }}>
          {(badgeMutation.error as Error)?.message ?? (kycMutation.error as Error)?.message}
        </p>
      )}

      <div className="panel" style={{ marginBottom: 16, padding: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          <div>
            <span className="muted">Agency</span>
            <div>{str(agent.agency_name)}</div>
          </div>
          <div>
            <span className="muted">User email</span>
            <div>{str(agent.email)}</div>
          </div>
          <div>
            <span className="muted">User name</span>
            <div>{str(agent.user_full_name)}</div>
          </div>
          <div>
            <span className="muted">Verified (legacy flag)</span>
            <div>{agent.verified ? 'yes' : 'no'}</div>
          </div>
          <div>
            <span className="muted">Badge status</span>
            <div>
              <strong>{str(agent.verification_badge_status)}</strong>
            </div>
          </div>
          <div>
            <span className="muted">KYC tier</span>
            <div>{str(agent.kyc_tier)}</div>
          </div>
          <div>
            <span className="muted">Gov ID workflow</span>
            <div>{str(agent.gov_id_validation_status)}</div>
          </div>
          <div>
            <span className="muted">Created</span>
            <div>{formatAdminDateTime(String(agent.created_at ?? ''))}</div>
          </div>
        </div>
        {str(agent.badge_rejection_reason) !== '—' && (
          <p style={{ marginTop: 12, color: '#b45309' }}>
            <strong>Last badge / review note:</strong> {str(agent.badge_rejection_reason)}
          </p>
        )}
        <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {str(agent.verification_document_url) !== '—' && (
            <a className="btn btn-neutral" href={String(agent.verification_document_url)} target="_blank" rel="noreferrer">
              Open ID / passport
            </a>
          )}
          {str(agent.business_license_url) !== '—' && (
            <a className="btn btn-neutral" href={String(agent.business_license_url)} target="_blank" rel="noreferrer">
              Open business license
            </a>
          )}
          {str(agent.selfie_verification_url) !== '—' && (
            <a className="btn btn-neutral" href={String(agent.selfie_verification_url)} target="_blank" rel="noreferrer">
              Open verification selfie
            </a>
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Reputation (aggregates)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <span>
            Listings: <strong>{str(rep.listings_total)}</strong>
          </span>
          <span>
            Verified listings: <strong>{str(rep.listings_verified)}</strong>
          </span>
          <span>
            Rejected listings: <strong>{str(rep.listings_rejected)}</strong>
          </span>
          <span>
            Pending listings: <strong>{str(rep.listings_pending)}</strong>
          </span>
          <span>
            Deals closed: <strong>{str(rep.deals_closed)}</strong>
          </span>
          <span>
            Open reports on listings: <strong>{str(rep.open_reports_on_listings)}</strong>
          </span>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>KYC tier (admin label)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select
            value={kycTier}
            onChange={(e) => setKycTier(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '0.45rem 0.65rem' }}
          >
            <option value="none">none</option>
            <option value="basic">basic</option>
            <option value="enhanced">enhanced</option>
            <option value="full">full</option>
          </select>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={kycMutation.isPending}
            onClick={() => kycMutation.mutate(kycTier)}
          >
            Save KYC tier
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 16, padding: 12 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>Badge actions</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="btn btn-success"
            disabled={badgeMutation.isPending}
            onClick={() => badgeMutation.mutate({ status: 'approved' })}
          >
            Approve badge
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={badgeMutation.isPending}
            onClick={() => {
              const reason = window.prompt('Rejection reason (required):') ?? '';
              if (!reason.trim()) return;
              badgeMutation.mutate({ status: 'rejected', reason: reason.trim() });
            }}
          >
            Reject (with reason)
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={badgeMutation.isPending}
            onClick={() => badgeMutation.mutate({ status: 'suspended' })}
          >
            Suspend badge
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={badgeMutation.isPending}
            onClick={() => badgeMutation.mutate({ status: 'expired' })}
          >
            Mark expired
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={badgeMutation.isPending}
            onClick={() => badgeMutation.mutate({ status: 'pending' })}
          >
            Reset to pending
          </button>
        </div>
      </div>

      <div className="panel panel-scroll" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '12px 12px 8px', fontSize: '1.05rem' }}>Recent listings</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Verification</th>
              <th>Listing</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.properties_recent ?? []).length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 16 }}>
                  No properties.
                </td>
              </tr>
            )}
            {(q.data?.properties_recent ?? []).map((p, idx) => (
              <tr key={idx}>
                <td>{str(p.title)}</td>
                <td>{str(p.verification_status)}</td>
                <td>{str(p.listing_status)}</td>
                <td>{formatAdminDateTime(String(p.created_at ?? ''))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel panel-scroll">
        <h2 style={{ margin: '12px 12px 8px', fontSize: '1.05rem' }}>Open listing reports (this agent’s properties)</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.listing_reports_open ?? []).length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 16 }}>
                  No open reports.
                </td>
              </tr>
            )}
            {(q.data?.listing_reports_open ?? []).map((r, idx) => (
              <tr key={idx}>
                <td>{str(r.property_title)}</td>
                <td>{str(r.reason)}</td>
                <td>{str(r.status)}</td>
                <td>{formatAdminDateTime(String(r.created_at ?? ''))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
