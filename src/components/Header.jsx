import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function Header({ lastUpdated, onRefresh, activeNav = 'Dashboard' }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  return (
    <div className="dashboard-header">
      <div className="header-title-area">
        <h1>{activeNav === 'Reports' ? 'Release Reports' : 'Release Sync Dashboard'}</h1>
        <p>{activeNav === 'Reports' ? 'Review release scope, validation progress, and change activity.' : 'Track, validate, and deploy releases across Allstate repositories.'}</p>
      </div>

      <div className="header-actions">
        <div className="last-updated">
          <span>Last updated: {lastUpdated}</span>
          <RefreshCw size={12} style={{ opacity: 0.6 }} />
        </div>

        <button 
          className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
          onClick={handleRefreshClick}
          aria-label="Refresh dashboard"
          title="Reload the dashboard’s bundled sample data"
        >
          <RefreshCw size={14} />
          <span>Refresh Dashboard</span>
        </button>
      </div>
    </div>
  );
}
