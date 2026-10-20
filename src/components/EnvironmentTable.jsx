import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderGit2, 
  MoreHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Download,
  Info,
  X,
  Filter
} from 'lucide-react';
import { downloadRepositoryManifest } from '../utils/exportRepositoryManifest';

const COLUMN_OPTIONS = [
  ['repository', 'Repository'],
  ['prodVersion', 'Prod Version'],
  ['nonProdVersion', 'Non-Prod Version'],
  ['hfVersion', 'HF Version'],
  ['lastDeployed', 'Last Deployed'],
  ['buildVersion', 'Build Version'],
  ['status', 'Status'],
  ['actions', 'Actions']
];
const STATUS_OPTIONS = [
  ['All Statuses', 'All Statuses'],
  ['Review', 'Mismatch review'],
  ['Match', 'Versions match'],
  ['Investigate', 'Critical mismatch'],
  ['On Track', 'Deployment in progress']
];
const COLUMN_STAGGER_DELAY = 36;
const COLUMN_ENTER_DURATION = 360;
const COLUMN_EXIT_DURATION = 180;
const COMPONENT_SCAN_DURATION = 700;

function ColumnVisibilityFilter({ visibleColumns, visibleColumnCount, isOpen, setIsOpen, selectAllRef, selectAllColumns, deselectAllColumns, toggleColumn }) {
  return (
    <div className="status-filter-control">
      <button
        className={`status-filter-icon-button ${isOpen ? 'active' : ''}`}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Choose visible columns; ${visibleColumnCount} of ${COLUMN_OPTIONS.length} shown`}
        title="Choose visible columns"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Filter size={13} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="column-picker-menu column-visibility-menu" role="group" aria-label="Choose visible columns">
          <div className="filter-menu-section-label">Visible columns <span>{visibleColumnCount}/{COLUMN_OPTIONS.length}</span></div>
          <label className="column-picker-option column-picker-select-all">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={visibleColumnCount === COLUMN_OPTIONS.length}
              onChange={(event) => event.target.checked ? selectAllColumns() : deselectAllColumns()}
            />
            <span>Select all columns</span>
          </label>
          <button className="column-picker-deselect" type="button" onClick={deselectAllColumns}>Deselect all</button>
          <div className="column-picker-divider" />
          {COLUMN_OPTIONS.map(([key, label]) => (
            <label className="column-picker-option" key={key}>
              <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusValueFilter({ statusFilter, setStatusFilter, isOpen, setIsOpen }) {
  return (
    <div className="status-filter-control status-value-filter-control">
      <button
        className={`status-filter-icon-button status-filter-header-button ${isOpen ? 'active' : ''}`}
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Filter statuses; current filter: ${statusFilter}`}
        title="Filter by status"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Filter size={13} aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="column-picker-menu status-filter-menu" role="group" aria-label="Filter by status">
          <div className="filter-menu-section-label">Filter by status</div>
          {STATUS_OPTIONS.map(([value, label]) => (
            <button
              className={`status-filter-option ${statusFilter === value ? 'selected' : ''}`}
              type="button"
              key={value}
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              <span>{label}</span>
              {statusFilter === value && <CheckCircle2 size={13} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EnvironmentTable({ repositories, totalRepositories, foundationVersion, foundationPipeline, releaseName, searchQuery = '', onActionClick }) {
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [visibleColumns, setVisibleColumns] = useState(() => Object.fromEntries(COLUMN_OPTIONS.map(([key]) => [key, true])));
  const [renderedColumns, setRenderedColumns] = useState(() => Object.fromEntries(COLUMN_OPTIONS.map(([key]) => [key, true])));
  const [columnAnimations, setColumnAnimations] = useState({});
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [pipelineInfo, setPipelineInfo] = useState(null);
  const [isComponentScanning, setIsComponentScanning] = useState(false);
  const [componentScanCycle, setComponentScanCycle] = useState(0);
  const columnAnimationTimers = useRef({});
  const componentScanTimer = useRef(null);
  const selectAllRef = useRef(null);

  const visibleColumnCount = COLUMN_OPTIONS.reduce((count, [key]) => count + Number(visibleColumns[key]), 0);
  const renderedColumnCount = COLUMN_OPTIONS.reduce((count, [key]) => count + Number(renderedColumns[key]), 0);
  const hasLaterVersionColumn = renderedColumns.nonProdVersion || renderedColumns.hfVersion;

  useEffect(() => () => {
    Object.values(columnAnimationTimers.current).forEach(window.clearTimeout);
    window.clearTimeout(componentScanTimer.current);
  }, []);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = visibleColumnCount > 0 && visibleColumnCount < COLUMN_OPTIONS.length;
    }
  }, [visibleColumnCount]);

  const filteredRepos = useMemo(() => {
    if (!repositories) return [];
    return repositories.filter((repo) => {
      const matchesStatus = statusFilter === 'All Statuses' || repo.status === statusFilter;
      const matchesSearch = 
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.changeOrder.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.prodVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.nonProdVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.hfVersion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.jenkinsBuild.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.lastDeployed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.environment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.status.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [repositories, statusFilter, searchQuery]);

  const applyColumnSelection = (nextColumns) => {
    const changedColumns = Object.entries(nextColumns).filter(([key, shouldShow]) => shouldShow !== visibleColumns[key]);
    if (changedColumns.length === 0) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setIsComponentScanning(true);
    setComponentScanCycle((cycle) => cycle + 1);
    window.clearTimeout(componentScanTimer.current);
    componentScanTimer.current = window.setTimeout(() => setIsComponentScanning(false), prefersReducedMotion ? 1 : COMPONENT_SCAN_DURATION);

    changedColumns.forEach(([key, shouldShow]) => {
      window.clearTimeout(columnAnimationTimers.current[key]);
      setColumnAnimations((current) => ({ ...current, [key]: shouldShow ? 'entering' : 'exiting' }));

      const columnIndex = COLUMN_OPTIONS.findIndex(([columnKey]) => columnKey === key);
      const staggerIndex = shouldShow ? columnIndex : COLUMN_OPTIONS.length - columnIndex - 1;
      const animationDelay = prefersReducedMotion ? 0 : staggerIndex * COLUMN_STAGGER_DELAY;
      const animationDuration = prefersReducedMotion ? 1 : (shouldShow ? COLUMN_ENTER_DURATION : COLUMN_EXIT_DURATION);

      if (shouldShow) {
        setRenderedColumns((current) => ({ ...current, [key]: true }));
      }

      columnAnimationTimers.current[key] = window.setTimeout(() => {
        if (!shouldShow) setRenderedColumns((current) => ({ ...current, [key]: false }));
        setColumnAnimations((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
        delete columnAnimationTimers.current[key];
      }, animationDuration + animationDelay);
    });
    setVisibleColumns(nextColumns);
  };

  const toggleColumn = (key) => {
    applyColumnSelection({ ...visibleColumns, [key]: !visibleColumns[key] });
  };

  const selectAllColumns = () => {
    applyColumnSelection(Object.fromEntries(COLUMN_OPTIONS.map(([key]) => [key, true])));
  };

  const deselectAllColumns = () => {
    applyColumnSelection(Object.fromEntries(COLUMN_OPTIONS.map(([key]) => [key, false])));
  };

  const columnClass = (key, baseClass = '') => [
    baseClass,
    `managed-column-${key}`,
    columnAnimations[key] ? `column-${columnAnimations[key]}` : ''
  ].filter(Boolean).join(' ');

  const gutterClass = (baseClass = 'version-column-gutter') => [
    baseClass,
    'column-gutter-transition'
  ].filter(Boolean).join(' ');

  const renderStatusPill = (status) => {
    switch (status) {
      case 'Review':
        return (
          <span className="status-pill review" title="Production and non-production versions differ; review the change.">
            <AlertTriangle size={11} strokeWidth={2.4} />
            <span>Mismatch review</span>
          </span>
        );
      case 'Match':
        return (
          <span className="status-pill match" title="Production and non-production versions match.">
            <CheckCircle2 size={11} strokeWidth={2.4} />
            <span>Versions match</span>
          </span>
        );
      case 'Investigate':
        return (
          <span className="status-pill investigate" title="Critical version mismatch requiring investigation.">
            <XCircle size={11} strokeWidth={2.4} />
            <span>Critical mismatch</span>
          </span>
        );
      case 'On Track':
        return (
          <span className="status-pill on-track" title="A deployment is in progress; versions have not converged yet.">
            <CheckCircle2 size={11} strokeWidth={2.4} />
            <span>Deployment in progress</span>
          </span>
        );
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  const getNonProdColor = (versionStatus) => {
    if (versionStatus === 'mismatch-alert' || versionStatus === 'mismatch-danger') {
      return '#dc2626';
    }
    if (versionStatus === 'progress') {
      return '#16a34a';
    }
    return '#0f172a';
  };

  const renderFoundationInfoButton = (environment) => (
    <button
      type="button"
      className="version-info-button"
      aria-label={`Foundation pipeline details for ${environment}`}
      title={`Foundation pipeline details for ${environment}`}
      onClick={() => setPipelineInfo(environment)}
    >
      <Info size={12} />
    </button>
  );

  return (
    <div className="table-card">
      {/* Table Header Bar with Filters */}
      <div className="table-header-bar">
        <div className="card-header-left">
          <h2 className="card-title">Repository Environment Versions</h2>
              <p className="card-subtitle">Showing {filteredRepos.length} of {repositories?.length || 0} listed repositories · {totalRepositories} total for this release</p>
        </div>

        <div className="table-toolbar-actions">
          <button
            className="manifest-export-btn"
            type="button"
            disabled={filteredRepos.length === 0}
            onClick={() => downloadRepositoryManifest(filteredRepos, { releaseName, foundationVersion })}
            title={`Download ${filteredRepos.length} filtered repositories as an Excel manifest`}
          >
            <Download size={14} />
            <span>Export Manifest</span>
          </button>
          <ColumnVisibilityFilter
            visibleColumns={visibleColumns}
            visibleColumnCount={visibleColumnCount}
            isOpen={isColumnMenuOpen}
            setIsOpen={setIsColumnMenuOpen}
            selectAllRef={selectAllRef}
            selectAllColumns={selectAllColumns}
            deselectAllColumns={deselectAllColumns}
            toggleColumn={toggleColumn}
          />
        </div>

      </div>

      {/* Table Body with internal scroll */}
      <div className={`table-responsive ${isComponentScanning ? 'is-component-scanning' : ''}`}>
        <table className="data-table">
          <thead>
            <tr>
              {renderedColumns.repository && <th className={columnClass('repository', 'sticky-repository')} style={{ width: '170px' }}>Repository</th>}
              {renderedColumns.prodVersion && <th className={columnClass('prodVersion', 'foundation-column foundation-column-header')} style={{ width: '112px' }}>
                <div className="foundation-header-content">
                  <span className="foundation-version-label">Foundation {foundationVersion}</span>
                  <span className="version-heading-with-info">Prod Version {renderFoundationInfoButton('Prod')}</span>
                </div>
              </th>}
              {renderedColumns.prodVersion && hasLaterVersionColumn && <th className={gutterClass()} aria-hidden="true" />}
              {renderedColumns.nonProdVersion && <th className={columnClass('nonProdVersion', 'non-prod-foundation-column non-prod-foundation-column-header')} style={{ width: '116px' }}>
                <div className="foundation-header-content">
                  <span className="foundation-version-label foundation-version-label--nonprod">Foundation {foundationVersion}</span>
                  <span className="version-heading-with-info">Non-Prod Version {renderFoundationInfoButton('Non-Prod')}</span>
                </div>
              </th>}
              {renderedColumns.nonProdVersion && renderedColumns.hfVersion && <th className={gutterClass()} aria-hidden="true" />}
              {renderedColumns.hfVersion && <th className={columnClass('hfVersion', 'hf-foundation-column hf-foundation-column-header')} style={{ width: '110px' }}>
                <div className="foundation-header-content">
                  <span className="foundation-version-label foundation-version-label--hf">Foundation {foundationVersion}</span>
                  <span className="version-heading-with-info">HF Version {renderFoundationInfoButton('HF')}</span>
                </div>
              </th>}
              {renderedColumns.lastDeployed && <th className={columnClass('lastDeployed', 'column-secondary')} style={{ width: '120px' }}>Last Deployed</th>}
              {renderedColumns.buildVersion && <th className={columnClass('buildVersion')} style={{ width: '150px' }}>Published Build</th>}
              {renderedColumns.status && <th className={columnClass('status')} style={{ width: '140px' }}>
                <div className="status-column-heading">
                  <span>Status</span>
                  <StatusValueFilter statusFilter={statusFilter} setStatusFilter={setStatusFilter} isOpen={isStatusMenuOpen} setIsOpen={setIsStatusMenuOpen} />
                </div>
              </th>}
              {renderedColumns.actions && <th className={columnClass('actions', 'sticky-actions')} style={{ width: '48px', textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <tr key={repo.id}>
                  {/* Repository */}
                  {renderedColumns.repository && <td className={columnClass('repository', 'sticky-repository')} style={{ width: '170px' }}>
                    <div className="repo-name-cell">
                      <div className="repo-icon-wrap">
                        <FolderGit2 size={12} />
                      </div>
                      <span style={{ fontSize: '11.5px' }}>{repo.name}</span>
                    </div>
                  </td>}

                  {/* Prod Version */}
                  {renderedColumns.prodVersion && <td className={columnClass('prodVersion', 'foundation-column')} style={{ width: '112px' }}>
                    <span className="version-text">{repo.prodVersion}</span>
                  </td>}
                  {renderedColumns.prodVersion && hasLaterVersionColumn && <td className={gutterClass()} aria-hidden="true" />}

                  {/* Non-Prod Version */}
                  {renderedColumns.nonProdVersion && <td className={columnClass('nonProdVersion', 'non-prod-foundation-column')} style={{ width: '116px' }}>
                    <span className="version-text hf-version-text">{repo.nonProdVersion}</span>
                  </td>}
                  {renderedColumns.nonProdVersion && renderedColumns.hfVersion && <td className={gutterClass()} aria-hidden="true" />}

                  {/* Hotfix Version */}
                  {renderedColumns.hfVersion && <td className={columnClass('hfVersion', 'hf-foundation-column')} style={{ width: '110px' }}>
                    <span
                      className="version-text"
                      style={{
                        color: getNonProdColor(repo.versionStatus),
                        fontWeight: repo.versionStatus !== 'match' ? 600 : 400
                      }}
                    >
                      {repo.hfVersion}
                    </span>
                  </td>}

                  {/* Last Deployed */}
                  {renderedColumns.lastDeployed && <td className={columnClass('lastDeployed', 'column-secondary')} style={{ color: '#475569', fontSize: '11px', width: '120px' }}>
                    {repo.lastDeployed}
                  </td>}

                  {/* Published build version, its build number, and foundation baseline */}
                  {renderedColumns.buildVersion && <td className={columnClass('buildVersion')} style={{ width: '150px' }}>
                    <span className="published-build-version">{repo.publishedVersion || repo.nonProdVersion}</span>
                    <small className="published-build-meta">Build {repo.jenkinsBuild} · Foundation {repo.buildFoundationVersion || foundationVersion}</small>
                  </td>}

                  {/* Status */}
                  {renderedColumns.status && <td className={columnClass('status')} style={{ width: '140px' }}>
                    {renderStatusPill(repo.status)}
                  </td>}

                  {/* Actions */}
                  {renderedColumns.actions && <td className={columnClass('actions', 'sticky-actions')} style={{ textAlign: 'center', width: '48px' }}>
                    <button 
                      className="action-menu-btn" 
                      onClick={() => onActionClick && onActionClick(repo)}
                      title={`Manage ${repo.name}`}
                      aria-label="Actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={Math.max(1, renderedColumnCount + Number(renderedColumns.prodVersion && hasLaterVersionColumn) + Number(renderedColumns.nonProdVersion && renderedColumns.hfVersion))} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  {visibleColumnCount ? 'No repositories found matching the filter criteria.' : 'Select at least one column to display.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {isComponentScanning && <div className="component-scan-overlay" key={componentScanCycle} aria-hidden="true" />}
      </div>
      {pipelineInfo && createPortal(
        <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setPipelineInfo(null)}>
          <section className="modal-dialog pipeline-info-dialog" role="dialog" aria-modal="true" aria-labelledby="pipeline-info-title">
            <header className="modal-header">
              <div>
                <div className="modal-title" id="pipeline-info-title">Foundation pipeline details</div>
                <div className="pipeline-info-subtitle">{pipelineInfo} column · Release {releaseName}</div>
              </div>
              <button className="modal-close-btn" onClick={() => setPipelineInfo(null)} aria-label="Close pipeline details"><X size={18} /></button>
            </header>
            <div className="modal-body">
              <div className="pipeline-run-details">
                <div><span>Final foundation version</span><strong>{foundationPipeline?.finalVersion || foundationVersion}</strong></div>
                <div><span>Pipeline run by</span><strong>{foundationPipeline?.runBy || 'Not recorded'}</strong></div>
                <div><span>Timestamp</span><strong>{foundationPipeline?.runAt || 'Not recorded'}</strong></div>
              </div>
              <h3 className="pipeline-builds-heading">Jenkins build numbers</h3>
              <div className="pipeline-build-list">
                {repositories.map((repo) => (
                  <div className="pipeline-build-row" key={repo.id}>
                    <span>{repo.name}</span>
                    <a
                      href={repo.jenkinsUrl}
                      className="build-link"
                      onClick={(event) => {
                        event.preventDefault();
                        alert(`Opening Jenkins build ${repo.jenkinsBuild} logs for ${repo.name}`);
                      }}
                    >{repo.jenkinsBuild}</a>
                  </div>
                ))}
              </div>
            </div>
            <footer className="modal-footer"><button className="btn-secondary" onClick={() => setPipelineInfo(null)}>Close</button></footer>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
