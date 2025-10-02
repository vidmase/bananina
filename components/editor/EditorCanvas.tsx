/**
 * EditorCanvas Component
 * Main canvas for displaying and interacting with images
 */

import React, { useState, useCallback } from 'react';

export interface EditorCanvasProps {
  imageSrc: string | null;
  onImageClick?: () => void;
  allowZoom?: boolean;
  allowPan?: boolean;
  className?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  imageSrc,
  onImageClick,
  allowZoom = true,
  allowPan = true,
  className = '',
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!allowZoom) return;

      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoomLevel((prev) => Math.max(0.5, Math.min(5, prev * delta)));
    },
    [allowZoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!allowPan || zoomLevel <= 1) return;

      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    },
    [allowPan, zoomLevel, panPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || !allowPan) return;

      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, allowPan, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (allowZoom) {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [allowZoom]);

  if (!imageSrc) {
    return (
      <div className={`editor-canvas empty ${className}`}>
        <div className="editor-canvas-empty-state">
          <p>No image loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`editor-canvas ${className} ${isDragging ? 'dragging' : ''}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div className="editor-canvas-wrapper">
        <img
          src={imageSrc}
          alt="Edited image"
          className="editor-canvas-image"
          style={{
            transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`,
            cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
          }}
          onClick={onImageClick}
          draggable={false}
        />
      </div>

      {allowZoom && zoomLevel !== 1 && (
        <div className="editor-canvas-zoom-indicator">
          {Math.round(zoomLevel * 100)}%
        </div>
      )}
    </div>
  );
};

export default EditorCanvas;

