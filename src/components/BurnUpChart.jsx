import React, { useState } from 'react';
import { Info } from 'lucide-react';

export default function BurnUpChart({ chartData }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [visibleSeries, setVisibleSeries] = useState({
    planned: true,
    validated: true,
    postFreeze: true
  });

  if (!chartData) return null;

  const dataPoints = chartData.dataPoints;
  const svgWidth = 620;
  const svgHeight = 210;
  const paddingLeft = 38;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 48;

  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;
  const maxY = 20;

  const getX = (index) => paddingLeft + (index / (dataPoints.length - 1)) * graphWidth;
  const getY = (val) => paddingTop + graphHeight - (val / maxY) * graphHeight;

  const buildPath = (key) => {
    const validPoints = dataPoints
      .map((d, i) => (d[key] !== null ? { x: getX(i), y: getY(d[key]), val: d[key], index: i } : null))
      .filter(Boolean);

    if (validPoints.length === 0) return '';
    return validPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  };

  const plannedPath = buildPath('planned');
  const validatedPath = buildPath('validated');
  const postFreezePath = buildPath('postFreeze');

  const freezeX = getX(3); // Oct 10 is index 3

  const toggleSeries = (key) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="chart-card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="card-title-row">
            <h2 className="card-title">{chartData.title}</h2>
            <Info size={14} className="info-icon" title="Scope and validation tracking over release cycle" />
          </div>
          <p className="card-subtitle">{chartData.subtitle}</p>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '200px', marginTop: '4px' }}>
        {/* Code Freeze Badge at marker */}
        <div 
          className="freeze-badge-pill"
          style={{ left: `${(freezeX / svgWidth) * 100}%`, top: '16px' }}
        >
          <div style={{ fontWeight: 700, fontSize: '9px', textAlign: 'center' }}>Code Freeze</div>
          <div style={{ fontSize: '8.5px', color: '#7f1d1d' }}>Oct 10, 2024</div>
        </div>

        {/* SVG Chart */}
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Horizontal Grid lines and Y labels */}
          {[0, 5, 10, 15, 20].map((tick) => {
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

          {/* Y Axis Title */}
          <text 
            x={-(paddingTop + graphHeight / 2)} 
            y="13" 
            transform="rotate(-90)" 
            fontSize="10" 
            fill="#64748b" 
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
          >
            Components
          </text>

          {/* Vertical Code Freeze Dashed Marker */}
          <line 
            x1={freezeX} 
            y1={paddingTop + 8} 
            x2={freezeX} 
            y2={getY(0)} 
            stroke="#94a3b8" 
            strokeWidth="1.5" 
            strokeDasharray="4 3"
          />

          {/* Lines */}
          {visibleSeries.planned && (
            <path 
              d={plannedPath} 
              fill="none" 
              stroke="#2563eb" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {visibleSeries.validated && (
            <path 
              d={validatedPath} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {visibleSeries.postFreeze && (
            <path 
              d={postFreezePath} 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots on points */}
          {dataPoints.map((pt, i) => {
            const x = getX(i);
            return (
              <g key={i}>
                {visibleSeries.planned && pt.planned !== null && (
                  <circle 
                    cx={x} 
                    cy={getY(pt.planned)} 
                    r={hoveredPoint?.index === i && hoveredPoint?.series === 'planned' ? 6 : 4} 
                    fill="#2563eb" 
                    stroke="#ffffff" 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint({ index: i, series: 'planned', ...pt, val: pt.planned })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                )}

                {visibleSeries.validated && pt.validated !== null && (
                  <circle 
                    cx={x} 
                    cy={getY(pt.validated)} 
                    r={hoveredPoint?.index === i && hoveredPoint?.series === 'validated' ? 6 : 4} 
                    fill="#10b981" 
                    stroke="#ffffff" 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint({ index: i, series: 'validated', ...pt, val: pt.validated })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                )}

                {visibleSeries.postFreeze && pt.postFreeze !== null && (
                  <circle 
                    cx={x} 
                    cy={getY(pt.postFreeze)} 
                    r={hoveredPoint?.index === i && hoveredPoint?.series === 'postFreeze' ? 6 : 4} 
                    fill="#ef4444" 
                    stroke="#ffffff" 
                    strokeWidth="2" 
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint({ index: i, series: 'postFreeze', ...pt, val: pt.postFreeze })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                )}

                {/* X Axis Date Label */}
                <text 
                  x={x} 
                  y={getY(0) + 16} 
                  fontSize="10" 
                  fill="#64748b" 
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  {pt.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div 
            style={{
              position: 'absolute',
              left: `${(getX(hoveredPoint.index) / svgWidth) * 100}%`,
              top: `${(getY(hoveredPoint.val) / svgHeight) * 100}%`,
              transform: 'translate(-50%, -120%)',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              pointerEvents: 'none',
              zIndex: 20,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            <div>{hoveredPoint.date}</div>
            <div style={{ color: hoveredPoint.series === 'planned' ? '#60a5fa' : hoveredPoint.series === 'validated' ? '#4ade80' : '#f87171' }}>
              {hoveredPoint.series === 'planned' ? 'Planned Scope' : hoveredPoint.series === 'validated' ? 'Validated' : 'Post-Freeze'}: {hoveredPoint.val}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="chart-legend" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #f1f5f9' }}>
        <div 
          className="legend-item" 
          onClick={() => toggleSeries('planned')}
          style={{ opacity: visibleSeries.planned ? 1 : 0.4 }}
        >
          <span className="legend-dot" style={{ backgroundColor: '#2563eb' }} />
          <span>Planned Scope</span>
        </div>
        <div 
          className="legend-item" 
          onClick={() => toggleSeries('validated')}
          style={{ opacity: visibleSeries.validated ? 1 : 0.4 }}
        >
          <span className="legend-dot" style={{ backgroundColor: '#10b981' }} />
          <span>Validated Components</span>
        </div>
        <div 
          className="legend-item" 
          onClick={() => toggleSeries('postFreeze')}
          style={{ opacity: visibleSeries.postFreeze ? 1 : 0.4 }}
        >
          <span className="legend-dot" style={{ backgroundColor: '#ef4444' }} />
          <span>Post-Freeze Changes</span>
        </div>
      </div>
    </div>
  );
}
