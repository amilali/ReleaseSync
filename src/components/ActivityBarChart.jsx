import React from 'react';
import { Info } from 'lucide-react';

export default function ActivityBarChart({ activityData }) {
  if (!activityData) return null;

  // SVG dimensions with balanced padding
  const svgWidth = 440;
  const svgHeight = 210;
  const paddingLeft = 56;
  const paddingRight = 20;
  const paddingTop = 28;
  const paddingBottom = 48;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;
  const bars = activityData.bars || [];
  const maxValue = Math.max(...bars.map((bar) => bar.value), 0);
  const maxY = Math.max(10, Math.ceil(maxValue / 10) * 10);

  const getY = (val) => paddingTop + chartHeight - (val / maxY) * chartHeight;
  const zeroY = getY(0);

  // Bar slots are distributed evenly across the available chart width.
  const barWidth = 44;
  const slotWidth = chartWidth / Math.max(bars.length, 1);

  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-title-row">
            <h2 className="card-title">{activityData.title}</h2>
            <Info size={14} className="info-icon" title="Changes before and after code freeze" />
          </div>
          <p className="card-subtitle">{activityData.subtitle}</p>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '4px' }}>
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          width="100%" 
          height="100%"
          style={{ overflow: 'visible' }}
        >
          {/* Rotated Y-Axis Label: Number of Changes */}
          <text
            x={-(paddingTop + chartHeight / 2)}
            y="16"
            transform="rotate(-90)"
            fontSize="10.5"
            fill="#64748b"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            Number of Changes
          </text>

          {/* Grid lines & Y tick numbers */}
          {Array.from({ length: maxY / 10 + 1 }, (_, index) => index * 10).map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke={tick === 0 ? '#cbd5e1' : '#e2e8f0'}
                  strokeWidth={tick === 0 ? '1.2' : '1'}
                  strokeDasharray={tick === 0 ? 'none' : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  fontSize="10"
                  fill="#94a3b8"
                  textAnchor="end"
                  fontFamily="Inter, sans-serif"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* 4 Bars and Labels */}
          {bars.map((bar, i) => {
            const centerX = paddingLeft + (i + 0.5) * slotWidth;
            const barX = centerX - barWidth / 2;
            const barH = (bar.value / maxY) * chartHeight;
            const barY = zeroY - barH;
            const labelParts = bar.label.length > 14 ? bar.label.split(' ') : [bar.label];

            return (
              <g key={bar.id} style={{ cursor: 'pointer' }}>
                {/* Number above bar */}
                <text
                  x={centerX}
                  y={barY - 6}
                  fontSize="12.5"
                  fontWeight="700"
                  fill="#0f172a"
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans', 'Inter', sans-serif"
                >
                  {bar.value}
                </text>

                {/* Rectangular Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barH}
                  rx="3"
                  fill={bar.color}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {/* Bar Labels below X axis */}
                <text
                  x={centerX}
                  y={zeroY + 15}
                  fontSize="10.5"
                  fontWeight="600"
                  fill="#0f172a"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  {labelParts[0]}
                </text>

                {labelParts.length > 1 && (
                  <text
                    x={centerX}
                    y={zeroY + 28}
                    fontSize="10.5"
                    fontWeight="600"
                    fill="#0f172a"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                  >
                    {labelParts.slice(1).join(' ')}
                  </text>
                )}
                {bar.sublabel && (
                  <text
                    x={centerX}
                    y={zeroY + (labelParts.length > 1 ? 40 : 28)}
                    fontSize="9.5"
                    fill="#64748b"
                    textAnchor="middle"
                    fontFamily="Inter, sans-serif"
                  >
                    {bar.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
