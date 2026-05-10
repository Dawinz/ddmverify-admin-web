'use client';

type Props = {
  labels: string[];
  seriesA: number[];
  seriesB: number[];
  labelA: string;
  labelB: string;
};

function shortDay(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export function DashboardChart({ labels, seriesA, seriesB, labelA, labelB }: Props) {
  const w = 560;
  const h = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const maxVal = Math.max(1, ...seriesA, ...seriesB);
  const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW;

  const pointsA = labels.map((_, i) => {
    const x = padL + i * xStep;
    const y = padT + innerH - (seriesA[i] ?? 0) / maxVal * innerH;
    return `${x},${y}`;
  });
  const pointsB = labels.map((_, i) => {
    const x = padL + i * xStep;
    const y = padT + innerH - (seriesB[i] ?? 0) / maxVal * innerH;
    return `${x},${y}`;
  });

  return (
    <div className="dashboard-chart-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="dashboard-chart-svg" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(46,143,217,0.35)" />
            <stop offset="100%" stopColor="rgba(46,143,217,0)" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padL}
            x2={w - padR}
            y1={padT + innerH * (1 - t)}
            y2={padT + innerH * (1 - t)}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth={1}
          />
        ))}
        <polyline fill="none" stroke="#2e8fd9" strokeWidth={2.5} points={pointsA.join(' ')} />
        <polyline fill="none" stroke="#29d2c8" strokeWidth={2.5} points={pointsB.join(' ')} />
        {labels.map((lab, i) => (
          <text
            key={lab}
            x={padL + i * xStep}
            y={h - 10}
            textAnchor="middle"
            fontSize={11}
            fill="#64748b"
          >
            {shortDay(lab)}
          </text>
        ))}
        <text x={padL} y={14} fontSize={11} fill="#64748b">
          Count (max {maxVal})
        </text>
      </svg>
      <div className="dashboard-chart-legend">
        <span>
          <i className="legend-dot legend-blue" /> {labelA}
        </span>
        <span>
          <i className="legend-dot legend-teal" /> {labelB}
        </span>
      </div>
    </div>
  );
}
