/**
 * useImageUpload Hook
 * Handle image file uploads and drag & drop
 */

import { useState, useCallback, useEffect } from 'react';

export interface UploadOptions {
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  onUpload?: (dataUrl: string, file: File) => void;
  onError?: (error: Error) => void;
}

export const useImageUpload = (options: UploadOptions = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    acceptedFormats = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
    onUpload,
    onError,
  } = options;

  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      if (!acceptedFormats.includes(file.type)) {
        return `Invalid file type. Accepted formats: ${acceptedFormats.join(', ')}`;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return `File too large. Maximum size: ${maxMB}MB`;
      }

      return null;
    },
    [acceptedFormats, maxSize]
  );

  const processFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        onError?.(new Error(error));
        return;
      }

      setIsUploading(true);

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setIsUploading(false);
        onUpload?.(dataUrl, file);
      };

      reader.onerror = () => {
        setIsUploading(false);
        onError?.(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    },
    [validateFile, onUpload, onError]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input to allow same file upload
      e.target.value = '';
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
          break;
        }
      }
    },
    [processFile]
  );

  // Enable paste functionality
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return {
    isDragOver,
    isUploading,
    handleFileInput,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    processFile,
  };
};

export default useImageUpload;

