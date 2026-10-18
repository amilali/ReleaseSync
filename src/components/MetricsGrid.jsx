import React from 'react';
import { 
  Box, 
  Tag, 
  AlertTriangle, 
  FileText, 
  Rocket, 
  ArrowUp 
} from 'lucide-react';

export default function MetricsGrid({ metrics }) {
  if (!metrics) return null;

  return (
    <section className="metrics-grid" aria-label="KPI Metrics Overview">
      {/* 1. Total Repositories */}
      <div className="metric-card">
        <div className="metric-card-top">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <Box size={20} strokeWidth={2.2} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Total Repositories</span>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.totalRepositories.value}</span>
              <span className="metric-trend">
                <ArrowUp size={12} strokeWidth={2.5} style={{ marginRight: 1 }} />
                {metrics.totalRepositories.change}
              </span>
            </div>
            <span className="metric-subtext">{metrics.totalRepositories.subtext}</span>
          </div>
        </div>
      </div>

      {/* 2. On Track */}
      <div className="metric-card">
        <div className="metric-card-top">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <Tag size={20} strokeWidth={2.2} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Ready for Release</span>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.onTrack.value}</span>
            </div>
            <span className="metric-subtext">{metrics.onTrack.subtext}</span>
          </div>
        </div>
        <div className="metric-progress-wrapper">
          <span className="progress-pct">{metrics.onTrack.percentage}%</span>
          <div className="progress-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${metrics.onTrack.percentage}%`, backgroundColor: '#10b981' }} 
            />
          </div>
        </div>
      </div>

      {/* 3. Version Discrepancies */}
      <div className="metric-card">
        <div className="metric-card-top">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>
            <AlertTriangle size={20} strokeWidth={2.2} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Version Discrepancies</span>
            <div className="metric-value-row">
              <span className="metric-value" style={{ color: '#dc2626' }}>
                {metrics.versionDiscrepancies.value}
              </span>
            </div>
            <span className="metric-subtext" style={{ color: '#dc2626' }}>
              {metrics.versionDiscrepancies.subtext}
            </span>
          </div>
        </div>
        <div className="metric-progress-wrapper">
          <span className="progress-pct">{metrics.versionDiscrepancies.percentage}%</span>
          <div className="progress-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${metrics.versionDiscrepancies.percentage}%`, backgroundColor: '#ef4444' }} 
            />
          </div>
        </div>
      </div>

      {/* 4. Pending Change Orders */}
      <div className="metric-card">
        <div className="metric-card-top">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <FileText size={20} strokeWidth={2.2} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Pending Change Orders</span>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.pendingChangeOrders.value}</span>
            </div>
            <span className="metric-subtext">{metrics.pendingChangeOrders.subtext}</span>
          </div>
        </div>
        <div className="metric-progress-wrapper">
          <span className="progress-pct">{metrics.pendingChangeOrders.percentage}%</span>
          <div className="progress-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${metrics.pendingChangeOrders.percentage}%`, backgroundColor: '#f59e0b' }} 
            />
          </div>
        </div>
      </div>

      {/* 5. Releases This Month */}
      <div className="metric-card">
        <div className="metric-card-top">
          <div className="metric-icon-wrapper" style={{ backgroundColor: '#f3e8ff', color: '#8b5cf6' }}>
            <Rocket size={20} strokeWidth={2.2} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Releases This Month</span>
            <div className="metric-value-row">
              <span className="metric-value">{metrics.releasesThisMonth.value}</span>
            </div>
            <span className="metric-subtext">{metrics.releasesThisMonth.subtext}</span>
          </div>
        </div>
        <div className="metric-progress-wrapper">
          <span className="progress-pct">{metrics.releasesThisMonth.percentage}%</span>
          <div className="progress-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${metrics.releasesThisMonth.percentage}%`, backgroundColor: '#8b5cf6' }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
