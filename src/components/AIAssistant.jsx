import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Maximize2,
  RotateCcw,
  X,
  GitCompareArrows,
  Send,
  ShieldCheck,
  Sparkles,
  Timer,
  Wrench,
  Square,
  Zap,
} from 'lucide-react';

const slashCommands = [
  {
    command: '/clear',
    label: 'Clear chat',
    icon: RotateCcw,
  },
];

const suggestedPrompts = [
  { icon: GitCompareArrows, label: 'Version drift', description: 'Compare PROD and non-PROD with Foundation.', prompt: 'Compare version drift with Foundation', kind: 'versions' },
  { icon: RotateCcw, label: 'Revert plan', description: 'Build a RelCur recovery manifest, then review deployment.', prompt: 'Create a revert plan', kind: 'rollback' },
  { icon: CalendarDays, label: 'Plan your upcoming release', description: 'Choose main or off-cycle and complete a preflight.', prompt: 'Plan my upcoming release', kind: 'planner' },
  { icon: ShieldCheck, label: 'Release readiness', description: 'See what is ready, blocked, or awaiting approval.', prompt: 'Summarize release readiness', kind: 'readiness' },
];

const emptyReleasePlan = {
  type: '',
  releaseName: '',
  plannedDate: '',
  selectedRepositories: [],
  acknowledgeExceptions: false,
  repository: '',
  currentProdVersion: '',
  targetVersion: '',
  reason: '',
  changeOrder: '',
};

const emptyRevertPlan = {
  mode: '',
  lastKnownGoodFoundation: '',
  selectedRepositories: [],
  targetVersions: {},
  reason: '',
  changeOrder: '',
};

const releaseVersionPattern = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/i;

function normalizeReleaseVersion(version) {
  return (version || '').trim().replace(/^v/i, '');
}

function getRevertPlanChecks(plan, repositories, foundationVersion) {
  if (plan.mode === 'foundation') {
    const targetValid = releaseVersionPattern.test(plan.lastKnownGoodFoundation.trim());
    return [
      { label: 'Last known good Foundation version is valid', valid: targetValid },
      { label: 'Foundation target differs from current version', valid: targetValid && normalizeReleaseVersion(plan.lastKnownGoodFoundation) !== normalizeReleaseVersion(foundationVersion) },
      { label: 'Recovery reason provided', valid: Boolean(plan.reason.trim()) },
      { label: 'Change order or incident reference provided', valid: Boolean(plan.changeOrder.trim()) },
    ];
  }

  const selectedRepositories = repositories.filter((repo) => plan.selectedRepositories.includes(repo.name));
  return [
    { label: 'At least one production repository selected', valid: selectedRepositories.length > 0 },
    { label: 'Current PROD versions available for selected repositories', valid: selectedRepositories.length > 0 && selectedRepositories.every((repo) => Boolean(repo.prodVersion)) },
    { label: 'Each revert target uses a valid version format', valid: selectedRepositories.length > 0 && selectedRepositories.every((repo) => releaseVersionPattern.test((plan.targetVersions[repo.name] || '').trim())) },
    { label: 'Each revert target differs from current PROD', valid: selectedRepositories.length > 0 && selectedRepositories.every((repo) => normalizeReleaseVersion(plan.targetVersions[repo.name]) !== normalizeReleaseVersion(repo.prodVersion)) },
    { label: 'Recovery reason provided', valid: Boolean(plan.reason.trim()) },
    { label: 'Change order or incident reference provided', valid: Boolean(plan.changeOrder.trim()) },
  ];
}

function getRelCurManifest(plan, repositories) {
  return repositories.map((repo) => {
    const selected = plan.mode === 'repositories' && plan.selectedRepositories.includes(repo.name);
    return {
      name: repo.name,
      current: repo.prodVersion || 'Not available',
      target: selected ? (plan.targetVersions[repo.name] || 'Target required') : (repo.prodVersion || 'Not available'),
      action: selected ? 'Revert selected repository' : 'Keep current PROD',
    };
  });
}

function getSimulatedFoundationVersion(version) {
  const match = normalizeReleaseVersion(version).match(/^(\d+)\.(\d+)\.(\d+)$/);
  return match ? `${match[1]}.${match[2]}.${Number(match[3]) + 1}` : 'Awaiting RelCur build result';
}

function getReleasePlanChecks(plan, repositories) {
  if (plan.type === 'main') {
    const selectedRepositories = repositories.filter((repo) => plan.selectedRepositories.includes(repo.name));
    const flaggedRepositories = selectedRepositories.filter((repo) => ['Review', 'Investigate'].includes(repo.status));
    const plannedDate = plan.plannedDate ? new Date(`${plan.plannedDate}T00:00:00`) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      { label: 'Release name or version provided', valid: Boolean(plan.releaseName.trim()) },
      { label: 'Planned date is today or later', valid: Boolean(plannedDate && plannedDate >= today) },
      { label: 'At least one repository selected', valid: plan.selectedRepositories.length > 0 },
      { label: 'PROD and non-PROD baselines available for each selected repository', valid: selectedRepositories.length > 0 && selectedRepositories.every((repo) => Boolean(repo.prodVersion && repo.nonProdVersion)) },
      { label: flaggedRepositories.length ? 'Flagged version exceptions acknowledged' : 'No flagged version exceptions in scope', valid: flaggedRepositories.length === 0 || plan.acknowledgeExceptions },
    ];
  }

  const selectedRepository = repositories.find((repo) => repo.name === plan.repository);
  const targetVersionValid = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/i.test(plan.targetVersion.trim());
  const normalizedTarget = plan.targetVersion.trim().replace(/^v/i, '');
  const normalizedProd = plan.currentProdVersion.trim().replace(/^v/i, '');
  return [
    { label: 'Repository selected', valid: Boolean(selectedRepository) },
    { label: 'Current PROD version loaded from dashboard', valid: Boolean(plan.currentProdVersion) },
    { label: 'Target version uses a valid format (for example, 2.4.1)', valid: targetVersionValid },
    { label: 'Target version differs from current PROD', valid: Boolean(normalizedTarget) && normalizedTarget !== normalizedProd },
    { label: 'Off-cycle reason provided', valid: Boolean(plan.reason.trim()) },
    { label: 'Change order or approval reference provided', valid: Boolean(plan.changeOrder.trim()) },
  ];
}

function createReleasePlanAnswer(plan, repositories, foundationVersion) {
  if (plan.type === 'main') {
    const selectedRepositories = repositories.filter((repo) => plan.selectedRepositories.includes(repo.name));
    const selectedBaselines = selectedRepositories.map((repo) => `${repo.name} (PROD ${repo.prodVersion}; non-PROD ${repo.nonProdVersion}; status ${repo.status})`);
    return {
      title: `Main release brief · ${plan.releaseName}`,
      summary: `Preflight passed for ${plan.releaseName}, planned for ${plan.plannedDate}. The brief is ready for AI readiness and risk analysis.`,
      points: [`Repository baselines: ${selectedBaselines.join('; ')}.`, `Foundation baseline: ${foundationVersion}.`],
      source: 'Release planner preflight · current dashboard data',
    };
  }

  const repository = repositories.find((repo) => repo.name === plan.repository);
  return {
    title: `Off-cycle brief · ${plan.repository}`,
    summary: `Preflight passed. Current PROD is ${plan.currentProdVersion}; proposed target is ${plan.targetVersion}. Review the version difference and release reason before planning.`,
    points: [
      `Version change: PROD ${plan.currentProdVersion} → target ${plan.targetVersion}.`,
      `Reason: ${plan.reason.trim()}.`,
      `Change order / approval: ${plan.changeOrder.trim()}.`,
      repository?.status ? `Current repository status: ${repository.status}.` : 'Review repository status before approval.',
    ],
    repo: repository,
    source: 'Release planner preflight · current dashboard data',
  };
}

