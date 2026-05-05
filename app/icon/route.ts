import { NextResponse } from "next/server";

// Serves the same SVG the old `app/icon.tsx` returned, as a real Response.
// Needed because `app/icon.tsx` + Next 14.2 metadata prerender fails on some Windows paths.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#g)"/>
  <path d="M20 18h11.5c8.56 0 14.5 5.6 14.5 14S40.06 46 31.5 46H20V18Zm9.7 21.2c4.97 0 8.22-2.98 8.22-7.2 0-4.2-3.25-7.2-8.22-7.2h-2.3v14.4h2.3Z" fill="white"/>
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1D6DB9"/>
      <stop offset="0.55" stop-color="#2E8FD9"/>
      <stop offset="1" stop-color="#29D2C8"/>
    </linearGradient>
  </defs>
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
