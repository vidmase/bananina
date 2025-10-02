/**
 * useImageEditor Hook
 * Centralized state management for image editor
 */

import { useState, useCallback } from 'react';

export interface ImageEditorState {
  // Images
  currentImage: string | null;
  referenceImage: string | null;
  maskImage: string | null;
  
  // View state
  view: 'upload' | 'editor';
  activeTab: string;
  
  // Loading states
  isLoading: boolean;
  isEnhancingPrompt: boolean;
  isFetchingSuggestions: boolean;
  
  // Input
  prompt: string;
  error: string | null;
}

export const useImageEditor = () => {
  const [state, setState] = useState<ImageEditorState>({
    currentImage: null,
    referenceImage: null,
    maskImage: null,
    view: 'upload',
    activeTab: 'edit',
    isLoading: false,
    isEnhancingPrompt: false,
    isFetchingSuggestions: false,
    prompt: '',
    error: null,
  });

  const setImage = useCallback((image: string | null) => {
    setState((prev) => ({ ...prev, currentImage: image }));
  }, []);

  const setReferenceImage = useCallback((image: string | null) => {
    setState((prev) => ({ ...prev, referenceImage: image }));
  }, []);

  const setMaskImage = useCallback((mask: string | null) => {
    setState((prev) => ({ ...prev, maskImage: mask }));
  }, []);

  const setView = useCallback((view: 'upload' | 'editor') => {
    setState((prev) => ({ ...prev, view }));
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setPrompt = useCallback((promptOrUpdater: string | ((prev: string) => string)) => {
    setState((prev) => ({
      ...prev,
      prompt: typeof promptOrUpdater === 'function' ? promptOrUpdater(prev.prompt) : promptOrUpdater
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const resetEditor = useCallback(() => {
    setState({
      currentImage: null,
      referenceImage: null,
      maskImage: null,
      view: 'upload',
      activeTab: 'edit',
      isLoading: false,
      isEnhancingPrompt: false,
      isFetchingSuggestions: false,
      prompt: '',
      error: null,
    });
  }, []);

  return {
    state,
    setState,
    setImage,
    setReferenceImage,
    setMaskImage,
    setView,
    setActiveTab,
    setLoading,
    setPrompt,
    setError,
    resetEditor,
  };
};

export default useImageEditor;