function ReleasePlanner({ step, plan, repositories, checks, planIsValid, setStep, updatePlan, selectType, selectRepository, submit }) {
  const selectedRepository = repositories.find((repo) => repo.name === plan.repository);
  const progress = `${step + 1} of 3`;
  const toggleRepository = (name, checked) => {
    updatePlan('selectedRepositories', checked
      ? [...new Set([...plan.selectedRepositories, name])]
      : plan.selectedRepositories.filter((item) => item !== name));
    updatePlan('acknowledgeExceptions', false);
  };
  const flaggedRepositories = repositories.filter((repo) => plan.selectedRepositories.includes(repo.name) && ['Review', 'Investigate'].includes(repo.status));

  return (
    <div className="ai-planner">
      <div className="ai-planner-topline">
        <span>RELEASE PLANNER</span>
        <span>STEP {progress}</span>
      </div>
      <div className="ai-planner-progress" aria-label={`Step ${progress}`}><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>

      {step === 0 ? (
        <>
          <h3>Plan your upcoming release</h3>
          <p className="ai-planner-intro">First, choose the release path. I’ll ask for the details needed to preflight the plan.</p>
          <h4>Which release are you planning?</h4>
          <div className="ai-plan-type-options">
            <button type="button" onClick={() => selectType('main')}>
              <span className="ai-plan-option-icon"><CalendarDays size={19} /></span>
              <span><strong>Main release</strong><small>Plan a scheduled release across one or more repositories.</small></span>
              <ArrowUpRight size={15} />
            </button>
            <button type="button" onClick={() => selectType('offcycle')}>
              <span className="ai-plan-option-icon"><Zap size={19} /></span>
              <span><strong>Off-cycle release</strong><small>Plan an exception for a specific repository and version.</small></span>
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Back to quick starts</button>
        </>
      ) : step === 1 ? (
        <>
          <button className="ai-planner-back" type="button" onClick={() => setStep(0)}><ArrowLeft size={14} /> Change release type</button>
          <h3>{plan.type === 'main' ? 'Main release details' : 'Off-cycle release details'}</h3>
          <p className="ai-planner-intro">Fill in the required details. The next step checks for missing information before the AI brief is prepared.</p>

          {plan.type === 'main' ? (
            <div className="ai-planner-fields">
              <label className="ai-planner-field">Release name or target version <span>Required</span>
                <input value={plan.releaseName} onChange={(event) => updatePlan('releaseName', event.target.value)} placeholder="e.g., Release 2026.12" />
              </label>
              <label className="ai-planner-field">Planned deployment date <span>Required</span>
                <input type="date" value={plan.plannedDate} onChange={(event) => updatePlan('plannedDate', event.target.value)} />
              </label>
              <fieldset className="ai-planner-repositories">
                <legend>Repositories in scope <span>Choose one or more</span></legend>
                <div className="ai-planner-repo-list">
                  {repositories.map((repo) => (
                    <label key={repo.name}>
                      <input type="checkbox" checked={plan.selectedRepositories.includes(repo.name)} onChange={(event) => toggleRepository(repo.name, event.target.checked)} />
                      <span>{repo.name}<small>PROD {repo.prodVersion || 'not available'}</small></span>
                    </label>
                  ))}
                  {repositories.length === 0 && <p>No repositories are available in the current dashboard context.</p>}
                </div>
              </fieldset>
              {flaggedRepositories.length > 0 && <div className="ai-planner-exceptions">
                <strong><CircleAlert size={14} /> Version exceptions in scope</strong>
                <p>Review these repository differences before the main release plan:</p>
                <ul>{flaggedRepositories.map((repo) => <li key={repo.name}>{repo.name} · {repo.status} · PROD {repo.prodVersion} / non-PROD {repo.nonProdVersion}</li>)}</ul>
                <label><input type="checkbox" checked={plan.acknowledgeExceptions} onChange={(event) => updatePlan('acknowledgeExceptions', event.target.checked)} /> I’ve reviewed these exceptions and will account for them in the release.</label>
              </div>}
            </div>
          ) : (
            <div className="ai-planner-fields">
              <label className="ai-planner-field">Repository <span>Required</span>
                <select value={plan.repository} onChange={(event) => selectRepository(event.target.value)}>
                  <option value="">Choose a repository</option>
                  {repositories.map((repo) => <option key={repo.name} value={repo.name}>{repo.name}</option>)}
                </select>
              </label>
              <div className="ai-planner-baseline"><span>Current PROD baseline</span><strong>{plan.currentProdVersion || 'Select a repository to load its PROD version'}</strong><small>Loaded from the current dashboard snapshot.</small></div>
              <label className="ai-planner-field">Proposed target version <span>Required</span>
                <input value={plan.targetVersion} onChange={(event) => updatePlan('targetVersion', event.target.value)} placeholder="e.g., 2.4.1" />
              </label>
              <label className="ai-planner-field">Why is this release needed? <span>Required</span>
                <textarea value={plan.reason} onChange={(event) => updatePlan('reason', event.target.value)} placeholder="Describe the fix, risk, or customer need." rows={2} />
              </label>
              <label className="ai-planner-field">Change order or approval reference <span>Required</span>
                <input value={plan.changeOrder} onChange={(event) => updatePlan('changeOrder', event.target.value)} placeholder="e.g., CHG-123456" />
              </label>
            </div>
          )}

          <div className="ai-planner-actions">
            <button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Cancel</button>
            <button className="ai-planner-primary" type="button" onClick={() => setStep(2)}>Review plan <ArrowUpRight size={15} /></button>
          </div>
        </>
      ) : (
        <>
          <button className="ai-planner-back" type="button" onClick={() => setStep(1)}><ArrowLeft size={14} /> Edit details</button>
          <h3>Preflight your release brief</h3>
          <p className="ai-planner-intro">Check the required details before preparing the brief for AI analysis.</p>
          <div className="ai-plan-review-card">
            <span>{plan.type === 'main' ? 'MAIN RELEASE' : 'OFF-CYCLE RELEASE'}</span>
            {plan.type === 'main' ? <>
              <strong>{plan.releaseName || 'Release name not provided'}</strong>
              <p>Planned date · {plan.plannedDate || 'Not provided'}</p>
              <p>Repositories · {plan.selectedRepositories.length ? plan.selectedRepositories.join(', ') : 'None selected'}</p>
              {flaggedRepositories.length > 0 && <p>Flagged version exceptions · {flaggedRepositories.map((repo) => repo.name).join(', ')} · {plan.acknowledgeExceptions ? 'acknowledged' : 'acknowledgment required'}</p>}
            </> : <>
              <strong>{plan.repository || 'Repository not selected'}</strong>
              <p>Current PROD · {plan.currentProdVersion || 'Not available'}</p>
              <p>Proposed target · {plan.targetVersion || 'Not provided'}</p>
              {plan.currentProdVersion && plan.targetVersion && <p className="ai-plan-version-delta">Version difference · {plan.currentProdVersion} → {plan.targetVersion}</p>}
              <p>Reason · {plan.reason || 'Not provided'}</p>
              <p>Change order · {plan.changeOrder || 'Not provided'}</p>
            </>}
          </div>
          <div className="ai-plan-checklist" aria-label="Release preflight checks">
            {checks.map((check) => <div className={check.valid ? 'is-valid' : 'is-missing'} key={check.label}>{check.valid ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}<span>{check.label}</span></div>)}
          </div>
          <p className="ai-planner-backend-note">Prototype preflight uses dashboard data. A connected backend should recheck live PROD versions, repository health, and approval status before sending this brief for AI analysis.</p>
          <div className="ai-planner-actions">
            <button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Cancel</button>
            <button className="ai-planner-primary" type="button" disabled={!planIsValid} onClick={submit}><Sparkles size={15} /> Prepare AI brief</button>
          </div>
        </>
      )}
    </div>
  );
}

