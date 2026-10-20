import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

export default function FinalizeVersionsModal({ isOpen, onClose, repositories, releaseName, onFinalize }) {
  const [drafts, setDrafts] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    setDrafts(Object.fromEntries(repositories.map((repo) => [repo.id, {
      nonProdVersion: repo.nonProdVersion,
      hfVersion: repo.hfVersion
    }])));
  }, [isOpen, repositories]);

  const pendingCount = useMemo(() => repositories.reduce((count, repo) => (
    count + Number(!repo.nonProdVersionFinalized) + Number(!repo.hfVersionFinalized)
  ), 0), [repositories]);

  if (!isOpen) return null;

  const updateDraft = (repoId, field, value) => {
    setDrafts((current) => ({ ...current, [repoId]: { ...current[repoId], [field]: value } }));
  };

  const confirmAll = () => {
    const versions = repositories.map((repo) => ({
      id: repo.id,
      nonProdVersion: drafts[repo.id]?.nonProdVersion?.trim(),
      hfVersion: drafts[repo.id]?.hfVersion?.trim()
    }));
    if (versions.some((version) => !version.nonProdVersion || !version.hfVersion)) return;
    onFinalize(versions);
    onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-dialog finalize-versions-dialog" role="dialog" aria-modal="true" aria-labelledby="finalize-versions-title">
        <header className="modal-header">
          <div>
            <div className="modal-title" id="finalize-versions-title">Finalize release versions</div>
            <div className="finalize-versions-subtitle">{releaseName} · Review Non-Prod and HF versions before confirming.</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </header>

        <div className="finalize-versions-notice"><AlertCircle size={15} /> Confirming finalizes all listed pending versions for this release.</div>
        <div className="finalize-versions-table-wrap">
          <table className="finalize-versions-table">
            <thead><tr><th>Repository</th><th>Non-Prod version</th><th>HF version</th></tr></thead>
            <tbody>{repositories.map((repo) => (
              <tr key={repo.id}>
                <th scope="row">{repo.name}<small>{repo.changeOrder}</small></th>
                {['nonProdVersion', 'hfVersion'].map((field) => {
                  const finalized = repo[`${field}Finalized`];
                  return <td key={field}>
                    <input
                      aria-label={`${field === 'nonProdVersion' ? 'Non-Prod' : 'HF'} planned version for ${repo.name}`}
                      value={drafts[repo.id]?.[field] ?? ''}
                      disabled={finalized}
                      onChange={(event) => updateDraft(repo.id, field, event.target.value)}
                    />
                    {finalized && <span className="version-finalized-badge"><CheckCircle2 size={12} /> Finalized</span>}
                  </td>;
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>

        <footer className="modal-footer">
          <span className="finalize-pending-count">{pendingCount} version{pendingCount === 1 ? '' : 's'} pending</span>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={confirmAll} disabled={!pendingCount || repositories.some((repo) => !drafts[repo.id]?.nonProdVersion?.trim() || !drafts[repo.id]?.hfVersion?.trim())}>
            Confirm final versions
          </button>
        </footer>
      </section>
    </div>
  );
}
