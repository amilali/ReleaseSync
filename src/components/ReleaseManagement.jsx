import React, { useEffect } from 'react';
import { CalendarDays, Check, CircleDot, GitBranch, Layers3, Rocket, Save, Plus } from 'lucide-react';

const STATUSES = ['Planning', 'In Progress', 'Ready', 'Released'];

function formatDate(date) {
  if (!date) return 'Choose a target date';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ReleaseManagement({ plan, plans = [], availableReleases = [], activePlanId, onSelectPlan, onCreateRelease, onChange, repositories = [], currentFoundationVersion, onSave }) {
  const selectedIds = plan.repositoryIds || [];
  const selectedRepos = repositories.filter((repo) => selectedIds.includes(repo.id));
  const [saved, setSaved] = React.useState(true);
  useEffect(() => setSaved(true), [activePlanId]);
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
  const isDuplicateName = plans.some((candidate) => candidate.id !== plan.id && candidate.targetRelease?.trim().toLowerCase() === plan.targetRelease?.trim().toLowerCase());

  return (
    <section className="release-planning-page" aria-label="Release management">
      <div className="release-management-toolbar">
        <label className="release-switcher-field">Manage release
          <select value={activePlanId} onChange={(event) => {
            const value = event.target.value;
            if (value.startsWith('existing:')) onCreateRelease?.(value.slice('existing:'.length));
            else onSelectPlan?.(value);
          }}>
            <optgroup label="Managed releases">
              {plans.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.targetRelease?.trim() || 'Untitled release'}</option>)}
            </optgroup>
            <optgroup label="Set up an existing release">
              {availableReleases.filter((name) => !plans.some((candidate) => candidate.targetRelease?.trim() === name)).map((name) => <option key={name} value={`existing:${name}`}>{name}</option>)}
            </optgroup>
          </select>
        </label>
        <button className="release-create-btn" type="button" onClick={onCreateRelease}><Plus size={14} />Create release</button>
      </div>
      <div className="release-plan-overview">
        <div className="release-plan-intro">
          <span className="release-eyebrow"><Rocket size={14} /> RELEASE PLAN</span>
          <h2>{plan.targetRelease || 'Name your target release'}</h2>
          <p>Set the release window, repository versions, and foundation baseline for this release.</p>
        </div>
        <div className="release-date-callout">
          <span className="release-date-icon"><CalendarDays size={17} /></span>
          <div><small>Target release date</small><strong>{formatDate(plan.targetDate)}</strong></div>
          <span className={`release-status-pill status-${(plan.status || 'Planning').toLowerCase().replace(' ', '-')}`}><CircleDot size={11} />{plan.status || 'Planning'}</span>
        </div>
      </div>

      <div className="release-plan-columns">
        <div className="release-plan-main">
          <section className="release-panel">
            <div className="release-panel-heading"><div><h3>Release details</h3><p>Define the target and current lifecycle stage.</p></div><CalendarDays size={17} /></div>
            <div className="release-form-grid">
              <label className="release-field release-field-wide">Target release name
                <input value={plan.targetRelease || ''} onChange={(event) => updatePlan({ ...plan, targetRelease: event.target.value })} placeholder="e.g. Release 2026.11" />
              </label>
              <label className="release-field">Target date
                <input type="date" value={plan.targetDate || ''} onChange={(event) => updatePlan({ ...plan, targetDate: event.target.value })} />
              </label>
              <label className="release-field">Foundation version override
                <input value={plan.finalFoundationVersion || ''} onChange={(event) => updatePlan({ ...plan, finalFoundationVersion: event.target.value })} placeholder="e.g. 1.316.000" />
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
            <div className="release-panel-heading"><div><h3>Repository versions <span className="release-count-badge">{selectedIds.length} in scope</span></h3><p>Review or override the published version for each repository.</p></div><Layers3 size={17} /></div>
            <div className="release-repository-list">
              {repositories.map((repo) => {
                const checked = selectedIds.includes(repo.id);
                return <div className={`release-repository-row ${checked ? 'is-selected' : ''}`} key={repo.id}>
                  <input id={`release-scope-${repo.id}`} type="checkbox" checked={checked} onChange={() => toggleRepository(repo.id)} />
                  <span className="release-repo-mark"><GitBranch size={14} /></span>
                  <label className="release-repo-name" htmlFor={`release-scope-${repo.id}`}><strong>{repo.name}</strong></label>
                  <input
                    className="release-repo-version-input"
                    aria-label={`Published version for ${repo.name}`}
                    value={plan.repositoryVersions?.[repo.id] ?? repo.publishedVersion ?? repo.nonProdVersion ?? ''}
                    onChange={(event) => updatePlan({ ...plan, repositoryVersions: { ...plan.repositoryVersions, [repo.id]: event.target.value } })}
                  />
                  <span className={`release-repo-state state-${(repo.status || 'Review').toLowerCase().replace(' ', '-')}`}>{repo.status}</span>
                </div>;
              })}
              {!repositories.length && <p className="release-empty">No repositories are available to add.</p>}
            </div>
          </section>
        </div>

        <aside className="release-plan-rail">
          <section className="release-panel release-snapshot-panel">
            <div className="release-panel-heading"><div><h3>Plan snapshot</h3><p>Current release scope at a glance.</p></div></div>
            <div className="release-snapshot-row"><span>Target</span><strong>{plan.targetRelease || 'Not set'}</strong></div>
            <div className="release-snapshot-row"><span>Target date</span><strong>{formatDate(plan.targetDate)}</strong></div>
            <div className="release-snapshot-row"><span>Foundation version</span><strong>{plan.finalFoundationVersion || 'Not recorded'}</strong></div>
            <div className="release-snapshot-row"><span>Repositories</span><strong>{selectedIds.length} of {repositories.length}</strong></div>
            <div className="release-snapshot-row"><span>Ready in scope</span><strong>{selectedRepos.filter((repo) => ['Match', 'On Track'].includes(repo.status)).length}</strong></div>
            {isDuplicateName && <p className="release-validation-note">A release with this name already exists.</p>}
            <button className="release-primary-btn release-save-btn" type="button" onClick={savePlan} disabled={!plan.targetRelease?.trim() || !plan.targetDate || !plan.finalFoundationVersion?.trim() || isDuplicateName}>
              {saved ? <Check size={15} /> : <Save size={15} />}
              Save release plan
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
}
