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

      {/* Footer branding */}
      <div className="sidebar-footer">
        <span className="tagline">You're in good hands.®</span>
      </div>
    </aside>
  );
}