function RevertPlanner({ step, plan, repositories, checks, planIsValid, updatePlan, setStep, selectMode, startRun, runStatus, runStage, resolveRun, foundationVersion }) {
  const manifest = getRelCurManifest(plan, repositories);
  const simulatedFoundation = plan.mode === 'foundation'
    ? plan.lastKnownGoodFoundation
    : getSimulatedFoundationVersion(foundationVersion);
  const stages = ['Validate selected versions and recovery reference', 'Compose RelCur manifest from PROD baselines', 'Build preview and capture Foundation version'];
  return <div className="ai-planner ai-revert-planner">
    <div className="ai-planner-topline"><span>REVERT PLANNER</span><span>STEP {step + 1} OF 4</span></div>
    <div className="ai-planner-progress"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
    {step === 0 ? <>
      <h3>Plan a controlled revert</h3>
      <p className="ai-planner-intro">Choose what needs restoring. We’ll keep unaffected production repositories at their current versions and pause for your approval before deployment.</p>
      <h4>What are you reverting?</h4>
      <div className="ai-plan-type-options">
        <button type="button" onClick={() => selectMode('foundation')}><span className="ai-plan-option-icon"><RotateCcw size={19} /></span><span><strong>Restore a Foundation build</strong><small>Use a previously verified Foundation version from RelCur.</small></span><ArrowUpRight size={15} /></button>
        <button type="button" onClick={() => selectMode('repositories')}><span className="ai-plan-option-icon"><GitCompareArrows size={19} /></span><span><strong>Revert selected repositories</strong><small>Set old versions for selected repositories; keep all others on current PROD.</small></span><ArrowUpRight size={15} /></button>
      </div>
      <button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Back to quick starts</button>
    </> : step === 1 ? <>
      <button className="ai-planner-back" type="button" onClick={() => setStep(0)}><ArrowLeft size={14} /> Change revert scope</button>
      <h3>{plan.mode === 'foundation' ? 'Foundation restore details' : 'Repository revert details'}</h3>
      <p className="ai-planner-intro">Provide the recovery target and traceable reason. Dashboard values are a starting point and must be checked against RelCur before any real build.</p>
      <div className="ai-planner-fields">
        {plan.mode === 'foundation' ? <>
          <div className="ai-planner-baseline"><span>Current Foundation version</span><strong>{foundationVersion}</strong><small>Dashboard snapshot; verify the last successful RelCur build.</small></div>
          <label className="ai-planner-field">Last known good Foundation version <span>Required</span><input value={plan.lastKnownGoodFoundation} onChange={(e) => updatePlan('lastKnownGoodFoundation', e.target.value)} placeholder="e.g., 3.8.4" /></label>
        </> : <fieldset className="ai-planner-repositories ai-revert-repositories"><legend>Select repositories to revert <span>Unselected repositories stay on PROD</span></legend>
          <div className="ai-revert-repo-list">{repositories.map((repo) => {
            const selected = plan.selectedRepositories.includes(repo.name);
            return <div className="ai-revert-repo-row" key={repo.name}><label><input type="checkbox" checked={selected} onChange={(e) => updatePlan('selectedRepositories', e.target.checked ? [...new Set([...plan.selectedRepositories, repo.name])] : plan.selectedRepositories.filter((name) => name !== repo.name))} /><span><strong>{repo.name}</strong><small>Current PROD · {repo.prodVersion || 'not available'}</small></span></label>{selected && <label className="ai-planner-field">Revert target version<input value={plan.targetVersions[repo.name] || ''} onChange={(e) => updatePlan('targetVersions', { ...plan.targetVersions, [repo.name]: e.target.value })} placeholder="Previously deployed version" /></label>}</div>;
          })}{repositories.length === 0 && <p>No repositories are available in this dashboard context.</p>}</div>
        </fieldset>}
        <label className="ai-planner-field">Reason for recovery <span>Required</span><textarea value={plan.reason} onChange={(e) => updatePlan('reason', e.target.value)} placeholder="Incident, regression, or release issue being addressed." rows={2} /></label>
        <label className="ai-planner-field">Change order or incident reference <span>Required</span><input value={plan.changeOrder} onChange={(e) => updatePlan('changeOrder', e.target.value)} placeholder="e.g., INC-123456 or CHG-123456" /></label>
      </div>
      <div className="ai-planner-actions"><button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Cancel</button><button className="ai-planner-primary" type="button" onClick={() => setStep(2)}>Review RelCur plan <ArrowUpRight size={15} /></button></div>
    </> : step === 2 ? <>
      <button className="ai-planner-back" type="button" onClick={() => setStep(1)}><ArrowLeft size={14} /> Edit recovery details</button>
      <h3>Review the recovery manifest</h3>
      <p className="ai-planner-intro">Confirm the targets before the simulated RelCur workflow. Selected rows use your old version; every other repository remains on its current PROD version.</p>
      <div className="ai-plan-review-card"><span>{plan.mode === 'foundation' ? 'FOUNDATION RESTORE' : 'SELECTED REPOSITORY REVERT'}</span><strong>{plan.mode === 'foundation' ? `Foundation ${plan.lastKnownGoodFoundation || 'target required'}` : `${plan.selectedRepositories.length} selected · ${repositories.length - plan.selectedRepositories.length} kept at PROD`}</strong><p>Recovery reason · {plan.reason || 'Not provided'}</p><p>Change / incident · {plan.changeOrder || 'Not provided'}</p></div>
      {plan.mode === 'repositories' && <div className="ai-revert-manifest-wrap"><table className="ai-revert-manifest"><thead><tr><th>Repository</th><th>Current PROD</th><th>RelCur target</th><th>Action</th></tr></thead><tbody>{manifest.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.current}</td><td>{row.target}</td><td>{row.action}</td></tr>)}</tbody></table></div>}
      <div className="ai-plan-checklist">{checks.map((check) => <div className={check.valid ? 'is-valid' : 'is-missing'} key={check.label}>{check.valid ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}<span>{check.label}</span></div>)}</div>
      <p className="ai-planner-backend-note">Backend placeholder: validate live PROD and last-successful RelCur data, assemble and submit the manifest, retrieve the actual Foundation build version, then require an authorized human approval before deployment.</p>
      <div className="ai-planner-actions"><button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Cancel</button><button className="ai-planner-primary" type="button" disabled={!planIsValid} onClick={startRun}><Sparkles size={15} /> Preview recovery</button></div>
    </> : <>
      <h3>{runStatus === 'running' ? 'Preparing recovery preview' : runStatus === 'awaiting-approval' ? 'Human approval required' : runStatus === 'approved' ? 'Demo approval recorded' : runStatus === 'declined' ? 'Recovery declined' : 'Recovery preview'}</h3>
      <p className="ai-planner-intro">{runStatus === 'awaiting-approval' ? 'Review the proposed Foundation version and scope. No deployment starts until an authorized person approves.' : runStatus === 'approved' ? 'Approval is recorded in this UI demo only. No pipeline or deployment was triggered.' : runStatus === 'declined' ? 'The recovery was declined in this UI demo. No pipeline or deployment was triggered.' : 'The local prototype is walking through the recovery checks. No pipeline or deployment is connected.'}</p>
      <div className="ai-revert-run-steps">{stages.map((label, index) => <div key={label} className={index < runStage ? 'is-done' : index === runStage && runStatus === 'running' ? 'is-active' : ''}>{index < runStage || runStatus !== 'running' && runStatus !== 'idle' ? <CheckCircle2 size={16} /> : <span className="ai-revert-run-dot" />}<span>{label}</span></div>)}</div>
      {runStatus === 'awaiting-approval' || runStatus === 'approved' || runStatus === 'declined' ? <div className="ai-revert-approval"><span>SIMULATED BUILD RESULT</span><strong>Foundation {simulatedFoundation}</strong><p>{plan.mode === 'foundation' ? `Restore target · Foundation ${plan.lastKnownGoodFoundation}` : `RelCur manifest · ${plan.selectedRepositories.length} repositories reverted; ${repositories.length - plan.selectedRepositories.length} retain current PROD`}</p><p>Reference · {plan.changeOrder} · {plan.reason}</p><small>Demo only: verify actual RelCur build output and deployment target in the connected backend.</small>{runStatus === 'awaiting-approval' && <div className="ai-planner-actions"><button className="ai-planner-cancel" type="button" onClick={() => resolveRun(false)}>Decline</button><button className="ai-planner-primary" type="button" onClick={() => resolveRun(true)}><ShieldCheck size={15} /> Approve demo deployment</button></div>}</div> : null}
      {(runStatus === 'approved' || runStatus === 'declined') && <button className="ai-planner-cancel" type="button" onClick={() => setStep(null)}>Back to quick starts</button>}
    </>}
  </div>;
}

