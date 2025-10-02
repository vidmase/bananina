/**
 * GeminiAnalysisPanel Component
 * Deep image analysis using Gemini Vision API
 * Provides comprehensive, context-aware suggestions
 */

import React, { useState } from 'react';
import { Button } from '../ui';

// Brain/Analysis Icon
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface ImageAnalysis {
  // Core Analysis
  description: string;
  mainSubject: string;
  style: string;
  mood: string;
  colorPalette: string[];
  
  // Technical Details
  composition: {
    rule: string;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    notes: string;
  };
  lighting: {
    type: string;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    notes: string;
  };
  quality: {
    sharpness: 'poor' | 'fair' | 'good' | 'excellent';
    exposure: 'underexposed' | 'correct' | 'overexposed';
    noise: 'high' | 'medium' | 'low';
  };
  
  // Suggestions
  strengths: string[];
  improvements: string[];
  editingSuggestions: Array<{
    title: string;
    description: string;
    prompt: string;
    category: 'composition' | 'color' | 'lighting' | 'style' | 'quality';
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // Metadata
  detectedObjects: string[];
  estimatedScene: string;
  timeOfDay?: string;
  weather?: string;
}

export interface GeminiAnalysisPanelProps {
  currentImage: string | null;
  onApplyPrompt: (prompt: string) => void;
}

export const GeminiAnalysisPanel: React.FC<GeminiAnalysisPanelProps> = ({
  currentImage,
  onApplyPrompt,
}) => {
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async () => {
    if (!currentImage) {
      setError('No image loaded. Please upload an image first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Import geminiClient dynamically
      const { geminiClient } = await import('../../geminiClient');
      
      // Call a new comprehensive analysis method
      const result = await geminiClient.comprehensiveAnalysis(currentImage);
      
      setAnalysis(result);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="gemini-analysis-panel">
      <div className="panel-header">
        <div className="panel-title">
          <BrainIcon />
          <span>Gemini Vision Analysis</span>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={analyzeImage}
          disabled={!currentImage || isAnalyzing}
          icon={<SparklesIcon />}
        >
          {isAnalyzing ? 'Analyzing...' : 'Deep Analyze'}
        </Button>
      </div>

      {error && (
        <div className="analysis-error">
          <p>{error}</p>
        </div>
      )}

      {!analysis && !isAnalyzing && !error && (
        <div className="analysis-placeholder">
          <BrainIcon />
          <p>Click "Deep Analyze" to get comprehensive AI-powered insights about your image</p>
          <ul className="feature-list">
            <li><CheckIcon /> Scene & subject detection</li>
            <li><CheckIcon /> Composition analysis</li>
            <li><CheckIcon /> Lighting & color evaluation</li>
            <li><CheckIcon /> Context-aware suggestions</li>
            <li><CheckIcon /> Ready-to-use edit prompts</li>
          </ul>
        </div>
      )}

      {isAnalyzing && (
        <div className="analysis-loading">
          <div className="loading-spinner"></div>
          <p>Analyzing image with Gemini Vision...</p>
          <span className="loading-subtext">This may take a few moments</span>
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          {/* Main Description */}
          <div className="analysis-section">
            <h4>Image Overview</h4>
            <p className="analysis-description">{analysis.description}</p>
            <div className="analysis-tags">
              <span className="tag"><strong>Subject:</strong> {analysis.mainSubject}</span>
              <span className="tag"><strong>Style:</strong> {analysis.style}</span>
              <span className="tag"><strong>Mood:</strong> {analysis.mood}</span>
            </div>
          </div>

          {/* Technical Analysis */}
          <div className="analysis-section">
            <h4>Technical Analysis</h4>
            <div className="technical-grid">
              <div className="technical-item">
                <span className="label">Composition</span>
                <span className={`quality-badge ${analysis.composition.quality}`}>
                  {analysis.composition.quality}
                </span>
                <p className="notes">{analysis.composition.notes}</p>
              </div>
              <div className="technical-item">
                <span className="label">Lighting</span>
                <span className={`quality-badge ${analysis.lighting.quality}`}>
                  {analysis.lighting.quality}
                </span>
                <p className="notes">{analysis.lighting.notes}</p>
              </div>
              <div className="technical-item">
                <span className="label">Sharpness</span>
                <span className={`quality-badge ${analysis.quality.sharpness}`}>
                  {analysis.quality.sharpness}
                </span>
              </div>
              <div className="technical-item">
                <span className="label">Exposure</span>
                <span className="quality-badge">{analysis.quality.exposure}</span>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          {analysis.colorPalette && analysis.colorPalette.length > 0 && (
            <div className="analysis-section">
              <h4>Color Palette</h4>
              <div className="color-palette">
                {analysis.colorPalette.map((color, idx) => (
                  <div
                    key={idx}
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {analysis.strengths && analysis.strengths.length > 0 && (
            <div className="analysis-section">
              <h4>✨ Strengths</h4>
              <ul className="strengths-list">
                {analysis.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {analysis.improvements && analysis.improvements.length > 0 && (
            <div className="analysis-section">
              <h4>💡 Areas for Improvement</h4>
              <ul className="improvements-list">
                {analysis.improvements.map((improvement, idx) => (
                  <li key={idx}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Editing Suggestions */}
          {analysis.editingSuggestions && analysis.editingSuggestions.length > 0 && (
            <div className="analysis-section">
              <h4>🎨 AI Edit Suggestions</h4>
              <div className="editing-suggestions">
                {analysis.editingSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={`suggestion-card priority-${suggestion.priority}`}
                  >
                    <div className="suggestion-header">
                      <h5>{suggestion.title}</h5>
                      <span className={`category-badge ${suggestion.category}`}>
                        {suggestion.category}
                      </span>
                    </div>
                    <p className="suggestion-description">{suggestion.description}</p>
                    <div className="suggestion-footer">
                      <span className={`priority-indicator priority-${suggestion.priority}`}>
                        {suggestion.priority} priority
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onApplyPrompt(suggestion.prompt)}
                      >
                        Apply Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scene Detection */}
          {(analysis.detectedObjects?.length > 0 || analysis.estimatedScene) && (
            <div className="analysis-section">
              <h4>🔍 Scene Detection</h4>
              {analysis.estimatedScene && (
                <p><strong>Scene:</strong> {analysis.estimatedScene}</p>
              )}
              {analysis.timeOfDay && (
                <p><strong>Time of Day:</strong> {analysis.timeOfDay}</p>
              )}
              {analysis.weather && (
                <p><strong>Weather:</strong> {analysis.weather}</p>
              )}
              {analysis.detectedObjects && analysis.detectedObjects.length > 0 && (
                <div className="detected-objects">
                  <strong>Detected:</strong>
                  <div className="object-tags">
                    {analysis.detectedObjects.map((obj, idx) => (
                      <span key={idx} className="object-tag">{obj}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reset Button */}
          <div className="analysis-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnalysis(null)}
              fullWidth
            >
              Clear Analysis
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={analyzeImage}
              fullWidth
            >
              Re-analyze
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiAnalysisPanel;



