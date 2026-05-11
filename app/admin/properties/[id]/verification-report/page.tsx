'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminQuery, getAccessToken } from '@/lib/use-admin-query';
import { apiPut } from '@/lib/api';

type ReportResponse = {
  row_version?: string;
  listing_status?: string;
  report: {
    id: string;
    request_id: string;
    property_name: string;
    title_deed_validation?: string;
    government_search_result?: string;
    field_findings?: string;
    document_authenticity_checks?: string;
    risk_level?: string;
    inspector_name?: string | null;
    pdf_url?: string | null;
    completion_date?: string;
  };
};

function ifMatchHeaders(rv: string | null): Record<string, string> | undefined {
  if (!rv || rv.trim() === '') return undefined;
  return { 'If-Match': `W/"${rv.trim()}"` };
}

export default function AdminVerificationReportPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const queryClient = useQueryClient();

  const q = useAdminQuery<ReportResponse>({
    key: ['admin', 'verification-report', id],
    path: `/verification/reports/${encodeURIComponent(id)}`,
    enabled: !!id,
  });

  const [titleDeed, setTitleDeed] = useState('');
  const [govSearch, setGovSearch] = useState('');
  const [fieldFindings, setFieldFindings] = useState('');
  const [docAuthenticity, setDocAuthenticity] = useState('');
  const [riskLevel, setRiskLevel] = useState('Medium');
  const [inspectorName, setInspectorName] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [rowVersion, setRowVersion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const hydratedForId = useRef<string | null>(null);

  useEffect(() => {
    hydratedForId.current = null;
  }, [id]);

  useEffect(() => {
    if (!q.data) return;
    if (hydratedForId.current === id) return;
    hydratedForId.current = id;
    const r = q.data.report;
    const rv = q.data.row_version;
    if (rv != null && rv !== '') setRowVersion(String(rv));
    const td = String(r.title_deed_validation ?? '');
    setTitleDeed(/^pending$/i.test(td.trim()) ? '' : td);
    const gs = String(r.government_search_result ?? '');
    setGovSearch(/^pending$/i.test(gs.trim()) ? '' : gs);
    const ff = String(r.field_findings ?? '');
    setFieldFindings(/^pending$/i.test(ff.trim()) ? '' : ff);
    const dc = String(r.document_authenticity_checks ?? '');
    setDocAuthenticity(/^pending$/i.test(dc.trim()) ? '' : dc);
    setRiskLevel(String(r.risk_level ?? 'Medium'));
    setInspectorName(r.inspector_name != null ? String(r.inspector_name) : '');
    setPdfUrl(r.pdf_url != null ? String(r.pdf_url) : '');
  }, [id, q.data]);

  const save = useCallback(async () => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No active session.');
      const body = {
        title_deed_validation: titleDeed.trim() || undefined,
        government_search_result: govSearch.trim() || undefined,
        field_findings: fieldFindings.trim() || undefined,
        document_authenticity_checks: docAuthenticity.trim() || undefined,
        risk_level: riskLevel.trim() || undefined,
        inspector_name: inspectorName.trim() || undefined,
        pdf_url: pdfUrl.trim() || undefined,
      };
      const j = (await apiPut(
        `/verification/reports/${encodeURIComponent(id)}`,
        token,
        body,
        ifMatchHeaders(rowVersion),
      )) as { row_version?: string | number; error?: string };
      if (j.row_version != null) setRowVersion(String(j.row_version));
      setMessage('Verification report saved.');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'verification-report', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'property', id] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }, [
    id,
    titleDeed,
    govSearch,
    fieldFindings,
    docAuthenticity,
    riskLevel,
    inspectorName,
    pdfUrl,
    rowVersion,
    queryClient,
  ]);

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

  if (q.isLoading) return <p className="muted">Loading report…</p>;

  if (q.error) {
    return (
      <div>
        <p style={{ color: '#dc2626' }}>{(q.error as Error).message}</p>
        <Link href={`/admin/properties/${encodeURIComponent(id)}`} className="btn btn-neutral" style={{ marginTop: 12 }}>
          ← Property detail
        </Link>
      </div>
    );
  }

  const propertyLabel = q.data?.report.property_name ?? 'Listing';

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href={`/admin/properties/${encodeURIComponent(id)}`} className="muted" style={{ textDecoration: 'none' }}>
          ← Property
        </Link>
      </div>
      <h1 className="page-title">Verification report</h1>
      <p className="muted" style={{ marginBottom: 8 }}>
        {propertyLabel}
        {rowVersion != null ? (
          <>
            {' '}
            · row version <code>{rowVersion}</code>
          </>
        ) : null}
      </p>
      <p className="muted" style={{ marginBottom: 20, fontSize: 13, maxWidth: 640 }}>
        Edits are saved to the issued report shown to agents in the mobile app. Send{' '}
        <code>If-Match: W/&quot;…&quot;</code> when you loaded this page so concurrent admin edits return a clear conflict.
      </p>

      {error && (
        <p style={{ color: '#dc2626', marginBottom: 12 }} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p style={{ color: '#15803d', marginBottom: 12 }} role="status">
          {message}
        </p>
      )}

      <div className="panel property-detail-panel" style={{ marginBottom: 16 }}>
        <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          Title deed validation
        </label>
        <textarea
          style={{
            width: '100%',
            minHeight: 100,
            marginBottom: 14,
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 14,
          }}
          value={titleDeed}
          onChange={(e) => setTitleDeed(e.target.value)}
          placeholder="Summary of title deed checks"
        />

        <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          Government land search
        </label>
        <textarea
          style={{
            width: '100%',
            minHeight: 100,
            marginBottom: 14,
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 14,
          }}
          value={govSearch}
          onChange={(e) => setGovSearch(e.target.value)}
        />

        <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          Field findings
        </label>
        <textarea
          style={{
            width: '100%',
            minHeight: 100,
            marginBottom: 14,
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 14,
          }}
          value={fieldFindings}
          onChange={(e) => setFieldFindings(e.target.value)}
        />

        <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
          Document authenticity
        </label>
        <textarea
          style={{
            width: '100%',
            minHeight: 80,
            marginBottom: 14,
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontFamily: 'inherit',
            fontSize: 14,
          }}
          value={docAuthenticity}
          onChange={(e) => setDocAuthenticity(e.target.value)}
        />

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div>
            <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
              Risk level
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
              }}
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              placeholder="Low / Medium / High"
            />
          </div>
          <div>
            <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>
              Inspector name
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
              }}
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
            />
          </div>
        </div>

        <label className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 4, marginTop: 14 }}>
          Report PDF URL (optional)
        </label>
        <input
          style={{
            width: '100%',
            marginBottom: 16,
            padding: '10px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            fontSize: 14,
          }}
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          placeholder="https://…"
        />

        <button type="button" className="btn btn-success" disabled={busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save report'}
        </button>
      </div>
    </div>
  );
}
