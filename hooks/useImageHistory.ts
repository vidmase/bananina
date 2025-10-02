/**
 * useImageHistory Hook
 * Manage undo/redo history for image edits
 */

import { useState, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  image: string;
  timestamp: Date;
  operation?: string;
}

export const useImageHistory = (maxEntries: number = 50) => {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback(
    (image: string, operation?: string) => {
      setHistory((prev) => {
        // Remove any history after current index (when undoing then making new edits)
        const newHistory = prev.slice(0, historyIndex + 1);
        
        // Add new entry
        newHistory.push(image);
        
        // Limit history size
        if (newHistory.length > maxEntries) {
          return newHistory.slice(-maxEntries);
        }
        
        return newHistory;
      });
      
      setHistoryIndex((prev) => {
        const newIndex = prev + 1;
        return newIndex >= maxEntries ? maxEntries - 1 : newIndex;
      });
    },
    [historyIndex, maxEntries]
  );

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [history, historyIndex]);

  const jumpToHistory = useCallback(
    (index: number) => {
      if (index >= 0 && index < history.length) {
        setHistoryIndex(index);
        return history[index];
      }
      return null;
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const resetHistory = useCallback((initialImage: string) => {
    setHistory([initialImage]);
    setHistoryIndex(0);
  }, []);

  const getHistoryEntries = useCallback((): HistoryEntry[] => {
    return history.map((image, index) => ({
      id: `history-${index}`,
      image,
      timestamp: new Date(Date.now() - (history.length - index) * 60000), // Mock timestamp
      operation: index === 0 ? 'Original' : `Edit ${index}`,
    }));
  }, [history]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const currentImage = history[historyIndex] || null;

  return {
    history,
    historyIndex,
    currentImage,
    canUndo,
    canRedo,
    addToHistory,
    undo,
    redo,
    jumpToHistory,
    clearHistory,
    resetHistory,
    getHistoryEntries,
  };
};

export default useImageHistory;