function analyzePrompt(prompt, repositories, metrics, readiness, foundationVersion, releaseName) {
  const normalized = prompt.toLowerCase();
  const mismatches = repositories.filter((repo) => ['Review', 'Investigate'].includes(repo.status));
  const highestRisk = repositories.find((repo) => repo.status === 'Investigate');

  // Revert plans compare every listed non-PROD version with PROD and retain rows for human review.
  if (/revert|rollback|roll back/.test(normalized)) {
    const revertRows = repositories.map((repo) => ({
      name: repo.name,
      current: repo.nonProdVersion,
      target: repo.prodVersion,
      status: repo.nonProdVersion === repo.prodVersion ? 'Already aligned' : 'Revert to PROD version',
      repo,
    }));
    const markdown = [
      '| Repository | Current non-PROD | Proposed revert target | Action |',
      '| --- | --- | --- | --- |',
      ...revertRows.map((row) => `| ${row.name} | \`${row.current}\` | \`${row.target}\` | ${row.status} |`),
    ].join('\n');
    return {
      title: 'Revert plan · human review required',
      summary: `Here are the non-PROD versions for ${releaseName}. Proposed targets match each repository’s current PROD version; confirm the scope and target versions with Release Support before applying a revert.`,
      markdown,
      points: [],
      revertRows,
      handoff: true,
      source: `${releaseName} · repository PROD and non-PROD versions`,
    };
  }
  const mentionedRepo = repositories.find((repo) => normalized.includes(repo.name.toLowerCase()));

  if (mentionedRepo) {
    const statusLabel = mentionedRepo.status === 'Investigate' ? 'Critical mismatch'
      : mentionedRepo.status === 'Review' ? 'Mismatch review'
        : mentionedRepo.status === 'Match' ? 'Versions match' : 'Deployment in progress';
    return {
      title: mentionedRepo.name,
      summary: `${statusLabel}. PROD is ${mentionedRepo.prodVersion}; non-PROD is ${mentionedRepo.nonProdVersion}${mentionedRepo.hfVersion ? `; HF is ${mentionedRepo.hfVersion}` : ''}.`,
      points: [
        mentionedRepo.changeOrder ? `Change order: ${mentionedRepo.changeOrder}.` : `Foundation baseline: ${foundationVersion}.`,
        mentionedRepo.status === 'Investigate' || mentionedRepo.status === 'Review'
          ? 'Review the version difference before release sign-off.'
          : 'No version review is currently flagged for this repository.',
      ],
      repo: mentionedRepo,
      source: `${releaseName} · Repository status`,
    };
  }

  if (/specific repository|analyze a repository/.test(normalized)) {
    return {
      title: 'Choose a repository to analyze',
      summary: 'Tell me the repository name and I’ll review its PROD, non-PROD, and HF versions, current status, related change order, and release risk.',
      points: ['For example: “Analyze Claims Gateway” or “What is the release risk for Agency API?”'],
      source: `${releaseName} · Repository status`,
    };
  }

  if (/readiness|ready|block|release summary|sign.?off/.test(normalized)) {
    const blocked = readiness.breakdown.find((item) => item.status === 'Blocked')?.count ?? 0;
    const needsReview = readiness.breakdown.find((item) => item.status === 'Needs Review')?.count ?? 0;
    return {
      title: 'Release readiness snapshot',
      summary: `${metrics.onTrack.value} of ${metrics.totalRepositories.value} repositories are ready (${metrics.onTrack.percentage}%). ${blocked} items are blocked and ${needsReview} need review in the release checklist.`,
      points: [
        `${metrics.pendingChangeOrders.value} change orders are awaiting approval.`,
        `${metrics.versionDiscrepancies.value} version discrepancies remain open.`,
        'Review blocked checklist items before confirming release readiness.',
      ],
      repo: highestRisk,
    };
  }

  if (/version|foundation|drift|mismatch|differ|compare/.test(normalized)) {
    return {
      title: 'Version drift against the release baseline',
      summary: `${mismatches.length} listed repositories have a version difference requiring attention. Foundation baseline: ${foundationVersion}.`,
      points: mismatches.map((repo) => `${repo.name}: PROD ${repo.prodVersion} · non-PROD ${repo.nonProdVersion} (${repo.status === 'Investigate' ? 'investigate' : 'review'})`),
      repo: highestRisk || mismatches[0],
    };
  }

  if (/change order|approval|approvals|cab/.test(normalized)) {
    const pending = repositories.filter((repo) => ['Review', 'Investigate'].includes(repo.status));
    return {
      title: 'Change governance to review',
      summary: `${metrics.pendingChangeOrders.value} change orders are awaiting approval. The listed version exceptions below may need to be resolved or covered by an approved change order.`,
      points: pending.map((repo) => `${repo.changeOrder} · ${repo.name} · ${repo.status === 'Investigate' ? 'critical mismatch' : 'mismatch review'}`),
      repo: highestRisk || pending[0],
    };
  }

  return {
    title: 'Release overview',
    summary: `${metrics.onTrack.value} of ${metrics.totalRepositories.value} repositories are ready. I found ${mismatches.length} version differences in the listed repositories; ${highestRisk?.name || 'no repository'} is the highest-priority review.`,
    points: [
      `Foundation baseline: ${foundationVersion}.`,
      `${metrics.pendingChangeOrders.value} change orders are awaiting approval.`,
      `Release readiness is ${metrics.onTrack.percentage}%.`,
    ],
    repo: highestRisk,
  };
}

