import React, { useMemo, useState } from 'react';
import { Search, Calendar, Bell, ChevronDown, ArrowUpRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  onSearchChange, 
  repositories = [],
  onAskAI,
  currentRelease, 
  availableReleases, 
  onSelectRelease,
  onFinalizeVersions,
  canFinalizeVersions = true,
  notifications = [],
  user,
  onNotificationClick,
  onUserClick
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const suggestions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return repositories.map((repo) => {
      const searchableFields = [
        ['Repository', repo.name],
        ['Environment', repo.environment],
        ['Production version', repo.prodVersion],
        ['Non-production version', repo.nonProdVersion],
        ['HF version', repo.hfVersion],
        ['Build', repo.jenkinsBuild],
        ['Change order', repo.changeOrder],
        ['Status', repo.status],
      ];
      const matchedField = searchableFields.find(([, value]) => value?.toLowerCase().includes(query));
      return matchedField ? { repo, matchedBy: matchedField[0] } : null;
    }).filter(Boolean).slice(0, 5);
  }, [repositories, searchQuery]);

  const selectSuggestion = (repo) => {
    onSearchChange?.(repo.name);
    setIsSearchFocused(false);
    setActiveSuggestion(-1);
  };

  const selectAskSuggestion = (prompt = 'Summarize release readiness') => {
    onSearchChange?.('');
    setIsSearchFocused(false);
    setActiveSuggestion(-1);
    onAskAI?.(prompt);
  };

  const handleSearchKeyDown = (event) => {
    const askActionAvailable = !searchQuery.trim() || /^\/ask(?:\s|$)/i.test(searchQuery.trim());
    const optionCount = suggestions.length || (askActionAvailable ? 1 : 0);
    if (event.key === 'ArrowDown' && optionCount) {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % optionCount);
    } else if (event.key === 'ArrowUp' && optionCount) {
      event.preventDefault();
      setActiveSuggestion((index) => (index <= 0 ? optionCount - 1 : index - 1));
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeSuggestion];
      if (!suggestion || suggestion.type === 'ask') {
        const prompt = searchQuery.trim().replace(/^\/ask\s*/i, '') || 'Summarize release readiness';
        selectAskSuggestion(prompt);
      }
      else selectSuggestion(suggestion.repo);
    } else if (event.key === 'Enter' && /^\/ask(?:\s|$)/i.test(searchQuery.trim())) {
      event.preventDefault();
      selectAskSuggestion(searchQuery.trim().replace(/^\/ask\s*/i, '') || 'Summarize release readiness');
    } else if (event.key === 'Escape') {
      setIsSearchFocused(false);
      setActiveSuggestion(-1);
    }
  };

  return (
    <header className="top-navbar">
      {/* Brand & Subtitle */}
      <div className="nav-left">
        <div className="brand-section">
          {/* ReleaseSync Interlocking Cubes Logo Icon */}
          <div className="brand-icon-box">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L4 9V23L16 30L28 23V9L16 2Z" stroke="#0033a0" strokeWidth="2.2" strokeLinejoin="round"/>
              <path d="M16 16L4 9" stroke="#0033a0" strokeWidth="2.2"/>
              <path d="M16 16L28 9" stroke="#0033a0" strokeWidth="2.2"/>
              <path d="M16 16V30" stroke="#0033a0" strokeWidth="2.2"/>
              <rect x="12" y="12" width="8" height="8" rx="2" fill="#2563eb" fillOpacity="0.2" stroke="#2563eb" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <div className="brand-title">Release Sync</div>
            <div className="brand-subtitle">Enterprise Release Management Platform</div>
          </div>
        </div>
      </div>

      {/* Center Search Input */}
        <div className="nav-center">
          <div className="search-box">
            <Search size={16} />
            <input
            type="text"
            aria-label="Search repositories, versions, builds, and change orders"
              placeholder="Search repositories, versions, builds, change orders..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange && onSearchChange(e.target.value);
                setActiveSuggestion(-1);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
              onKeyDown={handleSearchKeyDown}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isSearchFocused}
              aria-controls="global-search-suggestions"
            aria-activedescendant={activeSuggestion >= 0 ? `search-suggestion-${activeSuggestion}` : undefined}
          />
          <svg className="search-border-orbit" viewBox="0 0 400 36" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="search-orbit-gradient" x1="0" y1="0" x2="400" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#bfdbfe" stopOpacity="0" />
                <stop offset="0.35" stopColor="#60a5fa" />
                <stop offset="0.7" stopColor="#2563eb" />
                <stop offset="1" stopColor="#93c5fd" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="398" height="34" rx="16" fill="none" stroke="url(#search-orbit-gradient)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
          {isSearchFocused && (
            <div className="search-suggestions" id="global-search-suggestions" role="listbox" aria-label="Search suggestions">
              <div className="search-suggestions-label">
                {!searchQuery.trim() ? 'SUGGESTED ACTION' : /^\/ask(?:\s|$)/i.test(searchQuery.trim()) ? 'AI ASSISTANT' : suggestions.length ? 'MATCHING REPOSITORIES' : 'NO MATCHES'}
              </div>
              {!searchQuery.trim() ? (
                <button
                  className={`search-suggestion ${activeSuggestion === 0 ? 'active' : ''}`}
                  id="search-suggestion-0"
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === 0}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectAskSuggestion()}
                >
                  <span className="search-suggestion-icon search-suggestion-ai"><Sparkles size={15} /></span>
                  <span className="search-suggestion-copy">
                    <strong><kbd>/ask</kbd> Summarize this release</strong>
                    <small>Ask AI about readiness, mismatches, and approvals</small>
                  </span>
                  <ArrowUpRight size={14} className="search-suggestion-arrow" />
                </button>
              ) : /^\/ask(?:\s|$)/i.test(searchQuery.trim()) ? (
                <button
                  className={`search-suggestion ${activeSuggestion === 0 ? 'active' : ''}`}
                  id="search-suggestion-0"
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === 0}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectAskSuggestion(searchQuery.trim().replace(/^\/ask\s*/i, '') || 'Summarize release readiness')}
                >
                  <span className="search-suggestion-icon search-suggestion-ai"><Sparkles size={15} /></span>
                  <span className="search-suggestion-copy">
                    <strong>Ask AI: {searchQuery.trim().replace(/^\/ask\s*/i, '') || 'Summarize release readiness'}</strong>
                    <small>Analyze current release data</small>
                  </span>
                  <ArrowUpRight size={14} className="search-suggestion-arrow" />
                </button>
              ) : suggestions.length ? suggestions.map(({ repo, matchedBy }, index) => (
                <button
                  className={`search-suggestion ${activeSuggestion === index ? 'active' : ''}`}
                  id={`search-suggestion-${index}`}
                  key={repo.id}
                  type="button"
                  role="option"
                  aria-selected={activeSuggestion === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(repo)}
                >
                  <span className="search-suggestion-icon"><Search size={14} /></span>
                  <span className="search-suggestion-copy">
                    <strong>{repo.name}</strong>
                    <small>{repo.environment} · {repo.prodVersion} · {matchedBy}</small>
                  </span>
                  <ArrowUpRight size={14} className="search-suggestion-arrow" />
                </button>
              )) : <p className="search-suggestions-empty">Try a repository, version, build, or change order—or type <kbd>/ask</kbd>.</p>}
            </div>
          )}
        </div>

      {/* Right Controls: Release selector, Notifications, Profile */}
      <div className="nav-right">
        {/* Release Selector Dropdown */}
        <div className="release-menu-wrap">
          <button 
            className="release-selector-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Select release"
            aria-expanded={isDropdownOpen}
          >
            <Calendar size={15} color="#475569" />
            <span>{currentRelease}</span>
            <ChevronDown size={14} color="#64748b" />
          </button>

          {isDropdownOpen && (
            <div 
              className="release-menu"
              role="menu"
            >
              {availableReleases && availableReleases.map((rel) => (
                <button
                  key={rel}
                  type="button"
                  role="menuitem"
                  className={`release-menu-item ${rel === currentRelease ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectRelease && onSelectRelease(rel);
                    setIsDropdownOpen(false);
                  }}
                >
                  {rel}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="finalize-release-nav-btn" type="button" onClick={onFinalizeVersions} disabled={!canFinalizeVersions} title={canFinalizeVersions ? `Finalize versions for ${currentRelease}` : 'Version details are not loaded for this release'}>
          <CheckCircle2 size={14} />
          <span>Finalize versions</span>
        </button>

        {/* Notification Bell */}
        <div className="notifications-wrap">
          <button
            className="notification-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            aria-label="View release alerts"
            aria-expanded={isNotificationsOpen}
            title={`${notifications.length} release alerts`}
          >
            <Bell size={18} />
            {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
          </button>
          {isNotificationsOpen && (
            <div className="notifications-menu" role="dialog" aria-label="Release alerts">
              <div className="notifications-menu-heading">Release alerts</div>
              {notifications.length ? notifications.map((notification) => (
                <button
                  className="notification-item"
                  key={notification.repo.id}
                  type="button"
                  onClick={() => {
                    onNotificationClick?.(notification.repo);
                    setIsNotificationsOpen(false);
                  }}
                >
                  <strong>{notification.title}</strong>
                  <span>{notification.detail}</span>
                </button>
              )) : <p className="notifications-empty">No open version alerts.</p>}
            </div>
          )}
        </div>

        {/* User Profile Info */}
        <div className="user-profile" onClick={onUserClick} title="User Account Settings">
          <div className="avatar-circle">
            {user?.initials || 'JD'}
          </div>
          <div className="user-details">
            <span className="user-name">{user?.name || 'John Doe'}</span>
            <span className="user-role">{user?.role || 'Release Manager'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
