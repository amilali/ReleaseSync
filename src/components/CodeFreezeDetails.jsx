import React from 'react';
import { Calendar, Edit3 } from 'lucide-react';

export default function CodeFreezeDetails({ freezeDetails, onEdit }) {
  if (!freezeDetails) return null;

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Calendar size={17} color="#2563eb" />
          <span>Code Freeze Details</span>
        </div>
        <button 
          className="panel-header-btn"
          onClick={onEdit}
          title="Edit freeze policy"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>
      </div>

      {/* Date Banner */}
      <div className="freeze-date-banner">
        <div className="freeze-date-left">
          <span className="freeze-sublabel">Code Freeze Date</span>
          <div className="freeze-timestamp">
            <Calendar size={14} color="#64748b" />
            <span>{freezeDetails.date}</span>
          </div>
        </div>

        <div className="freeze-date-right">
          <div className="days-sub">Days Since Freeze</div>
          <div className="days-count">
            {freezeDetails.daysSinceFreeze} <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>days</span>
          </div>
        </div>
      </div>

      {/* 3 Stats Grid */}
      <div className="freeze-stats-grid">
        {freezeDetails.stats.map((stat, i) => (
          <div className="freeze-stat-box" key={i}>
            <span className="freeze-stat-label">{stat.label}</span>
            <span className="freeze-stat-num" style={{ color: stat.color }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
