import React from 'react';
import { PieChart, Info } from 'lucide-react';

export default function ReleaseReadiness({ readinessData, onViewChecklist, compact = false }) {
  if (!readinessData) return null;

  const total = readinessData.breakdown.reduce((sum, item) => sum + item.count, 0) || 24;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  // Compute SVG arc segments
  let accumulatedPercent = 0;
  const segments = readinessData.breakdown.map((item) => {
    const fraction = item.count / total;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += fraction;

    return {
      ...item,
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className={compact ? 'metric-card readiness-metric-card' : 'panel-card'}>
      <div className={`panel-header${compact ? ' readiness-metric-header' : ''}`}>
        <div className="panel-title">
          <PieChart size={16} color="#2563eb" />
          <span>Release Readiness</span>
          {!compact && <Info size={13} className="info-icon" title="Aggregated service readiness breakdown" />}
        </div>
        <button 
          className="panel-header-btn"
          onClick={onViewChecklist}
        >
          {compact ? 'Checklist' : 'View Checklist'}
        </button>
      </div>

      <div className={`readiness-content${compact ? ' readiness-content-compact' : ''}`}>
        {/* Donut Chart */}
        <div className={`donut-chart-box${compact ? ' donut-chart-compact' : ''}`}>
          <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="11"
            />
            {/* Segments */}
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="11"
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
              />
            ))}
          </svg>

          {/* Center text */}
          <div className="donut-center-text">
            <div className="donut-center-pct">{readinessData.percentage}%</div>
            <div className="donut-center-label">Ready</div>
          </div>
        </div>

        {/* Legend / Breakdown List */}
        <div className="readiness-list">
          {readinessData.breakdown.map((item, i) => (
            <div className="readiness-item" key={i}>
              <div className="readiness-label-group">
                <span className="readiness-dot" style={{ backgroundColor: item.color }} />
                <span>{item.status}</span>
              </div>
              <span className="readiness-count">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
