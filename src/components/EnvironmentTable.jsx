import React, { useState, useMemo } from 'react';
import { 
  FolderGit2, 
  MoreHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Sparkles,
  Download
} from 'lucide-react';
import { downloadRepositoryManifest } from '../utils/exportRepositoryManifest';

export default function EnvironmentTable({ repositories, totalRepositories, foundationVersion, releaseName, searchQuery = '', onActionClick, onAIActivate }) {
  const [envFilter, setEnvFilter] = useState('All Environments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const filteredRepos = useMemo(() => {
    if (!repositories) return [];
    return repositories.filter((repo) => {
      const matchesEnv = envFilter === 'All Environments' || repo.environment === envFilter;
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

      return matchesEnv && matchesStatus && matchesSearch;
    });
  }, [repositories, envFilter, statusFilter, searchQuery]);

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
          <button
            className="table-ai-btn"
            type="button"
            onClick={onAIActivate}
            title="Open the AI Assistant for release analysis"
          >
            <Sparkles size={14} />
            <span>AI Assistant</span>
          </button>
        </div>

        <div className="table-filter-group">
          {/* Environments Filter */}
          <select 
            className="custom-select"
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            aria-label="Filter by Environment"
          >
            <option value="All Environments">All Environments</option>
            <option value="PROD">PROD</option>
            <option value="UAT">UAT</option>
            <option value="STAGING">STAGING</option>
          </select>

          {/* Statuses Filter */}
          <select 
            className="custom-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Review">Mismatch review</option>
            <option value="Match">Versions match</option>
            <option value="Investigate">Critical mismatch</option>
            <option value="On Track">Deployment in progress</option>
          </select>

        </div>
      </div>

      {/* Table Body with internal scroll */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th className="sticky-repository" style={{ width: '170px' }}>Repository</th>
              <th className="foundation-column foundation-column-header" style={{ width: '112px' }}>
                <div className="foundation-header-content">
                  <span className="foundation-version-label">Foundation {foundationVersion}</span>
                  <span>Prod Version</span>
                </div>
              </th>
              <th style={{ width: '96px' }}>Non-Prod Version</th>
              <th style={{ width: '86px' }}>HF Version</th>
              <th className="column-secondary" style={{ width: '80px' }}>Jenkins Build</th>
              <th className="column-secondary" style={{ width: '120px' }}>Last Deployed</th>
              <th style={{ width: '90px' }}>Change Order</th>
              <th style={{ width: '140px' }}>Status</th>
              <th className="sticky-actions" style={{ width: '48px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRepos.length > 0 ? (
              filteredRepos.map((repo) => (
                <tr key={repo.id}>
                  {/* Repository */}
                  <td className="sticky-repository">
                    <div className="repo-name-cell">
                      <div className="repo-icon-wrap">
                        <FolderGit2 size={12} />
                      </div>
                      <span style={{ fontSize: '11.5px' }}>{repo.name}</span>
                    </div>
                  </td>

                  {/* Prod Version */}
                  <td className="foundation-column">
                    <span className="version-text">{repo.prodVersion}</span>
                  </td>

                  {/* Hotfix Version */}
                  <td>
                    <span className="version-text hf-version-text">{repo.hfVersion}</span>
                  </td>

                  {/* Non-Prod Version */}
                  <td>
                    <span 
                      className="version-text" 
                      style={{ 
                        color: getNonProdColor(repo.versionStatus),
                        fontWeight: repo.versionStatus !== 'match' ? 600 : 400
                      }}
                    >
                      {repo.nonProdVersion}
                    </span>
                  </td>

                  {/* Jenkins Build */}
                  <td className="column-secondary">
                    <a 
                      href={repo.jenkinsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="build-link"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Opening Jenkins build ${repo.jenkinsBuild} logs for ${repo.name}`);
                      }}
                    >
                      {repo.jenkinsBuild}
                    </a>
                  </td>

                  {/* Last Deployed */}
                  <td className="column-secondary" style={{ color: '#475569', fontSize: '11px' }}>
                    {repo.lastDeployed}
                  </td>

                  {/* Change Order */}
                  <td>
                    <span style={{ fontWeight: 500, color: '#334155', fontSize: '11px' }}>
                      {repo.changeOrder}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    {renderStatusPill(repo.status)}
                  </td>

                  {/* Actions */}
                  <td className="sticky-actions" style={{ textAlign: 'center' }}>
                    <button 
                      className="action-menu-btn" 
                      onClick={() => onActionClick && onActionClick(repo)}
                      title={`Manage ${repo.name}`}
                      aria-label="Actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No repositories found matching the filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
