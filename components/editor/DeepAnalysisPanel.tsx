/**
 * Deep Analysis Panel Component
 * Provides comprehensive AI-powered image analysis with context-aware suggestions
 * Uses Gemini Vision API for deep understanding of image content
 */

import React, { useState } from 'react';
import { geminiClient } from '../../geminiClient';

// Icons
const ScanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <circle cx="12" cy="12" r="1"/>
  </svg>
);

const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

export interface DeepAnalysisPanelProps {
  currentImage: string | null;
  onApplyPrompt: (prompt: string) => void;
}

interface AnalysisResult {
  description: string;
  mainSubject: string;
  style: string;
  mood: string;
  colorPalette: string[];
  composition: {
    rule: string;
    quality: string;
    notes: string;
  };
  lighting: {
    type: string;
    quality: string;
    notes: string;
  };
  quality: {
    sharpness: string;
    exposure: string;
    noise: string;
  };
  strengths: string[];
  improvements: string[];
  editingSuggestions: Array<{
    title: string;
    description: string;
    prompt: string;
    category: string;
    priority: string;
  }>;
  detectedObjects: string[];
  estimatedScene: string;
  timeOfDay?: string;
  weather?: string;
}

export const DeepAnalysisPanel: React.FC<DeepAnalysisPanelProps> = ({
  currentImage,
  onApplyPrompt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performDeepAnalysis = async () => {
    if (!currentImage) {
      setError('No image available to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setIsExpanded(true);

    try {
      const result = await geminiClient.comprehensiveAnalysis(currentImage);
      setAnalysis(result);
    } catch (err) {
      console.error('Deep analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="deep-analysis-panel">
      <div 
        className="analysis-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          cursor: 'pointer',
          borderRadius: '8px',
          marginBottom: '0.5rem',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
          <ScanIcon />
          <span style={{ fontWeight: 600 }}>Deep AI Analysis</span>
        </div>
        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </div>

      {isExpanded && (
        <div className="analysis-content" style={{ padding: '1rem' }}>
          {!analysis && !isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ 
                width: '60px', 
                height: '60px', 
                margin: '0 auto 1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ScanIcon />
              </div>
              <p style={{ color: 'var(--text-secondary, #999)', marginBottom: '1.5rem' }}>
                Get comprehensive AI-powered insights about your image
              </p>
              <button
                onClick={performDeepAnalysis}
                disabled={!currentImage}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentImage ? 'pointer' : 'not-allowed',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  opacity: currentImage ? 1 : 0.5,
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentImage) e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Start Deep Analysis
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="spinner" style={{
                width: '40px',
                height: '40px',
                margin: '0 auto 1rem',
                border: '4px solid rgba(102, 126, 234, 0.1)',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
              <p style={{ color: 'var(--text-secondary, #999)' }}>
                Analyzing image with Gemini AI...
              </p>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {error && (
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '6px',
              color: '#ff3b30',
            }}>
              {error}
            </div>
          )}

          {analysis && (
            <div className="analysis-results">
              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LightbulbIcon />
                  Overview
                </h4>
                <p style={{ 
                  color: 'var(--text-secondary, #ccc)', 
                  lineHeight: 1.6,
                  padding: '0.75rem',
                  background: 'var(--surface-color, #1a1a1a)',
                  borderRadius: '6px',
                  borderLeft: '3px solid #667eea',
                }}>
                  {analysis.description}
                </p>
              </div>

              {/* Context Tags */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                flexWrap: 'wrap',
                marginBottom: '1.5rem',
              }}>
                <span style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(102, 126, 234, 0.15)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#667eea',
                }}>
                  {analysis.mainSubject}
                </span>
                <span style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(118, 75, 162, 0.15)',
                  border: '1px solid rgba(118, 75, 162, 0.3)',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#764ba2',
                }}>
                  {analysis.style}
                </span>
                <span style={{
                  padding: '0.4rem 0.8rem',
                  background: 'rgba(102, 126, 234, 0.15)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  color: '#667eea',
                }}>
                  {analysis.mood}
                </span>
              </div>

              {/* AI Suggestions */}
              {analysis.editingSuggestions && analysis.editingSuggestions.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    🎯 Context-Aware Suggestions
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {analysis.editingSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '1rem',
                          background: 'var(--surface-color, #1a1a1a)',
                          border: '1px solid var(--border-color, #333)',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#667eea';
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color, #333)';
                          e.currentTarget.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.5rem',
                        }}>
                          <h5 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>
                            {suggestion.title}
                          </h5>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: suggestion.priority === 'high' 
                              ? 'rgba(255, 59, 48, 0.2)' 
                              : suggestion.priority === 'medium'
                              ? 'rgba(255, 149, 0, 0.2)'
                              : 'rgba(99, 102, 241, 0.2)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: suggestion.priority === 'high'
                              ? '#ff3b30'
                              : suggestion.priority === 'medium'
                              ? '#ff9500'
                              : '#6366f1',
                            fontWeight: 600,
                          }}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <p style={{ 
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary, #999)',
                          margin: '0.5rem 0',
                          lineHeight: 1.5,
                        }}>
                          {suggestion.description}
                        </p>
                        <button
                          onClick={() => onApplyPrompt(suggestion.prompt)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            width: '100%',
                            marginTop: '0.5rem',
                          }}
                        >
                          Apply This Edit
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                {analysis.strengths && analysis.strengths.length > 0 && (
                  <div>
                    <h5 style={{ 
                      fontSize: '0.85rem', 
                      marginBottom: '0.5rem',
                      color: '#4ade80',
                    }}>
                      ✨ Strengths
                    </h5>
                    <ul style={{ 
                      margin: 0, 
                      padding: '0 0 0 1.2rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary, #999)',
                      lineHeight: 1.8,
                    }}>
                      {analysis.strengths.slice(0, 3).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.improvements && analysis.improvements.length > 0 && (
                  <div>
                    <h5 style={{ 
                      fontSize: '0.85rem', 
                      marginBottom: '0.5rem',
                      color: '#fbbf24',
                    }}>
                      💡 Improvements
                    </h5>
                    <ul style={{ 
                      margin: 0, 
                      padding: '0 0 0 1.2rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary, #999)',
                      lineHeight: 1.8,
                    }}>
                      {analysis.improvements.slice(0, 3).map((i, idx) => (
                        <li key={idx}>{i}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Scene Detection */}
              {analysis.detectedObjects && analysis.detectedObjects.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h5 style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    🔍 Detected Objects
                  </h5>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {analysis.detectedObjects.slice(0, 6).map((obj, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: 'var(--surface-color, #1a1a1a)',
                          border: '1px solid var(--border-color, #333)',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary, #999)',
                        }}
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Re-analyze Button */}
              <button
                onClick={performDeepAnalysis}
                style={{
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#667eea',
                  border: '1px solid #667eea',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  width: '100%',
                  marginTop: '1rem',
                }}
              >
                Re-analyze Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeepAnalysisPanel;

