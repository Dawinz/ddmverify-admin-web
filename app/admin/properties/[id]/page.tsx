'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { apiPatch } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { useAdminQuery, getAccessToken } from '@/lib/use-admin-query';
import { formatAdminDateTime } from '@/lib/format-datetime';

type PropertyDetailResponse = {
  property: Record<string, unknown>;
  images: Array<{ id: string; image_url: string }>;
};

const API = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

function str(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const s = String(v).trim();
  return s.length ? s : '—';
}

function PropertyGalleryImage({
  url,
  index,
  onPreview,
}: {
  url: string;
  index: number;
  onPreview: () => void;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="property-detail-images__broken" role="img" aria-label={`Image ${index + 1} failed to load`}>
        <ImageOff size={28} strokeWidth={1.5} aria-hidden />
        <span>Could not load image</span>
        <a href={url} target="_blank" rel="noreferrer" className="link-sm">
          Open URL
        </a>
      </div>
    );
  }
  return (
    <button
      type="button"
      className="property-detail-images__link"
      onClick={onPreview}
      title="View larger on this page"
    >
      <img
        src={url}
        alt={`Property photo ${index + 1}`}
        loading={index < 4 ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </button>
  );
}

export default function AdminPropertyDetailPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();
  const q = useAdminQuery<PropertyDetailResponse>({
    key: ['admin', 'property', id],
    path: `/admin/properties/${encodeURIComponent(id)}`,
    enabled: !!id,
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionOk, setActionOk] = useState('');
  const [rowVersion, setRowVersion] = useState<string | null>(null);
  const [listingStatus, setListingStatus] = useState<'active' | 'expired' | 'revoked'>('active');
  const [listingBusy, setListingBusy] = useState(false);
  const [listingMsg, setListingMsg] = useState('');

  const images = q.data?.images ?? [];
  const lightboxOpen =
    lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < images.length;
  const currentUrl = lightboxOpen ? images[lightboxIndex].image_url : '';

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null && i < images.length - 1 ? i + 1 : i,
    );
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen, closeLightbox, goPrev, goNext]);

  useEffect(() => {
    const row = q.data?.property as Record<string, unknown> | undefined;
    if (!row) return;
    const rv = row['row_version'];
    if (rv !== undefined && rv !== null) setRowVersion(String(rv));
    const ls = row['listing_status'];
    if (ls === 'active' || ls === 'expired' || ls === 'revoked') {
      setListingStatus(ls);
    }
  }, [q.data?.property]);

  function ifMatchHeaders(): Record<string, string> | undefined {
    if (!rowVersion || rowVersion.trim() === '') return undefined;
    return { 'If-Match': `W/"${rowVersion.trim()}"` };
  }

  async function postVerification(path: string, body: Record<string, unknown>) {
    const token = await getAccessToken();
    if (!token) throw new Error('No active session.');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    const im = ifMatchHeaders();
    if (im) Object.assign(headers, im);
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (res.status === 409) {
      throw new Error('Version conflict — refresh the page and try again.');
    }
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = (await res.json()) as { error?: string; message?: string };
        msg = j.error ?? j.message ?? msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    try {
      const j = (await res.json()) as { row_version?: string | number };
      if (j.row_version != null) setRowVersion(String(j.row_version));
    } catch {
      /* ignore */
    }
  }

  async function runAction(
    label: string,
    fn: () => Promise<void>,
  ) {
    setActionError('');
    setActionOk('');
    setActionBusy(true);
    try {
      await fn();
      setActionOk(`${label} saved.`);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'property', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionBusy(false);
    }
  }

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
  if (!row) return <p className="muted">No data.</p>;

  const rows: [string, string][] = [
    ['Title', str(row.title)],
    ['Location', str(row.location)],
    ['Price', str(row.price)],
    ['Category', str(row.category)],
    ['Listing status', str(row.listing_status)],
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

      <div className="panel property-detail-actions property-detail-panel" style={{ marginBottom: 16 }}>
        <div className="property-detail-actions__head">
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Verification & actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <Link href={`/admin/properties/${encodeURIComponent(id)}/verification-report`} className="btn btn-neutral link-sm" style={{ textDecoration: 'none' }}>
              Edit verification report
            </Link>
            <Link href="/admin/verification" className="link-sm">
              Open verification queue →
            </Link>
          </div>
        </div>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
          Run the same checks as the verification queue: approve, reject, request changes, or suspend this listing.
          {rowVersion != null ? (
            <>
              {' '}
              Row version <code>{rowVersion}</code> is sent as <code>If-Match</code> when present.
            </>
          ) : null}
        </p>
        {actionError && (
          <p style={{ color: '#dc2626', margin: '0 0 10px', fontSize: 14 }} role="alert">
            {actionError}
          </p>
        )}
        {actionOk && (
          <p style={{ color: '#15803d', margin: '0 0 10px', fontSize: 14 }} role="status">
            {actionOk}
          </p>
        )}
        <div className="property-detail-actions__buttons">
          <button
            type="button"
            className="btn btn-success"
            disabled={actionBusy}
            onClick={() =>
              runAction('Approve', () =>
                postVerification('/verification/approve', { property_id: id }),
              )
            }
          >
            Approve
          </button>
          <button
            type="button"
            className="btn btn-danger"
            disabled={actionBusy}
            onClick={() => {
              const reason = window.prompt('Rejection reason (optional):') ?? '';
              void runAction('Reject', () =>
                postVerification('/verification/reject', {
                  property_id: id,
                  ...(reason.trim() ? { reason: reason.trim() } : {}),
                }),
              );
            }}
          >
            Reject
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={actionBusy}
            onClick={() => {
              const reason = window.prompt('What needs to change? (optional)') ?? '';
              void runAction('Needs changes', () =>
                postVerification('/verification/needs-changes', {
                  property_id: id,
                  ...(reason.trim() ? { reason: reason.trim() } : {}),
                }),
              );
            }}
          >
            Needs changes
          </button>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={actionBusy}
            style={{ borderColor: '#cbd5e1' }}
            onClick={() => {
              const reason = window.prompt('Suspend reason (optional):') ?? '';
              void runAction('Suspend', () =>
                postVerification('/verification/suspend', {
                  property_id: id,
                  ...(reason.trim() ? { reason: reason.trim() } : {}),
                }),
              );
            }}
          >
            Suspend
          </button>
        </div>
      </div>

      <div className="panel property-detail-panel" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Public catalog listing</h2>
        <p className="muted" style={{ margin: '0 0 12px', fontSize: 13, maxWidth: 560 }}>
          Non‑active listings are hidden from <code>GET /catalog/properties</code>. Uses the same row version as other actions.
        </p>
        {listingMsg && (
          <p style={{ color: '#15803d', margin: '0 0 10px', fontSize: 14 }} role="status">
            {listingMsg}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <label className="muted" style={{ fontSize: 13 }}>
            Status{' '}
            <select
              className="input"
              style={{ marginLeft: 8 }}
              value={listingStatus}
              disabled={listingBusy}
              onChange={(e) => setListingStatus(e.target.value as 'active' | 'expired' | 'revoked')}
            >
              <option value="active">active</option>
              <option value="expired">expired</option>
              <option value="revoked">revoked</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn-neutral"
            disabled={listingBusy}
            onClick={() => {
              void (async () => {
                setListingMsg('');
                setActionError('');
                setListingBusy(true);
                try {
                  const token = await getAccessToken();
                  if (!token) throw new Error('No active session.');
                  const out = (await apiPatch(
                    `/admin/properties/${encodeURIComponent(id)}/listing-status`,
                    token,
                    { listing_status: listingStatus },
                    ifMatchHeaders(),
                  )) as { row_version?: string | number };
                  if (out.row_version != null) setRowVersion(String(out.row_version));
                  setListingMsg('Listing status updated.');
                  await queryClient.invalidateQueries({ queryKey: ['admin', 'property', id] });
                  await queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
                } catch (e) {
                  setActionError(e instanceof Error ? e.message : 'Update failed');
                } finally {
                  setListingBusy(false);
                }
              })();
            }}
          >
            {listingBusy ? 'Saving…' : 'Save listing status'}
          </button>
        </div>
      </div>

      <div className="panel property-detail-panel" style={{ marginBottom: 16 }}>
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
        <div className="panel property-detail-images property-detail-panel" style={{ marginBottom: 16 }}>
          <div className="property-detail-images__head">
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Images</h2>
            <span className="property-detail-images__count">
              {images.length} photo{images.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 13 }}>
            Click a photo to preview it on this page. Use arrow keys when the preview is open.
          </p>
          <div className="property-detail-images__grid">
            {images.map((im, i) => (
              <figure key={im.id || `${im.image_url}-${i}`} className="property-detail-images__figure">
                <PropertyGalleryImage url={im.image_url} index={i} onPreview={() => setLightboxIndex(i)} />
                <figcaption className="property-detail-images__caption">
                  <span>Photo {i + 1}</span>
                  <button
                    type="button"
                    className="property-detail-images__enlarge"
                    onClick={() => setLightboxIndex(i)}
                  >
                    Preview
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}

      {lightboxOpen && currentUrl && (
        <div
          className="property-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={closeLightbox}
        >
          <div className="property-lightbox__inner" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="property-lightbox__close"
              aria-label="Close preview"
              onClick={closeLightbox}
            >
              <X size={22} strokeWidth={2} />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="property-lightbox__nav property-lightbox__nav--prev"
                  aria-label="Previous image"
                  disabled={lightboxIndex === 0}
                  onClick={goPrev}
                >
                  <ChevronLeft size={28} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="property-lightbox__nav property-lightbox__nav--next"
                  aria-label="Next image"
                  disabled={lightboxIndex === images.length - 1}
                  onClick={goNext}
                >
                  <ChevronRight size={28} strokeWidth={2} />
                </button>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="property-lightbox__img"
              src={currentUrl}
              alt={`Property photo ${(lightboxIndex ?? 0) + 1}`}
            />
            <div className="property-lightbox__footer">
              <span className="property-lightbox__counter">
                {(lightboxIndex ?? 0) + 1} / {images.length}
              </span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="property-lightbox__external link-sm"
              >
                Open original in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
