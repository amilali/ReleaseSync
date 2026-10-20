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

function analyzePrompt(prompt, repositories, metrics, readiness, foundationVersion) {
  const normalized = prompt.toLowerCase();
  const mismatches = repositories.filter((repo) => ['Review', 'Investigate'].includes(repo.status));
  const highestRisk = repositories.find((repo) => repo.status === 'Investigate');

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

export default function AIAssistant({ repositories, metrics, readiness, foundationVersion, releaseName, initialPrompt = '', onInitialPromptConsumed, onReview, input, setInput, messages, setMessages, presentation = 'page', onFullScreen, onClose }) {
  const [thinkingId, setThinkingId] = useState(null);
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);
  const [isSlashDismissed, setIsSlashDismissed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const thinkingTimer = useRef(null);
  const messageListRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list || messages.length === 0) return;
    list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!initialPrompt) return;
    const answer = analyzePrompt(initialPrompt, repositories, metrics, readiness, foundationVersion);
    setMessages((current) => current.some((message) => message.question === initialPrompt)
      ? current
      : [...current, { question: initialPrompt, answer }]);
    onInitialPromptConsumed?.();
  }, [initialPrompt, repositories, metrics, readiness, foundationVersion, onInitialPromptConsumed]);

  const enqueueQuestion = (question, allowAfterClear = false) => {
    if (!question || (!allowAfterClear && (thinkingId !== null || messages.some((message) => message.thinking)))) return;
    const id = `chat-${Date.now()}`;
    const answer = analyzePrompt(question, repositories, metrics, readiness, foundationVersion);
    setMessages((current) => [...current, { id, question, answer: null, thinking: true }]);
    setInput('');
    setThinkingId(id);
    thinkingTimer.current = window.setTimeout(() => {
      setMessages((current) => current.map((message) => message.id === id
        ? { ...message, answer, thinking: false }
        : message));
      setThinkingId(null);
      thinkingTimer.current = null;
    }, 1050);
  };

  const ask = (prompt) => {
    const question = prompt.trim();
    if (!question) return;
    const clearCommand = question.match(/^\/clear(?:\s+([\s\S]*))?$/i);
    if (clearCommand) {
      window.clearTimeout(thinkingTimer.current);
      setThinkingId(null);
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
            {messages.map(({ id, question, answer, thinking }, index) => (
              <article className={`ai-exchange ${index === messages.length - 1 ? 'ai-exchange--drop-in' : ''}`} key={id || `${index}-${question}`}>
                <div className="ai-user-question"><span>You</span><p>{question}</p></div>
                {thinking || !answer ? (
                  <div className="ai-answer ai-answer--thinking" role="status" aria-label="Thinking through release data">
                    <div className="ai-answer-mark"><Sparkles size={14} /></div>
                    <div className="ai-thinking-content">
                      <p className="ai-thinking-text">Thinking through release data<span className="ai-thinking-dots" aria-hidden="true"><i /><i /><i /></span></p>
                      <div className="ai-answer-skeleton" aria-hidden="true">
                        <span className="ai-skeleton-line ai-skeleton-title" />
                        <span className="ai-skeleton-line ai-skeleton-long" />
                        <span className="ai-skeleton-line ai-skeleton-medium" />
                        <span className="ai-skeleton-line ai-skeleton-short" />
                        <div className="ai-skeleton-points">
                          <span><i className="ai-skeleton-dot" /><i className="ai-skeleton-line" /></span>
                          <span><i className="ai-skeleton-dot" /><i className="ai-skeleton-line" /></span>
                          <span><i className="ai-skeleton-dot" /><i className="ai-skeleton-line" /></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="ai-answer ai-answer--arrive">
                    <div className="ai-answer-mark"><Sparkles size={14} /></div>
                    <div className="ai-answer-body">
                      <h3>{answer.title}</h3>
                      <p>{answer.summary}</p>
                      <ul>{answer.points.map((point) => <li key={point}>{point}</li>)}</ul>
                      {answer.repo && (
                        <button className="ai-review-link" type="button" onClick={() => onReview?.(answer.repo)}>
                          Review {answer.repo.name}<ArrowUpRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            ))}
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
          <button type="submit" disabled={!input.trim() || (isThinking && !hasClearCommand)} aria-label="Send question"><Send size={16} /></button>
        </form>
        <p className="ai-preview-note"><CheckCircle2 size={12} /> Preview analysis uses bundled dashboard data. Connect an approved AI service to enable model-generated responses.</p>
      </div>
    </section>
  );
}
