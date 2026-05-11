'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { apiPost } from '@/lib/api';
import { getAccessToken, useAdminQuery } from '@/lib/use-admin-query';

type DealItem = {
  id: string;
  property_id: string;
  property_title?: string | null;
  buyer_user_id?: string | null;
  buyer_email?: string | null;
  agent_user_id?: string | null;
  agent_email?: string | null;
  verification_stage?: number | null;
  status?: string | null;
  stage?: string | null;
  deal_stage_updated_at?: string | null;
  updated_at?: string | null;
};

type DealTimelineEvent = {
  id: string;
  previous_status?: string | null;
  new_status?: string | null;
  actor_email?: string | null;
  actor_role?: string | null;
  comment?: string | null;
  evidence_url?: string | null;
  created_at?: string | null;
};

export default function AdminDealsPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [actionsOpenForId, setActionsOpenForId] = useState<string | null>(null);
  const [selected, setSelected] = useState<DealItem | null>(null);
  const dealsQ = useAdminQuery<{ items: DealItem[] }>({
    key: ['admin', 'deals'],
    path: '/admin/deals',
    fallback: { items: [] },
  });
  const items = dealsQ.data?.items ?? [];
  const filtered = items.filter((d) => {
    const q = query.trim().toLowerCase();
    const status = (d.status ?? 'active').toLowerCase();
    const stage = (d.stage ?? 'initiated').toLowerCase();
    const matchesQuery =
      q.length === 0 ||
      (d.property_title ?? '').toLowerCase().includes(q) ||
      (d.buyer_email ?? '').toLowerCase().includes(q) ||
      (d.agent_email ?? '').toLowerCase().includes(q) ||
      d.property_id.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const matchesStage = stageFilter === 'all' || stage === stageFilter;
    return matchesQuery && matchesStatus && matchesStage;
  });
  const timelineQ = useAdminQuery<{ timeline: DealTimelineEvent[] }>({
    key: ['admin', 'deal', 'timeline', selected?.property_id ?? 'none'],
    path: selected?.property_id ? `/admin/deals/${encodeURIComponent(selected.property_id)}/timeline` : '/admin/deals/00000000-0000-0000-0000-000000000000/timeline',
    fallback: { timeline: [] },
    enabled: Boolean(selected?.property_id),
  });
  const statusMutation = useMutation({
    mutationFn: async ({ deal, next_stage }: { deal: DealItem; next_stage: string }) => {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      await apiPost('/admin/deals/stage-transition', token, {
        property_id: deal.property_id,
        next_stage,
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'deals'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'deal', 'timeline', variables.deal.property_id] });
    },
  });

  if (dealsQ.isLoading) return <p className="muted">Loading deals...</p>;

  return (
    <div>
      <h1 className="page-title">Deals Control</h1>
      {dealsQ.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(dealsQ.error as Error).message}</p>}
      {statusMutation.error && <p style={{ color: '#dc2626', marginBottom: 16 }}>{(statusMutation.error as Error).message}</p>}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) minmax(130px, 170px) minmax(160px, 220px)', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search property, buyer, agent..."
              style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
              <option value="disputed">disputed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span className="muted">Stage</span>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px' }}>
              <option value="all">All stages</option>
              <option value="initiated">initiated</option>
              <option value="document_submission">document_submission</option>
              <option value="ownership_validation">ownership_validation</option>
              <option value="government_verification">government_verification</option>
              <option value="site_verification">site_verification</option>
              <option value="legal_review">legal_review</option>
              <option value="buyer_confirmation">buyer_confirmation</option>
              <option value="payment_confirmation">payment_confirmation</option>
              <option value="completed">completed</option>
              <option value="disputed">disputed</option>
              <option value="cancelled">cancelled</option>
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
              <th>Agent</th>
              <th>Verification</th>
              <th>Deal Stage</th>
              <th>Status</th>
              <th>Updated</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>No matching deals</td>
              </tr>
            )}
            {filtered.map((d) => {
              const actionsVisible = actionsOpenForId === d.id;
              return (
                <>
                  <tr key={d.id}>
                    <td>
                      <Link href={`/admin/properties/${encodeURIComponent(d.property_id)}`} className="link-sm">
                        {d.property_title ?? d.property_id}
                      </Link>
                    </td>
                    <td>
                      {d.buyer_user_id ? (
                        <Link href={`/admin/users/${encodeURIComponent(d.buyer_user_id)}`} className="link-sm">
                          {d.buyer_email ?? '—'}
                        </Link>
                      ) : (
                        d.buyer_email ?? '—'
                      )}
                    </td>
                    <td>
                      {d.agent_user_id ? (
                        <Link href={`/admin/users/${encodeURIComponent(d.agent_user_id)}`} className="link-sm">
                          {d.agent_email ?? '—'}
                        </Link>
                      ) : (
                        d.agent_email ?? '—'
                      )}
                    </td>
                    <td>{d.verification_stage ?? 1}/7</td>
                    <td>{(d.stage ?? 'initiated').toLowerCase()}</td>
                    <td>{d.status ?? 'active'}</td>
                    <td>{d.deal_stage_updated_at ? new Date(d.deal_stage_updated_at).toLocaleString() : d.updated_at ? new Date(d.updated_at).toLocaleString() : '—'}</td>
                    <td className="actions-col">
                      <div className="actions-inline">
                        <button type="button" className="btn btn-neutral" onClick={() => setSelected(d)}>
                          View details
                        </button>
                        <button type="button" className="btn btn-neutral" onClick={() => setActionsOpenForId((prev) => (prev === d.id ? null : d.id))}>
                          {actionsVisible ? 'Hide actions' : 'View actions'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {actionsVisible && (
                    <tr key={`${d.id}-actions`}>
                      <td colSpan={8} style={{ background: '#f8fafc' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, padding: 10 }}>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'document_submission' })}>
                            Docs
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'ownership_validation' })}>
                            Ownership
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'government_verification' })}>
                            Govt
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'site_verification' })}>
                            Site
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'legal_review' })}>
                            Legal
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'buyer_confirmation' })}>
                            Buyer confirm
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'payment_confirmation' })}>
                            Payment
                          </button>
                          <button type="button" className="btn btn-success" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'completed' })}>
                            Complete
                          </button>
                          <button type="button" className="btn btn-neutral" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'disputed' })}>
                            Dispute
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => statusMutation.mutate({ deal: d, next_stage: 'cancelled' })}>
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
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Deal details</h2>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div><strong>Deal ID:</strong> <code>{selected.id}</code></div>
              <div><strong>Status:</strong> {selected.status ?? 'active'}</div>
              <div>
                <strong>Property:</strong>{' '}
                <Link href={`/admin/properties/${encodeURIComponent(selected.property_id)}`} className="link-sm">
                  {selected.property_title ?? selected.property_id}
                </Link>
              </div>
              <div><strong>Property ID:</strong> <code>{selected.property_id}</code></div>
              <div>
                <strong>Buyer:</strong>{' '}
                {selected.buyer_user_id ? <Link href={`/admin/users/${encodeURIComponent(selected.buyer_user_id)}`} className="link-sm">{selected.buyer_email ?? '—'}</Link> : (selected.buyer_email ?? '—')}
              </div>
              <div>
                <strong>Agent:</strong>{' '}
                {selected.agent_user_id ? <Link href={`/admin/users/${encodeURIComponent(selected.agent_user_id)}`} className="link-sm">{selected.agent_email ?? '—'}</Link> : (selected.agent_email ?? '—')}
              </div>
              <div><strong>Verification stage:</strong> {selected.verification_stage ?? 1}/7</div>
              <div><strong>Deal stage:</strong> {selected.stage ?? 'initiated'}</div>
              <div><strong>Updated:</strong> {selected.updated_at ? new Date(selected.updated_at).toLocaleString() : '—'}</div>
            </div>
            <div style={{ marginTop: 14 }}>
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 14 }}>Timeline</h3>
              {timelineQ.isLoading && <p className="muted">Loading timeline...</p>}
              {!timelineQ.isLoading && (timelineQ.data?.timeline?.length ?? 0) === 0 && (
                <p className="muted">No timeline events yet.</p>
              )}
              {(timelineQ.data?.timeline ?? []).slice(0, 8).map((e) => (
                <div key={e.id} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{(e.previous_status ?? '—')} → {(e.new_status ?? '—')}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {(e.actor_email ?? e.actor_role ?? 'system')} • {e.created_at ? new Date(e.created_at).toLocaleString() : '—'}
                  </div>
                  {e.comment ? <div style={{ marginTop: 4 }}>{e.comment}</div> : null}
                  {e.evidence_url ? <div style={{ marginTop: 4 }}><a href={e.evidence_url} target="_blank" rel="noreferrer" className="link-sm">Open evidence</a></div> : null}
                </div>
              ))}
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
