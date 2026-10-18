import React, { useState } from 'react';
import { X, Calendar, AlertTriangle } from 'lucide-react';

export default function EditFreezeModal({ isOpen, onClose, freezeDetails, onSave }) {
  if (!isOpen || !freezeDetails) return null;

  const [date, setDate] = useState(freezeDetails.date);
  const [days, setDays] = useState(freezeDetails.daysSinceFreeze);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        ...freezeDetails,
        date,
        daysSinceFreeze: Number(days)
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Configure Code Freeze Milestone</div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '8px', padding: '10px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', marginBottom: '16px' }}>
              <AlertTriangle size={16} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '12px', color: '#92400e' }}>
                Adjusting code freeze milestone impacts SLA calculations and CAB approval gates.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Code Freeze Timestamp
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Days Elapsed Since Freeze
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
