/**
 * FiltersPanel Component
 * Quick filters and artistic styles panel
 */

import React from 'react';

export interface Filter {
  id: string;
  name: string;
  prompt: string;
  category?: string;
  icon?: string;
}

export interface FiltersPanelProps {
  filters: Filter[];
  onFilterClick: (filter: Filter) => void;
  isLoading?: boolean;
  className?: string;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  filters,
  onFilterClick,
  isLoading = false,
  className = '',
}) => {
  return (
    <div className={`filters-panel ${className}`}>
      <h3 className="filters-panel-title">Quick Filters</h3>
      
      <div className="filters-panel-grid">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className="filter-card"
            onClick={() => onFilterClick(filter)}
            disabled={isLoading}
            title={filter.prompt}
          >
            {filter.icon && <span className="filter-card-icon">{filter.icon}</span>}
            <span className="filter-card-name">{filter.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FiltersPanel;

