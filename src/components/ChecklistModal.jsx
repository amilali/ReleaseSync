import React from 'react';
import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ChecklistModal({ isOpen, onClose, checklist = [] }) {
  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#15803d', backgroundColor: '#dcfce7', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
            <CheckCircle2 size={12} />
            Ready
          </span>
        );
      case 'Needs Review':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b45309', backgroundColor: '#fef3c7', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
            <Clock size={12} />
            Needs Review
          </span>
        );
      case 'Blocked':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#b91c1c', backgroundColor: '#fee2e2', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 600 }}>
            <AlertCircle size={12} />
            Blocked
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Release 2024.10 Readiness Checklist</div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            All requirements must meet compliance before the deployment window opens on Oct 18, 2024.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checklist.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 14px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  backgroundColor: '#f8fafc' 
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{item.item}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Category: <span style={{ fontWeight: 500 }}>{item.category}</span> • Owner: <span style={{ fontWeight: 500 }}>{item.owner}</span>
                  </div>
                </div>
                <div>{getStatusBadge(item.status)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => { alert('Sign-off notification sent to CAB approval board.'); onClose(); }}>
            Export Audit Sign-off
          </button>
        </div>
      </div>
    </div>
  );
}
