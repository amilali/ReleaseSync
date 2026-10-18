import React, { useState } from 'react';
import { Search, Calendar, Bell, ChevronDown } from 'lucide-react';

export default function Navbar({ 
  searchQuery, 
  onSearchChange, 
  currentRelease, 
  availableReleases, 
  onSelectRelease,
  notifications = [],
  user,
  onNotificationClick,
  onUserClick
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          />
        </div>
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
