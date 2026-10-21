import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tag, 
  Plus, 
  CalendarDays, 
  Check, 
  CircleDot, 
  GitBranch, 
  Layers3, 
  Rocket, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Bug, 
  Bookmark, 
  CheckSquare, 
  ShieldCheck, 
  Database, 
  Zap, 
  FileText, 
  UserCheck, 
  ExternalLink, 
  Filter, 
  Search, 
  X,
  Play,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertOctagon
} from 'lucide-react';
import ReleaseTagModal from './ReleaseTagModal';
import { INITIAL_RELEASE_TAGS_DATA, getReleaseTagData } from '../data/releaseTagData';

const STATUSES = ['Planning', 'In Progress', 'Ready', 'Released'];

function formatDate(date) {
  if (!date) return 'Choose a target date';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReleaseManagement({ 
  plan, 
  plans = [], 
  availableReleases = [], 
  activePlanId, 
  onSelectPlan, 
  onCreateRelease, 
  onChange, 
  repositories = [], 
  currentFoundationVersion, 
  onSave 
}) {
  // Tag Modal control
  const [isTagModalOpen, setIsTagModalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('stories'); // 'stories' | 'regression' | 'validation' | 'repositories'
  
  // Release tags store
  const [releaseTagsData, setReleaseTagsData] = useState(() => {
    const saved = window.localStorage.getItem('releasesync.releaseTags.v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_RELEASE_TAGS_DATA;
  });

  const activeTagName = plan.targetRelease || 'Nov-R2';
  const tagData = releaseTagsData[activeTagName] || getReleaseTagData(activeTagName, plan);

  // Stories filter states
  const [storySearch, setStorySearch] = useState('');
  const [storySourceFilter, setStorySourceFilter] = useState('All');
  const [storyTypeFilter, setStoryTypeFilter] = useState('All');
  const [storyStatusFilter, setStoryStatusFilter] = useState('All');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  // New story modal state
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryKey, setNewStoryKey] = useState('');
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStorySource, setNewStorySource] = useState('VersionOne');
  const [newStoryType, setNewStoryType] = useState('Story');
  const [newStoryRepo, setNewStoryRepo] = useState(repositories[0]?.name || 'Claims Gateway');
  const [newStoryPriority, setNewStoryPriority] = useState('High');
  const [newStoryPoints, setNewStoryPoints] = useState(5);

  // New regression issue state
  const [isAddRegressionOpen, setIsAddRegressionOpen] = useState(false);
  const [newRegTitle, setNewRegTitle] = useState('');
  const [newRegSeverity, setNewRegSeverity] = useState('High');
  const [newRegComponent, setNewRegComponent] = useState(repositories[0]?.name || 'Claims Gateway');
  const [newRegOwner, setNewRegOwner] = useState('QA Team');
  const [isRunningRegression, setIsRunningRegression] = useState(false);

  // New validation step state
  const [isAddValidationOpen, setIsAddValidationOpen] = useState(false);
  const [newValName, setNewValName] = useState('');
  const [newValCategory, setNewValCategory] = useState('Quality Gate');
  const [newValDesc, setNewValDesc] = useState('');
  const [newValOwner, setNewValOwner] = useState('Release Team');

  // Plan snapshot state
  const selectedIds = plan.repositoryIds || [];
  const selectedRepos = repositories.filter((repo) => selectedIds.includes(repo.id));
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSaved(true);
  }, [activePlanId]);

  // Persist releaseTagsData to localStorage
  const updateTagData = (updated) => {
    const nextState = {
      ...releaseTagsData,
      [activeTagName]: updated
    };
    setReleaseTagsData(nextState);
    try {
      window.localStorage.setItem('releasesync.releaseTags.v2', JSON.stringify(nextState));
    } catch (e) { /* ignore */ }
  };

  const updatePlan = (next) => {
    setSaved(false);
    onChange(next);
  };

  const toggleRepository = (id) => {
    const next = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
    updatePlan({ ...plan, repositoryIds: next });
  };

  const savePlan = () => {
    try {
      onSave?.(plan);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  // Sync with VersionOne
  const handleSyncWithV1 = () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback(`Successfully synchronized stories from VersionOne for tag ${activeTagName}`);
      setTimeout(() => setSyncFeedback(null), 4000);
      updateTagData({
        ...tagData,
        lastSynced: 'Just now'
      });
    }, 1100);
  };

  // Run Regression Suite simulation
  const handleRunRegression = () => {
    setIsRunningRegression(true);
    setTimeout(() => {
      setIsRunningRegression(false);
      const updatedSuite = {
        ...tagData.regressionSuite,
        lastRunTimestamp: `Just now (${new Date().toLocaleTimeString()})`,
        passRate: 94,
        passed: tagData.regressionSuite.passed + 4,
        inProgress: Math.max(0, tagData.regressionSuite.inProgress - 4)
      };
      updateTagData({
        ...tagData,
        regressionSuite: updatedSuite
      });
    }, 1400);
  };

  // Story status update
  const handleStoryStatusChange = (storyId, newStatus) => {
    const updatedStories = (tagData.stories || []).map((story) => 
      story.id === storyId ? { ...story, status: newStatus } : story
    );
    updateTagData({
      ...tagData,
      stories: updatedStories
    });
  };

  // Delete story
  const handleDeleteStory = (storyId) => {
    const updatedStories = (tagData.stories || []).filter((story) => story.id !== storyId);
    updateTagData({
      ...tagData,
      stories: updatedStories
    });
  };

  // Add new story to tag
  const handleAddStory = (e) => {
    e.preventDefault();
    if (!newStoryKey.trim() || !newStoryTitle.trim()) return;

    const newStory = {
      id: newStoryKey.trim().toUpperCase(),
      source: newStorySource,
      type: newStoryType,
      title: newStoryTitle.trim(),
      repository: newStoryRepo,
      assignee: { name: 'Amil Ali', initials: 'AA', avatarBg: '#3b82f6' },
      priority: newStoryPriority,
      storyPoints: Number(newStoryPoints) || 3,
      status: 'In Progress',
      sprint: 'Current Release Sprint',
      epic: 'Release Alignment',
      regressionImpact: 'Low',
      lastUpdated: 'Just now'
    };

    updateTagData({
      ...tagData,
      stories: [newStory, ...(tagData.stories || [])]
    });

    setIsAddStoryOpen(false);
    setNewStoryKey('');
    setNewStoryTitle('');
  };

  // Add regression issue
  const handleAddRegressionIssue = (e) => {
    e.preventDefault();
    if (!newRegTitle.trim()) return;

    const newIssue = {
      id: `REG-${Math.floor(100 + Math.random() * 900)}`,
      title: newRegTitle.trim(),
      severity: newRegSeverity,
      status: 'Investigating',
      component: newRegComponent,
      detectedInRun: 'Run #B489-03',
      owner: newRegOwner.trim() || 'QA Team'
    };

    const updatedSuite = {
      ...tagData.regressionSuite,
      issues: [newIssue, ...(tagData.regressionSuite?.issues || [])]
    };

    updateTagData({
      ...tagData,
      regressionSuite: updatedSuite
    });

    setIsAddRegressionOpen(false);
    setNewRegTitle('');
  };

  // Toggle validation step status
  const handleToggleValidationStep = (stepId) => {
    const currentSteps = tagData.validationSteps || [];
    const updated = currentSteps.map((step) => {
      if (step.id === stepId) {
        const nextStatus = step.status === 'Passed' ? 'In Progress' : step.status === 'In Progress' ? 'Action Required' : 'Passed';
        return {
          ...step,
          status: nextStatus,
          verifiedAt: nextStatus === 'Passed' ? `Verified at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : step.verifiedAt
        };
      }
      return step;
    });

    updateTagData({
      ...tagData,
      validationSteps: updated
    });
  };

  // Add custom validation step
  const handleAddValidationStep = (e) => {
    e.preventDefault();
    if (!newValName.trim()) return;

    const newStep = {
      id: `val-${Date.now()}`,
      name: newValName.trim(),
      category: newValCategory,
      description: newValDesc.trim() || 'Custom release validation requirement.',
      status: 'In Progress',
      owner: newValOwner.trim() || 'Release Team',
      verifiedAt: 'Just created',
      evidence: 'Pending review'
    };

    updateTagData({
      ...tagData,
      validationSteps: [...(tagData.validationSteps || []), newStep]
    });

    setIsAddValidationOpen(false);
    setNewValName('');
    setNewValDesc('');
  };

  // Filtered stories
  const filteredStories = useMemo(() => {
    return (tagData.stories || []).filter((story) => {
      const matchesSearch = 
        story.id.toLowerCase().includes(storySearch.toLowerCase()) ||
        story.title.toLowerCase().includes(storySearch.toLowerCase()) ||
        story.repository.toLowerCase().includes(storySearch.toLowerCase()) ||
        story.assignee.name.toLowerCase().includes(storySearch.toLowerCase());
      
      const matchesSource = storySourceFilter === 'All' || story.source === storySourceFilter;
      const matchesType = storyTypeFilter === 'All' || story.type === storyTypeFilter;
      const matchesStatus = storyStatusFilter === 'All' || story.status === storyStatusFilter;

      return matchesSearch && matchesSource && matchesType && matchesStatus;
    });
  }, [tagData.stories, storySearch, storySourceFilter, storyTypeFilter, storyStatusFilter]);

  // Aggregate stats
  const storiesList = tagData.stories || [];
  const totalPoints = storiesList.reduce((acc, s) => acc + (s.storyPoints || 0), 0);
  const doneStoriesCount = storiesList.filter((s) => s.status === 'Done').length;
  const validationSteps = tagData.validationSteps || [];
  const passedValidationCount = validationSteps.filter((v) => v.status === 'Passed').length;
  const regressionSuite = tagData.regressionSuite || { passRate: 88, status: 'Active', totalTests: 100, passed: 88, issues: [] };

  const allTagNames = Array.from(new Set([
    'Nov-R2',
    'Release 2024.10',
    'Release 2024.09',
    'Release 2024.08',
    'Hotfix 2024.10.1',
    ...availableReleases,
    ...plans.map((p) => p.targetRelease).filter(Boolean),
    ...Object.keys(releaseTagsData)
  ]));

  return (
    <section className="release-planning-page" aria-label="Release Tag Management">
      {/* ─── Top Release Tag Switcher & Toolbar ─── */}
      <div className="release-tag-master-bar">
        <div className="release-tag-master-left">
          <div className="release-tag-pill-badge" onClick={() => setIsTagModalOpen(true)} role="button" tabIndex={0} title="Click to switch or create release tag">
            <Tag size={15} className="tag-icon-svg" />
            <div className="tag-pill-text">
              <small>ACTIVE RELEASE TAG</small>
              <strong>{activeTagName}</strong>
            </div>
            <span className="tag-switch-indicator">Switch Tag</span>
          </div>

          <button 
            type="button" 
            className="release-tag-toolbar-add-btn" 
            onClick={() => setIsTagModalOpen(true)}
            title="Choose another tag or create a new tag"
          >
            <Plus size={15} />
            <span>Select / Create Tag</span>
          </button>
        </div>

        <div className="release-tag-master-right">
          <div className="release-tag-sync-status">
            <span className="sync-pulse-dot" />
            <span>Synced with VersionOne · <small>{tagData.lastSynced || 'Just now'}</small></span>
          </div>

          <button 
            type="button" 
            className={`release-tag-sync-btn ${isSyncing ? 'is-loading' : ''}`}
            onClick={handleSyncWithV1}
            disabled={isSyncing}
            title="Pull updated stories from VersionOne Enterprise"
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
            <span>{isSyncing ? 'Pulling from VersionOne...' : 'Sync from VersionOne'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="release-sync-toast-alert" role="status">
          <CheckCircle2 size={16} />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* ─── Release Overview Header ─── */}
      <div className="release-plan-overview release-tag-hero-overview">
        <div className="release-plan-intro">
          <div className="release-hero-tags-row">
            <span className="release-eyebrow"><Rocket size={14} /> RELEASE TAG DASHBOARD</span>
            <span className="release-tag-source-badge">
              <Sparkles size={12} /> VersionOne Enterprise
            </span>
          </div>
          <h2>Release Tag: {activeTagName}</h2>
          <p>Tracking VersionOne (V1) user stories, regression test suite health, and release gate validation steps.</p>
        </div>

        <div className="release-date-callout">
          <span className="release-date-icon"><CalendarDays size={18} /></span>
          <div>
            <small>Target release date</small>
            <strong>{formatDate(tagData.targetDate || plan.targetDate)}</strong>
          </div>
          <span className={`release-status-pill status-${(tagData.status || plan.status || 'Planning').toLowerCase().replace(' ', '-')}`}>
            <CircleDot size={11} />{tagData.status || plan.status || 'Planning'}
          </span>
        </div>
      </div>

      {/* ─── 4 Quick KPI Highlight Cards ─── */}
      <div className="release-tag-kpi-grid">
        <div className="release-kpi-card" onClick={() => setActiveTab('stories')}>
          <div className="kpi-icon-wrap kpi-icon-blue">
            <Bookmark size={18} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Tagged User Stories</div>
            <div className="kpi-value">{storiesList.length} <small>issues</small></div>
            <div className="kpi-subtext">
              <strong>{doneStoriesCount} of {storiesList.length} Done</strong> · {totalPoints} story points
            </div>
          </div>
        </div>

        <div className="release-kpi-card" onClick={() => setActiveTab('regression')}>
          <div className={`kpi-icon-wrap ${regressionSuite.issues?.length > 0 ? 'kpi-icon-yellow' : 'kpi-icon-green'}`}>
            <ShieldCheck size={18} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Regression Suite Health</div>
            <div className="kpi-value">{regressionSuite.passRate}% <small>pass rate</small></div>
            <div className="kpi-subtext">
              {regressionSuite.issues?.length > 0 ? (
                <span className="text-warning-bold">{regressionSuite.issues.length} active regression bug{regressionSuite.issues.length > 1 ? 's' : ''}</span>
              ) : (
                <span className="text-success-bold">Zero regression defects</span>
              )}
            </div>
          </div>
        </div>

        <div className="release-kpi-card" onClick={() => setActiveTab('validation')}>
          <div className="kpi-icon-wrap kpi-icon-purple">
            <CheckSquare size={18} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Validation Gate Steps</div>
            <div className="kpi-value">{passedValidationCount} / {validationSteps.length} <small>passed</small></div>
            <div className="kpi-subtext">
              <strong>{validationSteps.length - passedValidationCount} steps remaining</strong> before deploy
            </div>
          </div>
        </div>

        <div className="release-kpi-card" onClick={() => setActiveTab('repositories')}>
          <div className="kpi-icon-wrap kpi-icon-indigo">
            <GitBranch size={18} />
          </div>
          <div className="kpi-details">
            <div className="kpi-label">Repository Scope</div>
            <div className="kpi-value">{selectedIds.length} <small>repositories</small></div>
            <div className="kpi-subtext">Foundation: <strong>{tagData.foundationVersion || currentFoundationVersion}</strong></div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ─── */}
      <div className="release-tag-nav-tabs">
        <button
          type="button"
          className={`release-tag-tab-btn ${activeTab === 'stories' ? 'active' : ''}`}
          onClick={() => setActiveTab('stories')}
        >
          <Bookmark size={15} />
          <span>VersionOne Stories</span>
          <span className="release-tab-badge">{storiesList.length}</span>
        </button>

        <button
          type="button"
          className={`release-tag-tab-btn ${activeTab === 'regression' ? 'active' : ''}`}
          onClick={() => setActiveTab('regression')}
        >
          <ShieldCheck size={15} />
          <span>Regression Testing Status</span>
          <span className={`release-tab-status-dot ${regressionSuite.issues?.length > 0 ? 'dot-warning' : 'dot-success'}`} />
        </button>

        <button
          type="button"
          className={`release-tag-tab-btn ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          <CheckSquare size={15} />
          <span>Validation Steps & Gates</span>
          <span className="release-tab-badge">{passedValidationCount}/{validationSteps.length}</span>
        </button>

        <button
          type="button"
          className={`release-tag-tab-btn ${activeTab === 'repositories' ? 'active' : ''}`}
          onClick={() => setActiveTab('repositories')}
        >
          <GitBranch size={15} />
          <span>Repository Scope & Details</span>
          <span className="release-tab-badge">{selectedIds.length}</span>
        </button>
      </div>

      {/* ─── TAB 1: VERSIONONE STORIES ─── */}
      {activeTab === 'stories' && (
        <div className="release-tag-tab-content">
          <div className="release-stories-toolbar">
            <div className="release-stories-search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search VersionOne key, story title, repository, assignee..."
                value={storySearch}
                onChange={(e) => setStorySearch(e.target.value)}
              />
              {storySearch && (
                <button type="button" className="clear-search-btn" onClick={() => setStorySearch('')}>
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="release-stories-filters-group">
              <select 
                value={storySourceFilter} 
                onChange={(e) => setStorySourceFilter(e.target.value)}
                className="stories-filter-select"
              >
                <option value="All">All VersionOne Stories</option>
                <option value="VersionOne">VersionOne Core</option>
              </select>

              <select 
                value={storyTypeFilter} 
                onChange={(e) => setStoryTypeFilter(e.target.value)}
                className="stories-filter-select"
              >
                <option value="All">All Issue Types</option>
                <option value="Story">Story</option>
                <option value="Bug">Bug</option>
                <option value="Task">Task</option>
                <option value="Epic">Epic</option>
              </select>

              <select 
                value={storyStatusFilter} 
                onChange={(e) => setStoryStatusFilter(e.target.value)}
                className="stories-filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="Done">Done</option>
                <option value="In QA">In QA</option>
                <option value="Ready for Test">Ready for Test</option>
                <option value="In Progress">In Progress</option>
                <option value="To Do">To Do</option>
              </select>

              <button 
                type="button" 
                className="release-add-story-btn"
                onClick={() => setIsAddStoryOpen(true)}
              >
                <Plus size={14} />
                <span>Tag New Story</span>
              </button>
            </div>
          </div>

          {/* Stories Table */}
          <div className="release-stories-table-wrap">
            <table className="release-stories-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Key & Source</th>
                  <th style={{ width: '90px' }}>Type</th>
                  <th>Summary & Description</th>
                  <th style={{ width: '150px' }}>Repository</th>
                  <th style={{ width: '90px' }}>Priority</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Points</th>
                  <th style={{ width: '140px' }}>Assignee</th>
                  <th style={{ width: '130px' }}>Status</th>
                  <th style={{ width: '40px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredStories.length > 0 ? (
                  filteredStories.map((story) => (
                    <tr key={story.id}>
                      <td>
                        <div className="story-key-cell">
                          <span className={`story-source-tag source-${story.source.toLowerCase()}`}>
                            {story.source}
                          </span>
                          <strong className="story-key-link">{story.id}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="story-type-cell">
                          {story.type === 'Bug' ? (
                            <span className="type-badge-bug" title="Bug"><Bug size={13} /> Bug</span>
                          ) : story.type === 'Task' ? (
                            <span className="type-badge-task" title="Task"><CheckSquare size={13} /> Task</span>
                          ) : (
                            <span className="type-badge-story" title="User Story"><Bookmark size={13} /> Story</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="story-summary-cell">
                          <span className="story-title-text">{story.title}</span>
                          <div className="story-meta-row">
                            <span className="story-epic-badge">{story.epic}</span>
                            <span className="story-sprint-meta">{story.sprint}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="story-repo-badge">{story.repository}</span>
                      </td>
                      <td>
                        <span className={`story-priority-badge priority-${story.priority.toLowerCase()}`}>
                          {story.priority}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="story-pts-badge">{story.storyPoints}</span>
                      </td>
                      <td>
                        <div className="story-assignee-cell">
                          <span className="story-avatar" style={{ backgroundColor: story.assignee.avatarBg }}>
                            {story.assignee.initials}
                          </span>
                          <span className="story-assignee-name">{story.assignee.name}</span>
                        </div>
                      </td>
                      <td>
                        <select 
                          className={`story-status-select status-${story.status.toLowerCase().replace(/\s+/g, '-')}`}
                          value={story.status}
                          onChange={(e) => handleStoryStatusChange(story.id, e.target.value)}
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Ready for Test">Ready for Test</option>
                          <option value="In QA">In QA</option>
                          <option value="Done">Done</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button" 
                          className="story-remove-btn" 
                          title="Untag story from this release"
                          onClick={() => handleDeleteStory(story.id)}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="empty-stories-cell">
                      <div className="empty-stories-state">
                        <Bookmark size={28} className="empty-icon" />
                        <h4>No user stories match the filter</h4>
                        <p>Try clearing search keywords or change the issue filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: REGRESSION TESTING STATUS ─── */}
      {activeTab === 'regression' && (
        <div className="release-tag-tab-content">
          <div className="regression-banner-card">
            <div className="regression-banner-top">
              <div className="regression-banner-title-wrap">
                <div className={`regression-status-icon-wrap ${regressionSuite.issues?.length > 0 ? 'status-icon-warn' : 'status-icon-ok'}`}>
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <div className="regression-suite-title">{regressionSuite.testSuiteName}</div>
                  <div className="regression-suite-meta">
                    Environment: <strong>{regressionSuite.environment}</strong> · Last run: <span>{regressionSuite.lastRunTimestamp}</span>
                  </div>
                </div>
              </div>

              <div className="regression-banner-actions">
                <button 
                  type="button" 
                  className={`regression-run-btn ${isRunningRegression ? 'is-running' : ''}`}
                  onClick={handleRunRegression}
                  disabled={isRunningRegression}
                >
                  <Play size={14} />
                  <span>{isRunningRegression ? 'Executing automated tests...' : 'Trigger Regression Run'}</span>
                </button>
                <button 
                  type="button" 
                  className="regression-add-defect-btn"
                  onClick={() => setIsAddRegressionOpen(true)}
                >
                  <Plus size={14} />
                  <span>Log Regression Defect</span>
                </button>
              </div>
            </div>

            {/* Regression Progress Bar */}
            <div className="regression-progress-container">
              <div className="regression-progress-header">
                <span>Test Execution Progress</span>
                <strong>{regressionSuite.passRate}% Passing ({regressionSuite.passed} / {regressionSuite.totalTests} tests)</strong>
              </div>
              <div className="regression-progress-bar">
                <div className="progress-segment seg-passed" style={{ width: `${(regressionSuite.passed / regressionSuite.totalTests) * 100}%` }} title={`Passed: ${regressionSuite.passed}`} />
                <div className="progress-segment seg-in-progress" style={{ width: `${(regressionSuite.inProgress / regressionSuite.totalTests) * 100}%` }} title={`In Progress: ${regressionSuite.inProgress}`} />
                <div className="progress-segment seg-failed" style={{ width: `${(regressionSuite.failed / regressionSuite.totalTests) * 100}%` }} title={`Failed: ${regressionSuite.failed}`} />
                <div className="progress-segment seg-blocked" style={{ width: `${(regressionSuite.blocked / regressionSuite.totalTests) * 100}%` }} title={`Blocked: ${regressionSuite.blocked}`} />
              </div>
              <div className="regression-progress-legend">
                <div className="legend-item"><span className="legend-dot dot-passed" /> Passed ({regressionSuite.passed})</div>
                <div className="legend-item"><span className="legend-dot dot-in-progress" /> In Progress ({regressionSuite.inProgress})</div>
                <div className="legend-item"><span className="legend-dot dot-failed" /> Failed ({regressionSuite.failed})</div>
                <div className="legend-item"><span className="legend-dot dot-blocked" /> Blocked ({regressionSuite.blocked})</div>
              </div>
            </div>
          </div>

          {/* Active Regression Defects List */}
          <div className="regression-defects-section">
            <div className="defects-section-header">
              <div>
                <h3>Active Regression Issues ({regressionSuite.issues?.length || 0})</h3>
                <p>Anomalies and regressions detected during this release test cycle requiring resolution before production sign-off.</p>
              </div>
            </div>

            {regressionSuite.issues?.length > 0 ? (
              <div className="defects-cards-grid">
                {regressionSuite.issues.map((issue) => (
                  <div className={`defect-card sev-${issue.severity.toLowerCase()}`} key={issue.id}>
                    <div className="defect-card-header">
                      <div className="defect-id-wrap">
                        <Bug size={14} />
                        <strong>{issue.id}</strong>
                        <span className={`defect-sev-badge sev-${issue.severity.toLowerCase()}`}>
                          {issue.severity} Severity
                        </span>
                      </div>
                      <span className="defect-status-pill">{issue.status}</span>
                    </div>

                    <div className="defect-card-title">{issue.title}</div>

                    <div className="defect-card-footer">
                      <div className="defect-meta-item">
                        <span>Component:</span> <strong>{issue.component}</strong>
                      </div>
                      <div className="defect-meta-item">
                        <span>Owner:</span> <strong>{issue.owner}</strong>
                      </div>
                      <div className="defect-meta-item">
                        <span>Test Run:</span> <code>{issue.detectedInRun}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="zero-defects-card">
                <CheckCircle2 size={32} className="zero-defects-icon" />
                <h4>No Regression Defects Open</h4>
                <p>All automated and manual regression tests for {activeTagName} have cleared without blockers.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: VALIDATION STEPS & GATES ─── */}
      {activeTab === 'validation' && (
        <div className="release-tag-tab-content">
          <div className="validation-header-bar">
            <div>
              <h3>Release Quality Gate & Validation Steps</h3>
              <p>Mandatory technical checks, automated test gates, security clearances, and CAB approvals.</p>
            </div>
            <button 
              type="button" 
              className="validation-add-step-btn"
              onClick={() => setIsAddValidationOpen(true)}
            >
              <Plus size={14} />
              <span>Add Validation Step</span>
            </button>
          </div>

          <div className="validation-steps-list">
            {validationSteps.map((step, index) => {
              const isPassed = step.status === 'Passed';
              const isInProgress = step.status === 'In Progress';
              return (
                <div 
                  className={`validation-step-row ${isPassed ? 'is-passed' : isInProgress ? 'is-progress' : 'is-pending'}`} 
                  key={step.id || index}
                >
                  <div className="validation-step-check" onClick={() => handleToggleValidationStep(step.id)} role="button" tabIndex={0} title="Click to toggle status">
                    {isPassed ? (
                      <CheckCircle2 size={20} className="step-icon-passed" />
                    ) : isInProgress ? (
                      <Clock size={20} className="step-icon-progress" />
                    ) : (
                      <CircleDot size={20} className="step-icon-pending" />
                    )}
                  </div>

                  <div className="validation-step-info">
                    <div className="validation-step-title-row">
                      <strong className="validation-step-name">{index + 1}. {step.name}</strong>
                      <span className="validation-category-tag">{step.category}</span>
                      <span className={`validation-status-badge status-${step.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {step.status}
                      </span>
                    </div>
                    <p className="validation-step-desc">{step.description}</p>
                    <div className="validation-step-meta-row">
                      <span>Owner: <strong>{step.owner}</strong></span>
                      <span>Verification: <strong>{step.verifiedAt}</strong></span>
                      {step.evidence && <span>Evidence: <em>{step.evidence}</em></span>}
                    </div>
                  </div>

                  <div className="validation-step-action">
                    <button 
                      type="button" 
                      className="validation-toggle-btn"
                      onClick={() => handleToggleValidationStep(step.id)}
                    >
                      {isPassed ? 'Mark In Progress' : 'Sign Off / Pass'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 4: REPOSITORY SCOPE & DETAILS ─── */}
      {activeTab === 'repositories' && (
        <div className="release-tag-tab-content">
          <div className="release-plan-columns">
            <div className="release-plan-main">
              <section className="release-panel">
                <div className="release-panel-heading">
                  <div>
                    <h3>Release details</h3>
                    <p>Define the target and current lifecycle stage.</p>
                  </div>
                  <CalendarDays size={17} />
                </div>
                <div className="release-form-grid">
                  <label className="release-field release-field-wide">Target release name
                    <input 
                      value={plan.targetRelease || ''} 
                      onChange={(event) => updatePlan({ ...plan, targetRelease: event.target.value })} 
                      placeholder="e.g. Release 2026.11" 
                    />
                  </label>
                  <label className="release-field">Target date
                    <input 
                      type="date" 
                      value={plan.targetDate || ''} 
                      onChange={(event) => updatePlan({ ...plan, targetDate: event.target.value })} 
                    />
                  </label>
                  <label className="release-field">Foundation version override
                    <input 
                      value={plan.finalFoundationVersion || ''} 
                      onChange={(event) => updatePlan({ ...plan, finalFoundationVersion: event.target.value })} 
                      placeholder="e.g. 1.316.000" 
                    />
                    <small className="release-field-help">Current compiled version: {currentFoundationVersion || 'Not recorded'}</small>
                  </label>
                  <label className="release-field">Release status
                    <select value={plan.status || 'Planning'} onChange={(event) => updatePlan({ ...plan, status: event.target.value })}>
                      {STATUSES.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              <section className="release-panel release-scope-panel">
                <div className="release-panel-heading">
                  <div>
                    <h3>Repository versions <span className="release-count-badge">{selectedIds.length} in scope</span></h3>
                    <p>Review or override the published version for each repository in this release tag.</p>
                  </div>
                  <Layers3 size={17} />
                </div>
                <div className="release-repository-list">
                  {repositories.map((repo) => {
                    const checked = selectedIds.includes(repo.id);
                    return (
                      <div className={`release-repository-row ${checked ? 'is-selected' : ''}`} key={repo.id}>
                        <input 
                          id={`release-scope-${repo.id}`} 
                          type="checkbox" 
                          checked={checked} 
                          onChange={() => toggleRepository(repo.id)} 
                        />
                        <span className="release-repo-mark"><GitBranch size={14} /></span>
                        <label className="release-repo-name" htmlFor={`release-scope-${repo.id}`}>
                          <strong>{repo.name}</strong>
                        </label>
                        <input
                          className="release-repo-version-input"
                          aria-label={`Published version for ${repo.name}`}
                          value={plan.repositoryVersions?.[repo.id] ?? repo.publishedVersion ?? repo.nonProdVersion ?? ''}
                          onChange={(event) => updatePlan({ ...plan, repositoryVersions: { ...plan.repositoryVersions, [repo.id]: event.target.value } })}
                        />
                        <span className={`release-repo-state state-${(repo.status || 'Review').toLowerCase().replace(' ', '-')}`}>
                          {repo.status}
                        </span>
                      </div>
                    );
                  })}
                  {!repositories.length && <p className="release-empty">No repositories are available to add.</p>}
                </div>
              </section>
            </div>

            <aside className="release-plan-rail">
              <section className="release-panel release-snapshot-panel">
                <div className="release-panel-heading">
                  <div>
                    <h3>Plan snapshot</h3>
                    <p>Current release scope at a glance.</p>
                  </div>
                </div>
                <div className="release-snapshot-row"><span>Target Tag</span><strong>{plan.targetRelease || activeTagName}</strong></div>
                <div className="release-snapshot-row"><span>Target date</span><strong>{formatDate(plan.targetDate)}</strong></div>
                <div className="release-snapshot-row"><span>Foundation version</span><strong>{plan.finalFoundationVersion || 'Not recorded'}</strong></div>
                <div className="release-snapshot-row"><span>Repositories</span><strong>{selectedIds.length} of {repositories.length}</strong></div>
                <div className="release-snapshot-row"><span>Tagged Stories</span><strong>{storiesList.length} issues ({totalPoints} pts)</strong></div>
                <div className="release-snapshot-row"><span>Regression Pass</span><strong>{regressionSuite.passRate}%</strong></div>
                
                <button 
                  className="release-primary-btn release-save-btn" 
                  type="button" 
                  onClick={savePlan}
                >
                  {saved ? <Check size={15} /> : <Save size={15} />}
                  Save release plan
                </button>
              </section>
            </aside>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: First Dialog Box Asking for Tag (+ Plus Icon) ─── */}
      <ReleaseTagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        currentTag={activeTagName}
        availableTags={allTagNames}
        tagsData={releaseTagsData}
        onSelectTag={(selected) => {
          setIsTagModalOpen(false);
          const candidate = plans.find((p) => p.targetRelease === selected);
          if (candidate) {
            onSelectPlan?.(candidate.id);
          } else {
            updatePlan({ ...plan, targetRelease: selected });
          }
        }}
        onCreateNewTag={(newTag) => {
          setIsTagModalOpen(false);
          // Register in tag data
          const newTagDetails = getReleaseTagData(newTag.tagName, newTag);
          setReleaseTagsData((prev) => ({
            ...prev,
            [newTag.tagName]: newTagDetails
          }));
          onCreateRelease?.(newTag.tagName);
        }}
      />

      {/* ─── MODAL 2: Add New VersionOne Story ─── */}
      {isAddStoryOpen && createPortal(
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setIsAddStoryOpen(false)}>
          <div className="modal-dialog release-tag-subdialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tag New VersionOne Story to {activeTagName}</div>
              <button className="modal-close-btn" type="button" onClick={() => setIsAddStoryOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStory} className="modal-body release-dialog-form">
              <div className="form-row-2">
                <label className="release-tag-form-field">
                  <span>Source</span>
                  <select value={newStorySource} onChange={(e) => setNewStorySource(e.target.value)}>
                    <option value="VersionOne">VersionOne Enterprise</option>
                  </select>
                </label>
                <label className="release-tag-form-field">
                  <span>Issue Key *</span>
                  <input 
                    required 
                    placeholder="e.g. V1-1120 or V1-8930" 
                    value={newStoryKey} 
                    onChange={(e) => setNewStoryKey(e.target.value)} 
                  />
                </label>
              </div>

              <label className="release-tag-form-field">
                <span>Summary / Title *</span>
                <input 
                  required 
                  placeholder="e.g. Asynchronous claim valuation event streaming" 
                  value={newStoryTitle} 
                  onChange={(e) => setNewStoryTitle(e.target.value)} 
                />
              </label>

              <div className="form-row-3">
                <label className="release-tag-form-field">
                  <span>Issue Type</span>
                  <select value={newStoryType} onChange={(e) => setNewStoryType(e.target.value)}>
                    <option value="Story">Story</option>
                    <option value="Bug">Bug</option>
                    <option value="Task">Task</option>
                    <option value="Epic">Epic</option>
                  </select>
                </label>
                <label className="release-tag-form-field">
                  <span>Repository</span>
                  <select value={newStoryRepo} onChange={(e) => setNewStoryRepo(e.target.value)}>
                    {repositories.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </label>
                <label className="release-tag-form-field">
                  <span>Priority</span>
                  <select value={newStoryPriority} onChange={(e) => setNewStoryPriority(e.target.value)}>
                    <option value="Highest">Highest</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <label className="release-tag-form-field">
                  <span>Story Points</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="21" 
                    value={newStoryPoints} 
                    onChange={(e) => setNewStoryPoints(e.target.value)} 
                  />
                </label>
              </div>

              <div className="release-tag-form-actions">
                <button type="button" className="release-tag-btn-secondary" onClick={() => setIsAddStoryOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="release-tag-btn-primary">
                  <Plus size={15} /> Add to Release Tag
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: Log Regression Defect ─── */}
      {isAddRegressionOpen && createPortal(
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setIsAddRegressionOpen(false)}>
          <div className="modal-dialog release-tag-subdialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Log Regression Defect for {activeTagName}</div>
              <button className="modal-close-btn" type="button" onClick={() => setIsAddRegressionOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddRegressionIssue} className="modal-body release-dialog-form">
              <label className="release-tag-form-field">
                <span>Defect Description *</span>
                <input 
                  required 
                  placeholder="e.g. High latency on Claims Gateway under load" 
                  value={newRegTitle} 
                  onChange={(e) => setNewRegTitle(e.target.value)} 
                />
              </label>

              <div className="form-row-3">
                <label className="release-tag-form-field">
                  <span>Severity</span>
                  <select value={newRegSeverity} onChange={(e) => setNewRegSeverity(e.target.value)}>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
                <label className="release-tag-form-field">
                  <span>Component</span>
                  <select value={newRegComponent} onChange={(e) => setNewRegComponent(e.target.value)}>
                    {repositories.map((r) => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </label>
                <label className="release-tag-form-field">
                  <span>Assigned Owner</span>
                  <input 
                    placeholder="e.g. Arch Team / QA Lead" 
                    value={newRegOwner} 
                    onChange={(e) => setNewRegOwner(e.target.value)} 
                  />
                </label>
              </div>

              <div className="release-tag-form-actions">
                <button type="button" className="release-tag-btn-secondary" onClick={() => setIsAddRegressionOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="release-tag-btn-primary">
                  <Bug size={15} /> Log Regression Issue
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 4: Add Validation Step ─── */}
      {isAddValidationOpen && createPortal(
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setIsAddValidationOpen(false)}>
          <div className="modal-dialog release-tag-subdialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Add Validation Gate Step</div>
              <button className="modal-close-btn" type="button" onClick={() => setIsAddValidationOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddValidationStep} className="modal-body release-dialog-form">
              <label className="release-tag-form-field">
                <span>Validation Step Name *</span>
                <input 
                  required 
                  placeholder="e.g. Chaos Monkey Resiliency Verification" 
                  value={newValName} 
                  onChange={(e) => setNewValName(e.target.value)} 
                />
              </label>

              <div className="form-row-2">
                <label className="release-tag-form-field">
                  <span>Category</span>
                  <select value={newValCategory} onChange={(e) => setNewValCategory(e.target.value)}>
                    <option value="Testing">Testing</option>
                    <option value="Security">Security</option>
                    <option value="Quality Gate">Quality Gate</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Performance">Performance</option>
                    <option value="Operations">Operations</option>
                    <option value="Governance">Governance</option>
                  </select>
                </label>
                <label className="release-tag-form-field">
                  <span>Assigned Owner</span>
                  <input 
                    placeholder="e.g. SRE / SecOps / QA Lead" 
                    value={newValOwner} 
                    onChange={(e) => setNewValOwner(e.target.value)} 
                  />
                </label>
              </div>

              <label className="release-tag-form-field">
                <span>Description</span>
                <textarea 
                  rows={2}
                  placeholder="Detail the acceptance criteria and verification steps..."
                  value={newValDesc}
                  onChange={(e) => setNewValDesc(e.target.value)}
                />
              </label>

              <div className="release-tag-form-actions">
                <button type="button" className="release-tag-btn-secondary" onClick={() => setIsAddValidationOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="release-tag-btn-primary">
                  <Plus size={15} /> Add Validation Gate
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
