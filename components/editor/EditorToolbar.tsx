/**
 * EditorToolbar Component
 * Top toolbar with undo/redo, download, and other actions
 */

import React from 'react';
import { Button } from '../ui';

export interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  hasImage: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDownload: () => void;
  onNewImage: () => void;
  className?: string;
}

const UndoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

const RedoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 7v6h-6" />
    <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3-2.3" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  canUndo,
  canRedo,
  hasImage,
  onUndo,
  onRedo,
  onDownload,
  onNewImage,
  className = '',
}) => {
  return (
    <div className={`editor-toolbar ${className}`}>
      <div className="editor-toolbar-left">
        <h1 className="editor-logo">Bananina</h1>
      </div>

      <div className="editor-toolbar-center">
        <div className="editor-toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            icon={<UndoIcon />}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            Undo
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={<RedoIcon />}
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            Redo
          </Button>
        </div>
      </div>

      <div className="editor-toolbar-right">
        <div className="editor-toolbar-group">
          <Button
            variant="ghost"
            size="sm"
            icon={<UploadIcon />}
            onClick={onNewImage}
            title="Upload new image"
          >
            New Image
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<DownloadIcon />}
            onClick={onDownload}
            disabled={!hasImage}
            title="Download image"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;

