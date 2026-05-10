'use client';

import Link from 'next/link';
import {
  Building2,
  CalendarDays,
  Home,
  MessageCircle,
  Percent,
  Users,
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

type AgentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  verified: boolean;
  agency_name: string | null;
  listings: string;
  activity_at: string;
};

type DashboardPayload = {
  kpis: Kpi[];
  agent_activity: AgentRow[];
  chart: {
    labels: string[];
    new_listings_by_day: number[];
    verified_by_day: number[];
  };
  insights: { severity: 'critical' | 'warning' | 'info' | 'positive'; message: string }[];
  notifications_24h?: number;
  totals?: { pending_verification: number; properties: number; verified_properties: number };
};

const kpiIcons: Record<string, typeof Building2> = {
  listings: Building2,
  bookings: CalendarDays,
  threads: Home,
  messages: MessageCircle,
  verification: Percent,
  signups: Users,
};

function formatKpiValue(k: Kpi): string {
  if (typeof k.value === 'number') return String(k.value);
  return k.value ?? '—';
}

function DeltaBadge({ k }: { k: Kpi }) {
  if (k.deltaPct == null) {
    return <span className="kpi-delta muted">{k.deltaLabel}</span>;
  }
  const up = k.deltaPct > 0;
  const flat = k.deltaPct === 0;
  return (
    <span className={`kpi-delta${flat ? ' flat' : up ? ' up' : ' down'}`}>
      {flat ? 'Flat' : `${up ? '+' : ''}${k.deltaPct}%`} {k.deltaLabel}
    </span>
  );
}

export default function AdminDashboard() {
  const dashQ = useAdminQuery<DashboardPayload>({
    key: ['admin', 'dashboard'],
    path: '/admin/dashboard',
  });

  if (dashQ.isLoading) {
    return (
      <div className="dashboard-loading">
        <p className="muted">Loading operations dashboard…</p>
      </div>
    );
  }

  if (dashQ.error) {
    return (
      <p style={{ color: '#dc2626' }}>{(dashQ.error as Error).message}</p>
    );
  }

  const data = dashQ.data!;
  const kpis = data.kpis ?? [];
  const agents = data.agent_activity ?? [];
  const chart = data.chart;

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-h1">Overview</h1>
        <p className="dashboard-sub muted">
          Live metrics from Railway Postgres — listings, bookings, messaging, and verification.
        </p>
      </div>

      <section className="kpi-grid" aria-label="Key metrics">
        {kpis.map((k) => {
          const Icon = kpiIcons[k.id] ?? Building2;
          return (
            <div key={k.id} className={`kpi-card accent-${k.accent}`}>
              <div className="kpi-card-top">
                <div>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{formatKpiValue(k)}</div>
                  <DeltaBadge k={k} />
                </div>
                <div className="kpi-icon-wrap" aria-hidden>
                  <Icon size={26} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

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
            <h2>New listings & verified (7 days)</h2>
          </div>
          {chart.labels.length > 0 ? (
            <DashboardChart
              labels={chart.labels}
              seriesA={chart.new_listings_by_day}
              seriesB={chart.verified_by_day}
              labelA="New listings / day"
              labelB="Moved to verified / day"
            />
          ) : (
            <p className="muted">No chart data.</p>
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

      <section className="dashboard-quick panel">
        <h3 className="quick-title">Shortcuts</h3>
        <div className="quick-links">
          <Link href="/admin/users">Users</Link>
          <Link href="/admin/properties">Properties</Link>
          <Link href="/admin/verification">Verification</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <Link href="/admin/deals">Deals</Link>
          <Link href="/admin/payment-methods">Payments</Link>
        </div>
      </section>
    </div>
  );
}
