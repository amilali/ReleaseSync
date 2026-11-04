import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
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
} from 'lucide-react';

const slashCommands = [
  {
    command: '/clear',
    label: 'Clear chat',
    icon: RotateCcw,
  },
];

const suggestedPrompts = [
  { icon: CircleAlert, label: 'Which repositories need attention?', kind: 'attention' },
  { icon: GitCompareArrows, label: 'Compare version drift with Foundation', kind: 'versions' },
  { icon: ShieldCheck, label: 'Summarize release readiness', kind: 'readiness' },
];

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
    if (!initialPrompt) return;
    const answer = analyzePrompt(initialPrompt, repositories, metrics, readiness, foundationVersion, releaseName);
    setMessages((current) => current.some((message) => message.question === initialPrompt)
      ? current
      : [...current, { question: initialPrompt, answer }]);
    onInitialPromptConsumed?.();
  }, [initialPrompt, repositories, metrics, readiness, foundationVersion, releaseName, onInitialPromptConsumed]);

  const enqueueQuestion = (question, allowAfterClear = false) => {
    if (!question || (!allowAfterClear && (thinkingId !== null || messages.some((message) => message.thinking)))) return;
    const id = `chat-${Date.now()}`;
    const answer = analyzePrompt(question, repositories, metrics, readiness, foundationVersion, releaseName);
    const steps = getAgentSteps(question);
    const approvalStep = steps.find((step) => step.requiresApproval);
    setMessages((current) => [...current, { id, question, answer: null, thinking: true, startedAt: Date.now(), steps }]);
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
    }, approvalStep ? 1600 : 4800);
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
        {messages.length === 0 ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon"><Bot size={22} /></div>
            <h3>What would you like to know?</h3>
            <p>Explore readiness, version differences, and release approvals.</p>
            <div className="ai-prompt-grid">
              {suggestedPrompts.map(({ icon: Icon, label, kind }) => (
                <button key={kind} type="button" onClick={() => ask(label)}>
                  <Icon size={16} />
                  <span>{label}</span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="ai-message-list" aria-live="polite" ref={messageListRef}>
            {messages.map(({ id, question, answer, thinking, startedAt, steps = [] }, index) => (
              <article className={`ai-exchange ${index === messages.length - 1 ? 'ai-exchange--drop-in' : ''}`} key={id || `${index}-${question}`}>
                <div className="ai-user-question"><span>You</span><p>{question}</p></div>
                {thinking || !answer ? (
                  <div className="ai-answer ai-answer--thinking" role="status" aria-label="Agent is working on your request">
                    <div className="ai-answer-mark"><Sparkles size={14} /></div>
                    <div className="ai-thinking-content">
                      {(() => {
                        const age = (Date.now() - (startedAt || Date.now())) / 1000;
                        const activeIndex = Math.min(steps.length - 1, Math.floor(age / (4.8 / steps.length)));
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
              placeholder="Ask about readiness, version drift, or approvals… (type / for commands)"
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
        <p className="ai-preview-note"><CheckCircle2 size={12} /> Preview analysis uses bundled dashboard data. Connect an approved AI service to enable model-generated responses.</p>
      </div>
    </section>
  );
}
