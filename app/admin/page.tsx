'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  Building2,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

import { DashboardChart } from '@/components/dashboard-chart';
import { useAdminQuery } from '@/lib/use-admin-query';

type Kpi = {
  id: string;
  label: string;
  value: number | string;
  deltaPct: number | null;
  deltaLabel: string;
  accent: string;
};

type MetricCard = {
  id: string;
  group: 'operations' | 'engagement' | 'risk' | 'financial';
  label: string;
  value: number | string;
  deltaPct: number | null;
  deltaLabel: string;
  accent: string;
  drillHref: string;
  drillLabel: string;
};

type AgentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  verified: boolean;
  agency_name: string | null;
  listings: string;
  activity_at: string;
};

type ActivityItem = {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  actor_user_id: string;
  created_at: string;
};

type DashboardPayload = {
  range?: {
    from: string;
    to: string;
    preset: string;
    compare_label?: string;
  };
  metric_cards?: MetricCard[];
  kpis: Kpi[];
  agent_activity: AgentRow[];
  chart: {
    labels: string[];
    new_listings_by_day: number[];
    verified_by_day: number[];
    bucket?: string;
  };
  analytics?: {
    rejection_rate_pct: number | null;
    avg_verification_days: number | null;
    revenue_tz_s: number;
    revenue_currency: string;
    top_locations: { location: string; count: number }[];
    duplicate_listing_pairs_estimate: number;
  };
  activity_feed?: ActivityItem[];
  insights: { severity: 'critical' | 'warning' | 'info' | 'positive'; message: string }[];
  notifications_24h?: number;
  totals?: {
    pending_verification: number;
    properties: number;
    verified_properties: number;
    open_listing_reports?: number;
    bookings_in_range?: number;
    banned_users?: number;
  };
};

const kpiIcons: Record<string, typeof Building2> = {
  listings: Building2,
  bookings: CalendarClock,
  threads: Inbox,
  messages: Mail,
  verification: ShieldCheck,
  signups: UserPlus,
};

function formatKpiValue(k: Kpi | MetricCard): string {
  if (typeof k.value === 'number') return String(k.value);
  return k.value ?? '—';
}

function DeltaBadge({
  deltaPct,
  deltaLabel,
}: {
  deltaPct: number | null;
  deltaLabel: string;
}) {
  if (deltaPct == null) {
    return <span className="kpi-delta muted">{deltaLabel}</span>;
  }
  const up = deltaPct > 0;
  const flat = deltaPct === 0;
  return (
    <span className={`kpi-delta${flat ? ' flat' : up ? ' up' : ' down'}`}>
      {flat ? 'Flat' : `${up ? '+' : ''}${deltaPct}%`} {deltaLabel}
    </span>
  );
}

