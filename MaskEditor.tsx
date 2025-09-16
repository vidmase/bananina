/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Part } from "@google/genai";

interface MaskEditorProps {
  imageSrc: string;
  initialMaskSrc: string | null;
  onSave: (maskDataUrl: string) => void;
  onCancel: () => void;
  ai: GoogleGenAI;
}

const base64ToPart = (base64DataUrl: string): Part | null => {
  const match = base64DataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  return { inlineData: { mimeType: match[1], data: match[2] } };
};

const MaskEditor: React.FC<MaskEditorProps> = ({ imageSrc, initialMaskSrc, onSave, onCancel, ai }) => {
  const [isSavingMask, setIsSavingMask] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(40);
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState<boolean>(false);
  const [isDetectingObject, setIsDetectingObject] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<{ x: number, y: number } | null>(null);
  const [isMaskPresent, setIsMaskPresent] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimatingMask, setIsAnimatingMask] = useState<boolean>(false);

  // Masking Canvas Logic
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const canvasDimensionsRef = useRef<{width: number; height: number;}>({width: 0, height: 0});

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAutoSelecting) return;
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      setIsMaskPresent(true);
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const drawToCanvas = useCallback((
    maskImg: HTMLImageElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    logicalWidth: number,
    logicalHeight: number
  ) => {
    const { width, height } = canvas; // physical dimensions
    // This mask is B&W, we need to draw it as the red overlay for editing
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    // Draw the full-resolution mask and scale it down to the physical dimensions of our display canvas
    tempCtx.drawImage(maskImg, 0, 0, width, height);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // If pixel is not black (i.e., part of the mask)
      if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
        data[i] = 255;     // R
        data[i + 1] = 0;   // G
        data[i + 2] = 0;   // B
        data[i + 3] = 255 * 0.7; // Alpha
      } else {
        data[i + 3] = 0; // Make black pixels transparent
      }
    }
    tempCtx.putImageData(imageData, 0, 0);

    // Draw the processed temp canvas onto the main (scaled) mask canvas context, using logical dimensions
    ctx.drawImage(tempCanvas, 0, 0, logicalWidth, logicalHeight);
  }, []);

  const handleAutoSelect = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageSrc) return;

    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    setIsDetectingObject(true);
    setError(null);

    try {
      // 1. Load original image to get its dimensions
      const originalImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageSrc;
      });
      const { naturalWidth, naturalHeight } = originalImage;

      // 2. Correctly scale click coordinates from displayed canvas to original image
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const scaleX = naturalWidth / rect.width;
      const scaleY = naturalHeight / rect.height;
      const originalX = Math.round(x * scaleX);
      const originalY = Math.round(y * scaleY);

      // 3. Create a new canvas with a visual marker
      const markerCanvas = document.createElement('canvas');
      markerCanvas.width = naturalWidth;
      markerCanvas.height = naturalHeight;
      const ctx = markerCanvas.getContext('2d');
      if (!ctx) throw new Error("Could not create marker canvas.");

      // Draw image
      ctx.drawImage(originalImage, 0, 0);

      // Draw marker
      const markerRadius = Math.max(5, Math.min(naturalWidth, naturalHeight) * 0.005);
      ctx.fillStyle = '#FF00FF'; // Bright magenta
      ctx.beginPath();
      ctx.arc(originalX, originalY, markerRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = markerRadius * 0.4;
      ctx.stroke();

      // 4. Convert to base64 and create API Part
      const markedImageBase64 = markerCanvas.toDataURL('image/jpeg');
      const imagePart = base64ToPart(markedImageBase64);
      if (!imagePart) throw new Error("Could not process the marked image.");

      // 5. Create new prompt referring to the visual marker
      const prompt = "You are an expert photo editing assistant specializing in high-quality object segmentation. In the provided image, the user has marked a point with a magenta circle. Generate a precise, pixel-perfect, black and white mask for the primary object located at that point. The main object under the marker should be completely white (#FFFFFF). Everything else, including other objects and the background, must be completely black (#000000). The mask's edges must follow the object's contours perfectly. If multiple objects are layered, select only the topmost object under the marker. Return ONLY the mask image.";

      // 6. Call API
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
      });

      // 7. Process response
      const maskPart = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (maskPart && maskPart.inlineData) {
        const maskImageData = `data:${maskPart.inlineData.mimeType};base64,${maskPart.inlineData.data}`;
        const maskImg = new Image();
        maskImg.src = maskImageData;
        maskImg.onload = () => {
          const maskCanvas = maskCanvasRef.current;
          const maskCtx = maskCanvas?.getContext('2d');
          if (maskCanvas && maskCtx) {
            const { width: logicalWidth, height: logicalHeight } = canvasDimensionsRef.current;
            maskCtx.clearRect(0, 0, logicalWidth, logicalHeight);
            drawToCanvas(maskImg, maskCanvas, maskCtx, logicalWidth, logicalHeight);
            setIsMaskPresent(true);
          }
        };
      } else {
        throw new Error("AI did not return a valid mask.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to auto-select object.");
      console.error(err);
    } finally {
      setIsDetectingObject(false);
      setIsAutoSelecting(false); // Switch back to brush tool
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isErasing) {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // Mask color
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
    }

    // Draw a line from the last point to the current point
    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else { // If it's just a click, draw a circle
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPointRef.current = { x, y };
  };

  useEffect(() => {
    if (!imageSrc) return;

    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onerror = () => {
      setError('Could not load image into the editor.');
      onCancel();
    };

    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      const container = imageCanvas.parentElement;
      if (!container) return;

      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
      const aspectRatio = naturalWidth / naturalHeight;
      let canvasWidth = containerWidth;
      let canvasHeight = containerWidth / aspectRatio;

      if (canvasHeight > containerHeight) {
        canvasHeight = containerHeight;
        canvasWidth = containerHeight * aspectRatio;
      }
      
      canvasDimensionsRef.current = { width: canvasWidth, height: canvasHeight };
      const dpr = window.devicePixelRatio || 1;

      // Set up image canvas
      imageCanvas.width = canvasWidth * dpr;
      imageCanvas.height = canvasHeight * dpr;
      imageCanvas.style.width = `${canvasWidth}px`;
      imageCanvas.style.height = `${canvasHeight}px`;
      const imageCtx = imageCanvas.getContext('2d');
      if (imageCtx) {
        imageCtx.scale(dpr, dpr);
        imageCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      }

      // Set up mask canvas
      maskCanvas.width = canvasWidth * dpr;
      maskCanvas.height = canvasHeight * dpr;
      maskCanvas.style.width = `${canvasWidth}px`;
      maskCanvas.style.height = `${canvasHeight}px`;
      const maskCtx = maskCanvas.getContext('2d');

      if (maskCtx) {
        maskCtx.scale(dpr, dpr);
        maskCtx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear before drawing

        if (initialMaskSrc) {
          const maskImg = new Image();
          maskImg.crossOrigin = "anonymous";
          maskImg.src = initialMaskSrc;
          maskImg.onload = () => {
            drawToCanvas(maskImg, maskCanvas, maskCtx, canvasWidth, canvasHeight);
            setIsMaskPresent(true);
          };
        } else {
          setIsMaskPresent(false);
        }
      }
    }

    img.src = imageSrc;
  }, [imageSrc, initialMaskSrc, onCancel, drawToCanvas]);

  const handleSaveMask = () => {
    const maskCanvas = maskCanvasRef.current;
    const sourceImage = imageSrc;
    if (!maskCanvas || !sourceImage) return;

    setIsSavingMask(true);

    const originalImage = new Image();
    originalImage.crossOrigin = "anonymous";

    originalImage.onload = () => {
      const { naturalWidth, naturalHeight } = originalImage;

      const finalMaskCanvas = document.createElement('canvas');
      finalMaskCanvas.width = naturalWidth;
      finalMaskCanvas.height = naturalHeight;
      const finalCtx = finalMaskCanvas.getContext('2d', { willReadFrequently: true });

      if (!finalCtx) {
        setError("Could not create the final mask.");
        setIsSavingMask(false);
        return;
      }

      // Draw the user's potentially smaller, high-DPR mask onto the full-size canvas, scaling it up.
      finalCtx.drawImage(maskCanvas, 0, 0, naturalWidth, naturalHeight);

      const imageData = finalCtx.getImageData(0, 0, naturalWidth, naturalHeight);
      const data = imageData.data;

      // Create new ImageData for the B&W mask to avoid modifying the original
      const maskImageData = finalCtx.createImageData(naturalWidth, naturalHeight);
      const maskData = maskImageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Check the alpha channel of the drawn (red) mask overlay
        if (data[i + 3] > 0) { // If pixel is not transparent, make it white
          maskData[i] = 255; maskData[i + 1] = 255; maskData[i + 2] = 255; maskData[i + 3] = 255;
        } else { // Otherwise, make it black
          maskData[i] = 0; maskData[i + 1] = 0; maskData[i + 2] = 0; maskData[i + 3] = 255;
        }
      }

      finalCtx.putImageData(maskImageData, 0, 0);

      onSave(finalMaskCanvas.toDataURL('image/png'));
      setIsSavingMask(false);
    };

    originalImage.onerror = () => {
      setError("Could not load original image to create mask.");
      setIsSavingMask(false);
    };

    originalImage.src = sourceImage;
  };

  const clearMask = () => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const { width: logicalWidth, height: logicalHeight } = canvasDimensionsRef.current;
      // The context is scaled, so clearRect needs to use logical dimensions
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);
      setIsMaskPresent(false);
    }
  };

  const triggerMaskAnimation = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setIsAnimatingMask(true);
    animationTimeoutRef.current = window.setTimeout(() => {
      setIsAnimatingMask(false);
    }, 500); // Match CSS animation duration
  };

  const featherMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !isMaskPresent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const blurAmount = 4;
    ctx.filter = `blur(${blurAmount}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    triggerMaskAnimation();
  }, [isMaskPresent]);

  const expandMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !isMaskPresent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const expandAmount = 5;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;
    tempCtx.drawImage(canvas, 0, 0);

    const offsets = [
      [expandAmount, 0], [-expandAmount, 0], [0, expandAmount], [0, -expandAmount],
      [expandAmount, expandAmount], [-expandAmount, -expandAmount],
      [expandAmount, -expandAmount], [-expandAmount, expandAmount]
    ];
    offsets.forEach(([x, y]) => ctx.drawImage(tempCanvas, x, y));
    ctx.drawImage(tempCanvas, 0, 0);
    triggerMaskAnimation();
  }, [isMaskPresent]);

  const contractMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !isMaskPresent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const contractAmount = 2;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.filter = `blur(${contractAmount}px)`;
    tempCtx.drawImage(canvas, 0, 0);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.drawImage(tempCanvas, 0, 0);

    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    triggerMaskAnimation();
  }, [isMaskPresent]);

  return (
    <div className={`masking-overlay ${isAutoSelecting ? 'autoselect-active' : ''}`}>
      {(isSavingMask || isDetectingObject) && (
        <div className="mask-saver-loader">
          <div className="spinner" />
          <p>{isSavingMask ? "Processing Mask..." : "Detecting object..."}</p>
        </div>
      )}
      {!isAutoSelecting && cursorPosition && (
        <div
          className={`brush-cursor ${isErasing ? 'erasing' : ''}`}
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            width: `${brushSize}px`,
            height: `${brushSize}px`,
          }}
        />
      )}
      <div className="masking-canvas-container">
        <canvas ref={imageCanvasRef} className="image-canvas" />
        <canvas
          ref={maskCanvasRef}
          className={`mask-canvas ${isAnimatingMask ? 'highlight' : ''}`}
          onMouseDown={(e) => isAutoSelecting ? handleAutoSelect(e) : startDrawing(e)}
          onMouseUp={stopDrawing}
          onMouseLeave={() => { stopDrawing(); setCursorPosition(null); }}
          onMouseEnter={(e) => !isAutoSelecting && setCursorPosition({ x: e.clientX, y: e.clientY })}
          onMouseMove={(e) => {
            if (!isAutoSelecting) {
              draw(e);
              setCursorPosition({ x: e.clientX, y: e.clientY });
            }
          }}
        />
      </div>
      <div className="masking-toolbar">
        <div className="toolbar-group">
          <label>Brush Size: {brushSize}</label>
          <input
            type="range"
            min="5"
            max="150"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            disabled={isAutoSelecting}
          />
        </div>
        <div className="toolbar-group">
          <button
            className={`btn btn-tool ${isAutoSelecting ? 'active' : ''}`}
            onClick={() => { setIsAutoSelecting(true); setIsErasing(false); }}
            aria-label="Auto select tool"
            title="Auto Select"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l4 4" /><path d="m13 11 4 4" /><path d="m19 5-4 4" /><path d="m11 13 4 4" /><path d="m21 19-4-4" /><path d="M9 3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" /><path d="M9 15a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z" /></svg>
          </button>
          <button
            className={`btn btn-tool ${!isErasing && !isAutoSelecting ? 'active' : ''}`}
            onClick={() => { setIsErasing(false); setIsAutoSelecting(false); }}
            aria-label="Brush tool"
          >
            Brush
          </button>
          <button
            className={`btn btn-tool ${isErasing && !isAutoSelecting ? 'active' : ''}`}
            onClick={() => { setIsErasing(true); setIsAutoSelecting(false); }}
            aria-label="Eraser tool"
          >
            Erase
          </button>
        </div>
        <div className="toolbar-group refine">
          <button className="btn btn-tool" onClick={featherMask} disabled={!isMaskPresent}>Feather</button>
          <button className="btn btn-tool" onClick={expandMask} disabled={!isMaskPresent}>Expand</button>
          <button className="btn btn-tool" onClick={contractMask} disabled={!isMaskPresent}>Contract</button>
        </div>
        <div className="toolbar-group">
          <button className="btn btn-secondary" onClick={clearMask} disabled={!isMaskPresent}>Clear</button>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveMask} disabled={!isMaskPresent}>Save Mask</button>
        </div>
      </div>
       {error && <div className="error-message" style={{position: 'absolute', top: '20px', zIndex: 105}}>{error}</div>}
    </div>
  );
};

export default MaskEditor;
