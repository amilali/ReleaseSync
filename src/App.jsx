import React, { useState } from 'react';
import initialData from './data/dashboardData.json';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import BurnUpChart from './components/BurnUpChart';
import ActivityBarChart from './components/ActivityBarChart';
import EnvironmentTable from './components/EnvironmentTable';
import CodeFreezeDetails from './components/CodeFreezeDetails';
import ReleaseReadiness from './components/ReleaseReadiness';
import ChecklistModal from './components/ChecklistModal';
import ActionModal from './components/ActionModal';
import EditFreezeModal from './components/EditFreezeModal';

export default function App() {
  const [data, setData] = useState(initialData);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelease, setSelectedRelease] = useState(data.system.currentRelease);
  const [lastUpdated, setLastUpdated] = useState(data.system.lastUpdated);

  // Modals state
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [selectedRepoForAction, setSelectedRepoForAction] = useState(null);
  const [isEditFreezeOpen, setIsEditFreezeOpen] = useState(false);

  // Reload the bundled sample data and refresh the displayed timestamp.
  const handleRefresh = () => {
    setData(initialData);
    setSelectedRelease(initialData.system.currentRelease);
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setLastUpdated(formatted);
  };

  const handleUpdateFreeze = (newFreeze) => {
    setData((prev) => ({
      ...prev,
      codeFreezeDetails: newFreeze
    }));
  };

  const urgentRepositories = data.repositories.filter((repo) => repo.status === 'Investigate');
  const notifications = [
    ...urgentRepositories.map((repo) => ({
      title: `Critical version mismatch: ${repo.name}`,
      detail: `${repo.prodVersion} in PROD · ${repo.nonProdVersion} outside PROD`,
      repo
    })),
    ...data.repositories
      .filter((repo) => repo.status === 'Review')
      .map((repo) => ({
        title: `Version mismatch needs review: ${repo.name}`,
        detail: `${repo.changeOrder} · ${repo.prodVersion} vs ${repo.nonProdVersion}`,
        repo
      }))
  ].slice(0, 3);

  return (
    <div className="app-container">
      {/* 1. Left Sidebar with Allstate Logo & Watermark */}
      <Sidebar
        activeNav={activeNav}
        onNavClick={(navName) => setActiveNav(navName)}
      />

      {/* 2. Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query) setActiveNav('Dashboard');
          }}
          currentRelease={selectedRelease}
          availableReleases={data.system.availableReleases}
          onSelectRelease={setSelectedRelease}
          notifications={notifications}
          user={data.system.currentUser}
          onNotificationClick={(repo) => setSelectedRepoForAction(repo)}
          onUserClick={() => alert(`Logged in as John Doe (Release Manager - Allstate Enterprise Engineering)`)}
        />

        {/* Dashboard Content Area */}
        <main className="dashboard-content">
          {/* Header with Title and Refresh Data button */}
          <Header
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
            activeNav={activeNav}
          />

          {selectedRelease !== data.system.currentRelease && (
            <div className="scope-notice" role="status">
              Detailed sample data is available for {data.system.currentRelease}. The selected release is {selectedRelease}; its release-specific records are not loaded.
            </div>
          )}

          {activeNav === 'Reports' ? (
            <section className="reports-view" aria-label="Release Reports">
              <div className="charts-grid" aria-label="Release Analytics Charts">
                <BurnUpChart chartData={data.burnUpChart} />
                <ActivityBarChart activityData={data.changeActivity} />
              </div>
            </section>
          ) : (
            <>
              {/* 5 KPI Metric Cards */}
              <MetricsGrid metrics={data.metrics} />

              {/* Release governance panels sit above the repository table. */}
              <section className="governance-grid" aria-label="Release Governance">
                <CodeFreezeDetails
                  freezeDetails={data.codeFreezeDetails}
                  onEdit={() => setIsEditFreezeOpen(true)}
                />

                <ReleaseReadiness
                  readinessData={data.releaseReadiness}
                  onViewChecklist={() => setIsChecklistOpen(true)}
                />
              </section>

              <EnvironmentTable
                repositories={data.repositories}
                totalRepositories={data.metrics.totalRepositories.value}
                searchQuery={searchQuery}
                onActionClick={(repo) => setSelectedRepoForAction(repo)}
              />
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <ChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        checklist={data.releaseReadiness.checklist}
      />

      <ActionModal
        isOpen={!!selectedRepoForAction}
        onClose={() => setSelectedRepoForAction(null)}
        repo={selectedRepoForAction}
      />

      <EditFreezeModal
        isOpen={isEditFreezeOpen}
        onClose={() => setIsEditFreezeOpen(false)}
        freezeDetails={data.codeFreezeDetails}
        onSave={handleUpdateFreeze}
      />
    </div>
  );
}
