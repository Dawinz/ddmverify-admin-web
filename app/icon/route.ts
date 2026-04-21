import { NextResponse } from "next/server";

// Serves the same SVG the old `app/icon.tsx` returned, as a real Response.
// Needed because `app/icon.tsx` + Next 14.2 metadata prerender fails on some Windows paths.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="2" y="2" width="28" height="28" rx="8" fill="#2563EB"/>
  <text x="16" y="19" text-anchor="middle" font-size="11" font-family="system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-weight="700" fill="white">DDM</text>
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
