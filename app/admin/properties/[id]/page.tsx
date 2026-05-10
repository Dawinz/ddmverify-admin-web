'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { useAdminQuery } from '@/lib/use-admin-query';
import { formatAdminDateTime } from '@/lib/format-datetime';

type PropertyDetailResponse = {
  property: Record<string, unknown>;
  images: Array<{ id: string; image_url: string }>;
};

function str(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const q = useAdminQuery<PropertyDetailResponse>({
    key: ['admin', 'property', id],
    path: `/admin/properties/${encodeURIComponent(id)}`,
    enabled: !!id,
  });

  if (!id) {
    return (
      <div>
        <p className="muted">Invalid property id.</p>
        <Link href="/admin/properties" className="btn btn-neutral">
          ← Back to properties
        </Link>
      </div>
    );
  }

  if (q.isLoading) return <p className="muted">Loading property…</p>;

  if (q.error) {
    return (
      <div>
        <p style={{ color: '#dc2626' }}>{(q.error as Error).message}</p>
        <Link href="/admin/properties" className="btn btn-neutral" style={{ marginTop: 12 }}>
          ← Back to properties
        </Link>
      </div>
    );
  }

  const row = q.data?.property;
  const images = q.data?.images ?? [];
  if (!row) return <p className="muted">No data.</p>;

  const rows: [string, string][] = [
    ['Title', str(row.title)],
    ['Location', str(row.location)],
    ['Price', str(row.price)],
    ['Category', str(row.category)],
    ['Verification', str(row.verification_status)],
    ['Created', formatAdminDateTime(row.created_at as string)],
    ['Updated', formatAdminDateTime(row.updated_at as string)],
    ['Agent email', str(row.agent_email)],
    ['Agency', str(row.agency_name)],
    ['Description', str(row.description)],
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/admin/properties" className="muted" style={{ textDecoration: 'none' }}>
          ← Properties
        </Link>
      </div>
      <h1 className="page-title">{str(row.title)}</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        Property ID: <code>{id}</code>
      </p>

      <div className="panel" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Summary</h2>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {rows.map(([k, v]) => (
            <div key={k}>
              <div className="muted" style={{ fontSize: 12 }}>
                {k}
              </div>
              <div style={{ whiteSpace: k === 'Description' ? 'pre-wrap' : undefined }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {images.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Images</h2>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {images.map((im, i) => (
              <li key={`${im.image_url}-${i}`} style={{ marginBottom: 8 }}>
                <a href={im.image_url} target="_blank" rel="noreferrer">
                  {im.image_url}
                  <ExternalLink size={12} style={{ marginLeft: 6, verticalAlign: 'middle' }} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
