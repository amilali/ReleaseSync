import React, { useState } from 'react';
import allstateHandsLogo from '../assets/allstate-hands-transparent.png';
import { 
  LayoutDashboard, 
  Layers, 
  Tag, 
  FileText, 
  ShieldCheck, 
  Clock, 
  BarChart3, 
  Sparkles,
  ArrowLeft,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export default function Sidebar({ activeNav = 'Dashboard', onNavClick, onAskAI, aiMode = false, onBack, onFullScreen, assistant }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Repositories', icon: Layers },
    { name: 'Releases', icon: Tag },
    { name: 'Change Orders', icon: FileText },
    { name: 'Deployments', icon: ShieldCheck },
    { name: 'Code Freeze', icon: Clock },
    { name: 'Reports', icon: BarChart3 },
    { name: 'AI Assistant', icon: Sparkles },
  ];

  return (
    <aside className={`sidebar ${aiMode ? 'sidebar-ai-mode' : ''} ${isCollapsed && !aiMode ? 'sidebar-collapsed' : ''}`}>
      {aiMode ? (
        <div className="sidebar-ai-shell">
          <header className="sidebar-ai-header">
            <button className="sidebar-ai-back" type="button" onClick={onBack}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="sidebar-ai-brand"><Sparkles size={15} /><span>Ask AI</span></div>
            <button className="sidebar-ai-fullscreen" type="button" onClick={onFullScreen} aria-label="Open full-screen AI assistant" title="Open full screen">
              <Maximize2 size={15} />
            </button>
          </header>
          <div className="sidebar-ai-content">{assistant}</div>
        </div>
      ) : (
        <>
      <div>
        <div className="sidebar-header">
          {/* Allstate Logo Text in Sidebar */}
          <div className="sidebar-allstate-logo">
            <img src={allstateHandsLogo} alt="" aria-hidden="true" />
            <svg viewBox="0 0 140 32" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="24" fill="#ffffff" fontFamily="'Inter', 'Plus Jakarta Sans', sans-serif" fontSize="23" fontWeight="800" letterSpacing="-0.5">
                Allstate
              </text>
            </svg>
          </div>
          <button
            className="sidebar-collapse-btn"
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.name;
            return (
              <button
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => onNavClick && onNavClick(item.name)}
                title={item.name}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer branding */}
      <div className="sidebar-footer">
        <button
          className="table-ai-btn ask-ai-btn sidebar-ask-ai-btn"
          type="button"
          onClick={onAskAI}
          title="Open the AI Assistant"
        >
          <Sparkles size={14} />
          <span>Ask AI</span>
        </button>
        <span className="tagline">You're in good hands.®</span>
      </div>
        </>
      )}
    </aside>
  );
}
