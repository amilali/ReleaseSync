import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Tag, 
  Plus, 
  Search, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers3, 
  Sparkles, 
  ArrowRight, 
  X,
  ExternalLink,
  GitBranch
} from 'lucide-react';

export default function ReleaseTagModal({
  isOpen,
  onClose,
  currentTag,
  availableTags = [],
  tagsData = {},
  onSelectTag,
  onCreateNewTag
}) {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newFoundationVersion, setNewFoundationVersion] = useState('1.315.654');
  const [newStatus, setNewStatus] = useState('Planning');

  if (!isOpen) return null;

  const filteredTags = availableTags.filter((tag) => 
    tag.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onCreateNewTag({
      tagName: newTagName.trim(),
      targetDate: newTargetDate,
      foundationVersion: newFoundationVersion.trim() || '1.315.654',
      status: newStatus
    });
    setShowCreateForm(false);
    setNewTagName('');
  };

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-dialog release-tag-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header release-tag-modal-header">
          <div className="release-tag-modal-title-wrap">
            <div className="release-tag-modal-icon-badge">
              <Tag size={18} />
            </div>
            <div>
              <div className="modal-title">Select or Create Release Tag</div>
              <p className="modal-subtitle">
                Pull VersionOne (V1) user stories, track regression testing, and manage validation steps for a release.
              </p>
            </div>
          </div>
          {onClose && (
            <button className="modal-close-btn" type="button" onClick={onClose} aria-label="Close dialog">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="modal-body release-tag-modal-body">
          {/* Header Action Bar */}
          <div className="release-tag-controls-bar">
            <div className="release-tag-search-wrap">
              <Search size={14} className="release-tag-search-icon" />
              <input
                type="text"
                className="release-tag-search-input"
                placeholder="Search release tags (e.g. Nov-R2, Release 2024.10)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus={!showCreateForm}
              />
            </div>
            <button
              type="button"
              className={`release-tag-create-trigger-btn ${showCreateForm ? 'active' : ''}`}
              onClick={() => setShowCreateForm(!showCreateForm)}
              title="Create a new release tag"
            >
              <Plus size={16} />
              <span>{showCreateForm ? 'View existing tags' : 'Create new tag'}</span>
            </button>
          </div>

          {showCreateForm ? (
            <form className="release-tag-create-form" onSubmit={handleCreateSubmit}>
              <div className="release-tag-form-banner">
                <Sparkles size={16} />
                <span>Define a new release tag to automatically pull VersionOne (V1) stories and initiate test gates.</span>
              </div>
              <div className="release-tag-form-grid">
                <label className="release-tag-form-field">
                  <span>Release Tag Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nov-R3 or Release 2024.11-RC1"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    autoFocus
                  />
                </label>
                <label className="release-tag-form-field">
                  <span>Target Release Date</span>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                  />
                </label>
                <label className="release-tag-form-field">
                  <span>Foundation Baseline</span>
                  <input
                    type="text"
                    placeholder="1.315.654"
                    value={newFoundationVersion}
                    onChange={(e) => setNewFoundationVersion(e.target.value)}
                  />
                </label>
                <label className="release-tag-form-field">
                  <span>Initial Status</span>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Ready">Ready</option>
                    <option value="Released">Released</option>
                  </select>
                </label>
              </div>
              <div className="release-tag-form-actions">
                <button
                  type="button"
                  className="release-tag-btn-secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="release-tag-btn-primary"
                  disabled={!newTagName.trim()}
                >
                  <Plus size={15} />
                  <span>Create Tag & Pull Stories</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="release-tag-cards-grid">
              {filteredTags.map((tag) => {
                const info = tagsData[tag] || {};
                const isSelected = currentTag === tag;
                const storyCount = info.stories?.length ?? 5;
                const regressionRate = info.regressionSuite?.passRate ?? 88;
                const regStatus = info.regressionSuite?.status ?? 'Active';

                return (
                  <div
                    key={tag}
                    className={`release-tag-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelectTag(tag)}
                  >
                    <div className="release-tag-card-header">
                      <div className="release-tag-card-title">
                        <Tag size={14} className="release-tag-card-icon" />
                        <strong>{tag}</strong>
                      </div>
                      <span className={`release-status-pill status-${(info.status || 'Planning').toLowerCase().replace(' ', '-')}`}>
                        {info.status || 'Planning'}
                      </span>
                    </div>

                    <div className="release-tag-card-meta">
                      <div className="release-tag-card-meta-item">
                        <CalendarDays size={13} />
                        <span>{info.targetDate ? new Date(`${info.targetDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}</span>
                      </div>
                      <div className="release-tag-card-meta-item">
                        <Layers3 size={13} />
                        <span>{storyCount} VersionOne stories</span>
                      </div>
                    </div>

                    <div className="release-tag-card-footer">
                      <div className="release-tag-card-regression">
                        <span className={`regression-dot ${regStatus === 'Passed' ? 'pass' : 'active'}`} />
                        <small>Regression: {regStatus} ({regressionRate}% pass)</small>
                      </div>
                      <button type="button" className="release-tag-select-action-btn">
                        <span>{isSelected ? 'Current' : 'Select'}</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Create Tag Card shortcut */}
              <div 
                className="release-tag-card release-tag-card-add-new" 
                onClick={() => setShowCreateForm(true)}
              >
                <div className="release-tag-add-new-icon">
                  <Plus size={24} />
                </div>
                <div className="release-tag-add-new-label">Create new release tag</div>
                <p>Define a new release branch, associate VersionOne stories, and configure regression runs.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
