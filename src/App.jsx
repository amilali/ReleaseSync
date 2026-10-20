import React, { useEffect, useState } from 'react';
import initialData from './data/dashboardData.json';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Header from './components/Header';
import MetricsGrid from './components/MetricsGrid';
import BurnUpChart from './components/BurnUpChart';
import ActivityBarChart from './components/ActivityBarChart';
import EnvironmentTable from './components/EnvironmentTable';
import CodeFreezeDetails from './components/CodeFreezeDetails';
import ChecklistModal from './components/ChecklistModal';
import ActionModal from './components/ActionModal';
import EditFreezeModal from './components/EditFreezeModal';
import AIAssistant from './components/AIAssistant';
import FinalizeVersionsModal from './components/FinalizeVersionsModal';

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderLeaving, setPreloaderLeaving] = useState(false);
  const [data, setData] = useState(initialData);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [selectedRelease, setSelectedRelease] = useState(data.system.currentRelease);
  const [lastUpdated, setLastUpdated] = useState(data.system.lastUpdated);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPreloaderLeaving(true), 820);
    const removeTimer = window.setTimeout(() => setShowPreloader(false), 1120);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  // Modals state
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [selectedRepoForAction, setSelectedRepoForAction] = useState(null);
  const [isEditFreezeOpen, setIsEditFreezeOpen] = useState(false);
  const [isFinalizeVersionsOpen, setIsFinalizeVersionsOpen] = useState(false);

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

  const handleFinalizeVersions = (versions) => {
    setData((prev) => ({
      ...prev,
      repositories: prev.repositories.map((repo) => {
        const finalized = versions.find((version) => version.id === repo.id);
        if (!finalized) return repo;
        return {
          ...repo,
          ...(!repo.nonProdVersionFinalized ? { nonProdVersion: finalized.nonProdVersion, nonProdVersionFinalized: true } : {}),
          ...(!repo.hfVersionFinalized ? { hfVersion: finalized.hfVersion, hfVersionFinalized: true } : {})
        };
      })
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
          repositories={data.repositories}
          onAskAI={(prompt) => {
            setAiInitialPrompt(prompt);
            setActiveNav('AI Assistant');
          }}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query) setActiveNav('Dashboard');
          }}
          currentRelease={selectedRelease}
          availableReleases={data.system.availableReleases}
          onSelectRelease={setSelectedRelease}
          onFinalizeVersions={() => setIsFinalizeVersionsOpen(true)}
          canFinalizeVersions={selectedRelease === data.system.currentRelease}
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

          {activeNav === 'AI Assistant' ? (
            <AIAssistant
              repositories={data.repositories}
              metrics={data.metrics}
              readiness={data.releaseReadiness}
              foundationVersion={data.system.foundationVersion}
              releaseName={selectedRelease}
              initialPrompt={aiInitialPrompt}
              onInitialPromptConsumed={() => setAiInitialPrompt('')}
              onReview={(repo) => setSelectedRepoForAction(repo)}
            />
          ) : activeNav === 'Reports' ? (
            <section className="reports-view" aria-label="Release Reports">
              <div className="charts-grid" aria-label="Release Analytics Charts">
                <BurnUpChart chartData={data.burnUpChart} />
                <ActivityBarChart activityData={data.changeActivity} />
              </div>
            </section>
          ) : activeNav === 'Code Freeze' ? (
            <section className="code-freeze-view" aria-label="Code Freeze">
              <CodeFreezeDetails
                freezeDetails={data.codeFreezeDetails}
                onEdit={() => setIsEditFreezeOpen(true)}
              />
            </section>
          ) : (
            <>
              {/* 5 KPI Metric Cards */}
              <MetricsGrid
                metrics={data.metrics}
                readinessData={data.releaseReadiness}
                onViewChecklist={() => setIsChecklistOpen(true)}
              />

              <EnvironmentTable
                repositories={data.repositories}
                totalRepositories={data.metrics.totalRepositories.value}
                foundationVersion={data.system.foundationVersion}
                foundationPipeline={data.system.foundationPipeline}
                releaseName={selectedRelease}
                onActionClick={(repo) => setSelectedRepoForAction(repo)}
              />
            </>
          )}
        </main>
      </div>

      {showPreloader && (
        <div className={`brand-preloader ${preloaderLeaving ? 'is-leaving' : ''}`} role="status" aria-label="Loading Release Sync">
          <div className="preloader-brand">
            <div className="preloader-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className="preloader-cube-outline" d="M24 3 5.5 13.5v21L24 45l18.5-10.5v-21L24 3Z" stroke="#0033a0" strokeWidth="3" strokeLinejoin="round" />
                <path className="preloader-cube-edges" d="M24 24 5.5 13.5M24 24l18.5-10.5M24 24v21" stroke="#0033a0" strokeWidth="3" strokeLinejoin="round" />
                <rect className="preloader-cube-core" x="19" y="19" width="10" height="10" rx="2.5" fill="#2563eb" fillOpacity=".17" stroke="#2563eb" strokeWidth="2" />
              </svg>
            </div>
            <div className="preloader-wordmark">
              <strong>Release Sync</strong>
              <span>Enterprise Release Management Platform</span>
            </div>
          </div>
        </div>
      )}

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

      <FinalizeVersionsModal
        isOpen={isFinalizeVersionsOpen}
        onClose={() => setIsFinalizeVersionsOpen(false)}
        repositories={data.repositories}
        releaseName={selectedRelease}
        onFinalize={handleFinalizeVersions}
      />
    </div>
  );
}
