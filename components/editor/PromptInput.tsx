/**
 * PromptInput Component
 * Input area for prompts with voice recognition and enhance features
 */

import React, { useRef } from 'react';
import { Button } from '../ui';

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onEnhance?: () => void;
  onVoiceToggle?: () => void;
  isLoading?: boolean;
  isEnhancing?: boolean;
  isListening?: boolean;
  supportsVoice?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MicIcon = ({ isActive }: { isActive: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isActive ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 2-2.5 2.5 3 3L19 5" />
    <path d="m14 4-1 1" />
    <path d="m10 8-1 1" />
    <path d="m20 10-1 1" />
    <path d="m18 12-1 1" />
    <path d="m12 18-1 1" />
    <path d="m8 22-1-1" />
    <path d="m4 18-1 1" />
    <path d="m2 16 1-1" />
    <path d="M9 3.5c-2.42 2.4-2.42 6.3 0 8.7 .9.9 2.1.9 3 0" />
    <path d="M14.5 9c-2.42 2.4-2.42 6.3 0 8.7.9.9 2.1.9 3 0" />
    <path d="M22 22s-4-4-7-4" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  onEnhance,
  onVoiceToggle,
  isLoading = false,
  isEnhancing = false,
  isListening = false,
  supportsVoice = false,
  disabled = false,
  placeholder = 'Describe how you want to edit your image...',
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className={`prompt-input-container ${className}`}>
      <div className="prompt-input-wrapper">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`prompt-input ${isListening ? 'listening' : ''}`}
          rows={1}
        />
        
        <div className="prompt-input-actions">
          {supportsVoice && onVoiceToggle && (
            <Button
              variant="ghost"
              size="sm"
              icon={<MicIcon isActive={isListening} />}
              onClick={onVoiceToggle}
              disabled={isLoading}
              className={isListening ? 'voice-active' : ''}
              title={isListening ? 'Stop recording' : 'Voice input'}
              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
            />
          )}

          {onEnhance && (
            <Button
              variant="ghost"
              size="sm"
              icon={<SparklesIcon />}
              onClick={onEnhance}
              disabled={!value.trim() || isLoading || isEnhancing}
              loading={isEnhancing}
              title="Enhance prompt with AI"
              aria-label="Enhance prompt"
            />
          )}

          <Button
            variant="primary"
            size="sm"
            icon={<SendIcon />}
            onClick={onSubmit}
            disabled={!value.trim() || isLoading}
            loading={isLoading}
            title="Generate (Enter)"
            aria-label="Generate image"
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;

