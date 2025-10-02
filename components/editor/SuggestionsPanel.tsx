/**
 * SuggestionsPanel Component
 * Display AI-generated suggestions for image editing
 */

import React from 'react';
import { Button } from '../ui';

export interface Suggestion {
  id: string;
  name: string;
  prompt: string;
  status?: 'loading' | 'success' | 'error';
  generatedSuggestion?: {
    name: string;
    prompt: string;
  };
}

export interface SuggestionsPanelProps {
  suggestions: Suggestion[] | null;
  isLoading?: boolean;
  onSuggestionClick: (suggestion: Suggestion) => void;
  onDismiss?: () => void;
  className?: string;
}

const SpinnerIcon = () => (
  <svg className="spinner" viewBox="0 0 24 24" width="20" height="20">
    <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="3" />
  </svg>
);

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  suggestions,
  isLoading = false,
  onSuggestionClick,
  onDismiss,
  className = '',
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`suggestions-panel ${className}`}>
      <div className="suggestions-panel-header">
        <h3 className="suggestions-panel-title">AI Suggestions</h3>
        {onDismiss && (
          <button
            className="suggestions-panel-close"
            onClick={onDismiss}
            aria-label="Close suggestions"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L10 9.293l4.646-4.647a.5.5 0 0 1 .708.708L10.707 10l4.647 4.646a.5.5 0 0 1-.708.708L10 10.707l-4.646 4.647a.5.5 0 0 1-.708-.708L9.293 10 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </button>
        )}
      </div>

      <div className="suggestions-panel-content">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
          />
        ))}
      </div>
    </div>
  );
};

const SuggestionCard: React.FC<{
  suggestion: Suggestion;
  onClick: () => void;
}> = ({ suggestion, onClick }) => {
  const displaySuggestion = suggestion.generatedSuggestion || suggestion;
  const isLoading = suggestion.status === 'loading';

  return (
    <button
      className={`suggestion-card ${isLoading ? 'loading' : ''}`}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="suggestion-card-loading">
          <SpinnerIcon />
          <span>Generating...</span>
        </div>
      ) : (
        <>
          <h4 className="suggestion-card-name">{displaySuggestion.name}</h4>
          <p className="suggestion-card-prompt">{displaySuggestion.prompt}</p>
        </>
      )}
    </button>
  );
};

export default SuggestionsPanel;

