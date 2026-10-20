import React from 'react';
import { X, PlayCircle, GitCompare, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export default function ActionModal({ isOpen, onClose, repo, foundationVersion }) {
  if (!isOpen || !repo) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Repository Actions: {repo.name}</div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Environment</span>
              <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{repo.environment}</div>
            </div>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Published build</span>
              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>{repo.publishedVersion || repo.nonProdVersion}</div>
              <small style={{ color: '#64748b' }}>Build {repo.jenkinsBuild} · Foundation {repo.buildFoundationVersion || foundationVersion}</small>
            </div>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Production Version</span>
              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>{repo.prodVersion}</div>
            </div>
            <div style={{ padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Non-Prod Version</span>
              <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', marginTop: '2px', color: repo.versionStatus.includes('danger') || repo.versionStatus.includes('alert') ? '#dc2626' : '#16a34a' }}>
                {repo.nonProdVersion}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0f172a',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              onClick={() => {
                alert(`Triggering Jenkins build pipeline for ${repo.name}`);
                onClose();
              }}
            >
              <PlayCircle size={17} color="#2563eb" />
              <span>Trigger Pipeline Synchronization</span>
            </button>

            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0f172a',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              onClick={() => {
                alert(`Viewing Git version diff for ${repo.prodVersion} vs ${repo.nonProdVersion}`);
                onClose();
              }}
            >
              <GitCompare size={17} color="#10b981" />
              <span>Compare Version Diff ({repo.prodVersion} ⟷ {repo.nonProdVersion})</span>
            </button>

            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                color: '#0f172a',
                textAlign: 'left',
                cursor: 'pointer'
              }}
              onClick={() => {
                alert(`Approving version override for ${repo.name} at ${repo.nonProdVersion}`);
                onClose();
              }}
            >
              <CheckCircle2 size={17} color="#f59e0b" />
              <span>Override & Approve Version Exception</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
