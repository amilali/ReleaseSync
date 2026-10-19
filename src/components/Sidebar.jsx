import React from 'react';
import allstateHandsLogo from '../assets/allstate-hands-transparent.png';
import { 
  LayoutDashboard, 
  Layers, 
  Tag, 
  FileText, 
  ShieldCheck, 
  Clock, 
  BarChart3, 
  Bot 
} from 'lucide-react';

export default function Sidebar({ activeNav = 'Dashboard', onNavClick }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Repositories', icon: Layers },
    { name: 'Releases', icon: Tag },
    { name: 'Change Orders', icon: FileText },
    { name: 'Deployments', icon: ShieldCheck },
    { name: 'Code Freeze', icon: Clock },
    { name: 'Reports', icon: BarChart3 },
    { name: 'AI Assistant', icon: Bot },
  ];

  return (
    <aside className="sidebar">
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

      {/* Footer Branding with Allstate Cupped Hands Watermark */}
      <div className="sidebar-footer">
        <svg 
          className="hands-watermark" 
          viewBox="0 0 160 160" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Allstate hands logo representation */}
          <circle cx="80" cy="80" r="70" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3.5" fill="none" />
          {/* Left hand cupping upward */}
          <path 
            d="M 38 98 C 42 74, 58 54, 76 52 C 80 51, 83 55, 81 59 C 78 65, 70 78, 70 88 C 70 94, 75 99, 81 102 C 73 111, 55 116, 42 108 C 39 106, 37 102, 38 98 Z" 
            stroke="rgba(255, 255, 255, 0.65)" 
            strokeWidth="3.5" 
            strokeLinejoin="round" 
            fill="none" 
          />
          {/* Right hand cupping upward & overlapping */}
          <path 
            d="M 122 98 C 118 74, 102 54, 84 52 C 80 51, 77 55, 79 59 C 82 65, 90 78, 90 88 C 90 94, 85 99, 79 102 C 87 111, 105 116, 118 108 C 121 106, 123 102, 122 98 Z" 
            stroke="rgba(255, 255, 255, 0.65)" 
            strokeWidth="3.5" 
            strokeLinejoin="round" 
            fill="none" 
          />
          {/* Palm inner details */}
          <path 
            d="M 52 82 C 60 76, 70 79, 74 88" 
            stroke="rgba(255, 255, 255, 0.5)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          <path 
            d="M 108 82 C 100 76, 90 79, 86 88" 
            stroke="rgba(255, 255, 255, 0.5)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          {/* Subtle connecting pulse line */}
          <path 
            d="M 64 114 Q 80 124 96 114" 
            stroke="rgba(255, 255, 255, 0.45)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
        </svg>
        <span className="tagline">You're in good hands.®</span>
      </div>
    </aside>
  );
}
