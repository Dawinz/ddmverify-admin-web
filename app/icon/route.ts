import { NextResponse } from "next/server";

// Lightweight favicon (~1 KB): brand gradient orb (matches DDM palette). Do not point
// metadata at /public/ddm-logo-mark.svg — it embeds a huge raster. Needed because
// `app/icon.tsx` + Next 14.2 metadata prerender fails on some Windows paths.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g" x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1D6DB9"/>
      <stop offset="0.5" stop-color="#2E8FD9"/>
      <stop offset="1" stop-color="#29D2C8"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="27" fill="url(#g)"/>
  <ellipse cx="32" cy="32" rx="12" ry="27" stroke="rgba(255,255,255,0.42)" stroke-width="1.6" fill="none"/>
  <ellipse cx="32" cy="32" rx="27" ry="12" stroke="rgba(255,255,255,0.32)" stroke-width="1.4" fill="none"/>
  <path d="M7 32h50" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

export function GET() {
  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
