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
          <h1>{activeNav === 'Reports' ? 'Release Reports' : activeNav === 'AI Assistant' ? 'AI Assistant' : activeNav === 'Code Freeze' ? 'Code Freeze' : activeNav === 'Releases' ? 'Release Management' : 'Release Sync Dashboard'}</h1>
          <p>{activeNav === 'Reports' ? 'Review release scope, validation progress, and change activity.' : activeNav === 'AI Assistant' ? 'Explore release data with contextual, explainable analysis.' : activeNav === 'Code Freeze' ? 'Manage freeze timing, exceptions, and post-freeze changes.' : activeNav === 'Releases' ? 'Create and maintain release plans, repository versions, and foundation baselines.' : 'Track, validate, and deploy releases across Allstate repositories.'}</p>
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
