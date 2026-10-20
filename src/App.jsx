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
import ReleaseManagement from './components/ReleaseManagement';

const RELEASE_PLAN_STORAGE_KEY = 'releasesync.releasePlan.v1';

function createInitialReleasePlan(repositories) {
  return {
    id: 'release-plan-2026-11',
    targetRelease: 'Release 2026.11',
    targetDate: '2026-11-20',
    status: 'Planning',
    finalFoundationVersion: initialData.system.foundationPipeline?.finalVersion || initialData.system.foundationVersion,
    repositoryIds: repositories.map((repo) => repo.id),
    repositoryVersions: Object.fromEntries(repositories.map((repo) => [repo.id, repo.publishedVersion || repo.nonProdVersion]))
  };
}

function loadReleasePlans() {
  const fallback = createInitialReleasePlan(initialData.repositories);
  const normalize = (plan, index) => ({
    ...fallback,
    ...plan,
    id: plan.id || `release-plan-${index + 1}`,
    targetRelease: typeof plan.targetRelease === 'string' ? plan.targetRelease : '',
    repositoryIds: plan.repositoryIds || fallback.repositoryIds,
    repositoryVersions: { ...fallback.repositoryVersions, ...(plan.repositoryVersions || {}) }
  });
  try {
    const stored = JSON.parse(window.localStorage.getItem(RELEASE_PLAN_STORAGE_KEY) || 'null');
    if (Array.isArray(stored?.plans) && stored.plans.length) {
      const plans = stored.plans.map(normalize);
      return { plans, activePlanId: plans.some((plan) => plan.id === stored.activePlanId) ? stored.activePlanId : plans[0].id };
    }
    if (stored?.targetRelease) return { plans: [normalize(stored, 0)], activePlanId: stored.id || fallback.id };
  } catch {
    // Start with the bundled sample release when saved data is unavailable.
  }
  return { plans: [fallback], activePlanId: fallback.id };
}

