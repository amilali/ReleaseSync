import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  GitCompareArrows,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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

export default function AIAssistant({ repositories, metrics, readiness, foundationVersion, releaseName, initialPrompt = '', onInitialPromptConsumed, onReview }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!initialPrompt) return;
    const answer = analyzePrompt(initialPrompt, repositories, metrics, readiness, foundationVersion);
    setMessages((current) => current.some((message) => message.question === initialPrompt)
      ? current
      : [...current, { question: initialPrompt, answer }]);
    onInitialPromptConsumed?.();
  }, [initialPrompt, repositories, metrics, readiness, foundationVersion, onInitialPromptConsumed]);

  const ask = (prompt) => {
    const question = prompt.trim();
    if (!question) return;
    const answer = analyzePrompt(question, repositories, metrics, readiness, foundationVersion);
    setMessages((current) => [...current, { question, answer }]);
    setInput('');
  };

  return (
    <section className="ai-workspace" aria-label="AI release assistant">
      <div className="ai-workspace-heading">
        <div className="ai-title-group">
          <div className="ai-title-icon"><Sparkles size={19} /></div>
          <div>
            <div className="ai-eyebrow">AI RELEASE ANALYST <span>PREVIEW</span></div>
            <h2>Make sense of {releaseName}</h2>
            <p>Ask a release question or choose an analysis to explore the current dashboard data.</p>
          </div>
        </div>
        <div className="ai-data-status"><span />Using current dashboard data</div>
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
          <div className="ai-message-list" aria-live="polite">
            {messages.map(({ question, answer }, index) => (
              <article className="ai-exchange" key={`${index}-${question}`}>
                <div className="ai-user-question"><span>You</span><p>{question}</p></div>
                <div className="ai-answer">
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
              </article>
            ))}
          </div>
        )}

        <form className="ai-composer" onSubmit={(event) => { event.preventDefault(); ask(input); }}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about readiness, version drift, or approvals…"
            aria-label="Ask the release analyst"
          />
          <button type="submit" disabled={!input.trim()} aria-label="Send question"><Send size={16} /></button>
        </form>
        <p className="ai-preview-note"><CheckCircle2 size={12} /> Preview analysis uses bundled dashboard data. Connect an approved AI service to enable model-generated responses.</p>
      </div>
    </section>
  );
}