function buildDashboardQuery(searchParams: URLSearchParams): string {
  const p = new URLSearchParams();
  const preset = searchParams.get('preset');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (from && to) {
    p.set('from', from);
    p.set('to', to);
    p.set('preset', 'custom');
  } else if (preset && preset !== 'custom') {
    p.set('preset', preset);
  } else {
    p.set('preset', '7d');
  }
  const qs = p.toString();
  return qs ? `/admin/dashboard?${qs}` : '/admin/dashboard';
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const dashboardPath = useMemo(() => buildDashboardQuery(searchParams), [searchParams]);

  const dashQ = useAdminQuery<DashboardPayload>({
    key: ['admin', 'dashboard', dashboardPath],
    path: dashboardPath,
  });

  const currentPreset = searchParams.get('preset') ?? '7d';

  const setPreset = (preset: string) => {
    const p = new URLSearchParams();
    p.set('preset', preset);
    router.replace(`/admin?${p.toString()}`);
  };

  if (dashQ.isLoading) {
    return (
      <div className="dashboard-loading">
        <p className="muted">Loading operations dashboard…</p>
      </div>
    );
  }

  if (dashQ.error) {
    return <p style={{ color: '#dc2626' }}>{(dashQ.error as Error).message}</p>;
  }

  const data = dashQ.data!;
  const metricCards = data.metric_cards ?? [];
  const opsCards = metricCards.filter((m) => m.group === 'operations' || m.group === 'risk' || m.group === 'financial');
  const engagementCards = metricCards.filter((m) => m.group === 'engagement');
  const kpis = data.kpis ?? [];
  const agents = data.agent_activity ?? [];
  const chart = data.chart;
  const rangeLabel = data.range
    ? data.range.preset === 'custom'
      ? `${data.range.from} → ${data.range.to}`
      : data.range.preset === 'today'
        ? 'Today'
        : data.range.preset === '30d'
          ? 'Last 30 days'
          : 'Last 7 days'
    : '';

  return (
    <div className="dashboard-page">
      <div className="dashboard-toolbar panel" style={{ marginBottom: 18, padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.65rem' }}>
              Operations dashboard
            </h1>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>
              Live metrics from Railway Postgres · Compare each metric to the prior period of equal length.
              {rangeLabel ? ` · ${rangeLabel}` : ''}
            </p>
          </div>
          <div className="dashboard-range-btns" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-neutral btn-sm${currentPreset === 'today' ? ' btn-active-dash' : ''}`}
              onClick={() => setPreset('today')}
            >
              Today
            </button>
            <button
              type="button"
              className={`btn btn-neutral btn-sm${currentPreset === '7d' ? ' btn-active-dash' : ''}`}
              onClick={() => setPreset('7d')}
            >
              7 days
            </button>
            <button
              type="button"
              className={`btn btn-neutral btn-sm${currentPreset === '30d' ? ' btn-active-dash' : ''}`}
              onClick={() => setPreset('30d')}
            >
              30 days
            </button>
          </div>
        </div>
      </div>

      {opsCards.length > 0 && (
        <section className="dashboard-section" aria-label="Operational metrics">
          <h2 className="dashboard-section-title">Operations & risk</h2>
          <div className="kpi-grid metric-grid-wide">
            {opsCards.map((k) => {
              const Icon = kpiIcons[k.id] ?? LayoutDashboard;
              return (
                <div key={k.id} className={`kpi-card accent-${k.accent}`}>
                  <div className="kpi-card-top">
                    <div>
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-value">{formatKpiValue(k)}</div>
                      <DeltaBadge deltaPct={k.deltaPct} deltaLabel={k.deltaLabel} />
                      <div style={{ marginTop: 10 }}>
                        <Link href={k.drillHref} className="link-sm">
                          {k.drillLabel} →
                        </Link>
                      </div>
                    </div>
                    <div className="kpi-icon-wrap" aria-hidden>
                      <Icon size={17} strokeWidth={1.75} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {engagementCards.length > 0 && (
        <section className="dashboard-section" aria-label="Engagement metrics">
          <h2 className="dashboard-section-title">Engagement</h2>
          <div className="kpi-grid">
            {engagementCards.map((k) => {
              const Icon = kpiIcons[k.id] ?? Building2;
              return (
                <div key={k.id} className={`kpi-card accent-${k.accent}`}>
                  <div className="kpi-card-top">
                    <div>
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-value">{formatKpiValue(k)}</div>
                      <DeltaBadge deltaPct={k.deltaPct} deltaLabel={k.deltaLabel} />
                      <div style={{ marginTop: 10 }}>
                        <Link href={k.drillHref} className="link-sm">
                          {k.drillLabel} →
                        </Link>
                      </div>
                    </div>
                    <div className="kpi-icon-wrap" aria-hidden>
                      <Icon size={17} strokeWidth={1.75} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {metricCards.length === 0 && (
        <section className="kpi-grid" aria-label="Key metrics (legacy row)">
          {kpis.map((k) => {
            const Icon = kpiIcons[k.id] ?? Building2;
            return (
              <div key={k.id} className={`kpi-card accent-${k.accent}`}>
                <div className="kpi-card-top">
                  <div>
                    <div className="kpi-label">{k.label}</div>
                    <div className="kpi-value">{formatKpiValue(k)}</div>
                    <DeltaBadge deltaPct={k.deltaPct} deltaLabel={k.deltaLabel} />
                  </div>
                  <div className="kpi-icon-wrap" aria-hidden>
                    <Icon size={17} strokeWidth={1.75} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="dashboard-panel agent-panel">
        <div className="panel-head">
          <h2>Agent activity</h2>
          <div className="panel-head-actions">
            <Link href="/admin/agents" className="btn btn-neutral btn-sm">
              View all
            </Link>
          </div>
        </div>
        <div className="table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Focus</th>
                <th>Listings</th>
                <th>Last activity</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 && (
                <tr>
                  <td colSpan={6} className="td-empty">
                    No agents yet.
                  </td>
                </tr>
              )}
              {agents.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="agent-cell">
                      <div className="agent-avatar">{(a.full_name ?? a.email ?? '?').slice(0, 1).toUpperCase()}</div>
                      <div>
                        <div className="agent-name">{a.full_name?.trim() || '—'}</div>
                        <div className="agent-email muted">{a.email ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`pill ${a.verified ? 'pill-success' : 'pill-warn'}`}>
                      {a.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>Listings</td>
                  <td>{a.listings}</td>
                  <td className="muted td-nowrap">
                    {a.activity_at ? new Date(a.activity_at).toLocaleString() : '—'}
                  </td>
                  <td>
                    <Link href="/admin/agents" className="link-muted">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="dashboard-split">
        <section className="dashboard-panel chart-panel">
          <div className="panel-head">
            <h2>
              New listings & verifications completed
              {chart.bucket === 'week' ? ' (weekly buckets)' : ' (daily)'}
            </h2>
          </div>
          {chart.labels.length > 0 ? (
            <DashboardChart
              labels={chart.labels}
              seriesA={chart.new_listings_by_day}
              seriesB={chart.verified_by_day}
              labelA="New listings"
              labelB="Verifications completed"
            />
          ) : (
            <p className="muted">No chart data for this range.</p>
          )}
        </section>

        <section className="dashboard-panel insights-panel">
          <div className="panel-head">
            <h2>Alerts & insights</h2>
            <Link href="/admin/verification" className="link-sm">
              Review queue
            </Link>
          </div>
          <ul className="insights-list">
            {(data.insights ?? []).map((ins, i) => (
              <li key={i} className={`insight insight-${ins.severity}`}>
                {ins.message}
              </li>
            ))}
          </ul>
          {typeof data.notifications_24h === 'number' && (
            <p className="muted foot-note">{data.notifications_24h} in-app notifications (24h).</p>
          )}
        </section>
      </div>

      <div className="dashboard-split">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Analytics snapshot</h2>
          </div>
          {data.analytics ? (
            <div style={{ padding: '4px 4px 12px', fontSize: '0.92rem', lineHeight: 1.55 }}>
              <p>
                <strong>Rejection rate</strong> (period){' '}
                {data.analytics.rejection_rate_pct == null
                  ? '—'
                  : `${data.analytics.rejection_rate_pct}%`}
              </p>
              <p>
                <strong>Avg. verification time</strong>{' '}
                {data.analytics.avg_verification_days == null
                  ? '—'
                  : `${data.analytics.avg_verification_days} days`}
              </p>
              <p>
                <strong>Revenue</strong> {Math.round(data.analytics.revenue_tz_s)} {data.analytics.revenue_currency}{' '}
                <span className="muted">(completed payment intents in range)</span>
              </p>
              {data.analytics.top_locations.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <strong>Top locations (new listings)</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    {data.analytics.top_locations.map((loc) => (
                      <li key={loc.location}>
                        {loc.location} — {loc.count}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="muted">No analytics block.</p>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Operational feed</h2>
            <Link href="/admin/audit" className="link-sm">
              Full audit log
            </Link>
          </div>
          <div className="table-scroll">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Action</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {(data.activity_feed ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="td-empty muted">
                      No audit entries yet.
                    </td>
                  </tr>
                )}
                {(data.activity_feed ?? []).map((row) => (
                  <tr key={row.id}>
                    <td className="muted td-nowrap" style={{ fontSize: '0.82rem' }}>
                      {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                    </td>
                    <td>{row.action}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {row.target_type ?? '—'} {row.target_id ? `· ${row.target_id.slice(0, 8)}…` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {data.totals && (
        <section className="dashboard-quick panel" style={{ marginTop: 16 }}>
          <h3 className="quick-title">Totals snapshot</h3>
          <p className="muted" style={{ fontSize: '0.88rem', marginBottom: 12 }}>
            Pending backlog {data.totals.pending_verification} · All properties {data.totals.properties} · Verified{' '}
            {data.totals.verified_properties}
            {typeof data.totals.open_listing_reports === 'number' && (
              <> · Open reports {data.totals.open_listing_reports}</>
            )}
            {typeof data.totals.bookings_in_range === 'number' && (
              <> · Bookings in range {data.totals.bookings_in_range}</>
            )}
            {typeof data.totals.banned_users === 'number' && <> · Banned users {data.totals.banned_users}</>}
          </p>
        </section>
      )}

      <section className="dashboard-quick panel">
        <h3 className="quick-title">Shortcuts</h3>
        <div className="quick-links">
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/properties">Properties</Link>
          <Link href="/admin/verification">Verification</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <Link href="/admin/deals">Deals</Link>
          <Link href="/admin/payment-methods">Payments</Link>
          <Link href="/admin/reports">Moderation reports</Link>
        </div>
      </section>
    </div>
  );
}
