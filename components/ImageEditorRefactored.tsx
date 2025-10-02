/**
 * ImageEditor (Refactored)
 * Example of how ImageEditor.tsx can be refactored using new components
 */

import React, { useCallback } from 'react';
import { useToast } from './ui';
import {
  EditorToolbar,
  EditorCanvas,
  PromptInput,
  SuggestionsPanel,
  FiltersPanel,
  HistoryPanel,
  PinModal,
  Suggestion,
  Filter,
} from './editor';
import {
  useImageEditor,
  useImageHistory,
  useVoiceInput,
  useImageUpload,
  useKeyboardShortcuts,
} from '../hooks';
import { kieClient } from '../kieClient';
import { geminiClient } from '../geminiClient';

// Quick filters example data
const QUICK_FILTERS: Filter[] = [
  { id: '1', name: 'Vintage', prompt: 'apply a vintage film filter with faded colors and grain' },
  { id: '2', name: 'B&W', prompt: 'convert to a high-contrast black and white image' },
  { id: '3', name: 'HDR', prompt: 'apply a high dynamic range (HDR) effect' },
  { id: '4', name: 'Watercolor', prompt: 'turn into a watercolor painting' },
];

export const ImageEditorRefactored: React.FC = () => {
  const toast = useToast();
  
  // State management hooks
  const { state, setImage, setPrompt, setLoading, setView, resetEditor } = useImageEditor();
  const {
    currentImage,
    canUndo,
    canRedo,
    addToHistory,
    undo,
    redo,
    getHistoryEntries,
    jumpToHistory,
  } = useImageHistory();

  // Voice input
  const { isListening, isSupported: voiceSupported, toggleListening } = useVoiceInput(
    (text) => {
      setPrompt((prev) => (prev.trim() ? `${prev} ${text}` : text));
    }
  );

  // Image upload
  const { isDragOver, handleFileInput, handleDrop, handleDragOver, handleDragLeave } =
    useImageUpload({
      onUpload: (dataUrl) => {
        setImage(dataUrl);
        addToHistory(dataUrl, 'Original');
        setView('editor');
        toast.success('Image loaded successfully!');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'z',
      ctrl: true,
      action: () => {
        const image = undo();
        if (image) {
          setImage(image);
          toast.info('Undo');
        }
      },
      description: 'Undo',
    },
    {
      key: 'y',
      ctrl: true,
      action: () => {
        const image = redo();
        if (image) {
          setImage(image);
          toast.info('Redo');
        }
      },
      description: 'Redo',
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        handleDownload();
      },
      description: 'Download image',
    },
  ]);

  // Handlers
  const handleSubmit = useCallback(async () => {
    if (!currentImage || !state.prompt.trim()) return;

    setLoading(true);
    try {
      const editedImage = await kieClient.generateImage(state.prompt, currentImage);
      setImage(editedImage);
      addToHistory(editedImage, state.prompt);
      toast.success('Image edited successfully!');
      setPrompt('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to edit image');
    } finally {
      setLoading(false);
    }
  }, [currentImage, state.prompt, setLoading, setImage, addToHistory, setPrompt, toast]);

  const handleFilterClick = useCallback(
    async (filter: Filter) => {
      if (!currentImage) return;

      setLoading(true);
      try {
        const editedImage = await kieClient.generateImage(filter.prompt, currentImage);
        setImage(editedImage);
        addToHistory(editedImage, filter.name);
        toast.success(`${filter.name} filter applied!`);
      } catch (error) {
        toast.error('Failed to apply filter');
      } finally {
        setLoading(false);
      }
    },
    [currentImage, setLoading, setImage, addToHistory, toast]
  );

  const handleUndo = useCallback(() => {
    const image = undo();
    if (image) {
      setImage(image);
    }
  }, [undo, setImage]);

  const handleRedo = useCallback(() => {
    const image = redo();
    if (image) {
      setImage(image);
    }
  }, [redo, setImage]);

  const handleDownload = useCallback(() => {
    if (!currentImage) return;

    const link = document.createElement('a');
    link.href = currentImage;
    const mimeType = currentImage.match(/data:(.*?);/)?.[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `bananina-edit.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image downloaded!');
  }, [currentImage, toast]);

  const handleNewImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setImage(dataUrl);
          addToHistory(dataUrl, 'Original');
          setView('editor');
          toast.success('Image loaded!');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [setImage, addToHistory, setView, toast]);

  // Upload view
  if (state.view === 'upload') {
    return (
      <div
        className={`upload-view ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-container">
          <h1>Bananina AI Image Editor</h1>
          <p>Upload an image to start editing with AI</p>
          
          <label className="upload-button">
            Choose Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
          
          <p className="upload-hint">or drag and drop an image here</p>
        </div>
      </div>
    );
  }

  // Editor view
  return (
    <div className="editor-view">
      <EditorToolbar
        canUndo={canUndo}
        canRedo={canRedo}
        hasImage={!!currentImage}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDownload={handleDownload}
        onNewImage={handleNewImage}
      />

      <div className="editor-main">
        <EditorCanvas imageSrc={currentImage} />

        <div className="editor-sidebar">
          <HistoryPanel
            history={getHistoryEntries()}
            currentIndex={getHistoryEntries().findIndex((e) => e.image === currentImage)}
            onHistoryClick={(index) => {
              const image = jumpToHistory(index);
              if (image) setImage(image);
            }}
          />
        </div>
      </div>

      <FiltersPanel filters={QUICK_FILTERS} onFilterClick={handleFilterClick} isLoading={state.isLoading} />

      <PromptInput
        value={state.prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        isLoading={state.isLoading}
        isListening={isListening}
        supportsVoice={voiceSupported}
        onVoiceToggle={toggleListening}
      />
    </div>
  );
};

export default ImageEditorRefactored;