// Safe, dependency-free rendering for the inline Markdown and tables used by assistant answers.
function renderInlineMarkdown(text) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

function MarkdownContent({ content }) {
  const lines = content.split('\n');
  const blocks = [];
  for (let index = 0; index < lines.length;) {
    if (lines[index].trim().startsWith('|')) {
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        const cells = lines[index].trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      blocks.push(<div className="ai-markdown-table-wrap" key={`table-${index}`}><table className="ai-markdown-table"><thead><tr>{(rows[0] || []).map((cell, cellIndex) => <th key={cellIndex}>{renderInlineMarkdown(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInlineMarkdown(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const line = lines[index++];
    if (line.trim()) blocks.push(<p key={`line-${index}`}>{renderInlineMarkdown(line)}</p>);
  }
  return <div className="ai-markdown-content">{blocks}</div>;
}

// Map prompt intent to the visible run trace and demo approval-gated operations.
function getAgentSteps(prompt) {
  const text = prompt.toLowerCase();
  const tools = /deploy|deployment|publish|provision|delete|remove|execute|run migration|finalize release/.test(text)
    ? [{ name: 'execute_release_operation', detail: 'Performing a release operation with external impact', requiresApproval: true }]
    : /version|foundation|drift|mismatch|compare|revert|rollback|roll back/.test(text)
    ? [{ name: 'compare_release_versions', detail: 'Comparing repository versions with the Foundation baseline' }]
    : /approval|change order|cab/.test(text)
      ? [{ name: 'list_pending_change_orders', detail: 'Checking approvals and linked repository exceptions' }]
      : /readiness|ready|block|sign.?off/.test(text)
        ? [{ name: 'get_release_readiness', detail: 'Reading checklist status and release metrics' }]
        : [{ name: 'get_release_overview', detail: 'Loading release metrics and repository status' }];
  return [
    { label: 'Understand request', detail: 'Interpreting your release question' },
    { label: 'Plan analysis', detail: 'Selecting the relevant dashboard data' },
    ...tools.map((tool) => ({ label: 'Use dashboard tool', ...tool })),
    { label: 'Synthesize findings', detail: 'Preparing a concise release summary' },
  ];
}

// Summarize the interpreted action and target before showing the demo approval decision.
function describeApprovalOperation(question, repositories, releaseName) {
  const normalized = question.toLowerCase();
  const repo = repositories.find((item) => normalized.includes(item.name.toLowerCase()));
  const action = /deploy|deployment/.test(normalized) ? 'Deploy release' : /publish/.test(normalized) ? 'Publish release'
    : /migration/.test(normalized) ? 'Run migration' : /delete|remove/.test(normalized) ? 'Remove resource'
      : /provision/.test(normalized) ? 'Provision resource' : /finalize/.test(normalized) ? 'Finalize release'
        : 'Run requested operation';
  const environment = /production|prod\b/.test(normalized) ? 'Production'
    : /non.?prod|staging|test/.test(normalized) ? 'Non-production' : null;
  return {
    action,
    target: [repo?.name, environment, !repo && releaseName].filter(Boolean).join(' · ') || 'Release environment',
    impact: `Would ${action.toLowerCase()}${repo ? ` for ${repo.name}` : ` for ${releaseName}`}${environment ? ` in ${environment}` : ''}.`,
  };
}

export default function AIAssistant({ repositories, metrics, readiness, foundationVersion, releaseName, initialPrompt = '', onInitialPromptConsumed, onReview, input, setInput, messages, setMessages, presentation = 'page', onFullScreen, onClose }) {
  const [thinkingId, setThinkingId] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [handoffDraft, setHandoffDraft] = useState(null);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [isSlashDismissed, setIsSlashDismissed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [releasePlannerStep, setReleasePlannerStep] = useState(null);
  const [releasePlan, setReleasePlan] = useState({ ...emptyReleasePlan, selectedRepositories: [] });
  const [revertPlannerStep, setRevertPlannerStep] = useState(null);
  const [activePlanner, setActivePlanner] = useState(null);
  const [revertPlan, setRevertPlan] = useState({ ...emptyRevertPlan, selectedRepositories: [], targetVersions: {} });
  const [revertRunStatus, setRevertRunStatus] = useState('idle');
  const [revertRunStage, setRevertRunStage] = useState(0);
  const [, setRunClock] = useState(0);
  const thinkingTimer = useRef(null);
  const messageListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list || messages.length === 0) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!thinkingId) return undefined;
    const timer = window.setInterval(() => {
      setRunClock((tick) => tick + 1);
    }, 100);
    return () => window.clearInterval(timer);
  }, [thinkingId]);

  useEffect(() => {
    if (revertPlannerStep !== 3 || revertRunStatus !== 'running') return undefined;
    const timer = window.setInterval(() => setRevertRunStage((stage) => {
      if (stage >= 2) {
        window.clearInterval(timer);
        setRevertRunStatus('awaiting-approval');
        return 3;
      }
      return stage + 1;
    }), 900);
    return () => window.clearInterval(timer);
  }, [revertPlannerStep, revertRunStatus]);

  useEffect(() => {
    if (!initialPrompt) return;
    const answer = analyzePrompt(initialPrompt, repositories, metrics, readiness, foundationVersion, releaseName);
    setMessages((current) => current.some((message) => message.question === initialPrompt)
      ? current
      : [...current, { question: initialPrompt, answer }]);
    onInitialPromptConsumed?.();
  }, [initialPrompt, repositories, metrics, readiness, foundationVersion, releaseName, onInitialPromptConsumed]);

  const enqueueQuestion = (question, allowAfterClear = false, answerOverride = null, runOptions = {}) => {
    if (!question || (!allowAfterClear && (thinkingId !== null || messages.some((message) => message.thinking)))) return;
    const id = `chat-${Date.now()}`;
    const answer = answerOverride || analyzePrompt(question, repositories, metrics, readiness, foundationVersion, releaseName);
    const steps = runOptions.steps || getAgentSteps(question);
    const durationMs = runOptions.durationMs || 4800;
    const approvalStep = steps.find((step) => step.requiresApproval);
    setMessages((current) => [...current, { id, question, answer: null, thinking: true, startedAt: Date.now(), steps, durationMs }]);
    setInput('');
    setThinkingId(id);
    thinkingTimer.current = window.setTimeout(() => {
      if (approvalStep) {
        setPendingApproval({ id, operation: approvalStep.name, answer, question, preview: describeApprovalOperation(question, repositories, releaseName) });
        thinkingTimer.current = null;
        return;
      }
      setMessages((current) => current.map((message) => message.id === id
        ? { ...message, answer, thinking: false }
        : message));
      setThinkingId(null);
      thinkingTimer.current = null;
    }, approvalStep ? 1600 : durationMs);
  };

  // Approval advances or cancels local UI state only; no external operation is connected.
  const resolveApproval = (approved) => {
    if (!pendingApproval) return;
    const { id, answer } = pendingApproval;
    setPendingApproval(null);
    if (approved) {
      thinkingTimer.current = window.setTimeout(() => {
        setMessages((current) => current.map((message) => message.id === id
          ? { ...message, answer, thinking: false, operationApproved: true }
          : message));
        setThinkingId(null);
        thinkingTimer.current = null;
      }, 1800);
      return;
    }
    window.clearTimeout(thinkingTimer.current);
    setMessages((current) => current.map((message) => message.id === id
      ? { ...message, thinking: false, answer: { title: 'Operation cancelled', summary: 'The requested operation was not started. No changes were made.', points: [] } }
      : message));
    setThinkingId(null);
  };

  // Stop clears the active timer and replaces the in-progress state with a stopped response.
  const stopGeneration = () => {
    if (!thinkingId) return;
    window.clearTimeout(thinkingTimer.current);
    thinkingTimer.current = null;
    setPendingApproval(null);
    setMessages((current) => current.map((message) => message.id === thinkingId && message.thinking
      ? { ...message, thinking: false, answer: { title: 'Generation stopped', summary: 'The response was stopped before it completed.', points: [], source: `${releaseName} · local assistant run` } }
      : message));
    setThinkingId(null);
  };

  const ask = (prompt) => {
    const question = prompt.trim();
    if (!question) return;
    const clearCommand = question.match(/^\/clear(?:\s+([\s\S]*))?$/i);
    if (clearCommand) {
      window.clearTimeout(thinkingTimer.current);
      setThinkingId(null);
      setPendingApproval(null);
      setHandoffDraft(null);
      setMessages([]);
      setInput('');
      const followUp = clearCommand[1]?.trim();
      if (followUp) enqueueQuestion(followUp, true);
      return;
    }
    enqueueQuestion(question);
  };

  // Start guided planning as a normal chat turn; the planner opens only after the user accepts its intro.
  const queuePlannerPrompt = (kind, prompt) => {
    const isRevert = kind === 'revert';
    setReleasePlan({ ...emptyReleasePlan, selectedRepositories: [] });
    setReleasePlannerStep(null);
    setRevertPlannerStep(null);
    setActivePlanner(null);
    setRevertPlan({ ...emptyRevertPlan, lastKnownGoodFoundation: foundationVersion, selectedRepositories: [], targetVersions: {} });
    setRevertRunStatus('idle');
    setRevertRunStage(0);
    const answer = {
      title: 'Before we proceed, a few questions',
      summary: isRevert
        ? 'I’ll ask what you want to restore, which versions should change, and what recovery reference to use. Start the guided questions when you’re ready.'
        : 'I’ll ask whether this is a main or off-cycle release, then gather its scope, baseline, and timing. Start the guided questions when you’re ready.',
      points: [],
      source: isRevert ? 'Revert planning · guided questions' : 'Release planning · guided questions',
      plannerAction: kind,
    };
    const steps = [
      { label: 'Understand request', detail: isRevert ? 'Identifying the recovery path' : 'Identifying the release path' },
      { label: 'Check context', detail: 'Reviewing the current dashboard snapshot' },
      { label: 'Prepare questions', detail: 'Setting up the guided flow' },
    ];
    enqueueQuestion(prompt, false, answer, { durationMs: 3200, steps });
  };

  const openPlanner = (kind) => {
    setActivePlanner(kind);
    if (kind === 'revert') {
      setRevertPlan({ ...emptyRevertPlan, lastKnownGoodFoundation: foundationVersion, selectedRepositories: [], targetVersions: {} });
      setRevertRunStatus('idle');
      setRevertRunStage(0);
      setRevertPlannerStep(0);
    } else {
      setReleasePlan({ ...emptyReleasePlan, selectedRepositories: [] });
      setReleasePlannerStep(0);
    }
  };

  const selectRevertMode = (mode) => {
    setRevertPlan({ ...emptyRevertPlan, mode, lastKnownGoodFoundation: foundationVersion, selectedRepositories: [], targetVersions: {} });
    setRevertPlannerStep(1);
  };
  const updateRevertPlan = (field, value) => setRevertPlan((current) => ({ ...current, [field]: value }));
  const revertChecks = getRevertPlanChecks(revertPlan, repositories, foundationVersion);
  const revertPlanValid = revertChecks.every((check) => check.valid);
  const startRevertRun = () => {
    if (!revertPlanValid) return;
    // TODO(backend): Revalidate live repository versions, submit the RelCur manifest, and fetch its actual Foundation build before presenting the approval gate.
    setRevertRunStatus('running');
    setRevertRunStage(0);
    setRevertPlannerStep(3);
  };
  const resolveRevertRun = (approved) => setRevertRunStatus(approved ? 'approved' : 'declined');

  const updateReleasePlan = (field, value) => {
    setReleasePlan((current) => ({ ...current, [field]: value }));
  };

  const selectPlanType = (type) => {
    setReleasePlan({ ...emptyReleasePlan, type, selectedRepositories: [] });
    setReleasePlannerStep(1);
  };

  const selectOffcycleRepository = (name) => {
    const repository = repositories.find((repo) => repo.name === name);
    setReleasePlan((current) => ({
      ...current,
      repository: name,
      currentProdVersion: repository?.prodVersion || '',
      changeOrder: repository?.changeOrder || '',
    }));
  };

  const planChecks = getReleasePlanChecks(releasePlan, repositories);
  const releasePlanValid = planChecks.length > 0 && planChecks.every((check) => check.valid);

  const submitReleasePlan = () => {
    if (!releasePlanValid) return;
    const answer = createReleasePlanAnswer(releasePlan, repositories, foundationVersion);
    const mainReleaseBaselines = repositories
      .filter((repo) => releasePlan.selectedRepositories.includes(repo.name))
      .map((repo) => `${repo.name}: PROD ${repo.prodVersion}; non-PROD ${repo.nonProdVersion}; status ${repo.status}`)
      .join(' | ');
    const question = releasePlan.type === 'main'
      ? `Plan main release ${releasePlan.releaseName} for ${releasePlan.plannedDate}. Foundation baseline: ${foundationVersion}. Selected repository snapshots: ${mainReleaseBaselines}.`
      : `Plan off-cycle release for ${releasePlan.repository}. Current PROD ${releasePlan.currentProdVersion}; proposed target ${releasePlan.targetVersion}. Difference: PROD ${releasePlan.currentProdVersion} → target ${releasePlan.targetVersion}. Reason: ${releasePlan.reason.trim()}. Change order: ${releasePlan.changeOrder.trim()}.`;

    // TODO(backend): Re-read live PROD versions, repository health, and approval/change-order state before forwarding this validated brief to the approved LLM service.
    setReleasePlannerStep(null);
    setActivePlanner(null);
    enqueueQuestion(question, false, answer);
  };

  const handleInsertSlash = (command) => {
    setInput(`${command} `);
    setIsSlashDismissed(true);
    inputRef.current?.focus();
  };

  const handleExecuteSlash = (command) => {
    setIsSlashDismissed(true);
    ask(command);
  };

  const hasClearCommand = /^\/clear(?:\s|$)/i.test(input);
  const isThinking = thinkingId !== null || messages.some((message) => message.thinking);
  const trimmedInput = input.trim();
  const isSlashActive = input.startsWith('/') && !/^\/clear\s+/i.test(input) && !isSlashDismissed && isInputFocused;
  const matchingSlashCommands = isSlashActive
    ? slashCommands.filter((cmd) => cmd.command.toLowerCase().startsWith(trimmedInput.toLowerCase()))
    : [];
  const showSlashSuggestions = isSlashActive;

  const handleInputKeyDown = (event) => {
    if (!showSlashSuggestions) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (matchingSlashCommands.length > 0) {
        setSelectedSlashIndex((prev) => (prev + 1) % matchingSlashCommands.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (matchingSlashCommands.length > 0) {
        setSelectedSlashIndex((prev) => (prev - 1 + matchingSlashCommands.length) % matchingSlashCommands.length);
      }
    } else if (event.key === 'Tab') {
      if (matchingSlashCommands.length > 0) {
        event.preventDefault();
        const chosen = matchingSlashCommands[selectedSlashIndex] || matchingSlashCommands[0];
        handleInsertSlash(chosen.command);
      }
    } else if (event.key === 'Enter') {
      if (matchingSlashCommands.length > 0 && !input.includes(' ')) {
        event.preventDefault();
        const chosen = matchingSlashCommands[selectedSlashIndex] || matchingSlashCommands[0];
        handleExecuteSlash(chosen.command);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsSlashDismissed(true);
    }
  };

  return (
    <section className={`ai-workspace ${presentation === 'popup' ? 'ai-workspace--popup' : ''} ${presentation === 'sidebar' ? 'ai-workspace--sidebar' : ''}`} aria-label="AI release assistant">
      <div className="ai-workspace-heading">
        <div className="ai-title-group">
          <div className="ai-title-icon"><Sparkles size={19} /></div>
          <div>
            <div className="ai-eyebrow">AI RELEASE ANALYST <span>PREVIEW</span></div>
            <h2>Make sense of {releaseName}</h2>
            <p>Ask a release question or choose an analysis to explore the current dashboard data.</p>
          </div>
        </div>
        <div className="ai-heading-actions">
          <div className="ai-data-status"><span />Using current dashboard data</div>
          {presentation === 'popup' && <div className="ai-popup-controls">
            <button type="button" aria-label="Open full-screen AI assistant" title="Open full screen" onClick={onFullScreen}><Maximize2 size={15} /></button>
            <button type="button" aria-label="Close AI assistant" title="Close" onClick={onClose}><X size={16} /></button>
          </div>}
        </div>
      </div>

      <div className="ai-context-strip" aria-label="Current release context">
        <div><span>Repositories ready</span><strong>{metrics.onTrack.value}<small> / {metrics.totalRepositories.value}</small></strong></div>
        <div><span>Version differences</span><strong>{metrics.versionDiscrepancies.value}</strong></div>
        <div><span>Awaiting approval</span><strong>{metrics.pendingChangeOrders.value}</strong></div>
        <div><span>Foundation baseline</span><strong>{foundationVersion}</strong></div>
      </div>

      <div className="ai-conversation-card">
        {activePlanner === 'release' ? (
          <div className="ai-empty-state ai-empty-state--planner">
            <ReleasePlanner step={releasePlannerStep ?? 0} plan={releasePlan} repositories={repositories} checks={planChecks} planIsValid={releasePlanValid}
              setStep={(step) => { setReleasePlannerStep(step); if (step === null) setActivePlanner(null); }} updatePlan={updateReleasePlan}
              selectType={selectPlanType} selectRepository={selectOffcycleRepository} submit={submitReleasePlan} />
          </div>
        ) : activePlanner === 'revert' ? (
          <div className="ai-empty-state ai-empty-state--planner">
            <RevertPlanner step={revertPlannerStep ?? 0} plan={revertPlan} repositories={repositories} checks={revertChecks} planIsValid={revertPlanValid}
              updatePlan={updateRevertPlan} setStep={(step) => { setRevertPlannerStep(step); if (step === null) setActivePlanner(null); }} selectMode={selectRevertMode} startRun={startRevertRun}
              runStatus={revertRunStatus} runStage={revertRunStage} resolveRun={resolveRevertRun} foundationVersion={foundationVersion} />
          </div>
        ) : messages.length === 0 ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon"><Bot size={22} /></div>
            <h3>What would you like to know?</h3>
            <p>Choose a starting point. Each analysis uses the current release data.</p>
            <div className="ai-prompt-grid">
              {suggestedPrompts.map(({ icon: Icon, label, description, prompt, kind }) => (
                <button key={kind} type="button" onClick={() => kind === 'planner' ? queuePlannerPrompt('release', prompt) : kind === 'rollback' ? queuePlannerPrompt('revert', prompt) : ask(prompt)}>
                  <span className="ai-prompt-icon"><Icon size={17} /></span>
                  <span className="ai-prompt-copy"><strong>{label}</strong><small>{description}</small></span>
                  <ArrowUpRight size={14} className="ai-prompt-arrow" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-message-list" aria-live="polite" ref={messageListRef}>
            {messages.map(({ id, question, answer, thinking, startedAt, durationMs, steps = [] }, index) => (
              <article className={`ai-exchange ${index === messages.length - 1 ? 'ai-exchange--drop-in' : ''}`} key={id || `${index}-${question}`}>
                <div className="ai-user-question"><span>You</span><p>{question}</p></div>
                {thinking || !answer ? (
                  <div className="ai-answer ai-answer--thinking" role="status" aria-label="Agent is working on your request">
                    <div className="ai-answer-mark"><Sparkles size={14} /></div>
                    <div className="ai-thinking-content">
                      {(() => {
                        const age = (Date.now() - (startedAt || Date.now())) / 1000;
                        const activeIndex = Math.min(steps.length - 1, Math.floor(age / ((durationMs || 4800) / steps.length)));
                        const activeStep = steps[activeIndex] || steps[0];
                        const phaseLabel = activeStep?.name
                          ? `Calling ${activeStep.name}`
                          : activeIndex === 0 ? 'Understanding your request'
                            : activeIndex === 1 ? 'Thinking through release data'
                              : 'Preparing the response';
                        return <div className="ai-run-activity">
                          <span className="ai-live-indicator" />
                          <span className="ai-activity-prefix">{activeStep?.name ? <Wrench size={13} /> : <Sparkles size={13} />}</span>
                          <span className="ai-activity-label" key={`${id}-${activeIndex}`}>
                            <span className="ai-activity-roll">{phaseLabel}</span>
                            <span className="ai-activity-detail">{activeStep?.name ? activeStep.name : activeStep?.detail}</span>
                          </span>
                          <span className="ai-run-timer"><Timer size={12} /> {((Date.now() - (startedAt || Date.now())) / 1000).toFixed(1)}s</span>
                        </div>;
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="ai-answer ai-answer--arrive">
                    <div className="ai-answer-mark"><Sparkles size={14} /></div>
                    <div className="ai-answer-body">
                      <h3>{answer.title}</h3>
                      {/* Use the Markdown renderer for structured answers; keep standard answers concise. */}
                      {answer.markdown ? (
                        <>
                          <p>{answer.summary}</p>
                          <MarkdownContent content={answer.markdown} />
                        </>
                      ) : (
                        <>
                          <p>{answer.summary}</p>
                          <ul>{answer.points.map((point) => <li key={point}>{point}</li>)}</ul>
                        </>
                      )}
                      <p className="ai-answer-source"><span />Source · {answer.source || `${releaseName} dashboard data`}</p>
                      {answer.handoff && <button className="ai-handoff-link" type="button" onClick={() => setHandoffDraft({ question, answer, conversation: messages })}><ShieldCheck size={14} /> Prepare human handoff <ArrowUpRight size={13} /></button>}
                      {answer.plannerAction && <button className="ai-planner-start-link" type="button" onClick={() => openPlanner(answer.plannerAction)}>{answer.plannerAction === 'revert' ? <RotateCcw size={14} /> : <CalendarDays size={14} />} {answer.plannerAction === 'revert' ? 'Start revert questions' : 'Start release questions'} <ArrowUpRight size={13} /></button>}
                      {answer.repo && (
                        <button className="ai-review-link" type="button" onClick={() => onReview?.(answer.repo)}>
                          {answer.repo.status === 'Match' || answer.repo.status === 'On Track' ? 'Open' : 'Review'} {answer.repo.name}<ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* Local human handoff draft carries conversation and release context without sending a ticket. */}
        {handoffDraft && (
          <div className="ai-handoff-draft" role="region" aria-label="Human handoff draft">
            <div className="ai-handoff-draft-heading"><span><ShieldCheck size={14} /> Release Support handoff</span><button type="button" onClick={() => setHandoffDraft(null)} aria-label="Close handoff draft"><X size={14} /></button></div>
            <p><strong>Conversation:</strong> {handoffDraft.conversation.length + 1} messages · “{handoffDraft.question}” · <strong>Release:</strong> {releaseName}</p>
            <div className="ai-handoff-versions" aria-label="Attached revert version details">{handoffDraft.answer.revertRows?.map((row) => <span key={row.name}>{row.name} <code>{row.current}</code> → <code>{row.target}</code></span>)}</div>
            <small>Demo draft only. No ticket or message will be sent.</small>
            <button className="ai-handoff-prepare" type="button" onClick={() => {
              setMessages((current) => [...current, { id: `handoff-${Date.now()}`, question: 'Human handoff prepared', answer: { title: 'Handoff draft ready', summary: `Release Support context is prepared for ${releaseName}, including the original question and repository version plan. This demo does not send the handoff.`, points: [], source: `${releaseName} · local demo draft` } }]);
              setHandoffDraft(null);
            }}>Prepare handoff draft</button>
          </div>
        )}
        {pendingApproval && (
          <div className="ai-hitl-prompt" role="alertdialog" aria-label="Approval required">
            <div className="ai-hitl-topline"><span className="ai-hitl-mark"><ShieldCheck size={15} /></span><strong>Approval required</strong><span className="ai-hitl-demo-tag">DEMO</span></div>
            <div className="ai-hitl-plan"><span><small>Proposed action</small><strong>{pendingApproval.preview.impact}</strong></span><span><small>Target</small><strong>{pendingApproval.preview.target}</strong></span></div>
            <p className="ai-hitl-demo-note">Demo gate only · approval simulates this step; no external API or release changes.</p>
            <div className="ai-hitl-actions">
              <button type="button" className="ai-hitl-cancel" onClick={() => resolveApproval(false)}>Decline</button>
              <button type="button" className="ai-hitl-approve" onClick={() => resolveApproval(true)}>Approve demo action</button>
            </div>
          </div>
        )}
        <form className="ai-composer" onSubmit={(event) => { event.preventDefault(); ask(input); }}>
          {showSlashSuggestions && (
            <div className="ai-slash-suggestions" role="listbox" aria-label="Available slash commands">
              {matchingSlashCommands.length > 0 ? (
                <div className="ai-slash-list">
                  {matchingSlashCommands.map((cmd, index) => (
                    <div
                      key={cmd.command}
                      role="option"
                      tabIndex={0}
                      aria-selected={selectedSlashIndex === index}
                      className={`ai-slash-item ${selectedSlashIndex === index ? 'active' : ''}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleExecuteSlash(cmd.command)}
                      onMouseEnter={() => setSelectedSlashIndex(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleExecuteSlash(cmd.command);
                        }
                      }}
                    >
                      <span className="ai-slash-icon">
                        <cmd.icon size={13} />
                      </span>
                      <kbd className="ai-slash-kbd">{cmd.command}</kbd>
                      <span className="ai-slash-label">{cmd.label}</span>
                      <span className="ai-slash-hint">
                        <kbd>↵</kbd> run · <kbd>Tab</kbd> fill
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ai-slash-empty">
                  No command matches <strong>{input}</strong> · <button type="button" onClick={() => handleInsertSlash('/clear')}><kbd className="ai-slash-kbd">/clear</kbd></button>
                </div>
              )}
            </div>
          )}
          <span className="ai-input-shell">
            {hasClearCommand && (
              <span className="ai-command-visual" aria-hidden="true">
                <span className="ai-command-tag">/clear</span>
                <span className="ai-command-remainder">{input.slice(6)}</span>
              </span>
            )}
            <input
              ref={inputRef}
              className={hasClearCommand ? 'ai-command-input' : ''}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setIsSlashDismissed(false);
                setSelectedSlashIndex(0);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => window.setTimeout(() => setIsInputFocused(false), 150)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask about a release or type /"
              aria-label="Ask the release analyst"
            />
          </span>
          {/* Swap the composer send action for Stop whenever a response run is active. */}
          {isThinking ? (
            <button className="ai-stop-button" type="button" onClick={stopGeneration} aria-label="Stop generating" title="Stop generating"><Square size={13} fill="currentColor" /></button>
          ) : (
            <button type="submit" disabled={!input.trim()} aria-label="Send question" title="Send question"><Send size={16} /></button>
          )}
        </form>
        <p className="ai-preview-note"><CheckCircle2 size={12} /> Preview uses bundled dashboard data. Connect an approved AI service for generated responses.</p>
      </div>
    </section>
  );
}
