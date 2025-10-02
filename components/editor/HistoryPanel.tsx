/**
 * HistoryPanel Component
 * Display edit history with thumbnails
 */

import React from 'react';

export interface HistoryEntry {
  id: string;
  image: string;
  timestamp: Date;
  operation?: string;
}

export interface HistoryPanelProps {
  history: HistoryEntry[];
  currentIndex: number;
  onHistoryClick: (index: number) => void;
  onClear?: () => void;
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  currentIndex,
  onHistoryClick,
  onClear,
  className = '',
}) => {
  if (history.length === 0) {
    return (
      <div className={`history-panel empty ${className}`}>
        <p className="history-panel-empty">No history yet</p>
      </div>
    );
  }

  return (
    <div className={`history-panel ${className}`}>
      <div className="history-panel-header">
        <h3 className="history-panel-title">History</h3>
        {onClear && history.length > 1 && (
          <button className="history-panel-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <div className="history-panel-list">
        {history.map((entry, index) => (
          <button
            key={entry.id}
            className={`history-item ${index === currentIndex ? 'active' : ''} ${
              index > currentIndex ? 'future' : ''
            }`}
            onClick={() => onHistoryClick(index)}
            title={entry.operation || `Step ${index + 1}`}
          >
            <img
              src={entry.image}
              alt={`History step ${index + 1}`}
              className="history-item-thumbnail"
              loading="lazy"
            />
            <div className="history-item-info">
              <span className="history-item-label">
                {index === 0 ? 'Original' : entry.operation || `Edit ${index}`}
              </span>
              <span className="history-item-time">
                {formatTime(entry.timestamp)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

export default HistoryPanel;