export default function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderLeaving, setPreloaderLeaving] = useState(false);
  const [data, setData] = useState(initialData);
  const [releasePlanState, setReleasePlanState] = useState(loadReleasePlans);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [isSidebarAiOpen, setIsSidebarAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [selectedRelease, setSelectedRelease] = useState(data.system.currentRelease);
  const [lastUpdated, setLastUpdated] = useState(data.system.lastUpdated);

  const releasePlans = releasePlanState.plans;
  const releasePlan = releasePlans.find((plan) => plan.id === releasePlanState.activePlanId) || releasePlans[0];
  const activeFoundationVersion = releasePlan?.finalFoundationVersion || data.system.foundationPipeline?.finalVersion || data.system.foundationVersion;
  const repositoriesForActivePlan = data.repositories.map((repo) => ({
    ...repo,
    publishedVersion: releasePlan?.repositoryVersions?.[repo.id] ?? repo.publishedVersion ?? repo.nonProdVersion,
    buildFoundationVersion: activeFoundationVersion
  }));
  const managedReleaseNames = releasePlans.map((plan) => plan.targetRelease?.trim()).filter(Boolean);
  const availableReleaseOptions = Array.from(new Set([...data.system.availableReleases, ...managedReleaseNames]));

  const handleSelectRelease = (releaseName) => {
    setSelectedRelease(releaseName);
    const matchingPlan = releasePlans.find((plan) => plan.targetRelease === releaseName);
    if (matchingPlan) setReleasePlanState((previous) => ({ ...previous, activePlanId: matchingPlan.id }));
  };

  const handleCreateRelease = (releaseName = '') => {
    // A button's onClick passes its click event. Only the existing-release
    // selector supplies a name, so ignore non-string event values here.
    const targetRelease = typeof releaseName === 'string' ? releaseName : '';
    const id = `release-plan-${Date.now()}`;
    const newPlan = {
      id,
      targetRelease,
      targetDate: '',
      status: 'Planning',
      finalFoundationVersion: data.system.foundationPipeline?.finalVersion || data.system.foundationVersion,
      repositoryIds: data.repositories.map((repo) => repo.id),
      repositoryVersions: Object.fromEntries(data.repositories.map((repo) => [repo.id, repo.publishedVersion || repo.nonProdVersion]))
    };
    setReleasePlanState((previous) => ({ ...previous, plans: [...previous.plans, newPlan], activePlanId: id }));
    if (targetRelease) setSelectedRelease(targetRelease);
    setActiveNav('Releases');
  };

  const handleChangeReleasePlan = (nextPlan) => {
    setReleasePlanState((previous) => ({
      ...previous,
      plans: previous.plans.map((plan) => plan.id === nextPlan.id ? nextPlan : plan)
    }));
    if (nextPlan.id === releasePlan.id && nextPlan.targetRelease?.trim()) setSelectedRelease(nextPlan.targetRelease);
  };

  const handleSaveReleasePlan = (savedPlan) => {
    const plans = releasePlans.map((plan) => plan.id === savedPlan.id ? savedPlan : plan);
    const nextState = { plans, activePlanId: savedPlan.id };
    window.localStorage.setItem(RELEASE_PLAN_STORAGE_KEY, JSON.stringify(nextState));
    setReleasePlanState(nextState);
    if (savedPlan.targetRelease?.trim()) setSelectedRelease(savedPlan.targetRelease);
  };

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPreloaderLeaving(true), 820);
    const removeTimer = window.setTimeout(() => setShowPreloader(false), 1120);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarAiOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarAiOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isSidebarAiOpen]);

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
        onAskAI={() => setIsSidebarAiOpen(true)}
        aiMode={isSidebarAiOpen}
        onBack={() => setIsSidebarAiOpen(false)}
        onFullScreen={() => {
          setIsSidebarAiOpen(false);
          setActiveNav('AI Assistant');
        }}
        assistant={isSidebarAiOpen && <AIAssistant
          repositories={repositoriesForActivePlan}
          metrics={data.metrics}
          readiness={data.releaseReadiness}
          foundationVersion={activeFoundationVersion}
          releaseName={selectedRelease}
          initialPrompt={aiInitialPrompt}
          onInitialPromptConsumed={() => setAiInitialPrompt('')}
          onReview={(repo) => setSelectedRepoForAction(repo)}
          input={aiInput}
          setInput={setAiInput}
          messages={aiMessages}
          setMessages={setAiMessages}
          presentation="sidebar"
        />}
      />

      {/* 2. Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          repositories={data.repositories}
          onAskAI={(prompt) => {
            setAiInitialPrompt(prompt);
            setIsSidebarAiOpen(true);
          }}
          onSearchChange={(query) => {
            setSearchQuery(query);
            if (query) setActiveNav('Dashboard');
          }}
          currentRelease={selectedRelease}
          availableReleases={availableReleaseOptions}
          onSelectRelease={handleSelectRelease}
          onFinalizeVersions={() => setIsFinalizeVersionsOpen(true)}
          canFinalizeVersions={selectedRelease === data.system.currentRelease}
          notifications={notifications}
          user={data.system.currentUser}
          onNotificationClick={(repo) => setSelectedRepoForAction(repo)}
          onUserClick={() => alert(`Logged in as Amil Ali (Release Manager - Allstate Enterprise Engineering)`)}
        />

        {/* Dashboard Content Area */}
        <main className="dashboard-content">
          {/* Header with Title and Refresh Data button */}
          <Header
            lastUpdated={lastUpdated}
            onRefresh={handleRefresh}
            activeNav={activeNav}
          />

          {activeNav !== 'Releases' && selectedRelease !== data.system.currentRelease && (
            <div className="scope-notice" role="status">
              Detailed sample data is available for {data.system.currentRelease}. The selected release is {selectedRelease}; its release-specific records are not loaded.
            </div>
          )}

          {activeNav === 'AI Assistant' ? (
            <AIAssistant
              repositories={repositoriesForActivePlan}
              metrics={data.metrics}
              readiness={data.releaseReadiness}
              foundationVersion={activeFoundationVersion}
              releaseName={selectedRelease}
              initialPrompt={aiInitialPrompt}
              onInitialPromptConsumed={() => setAiInitialPrompt('')}
              onReview={(repo) => setSelectedRepoForAction(repo)}
              input={aiInput}
              setInput={setAiInput}
              messages={aiMessages}
              setMessages={setAiMessages}
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
          ) : activeNav === 'Releases' ? (
            <ReleaseManagement
              plans={releasePlans}
              availableReleases={data.system.availableReleases}
              activePlanId={releasePlan.id}
              plan={releasePlan}
              onChange={handleChangeReleasePlan}
              onSelectPlan={(planId) => {
                setReleasePlanState((previous) => ({ ...previous, activePlanId: planId }));
                const nextPlan = releasePlans.find((candidate) => candidate.id === planId);
                if (nextPlan?.targetRelease?.trim()) setSelectedRelease(nextPlan.targetRelease);
              }}
              onCreateRelease={handleCreateRelease}
              repositories={data.repositories}
              currentFoundationVersion={data.system.foundationPipeline?.finalVersion || data.system.foundationVersion}
              onSave={handleSaveReleasePlan}
            />
          ) : (
            <>
              {/* 5 KPI Metric Cards */}
              <MetricsGrid
                metrics={data.metrics}
                readinessData={data.releaseReadiness}
                onViewChecklist={() => setIsChecklistOpen(true)}
                releasePlan={releasePlan}
                foundationVersion={activeFoundationVersion}
              />

              <EnvironmentTable
                repositories={repositoriesForActivePlan}
                totalRepositories={data.metrics.totalRepositories.value}
                foundationVersion={activeFoundationVersion}
                foundationPipeline={{ ...data.system.foundationPipeline, finalVersion: activeFoundationVersion }}
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
        foundationVersion={activeFoundationVersion}
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
