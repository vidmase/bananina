import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { kieClient } from '../kieClient';
import { deepseekClient } from '../deepseekClient';
import { nanoBananaClient } from '../nanoBananaClient';
import MaskEditor from '../MaskEditor';

// --- ICONS ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
const EffectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.5 2.5 3 3L19 5" /><path d="m14 4-1 1" /><path d="m10 8-1 1" /><path d="m20 10-1 1" /><path d="m18 12-1 1" /><path d="m12 18-1 1" /><path d="m8 22-1-1" /><path d="m4 18-1 1" /><path d="m2 16 1-1" /><path d="M9 3.5c-2.42 2.4-2.42 6.3 0 8.7 .9.9 2.1.9 3 0" /><path d="M14.5 9c-2.42 2.4-2.42 6.3 0 8.7.9.9 2.1.9 3 0" /><path d="M22 22s-4-4-7-4" /></svg>;
const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3-2.3" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V8a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/><path d="M12.22 14h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V16a2 2 0 0 0-2-2z"/><circle cx="12" cy="18" r="3"/></svg>;
const PaletteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.668 0-.437-.18-.835-.47-1.125-.29-.29-.688-.47-1.128-.47H10c-.552 0-1-.448-1-1s.448-1 1-1h2.273c.53 0 1.039.211 1.414.586.375.375.586.884.586 1.414V17c0 .552.448 1 1 1h.5c.552 0 1-.448 1-1v-.5c0-.552.448-1 1-1h.5c.552 0 1-.448 1-1V12c0-5.5-4.5-10-10-10z"/></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const ApertureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg>;
const FocusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 7V4a2 2 0 0 1 2-2h3"/><path d="M21 7V4a2 2 0 0 0-2-2h-3"/><path d="M3 17v3a2 2 0 0 0 2 2h3"/><path d="M21 17v3a2 2 0 0 1-2 2h-3"/></svg>;
const TimerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="18"/><path d="M19 13a7 7 0 1 1-7-7 7 7 0 0 1 7 7z"/></svg>;
const StackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const CompassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>;

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`star-icon ${filled ? 'filled' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const QUICK_EFFECTS = [
  { name: 'Remove BG', prompt: 'remove the background, output a transparent PNG' },
  { name: 'Pixar Style', prompt: 'convert to a 3D pixar animated movie style' },
  { name: 'Watercolor', prompt: 'turn into a watercolor painting' },
  { name: 'Sketch', prompt: 'convert to a black and white pencil sketch' },
  { name: '8-Bit', prompt: 'convert to 8-bit pixel art' },
  { name: 'HDR', prompt: 'apply a high dynamic range (HDR) effect' },
];

const PREDEFINED_FILTERS = [
  { name: 'Vintage', prompt: 'apply a vintage film filter with faded colors and grain' },
  { name: 'B&W', prompt: 'convert to a high-contrast black and white image' },
  { name: 'Sepia', prompt: 'apply a warm sepia tone filter' },
  { name: 'Technicolor', prompt: 'apply a vibrant, saturated Technicolor film look' },
  { name: 'Lomo', prompt: 'apply a lomography effect with vignetting and high contrast' },
  { name: 'Infrared', prompt: 'simulate an infrared photo effect' },
];

const ARTISTIC_STYLES = [
  { name: 'Impressionism', prompt: 'transform into an impressionist painting style like Monet' },
  { name: 'Cubism', prompt: 'transform into a cubist art style like Picasso' },
  { name: 'Pop Art', prompt: 'transform into a pop art style like Andy Warhol' },
  { name: 'Surrealism', prompt: 'transform into a surrealist style like Salvador Dalí' },
  { name: 'Art Nouveau', prompt: 'transform into an Art Nouveau style with organic lines and decorative patterns' },
  { name: 'Graffiti', prompt: 'transform into a graffiti street art style' },
];

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [styleDirectorImage, setStyleDirectorImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [isMasking, setIsMasking] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  const [view, setView] = useState<'upload' | 'editor'>('upload');
  const [suggestions, setSuggestions] = useState<any[] | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [imageBeforePreview, setImageBeforePreview] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
<<<<<<< HEAD

=======
  
>>>>>>> origin/master
  const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
  const [previewImageSrc, setPreviewImageSrc] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [image, setImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<any>('edit');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [favorites, setFavorites] = useState<any[]>([]);
  const recognitionRef = useRef<any | null>(null);

<<<<<<< HEAD
  // Constraint to preserve facial features for People & Portraits category
  const FACIAL_PRESERVATION_CONSTRAINT =
    'Strict facial preservation for every person in the image without exceptions: Do not modify, alter, synthesize, or stylize any part of any face. Preserve identity and keep 1:1 consistency of facial features (shape, proportions, expression, skin tone, eyes, nose, mouth, ears, facial hair, hairline and hairstyle, birthmarks, moles, freckles, scars). Maintain original face geometry, lighting, micro-texture, and color. If any operation would alter a face, reject that change and keep the face exactly as in the source image. All edits, masks, and style changes must strictly exclude all faces.'

  // List of categories considered under People & Portraits
  const PEOPLE_CATEGORIES = useMemo(
    () => new Set<string>([
      'Portrait Studio',
      'Expression Coach',
      'Fashion Stylist',
      'Glamour Shots',
      'Beauty Retouching',
      'Eyewear Styling',
      'Hair Styling',
      'Skin Perfection',
      'Age Enhancement',
      'Body Contouring',
      'Pose Director',
    ]),
    []
  );

=======
>>>>>>> origin/master
  const validatePin = (inputPin: string): boolean => {
    return inputPin === '1256';
  };

  const handlePinSubmit = () => {
    if (validatePin(pinInput)) {
      setIsAuthenticated(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      setTimeout(() => {
        setIsAuthenticated(false);
      }, 3600000);
    } else {
      setPinError('Invalid PIN code');
      setPinInput('');
      setTimeout(() => setPinError(''), 3000);
    }
  };

  const handleUploadClick = () => {
    if (!isAuthenticated) {
      setShowPinModal(true);
    } else {
      document.getElementById('image-upload')?.click();
    }
  };

  const handlePinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPinInput(value);
    setPinError('');
  };

  const handlePinKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pinInput.length === 4) {
      handlePinSubmit();
    }
  };

  const openImagePreview = (imageSrc: string) => {
    setPreviewImageSrc(imageSrc);
    setShowImagePreview(true);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImageSrc('');
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoomLevel(prev => Math.max(0.5, Math.min(5, prev * delta)));
  };

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessage('...');
      }, 2000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
          setPrompt(prev => (prev.trim() ? prev + ' ' : '') + transcript.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, []);

  const updateHistory = useCallback((newImage: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImage);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setImage(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setImage(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setView('editor');
      setHistory([result]);
      setHistoryIndex(0);
      setMaskImage(null);
      setReferenceImage(null);
      setStyleDirectorImage(null);
      setPrompt('');
      setActiveTab('edit');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadImage = useCallback(() => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    const mimeType = image.match(/data:(.*?);/)?.[1] || 'image/png';
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `imagina-edit.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [image]);

  const generateImage = useCallback(async (currentPrompt: string, baseImage: string) => {
      console.log('Using KIE client for image editing');
      let enhancedPrompt = currentPrompt;
      if (referenceImage) {
        enhancedPrompt = `Use the reference image as a style guide and apply it to the main image: ${currentPrompt}. Match the exact colors, patterns, textures, and design details from the reference image. Ensure the reference item fits naturally on the person while preserving their pose and lighting.`;
      } else if (maskImage || styleDirectorImage) {
        enhancedPrompt = `Modify the uploaded image by: ${currentPrompt}. Preserve the original subject and composition while applying the requested changes.`;
      } else {
        enhancedPrompt = `Apply the following changes to the uploaded image: ${currentPrompt}. Keep the original image structure and only modify as requested.`;
      }
      return await kieClient.generateImage(enhancedPrompt, baseImage, referenceImage);
  }, [maskImage, styleDirectorImage, referenceImage]);

  const handleSubmit = useCallback(async (currentPrompt: string) => {
    if (!image || !currentPrompt) return;

    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
<<<<<<< HEAD
      // If current feature is People & Portraits, enforce facial preservation constraint
      const isPeople = PEOPLE_CATEGORIES.has(activeSuggestionCategory);
      const promptToUse = isPeople && !currentPrompt.includes(FACIAL_PRESERVATION_CONSTRAINT)
        ? `${currentPrompt}. ${FACIAL_PRESERVATION_CONSTRAINT}`
        : currentPrompt;
      const newImage = await generateImage(promptToUse, image);
=======
      const newImage = await generateImage(currentPrompt, image);
>>>>>>> origin/master
      setImage(newImage);
      updateHistory(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
<<<<<<< HEAD
  }, [image, generateImage, updateHistory, activeSuggestionCategory]);
=======
  }, [image, generateImage, updateHistory]);
>>>>>>> origin/master

  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt) return;
    setIsEnhancingPrompt(true);
    try {
        const enhancedPrompt = await deepseekClient.enhancePrompt(prompt);
<<<<<<< HEAD
        const isPeople = PEOPLE_CATEGORIES.has(activeSuggestionCategory);
        const finalEnhanced = isPeople && !enhancedPrompt.includes(FACIAL_PRESERVATION_CONSTRAINT)
          ? `${enhancedPrompt}. ${FACIAL_PRESERVATION_CONSTRAINT}`
          : enhancedPrompt;
        setPrompt(finalEnhanced);
    } catch (err) {
        console.error("Error enhancing prompt:", err);
        const isPeople = PEOPLE_CATEGORIES.has(activeSuggestionCategory);
        const fallbackPrompt = `${prompt}, professional photography, high quality, detailed, cinematic lighting, sharp focus`;
        const finalFallback = isPeople && !fallbackPrompt.includes(FACIAL_PRESERVATION_CONSTRAINT)
          ? `${fallbackPrompt}. ${FACIAL_PRESERVATION_CONSTRAINT}`
          : fallbackPrompt;
        setPrompt(finalFallback);
    } finally {
        setIsEnhancingPrompt(false);
    }
  }, [prompt, activeSuggestionCategory]);
=======
        setPrompt(enhancedPrompt);
    } catch (err) {
        console.error("Error enhancing prompt:", err);
        const fallbackPrompt = `${prompt}, professional photography, high quality, detailed, cinematic lighting, sharp focus`;
        setPrompt(fallbackPrompt);
    } finally {
        setIsEnhancingPrompt(false);
    }
  }, [prompt]);
>>>>>>> origin/master

  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          recognitionRef.current?.start();
      }
      setIsListening(!isListening);
  };

  const isFavorite = useCallback((suggestion: any) => {
    return favorites.some(fav => fav.prompt === suggestion.prompt);
  }, [favorites]);

  const toggleFavorite = useCallback((suggestion: any) => {
    setFavorites(prev => {
        const isAlreadyFavorite = prev.some(fav => fav.prompt === suggestion.prompt);
        if (isAlreadyFavorite) {
            return prev.filter(fav => fav.prompt !== suggestion.prompt);
        } else {
            return [...prev, suggestion];
        }
    });
  }, []);

  const createSuggestionHandler = (systemInstruction: string, featureName: string) => useCallback(async () => {
    if (!image) return;

    setActiveSuggestionCategory(featureName);
    setIsFetchingSuggestions(true);
    setError(null);
    setSuggestions(null);

    try {
      const aiSuggestions = await deepseekClient.generateSuggestions(systemInstruction, "the uploaded image");
<<<<<<< HEAD
      // If this feature is a People & Portraits category, append the facial preservation constraint
      const isPeople = PEOPLE_CATEGORIES.has(featureName);

      // Heuristic to detect overly generic Fashion Stylist suggestions and replace with curated fallbacks
      const isFashion = featureName === 'Fashion Stylist';
      const looksSpecific = (text: string) => {
        const lower = text.toLowerCase();
        const requiredTerms = ['silhouette', 'fabric', 'texture', 'palette', 'footwear', 'accessor', 'fit', 'drape'];
        const present = requiredTerms.filter(t => lower.includes(t)).length;
        return lower.length > 120 && present >= 3; // require some length and at least 3 key aspects
      };

      let effectiveSuggestions = aiSuggestions;
      if (isFashion) {
        const specificCount = aiSuggestions.filter(s => looksSpecific(s.prompt)).length;
        if (specificCount < 2) {
          // Not specific enough: fall back to curated Fashion Stylist prompts
          effectiveSuggestions = getPredefinedSuggestions('Fashion Stylist');
        }
      }

      const suggestionsWithCategory = effectiveSuggestions.map((s: {name: string, prompt: string}) => ({
        ...s,
        prompt: isPeople ? `${s.prompt}. ${FACIAL_PRESERVATION_CONSTRAINT}` : s.prompt,
=======
      
      const suggestionsWithCategory = aiSuggestions.map((s: {name: string, prompt: string}) => ({
        ...s,
>>>>>>> origin/master
        category: featureName,
      }));
      setSuggestions(suggestionsWithCategory);

    } catch (err) {
      console.error(`${featureName} Error:`, err);
      const fallbackSuggestions = getPredefinedSuggestions(featureName);
<<<<<<< HEAD
      const isPeople = PEOPLE_CATEGORIES.has(featureName);
      const suggestionsWithCategory = fallbackSuggestions.map((s: {name: string, prompt: string}) => ({
        ...s,
        prompt: isPeople ? `${s.prompt}. ${FACIAL_PRESERVATION_CONSTRAINT}` : s.prompt,
=======
      const suggestionsWithCategory = fallbackSuggestions.map((s: {name: string, prompt: string}) => ({
        ...s,
>>>>>>> origin/master
        category: featureName,
      }));
      setSuggestions(suggestionsWithCategory);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [image]);

<<<<<<< HEAD
  // Re-introduced helper with proper wrapping after accidental unscoped literal
  const getPredefinedSuggestions = (category: string): { name: string; prompt: string }[] => {
    const suggestions: { [key: string]: { name: string; prompt: string }[] } = {
      // General/creative
      'Creative Concepts': [
        { name: 'Artistic Style', prompt: 'Transform into an oil painting with visible brushstrokes and rich textures' },
        { name: 'Fantasy Theme', prompt: 'Add magical elements like glowing particles and ethereal lighting' },
        { name: 'Futuristic Look', prompt: 'Apply a cyberpunk aesthetic with neon colors and digital effects' },
      ],
      'Technical Advice': [
        { name: 'Enhance Lighting', prompt: 'Improve the lighting with professional studio setup and balanced exposure' },
        { name: 'Sharpen Details', prompt: 'Increase sharpness and clarity while reducing noise' },
        { name: 'Color Correction', prompt: 'Adjust color balance, saturation, and contrast for professional look' },
      ],
      'Color Grading': [
        { name: 'Cinematic Teal & Orange', prompt: 'Apply a cinematic teal and orange color grade to create a modern, high-contrast look.' },
        { name: 'Vintage Film', prompt: 'Give the image a warm, faded vintage film look with muted colors and soft grain.' },
        { name: 'Dramatic Monochrome', prompt: 'Convert to a high-contrast black and white image with deep blacks and bright highlights for a dramatic feel.' },
      ],
      // Composition & lighting
      'Composition': [
        { name: 'Rule of Thirds', prompt: 'Crop the image to place the main subject on one of the intersecting lines of a 3x3 grid to create a more balanced composition.' },
        { name: 'Leading Lines', prompt: 'Emphasize existing lines in the image to guide the viewer\'s eye towards the main subject.' },
        { name: 'Add Framing', prompt: 'Introduce a natural frame within the image, like a doorway or window, to add depth and draw attention to the subject.' },
      ],
      'Lighting': [
        { name: 'Golden Hour Glow', prompt: 'Simulate the warm, soft light of the golden hour to create a flattering and magical atmosphere.' },
        { name: 'Dramatic Rembrandt', prompt: 'Apply Rembrandt lighting with a strong key light and a triangular highlight on the cheek to create a dramatic, moody portrait.' },
        { name: 'Soft Backlight', prompt: 'Add a soft backlight to separate the subject from the background and create a gentle, ethereal halo effect.' },
      ],
      'Depth Master': [
        { name: 'Shallow Depth of Field', prompt: 'Create a very shallow depth of field to blur the background and make the subject pop.' },
        { name: 'Deep Depth of Field', prompt: 'Ensure the entire scene from foreground to background is in sharp focus to capture all the details of a landscape.' },
        { name: 'Cinematic Bokeh', prompt: 'Enhance the background blur with beautiful, cinematic bokeh for a professional portrait look.' },
      ],
      'Focus Stacking': [
        { name: 'Macro Sharpness', prompt: 'Combine multiple macro shots to ensure every detail of a tiny subject is perfectly sharp.' },
        { name: 'Landscape Clarity', prompt: 'Merge several landscape photos to create an image where everything from the closest flower to the distant mountains is in focus.' },
        { name: 'Product Photography', prompt: 'Stack focus to create a commercial-quality product shot where the entire object is sharp and detailed.' },
      ],
      'Long Exposure': [
        { name: 'Silky Water', prompt: 'Use a long exposure to smooth out the surface of water, creating a silky, ethereal effect.' },
        { name: 'Cloud Streaks', prompt: 'Capture the movement of clouds with a long exposure to create dramatic streaks across the sky.' },
        { name: 'Light Trails', prompt: 'Create dynamic light trails from moving vehicles to add energy and excitement to a city scene at night.' },
      ],
      'HDR Blending': [
        { name: 'Balanced Landscape', prompt: 'Blend multiple exposures to create a landscape with a perfectly exposed sky and foreground.' },
        { name: 'Interior Real Estate', prompt: 'Create a bright, evenly lit interior shot by blending exposures to show both the inside and the view outside the window.' },
        { name: 'Sunset Brilliance', prompt: 'Capture the full range of colors and light in a sunset by blending exposures to avoid blown-out highlights and crushed shadows.' },
      ],
      // People & Portraits fallbacks (will also have constraint appended below)
      'Fashion Stylist': [
        { name: 'Tailored Formal', prompt: 'Replace current outfit with a sharp tailored set (single-breasted blazer with structured shoulders, slim trousers, crisp shirt). Use a cohesive neutral palette (charcoal/black/ivory), matte fabrics with subtle texture, and natural drape. Preserve body proportions, sleeve length at wrist, trouser break light at shoe, and realistic garment shadows and folds.' },
        { name: 'Elevated Streetwear', prompt: 'Style a modern streetwear look: oversized hoodie layered under a lightweight bomber, tapered cargo pants, and clean low-profile sneakers. Keep a muted palette (sage/stone/black), add minimal accessories (cap/watch), and ensure fabric thickness and stitching detail are realistic. Maintain pose alignment and plausible garment tension points at elbows, knees, and waist.' },
        { name: 'Minimalist Monochrome', prompt: 'Create a minimalist monochrome outfit in deep navy: relaxed knit top, straight-leg trousers, and sleek leather loafers. Balance silhouettes (boxy top with straight bottoms), ensure correct hemlines, and realistic fabric sheen for knit vs. leather. Add a subtle belt and keep overall styling clean and editorial.' },
      ],
      'Expression Coach': [
        { name: 'Confident Expression', prompt: 'Enhance facial expression to show confidence and engagement' },
        { name: 'Natural Smile', prompt: 'Create a more natural, authentic smile and eye expression' },
        { name: 'Dynamic Angle', prompt: 'Introduce a slight head tilt and angle the body to create a more dynamic composition' },
      ],
      'Portrait Studio': [
        { name: 'Expression Enhancement', prompt: 'Enhance facial expression to be more engaging and natural' },
        { name: 'Hair Styling', prompt: 'Improve hair styling and texture for a polished look' },
        { name: 'Subtle Makeup', prompt: 'Apply subtle, professional makeup enhancement' },
      ],
      'Eyewear Styling': [
        { name: 'Reflection Control', prompt: 'Minimize unwanted reflections on glasses lenses' },
        { name: 'Frame Enhancement', prompt: 'Enhance eyewear frames to complement face shape' },
        { name: 'Style Matching', prompt: 'Match eyewear style to overall portrait aesthetic' },
      ],
      'Hair Styling': [
        { name: 'Volume Boost', prompt: 'Add natural volume and texture to hair' },
        { name: 'Frizz Control', prompt: 'Reduce frizz while maintaining natural hair texture' },
        { name: 'Shape Refinement', prompt: 'Refine hairstyle shape to suit the portrait angle' },
      ],
      'Skin Perfection': [
        { name: 'Even Tone', prompt: 'Even out skin tone while preserving natural texture' },
        { name: 'Subtle Smoothing', prompt: 'Gently smooth skin texture to reduce distractions' },
        { name: 'Natural Glow', prompt: 'Add a natural, healthy skin glow without over-brightening' },
      ],
      'Age Enhancement': [
        { name: 'Graceful Maturity', prompt: 'Enhance sense of maturity and dignity with subtle lighting and tone adjustments' },
        { name: 'Youthful Vitality', prompt: 'Emphasize freshness with balanced tones and soft lighting' },
        { name: 'Timeless Look', prompt: 'Create a timeless portrait feel with balanced contrast and classic tones' },
      ],
      'Body Contouring': [
        { name: 'Posture Boost', prompt: 'Improve posture subtly for a more flattering silhouette' },
        { name: 'Silhouette Balance', prompt: 'Balance proportions with light and shadow without altering identity' },
        { name: 'Wardrobe Fit', prompt: 'Refine the look of clothing to fit naturally and flatter the subject' },
      ],
      'Pose Director': [
        { name: 'Professional Portrait', prompt: 'Optimize pose for headshot with proper head angle and hand placement' },
        { name: 'Confident Stance', prompt: 'Adjust pose to show confident body language with straight posture and relaxed shoulders' },
        { name: 'Dynamic Action', prompt: 'Create a more dynamic pose with movement and energy in the body positioning' },
      ],
    };

    // If category is People & Portraits, append the preservation constraint to each predefined prompt
    const isPeople = (
      category === 'Portrait Studio' ||
      category === 'Expression Coach' ||
      category === 'Fashion Stylist' ||
      category === 'Glamour Shots' ||
      category === 'Beauty Retouching' ||
      category === 'Eyewear Styling' ||
      category === 'Hair Styling' ||
      category === 'Skin Perfection' ||
      category === 'Age Enhancement' ||
      category === 'Body Contouring' ||
      category === 'Pose Director'
    );

    const base = suggestions[category] || [];
    if (!isPeople) return base;
    return base.map(s => ({ ...s, prompt: `${s.prompt}. ${FACIAL_PRESERVATION_CONSTRAINT}` }));
  };
=======
  const handlePreview = useCallback(async (previewPrompt: string) => {
    if (!image) return;
    setError(null);
    setIsPreviewLoading(previewPrompt);

    try {
        if (!imageBeforePreview) {
            setImageBeforePreview(image);
        }
        
        const baseImageForPreview = imageBeforePreview || image;
        const newImage = await generateImage(previewPrompt, baseImageForPreview);
        setImage(newImage);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate preview.");
        if (imageBeforePreview) {
          setImage(imageBeforePreview);
        }
    } finally {
        setIsPreviewLoading(null);
    }
}, [image, imageBeforePreview, generateImage]);

const getPredefinedSuggestions = (category: string): {name: string, prompt: string}[] => {
  const suggestions: {[key: string]: {name: string, prompt: string}[]} = {
    'Creative Concepts': [
      { name: 'Artistic Style', prompt: 'Transform into an oil painting with visible brushstrokes and rich textures' },
      { name: 'Fantasy Theme', prompt: 'Add magical elements like glowing particles and ethereal lighting' },
      { name: 'Futuristic Look', prompt: 'Apply a cyberpunk aesthetic with neon colors and digital effects' }
    ],
    'Technical Advice': [
      { name: 'Enhance Lighting', prompt: 'Improve the lighting with professional studio setup and balanced exposure' },
      { name: 'Sharpen Details', prompt: 'Increase sharpness and clarity while reducing noise' },
      { name: 'Color Correction', prompt: 'Adjust color balance, saturation, and contrast for professional look' }
    ],
    'Expression Coach': [
        { name: 'Confident Pose', prompt: 'Adjust posture to be more upright and open, with shoulders back and chin slightly lifted, for a confident and powerful look.' },
        { name: 'Engaging Expression', prompt: 'Enhance the expression by adding a subtle, genuine smile that reaches the eyes to create a more engaging and approachable feel.' },
        { name: 'Dynamic Angle', prompt: 'Introduce a slight head tilt and angle the body away from the camera to create a more dynamic and flattering composition.' },
    ],
    'Color Grading': [
        { name: 'Cinematic Teal & Orange', prompt: 'Apply a cinematic teal and orange color grade to create a modern, high-contrast look.' },
        { name: 'Vintage Film', prompt: 'Give the image a warm, faded vintage film look with muted colors and soft grain.' },
        { name: 'Dramatic Monochrome', prompt: 'Convert to a high-contrast black and white image with deep blacks and bright highlights for a dramatic feel.' },
    ],
    'Composition': [
        { name: 'Rule of Thirds', prompt: 'Crop the image to place the main subject on one of the intersecting lines of a 3x3 grid to create a more balanced composition.' },
        { name: 'Leading Lines', prompt: 'Emphasize existing lines in the image to guide the viewer\'s eye towards the main subject.' },
        { name: 'Add Framing', prompt: 'Introduce a natural frame within the image, like a doorway or window, to add depth and draw attention to the subject.' },
    ],
    'Lighting': [
        { name: 'Golden Hour Glow', prompt: 'Simulate the warm, soft light of the golden hour to create a flattering and magical atmosphere.' },
        { name: 'Dramatic Rembrandt', prompt: 'Apply Rembrandt lighting with a strong key light and a triangular highlight on the cheek to create a dramatic, moody portrait.' },
        { name: 'Soft Backlight', prompt: 'Add a soft backlight to separate the subject from the background and create a gentle, ethereal halo effect.' },
    ],
    'Depth Master': [
        { name: 'Shallow Depth of Field', prompt: 'Create a very shallow depth of field to blur the background and make the subject pop.' },
        { name: 'Deep Depth of Field', prompt: 'Ensure the entire scene from foreground to background is in sharp focus to capture all the details of a landscape.' },
        { name: 'Cinematic Bokeh', prompt: 'Enhance the background blur with beautiful, cinematic bokeh for a professional portrait look.' },
    ],
    'Focus Stacking': [
        { name: 'Macro Sharpness', prompt: 'Combine multiple macro shots to ensure every detail of a tiny subject is perfectly sharp.' },
        { name: 'Landscape Clarity', prompt: 'Merge several landscape photos to create an image where everything from the closest flower to the distant mountains is in focus.' },
        { name: 'Product Photography', prompt: 'Stack focus to create a commercial-quality product shot where the entire object is sharp and detailed.' },
    ],
    'Long Exposure': [
        { name: 'Silky Water', prompt: 'Use a long exposure to smooth out the surface of water, creating a silky, ethereal effect.' },
        { name: 'Cloud Streaks', prompt: 'Capture the movement of clouds with a long exposure to create dramatic streaks across the sky.' },
        { name: 'Light Trails', prompt: 'Create dynamic light trails from moving vehicles to add energy and excitement to a city scene at night.' },
    ],
    'HDR Blending': [
        { name: 'Balanced Landscape', prompt: 'Blend multiple exposures to create a landscape with a perfectly exposed sky and foreground.' },
        { name: 'Interior Real Estate', prompt: 'Create a bright, evenly lit interior shot by blending exposures to show both the inside and the view outside the window.' },
        { name: 'Sunset Brilliance', prompt: 'Capture the full range of colors and light in a sunset by blending exposures to avoid blown-out highlights and crushed shadows.' },
    ],
  };
  return suggestions[category] || [];
};
>>>>>>> origin/master

  const handleMacroPrecision = createSuggestionHandler(
    "You are an AI Macro Photography Specialist focusing on extreme close-up photography. Analyze the image and suggest macro techniques for enhancing detail, sharpness, and lighting on small subjects. Consider magnification, focus precision, and lighting control for tiny worlds. Provide specific recommendations for achieving stunning macro photography results.",
    "Macro Precision"
  );

  const handlePerspectiveWizard = createSuggestionHandler(
    "You are an AI Perspective Wizard specializing in lens corrections and creative viewpoints. Analyze the image and suggest perspective modifications including distortion correction, keystone adjustments, and creative angle changes. Consider lens geometry, architectural lines, and unique visual perspectives. Provide specific recommendations for mastering perspective in photography.",
    "Perspective Wizard"
  );

  const handleMotionCapture = createSuggestionHandler(
    "You are an AI Motion Capture Expert specializing in capturing moving subjects. Analyze the image and suggest techniques for freezing action, creating motion blur, and capturing peak moments in sports and action photography. Consider shutter speeds, panning techniques, and timing for dynamic shots. Provide specific recommendations for mastering motion photography.",
    "Motion Capture"
  );

  const handleLightSpectrum = createSuggestionHandler(
    "You are an AI Light Spectrum Analyst specializing in color science and light quality. Analyze the image and suggest modifications for color temperature, white balance, and spectral enhancements. Consider the light source, color accuracy, and creative color effects. Provide specific recommendations for mastering the light spectrum in photography.",
    "Light Spectrum"
  );

  const handleFrameAnalysis = createSuggestionHandler(
    "You are an AI Frame Analysis Expert specializing in photographic composition and visual storytelling. Analyze the image and suggest compositional improvements based on principles like the rule of thirds, leading lines, and visual flow. Consider the arrangement of elements, balance, and narrative impact. Provide specific recommendations for creating compelling compositions.",
    "Frame Analysis"
  );

  const handleCameraCalibration = createSuggestionHandler(
    "You are an AI Camera Calibration Specialist focusing on optical accuracy and sensor optimization. Analyze the image and suggest camera-specific corrections including lens profiles, sensor characteristics, and color calibration. Consider the camera model, lens type, and shooting conditions. Provide specific recommendations for achieving technical perfection through camera calibration.",
    "Camera Calibration"
  );

  // Architecture & Interior AI Assistants
  const handleSpacePlanning = createSuggestionHandler(
    "You are an AI Space Planning Consultant specializing in interior architecture and furniture arrangement. Analyze the space and suggest improvements for traffic flow, functional zones, and space efficiency. Consider human behavior, ergonomics, and architectural constraints. Provide specific recommendations for optimizing interior layouts.",
    "Space Planning"
  );

  const handleRoomMeasurements = createSuggestionHandler(
    "You are an AI Room Measurement Specialist focusing on proportion, scale, and visual balance in interior design. Analyze the space and suggest adjustments based on the golden ratio, scale harmony, and visual weight distribution. Consider the room's dimensions, furniture sizes, and architectural features. Provide specific recommendations for achieving proportional excellence in interior design.",
    "Room Measurements"
  );

  const handleWindowDesign = createSuggestionHandler(
    "You are an AI Window Design Expert specializing in natural light optimization and architectural integration. Analyze the windows and suggest improvements for daylighting, privacy, and aesthetic appeal. Consider window treatments, glazing options, and architectural style. Provide specific recommendations for enhancing windows in interior design.",
    "Window Design"
  );

  const handleDoorStyling = createSuggestionHandler(
    "You are an AI Door Styling Consultant focusing on entryway design and architectural hardware. Analyze the doors and suggest modifications for creating impact, improving functionality, and matching architectural style. Consider door materials, hardware finishes, and entryway composition. Provide specific recommendations for elevating doors in interior and exterior design.",
    "Door Styling"
  );

  const handleStaircaseDesign = createSuggestionHandler(
    "You are an AI Staircase Design Specialist focusing on architectural impact and safety. Analyze the staircase and suggest design enhancements for railings, materials, and overall aesthetic. Consider structural integrity, building codes, and architectural style. Provide specific recommendations for creating stunning and safe staircases.",
    "Staircase Design"
  );

  const handleLightingDesign = createSuggestionHandler(
    "You are an AI Lighting Design Consultant specializing in creating atmosphere and functionality through light. Analyze the space and suggest a layered lighting scheme with ambient, task, and accent lighting. Consider mood, functionality, and architectural highlights. Provide specific recommendations for professional lighting design.",
    "Lighting Design"
  );

  const handleMaterialTextures = createSuggestionHandler(
    "You are an AI Material & Texture Specialist focusing on surface treatments and tactile qualities in interior design. Analyze the space and suggest material and texture combinations for adding depth, interest, and character. Consider contrast, harmony, and sensory experience. Provide specific recommendations for using materials and textures effectively.",
    "Material Textures"
  );

  const handleBiophilicDesign = createSuggestionHandler(
    "You are an AI Biophilic Design Expert specializing in connecting indoor spaces with nature. Analyze the space and suggest ways to integrate natural elements like plants, natural light, and organic materials. Consider human well-being, sustainability, and connection to the natural world. Provide specific recommendations for creating healthy and inspiring biophilic interiors.",
    "Biophilic Design"
  );

  const handleOutdoorSpaces = createSuggestionHandler(
    "You are an AI Outdoor Space Designer specializing in landscape architecture and outdoor living. Analyze the outdoor area and suggest improvements for furniture arrangement, weather protection, and landscape integration. Consider functionality, comfort, and connection to the surrounding environment. Provide specific recommendations for creating beautiful and functional outdoor spaces.",
    "Outdoor Spaces"
  );

  const handleCeilingFeatures = createSuggestionHandler(
    "You are an AI Ceiling Design Specialist focusing on architectural details and spatial enhancement. Analyze the ceiling and suggest features like coffered details, height illusions, and integrated lighting. Consider architectural style, room proportions, and visual impact. Provide specific recommendations for transforming ceilings into architectural statements.",
    "Ceiling Features"
  );

  // Landscape AI Assistants
  const handleOceanWaves = createSuggestionHandler(
    "You are an AI Ocean Wave Specialist focusing on coastal and marine photography. Analyze the image and suggest techniques for capturing wave motion, enhancing water clarity, and creating dramatic coastal scenes. Consider shutter speeds, lighting conditions, and atmospheric effects. Provide specific recommendations for mastering ocean and wave photography.",
    "Ocean Waves"
  );

  const handleForestDepths = createSuggestionHandler(
    "You are an AI Forest Photography Expert specializing in woodland and forest scenes. Analyze the image and suggest techniques for capturing light filtering through canopies, creating atmospheric depth, and integrating wildlife elements. Consider composition, lighting, and storytelling in forest environments. Provide specific recommendations for creating magical forest photographs.",
    "Forest Depths"
  );

  const handleDesertLandscapes = createSuggestionHandler(
    "You are an AI Desert Landscape Photographer focusing on arid and desert environments. Analyze the image and suggest techniques for enhancing sand textures, capturing heat shimmer, and highlighting geological formations. Consider lighting, composition, and atmospheric conditions unique to desert landscapes. Provide specific recommendations for creating stunning desert photographs.",
    "Desert Landscapes"
  );

  const handleWinterScenes = createSuggestionHandler(
    "You are an AI Winter Scene Specialist focusing on snow and ice photography. Analyze the image and suggest techniques for capturing realistic snow textures, creating winter atmosphere, and enhancing frost details. Consider lighting, exposure, and color balance in winter conditions. Provide specific recommendations for mastering winter landscape photography.",
    "Winter Scenes"
  );

  const handleStormWeather = createSuggestionHandler(
    "You are an AI Storm Photography Expert specializing in dramatic weather phenomena. Analyze the image and suggest techniques for capturing lightning, powerful cloud formations, and realistic rain effects. Consider safety, exposure settings, and composition in storm photography. Provide specific recommendations for creating breathtaking storm photographs.",
    "Storm Weather"
  );

  const handleCanyonViews = createSuggestionHandler(
    "You are an AI Canyon Photography Specialist focusing on geological landscapes and dramatic perspectives. Analyze the image and suggest techniques for enhancing rock strata, creating depth, and capturing the vibrant colors of canyons. Consider lighting, composition, and scale in canyon photography. Provide specific recommendations for creating epic canyon photographs.",
    "Canyon Views"
  );

  const handleVolcanicTerrain = createSuggestionHandler(
    "You are an AI Volcanic Terrain Expert specializing in geological and volcanic landscapes. Analyze the image and suggest techniques for capturing lava flows, enhancing rock textures, and creating geothermal atmosphere. Consider safety, lighting, and the unique features of volcanic environments. Provide specific recommendations for creating powerful volcanic photographs.",
    "Volcanic Terrain"
  );

  const handleValleyVistas = createSuggestionHandler(
    "You are an AI Valley Vista Specialist focusing on expansive landscapes and river systems. Analyze the image and suggest techniques for enhancing river features, creating atmospheric depth, and showcasing ecosystem diversity. Consider composition, scale, and lighting in valley photography. Provide specific recommendations for capturing breathtaking valley vistas.",
    "Valley Vistas"
  );

  const handleCoastalBeacons = createSuggestionHandler(
    "You are an AI Coastal Beacon Specialist focusing on lighthouses and maritime scenes. Analyze the image and suggest techniques for enhancing lighthouse structures, capturing beacon light, and creating authentic coastal atmosphere. Consider weather conditions, composition, and storytelling in coastal photography. Provide specific recommendations for creating iconic lighthouse photographs.",
    "Coastal Beacons"
  );

  const handleConfirmSelection = useCallback(() => {
    if (!image) return;
    updateHistory(image);
    setImageBeforePreview(null);
    setSuggestions(null);
}, [image, updateHistory]);

const handleCancelAndRevert = useCallback(() => {
    if (imageBeforePreview) {
        setImage(imageBeforePreview);
    }
    setImageBeforePreview(null);
    setSuggestions(null);
    setError(null);
}, [imageBeforePreview]);

const handleResetToOriginal = useCallback(() => {
    if (imageBeforePreview) {
        setImage(imageBeforePreview);
        setImageBeforePreview(null);
        setSuggestions(null);
        setError(null);
    }
}, [imageBeforePreview]);

  const handleGetCreativeIdeas = createSuggestionHandler(
    "You are an AI Art Director. Analyze the user's image and provide three creative and transformative ideas. Each suggestion should be a concise, actionable prompt that dramatically alters the image's style or subject. IMPORTANT: Preserve all faces exactly as they are - do not modify, change, edit, or alter any facial features, expressions, or identities.",
    "Creative Concepts"
  );

  const handleExpressionCoach = createSuggestionHandler(
    "You are an AI Portrait Coach specializing in posing and expression. Analyze the person in the image and provide three specific, actionable suggestions to enhance their pose and expression for a more impactful portrait. Focus on posture, body language, and emotional expression. Do not suggest changes to clothing, background, or lighting.",
    "Expression Coach"
  );

  const handleGetTechnicalAdvice = createSuggestionHandler(
    "You are an AI Photography Expert. Analyze the user's image and provide three technical suggestions to improve the photo. Focus on camera settings, exposure, focus, or other technical aspects. Each suggestion should be a clear, actionable prompt. IMPORTANT: Preserve all faces exactly as they are - do not modify, change, edit, or alter any facial features, expressions, or identities.",
    "Technical Advice"
  );

  const handleGetColorGradingIdeas = createSuggestionHandler(
    "You are an AI Color Grading Specialist. Analyze the image's color palette and suggest three distinct color grading options to enhance the mood and visual appeal. Provide a descriptive name and a detailed prompt for each look.",
    "Color Grading"
);

const handleGetCompositionIdeas = createSuggestionHandler(
    "You are an AI Composition Expert. Analyze the image's composition and suggest three ways to improve it based on principles like the rule of thirds, leading lines, and framing. Provide specific, actionable prompts for each suggestion.",
    "Composition"
);

const handleGetLightingIdeas = createSuggestionHandler(
    "You are an AI Lighting Director. Analyze the lighting in the image and suggest three ways to improve it. Consider the direction, quality, and color of light to enhance the subject and mood. Provide specific, actionable prompts.",
    "Lighting"
);

const handleDepthMaster = createSuggestionHandler(
    "You are an AI Depth of Field Specialist. Analyze the image and suggest three ways to manipulate the depth of field to draw attention to the subject. Consider aperture settings, lens choice, and subject distance to create beautiful bokeh or ensure sharpness throughout the scene.",
    "Depth Master"
);

const handleFocusStacking = createSuggestionHandler(
    "You are an AI Focus Stacking Expert. Analyze the image and determine if focus stacking would enhance it. If so, provide three suggestions for capturing and blending multiple exposures to achieve maximum sharpness from foreground to background.",
    "Focus Stacking"
);

const handleLongExposure = createSuggestionHandler(
    "You are an AI Long Exposure Specialist. Analyze the image and suggest three creative long exposure ideas to capture motion in elements like water, clouds, or light trails. Provide prompts that specify the desired effect and mood.",
    "Long Exposure"
);

const handleHDRBlending = createSuggestionHandler(
    "You are an AI HDR Blending Expert. Analyze the image for dynamic range issues and suggest three ways to use HDR blending to create a perfectly exposed image. Provide prompts that detail how to balance highlights, midtones, and shadows.",
    "HDR Blending"
);

  // ... (all other handleGet... functions) ...

  const handleTropicalIslands = createSuggestionHandler(
    "You are an AI Tropical Environment Specialist focusing on island ecosystems and paradise landscapes. Analyze the tropical scene and suggest improvements for palm vegetation, coral reefs, turquoise waters, and tropical atmosphere. Consider island formation, tropical weather, and marine biodiversity. Provide specific recommendations for creating idyllic tropical paradise imagery.",
    "Tropical Islands"
  );

  const handleGetVisionEnhancementIdeas = createSuggestionHandler(
    "You are an AI Vision Enhancement Expert. Analyze the user's image with advanced computer vision and suggest three ways to improve visual clarity, detail, or perception. Focus on enhancing what the human eye can see - sharpening details, improving contrast, or revealing hidden elements. Each suggestion should be an actionable prompt.",
    "Vision Enhancement"
  );


  const handleQuickEffect = (prompt: string) => {
    setPrompt(prompt);
    handleSubmit(prompt);
  };
  
  const handleAutoReferenceApplication = useCallback(async (refImage: string) => {
    if (!image) {
      console.log('No base image available for auto-application');
      return;
    }
    
    console.log('Starting auto-application with reference image:', refImage.substring(0, 50) + '...');
    setIsLoading(true);
    setError(null);
    
    try {
      if (!imageBeforePreview) {
        setImageBeforePreview(image);
      }
      
      const autoPrompt = "Replace my current clothing with the clothing in the reference image, ensuring proper fit, realistic shadows, and matching the lighting conditions of my photo";
      
      console.log('Using auto prompt:', autoPrompt);
      console.log('Base image available:', !!image);
      console.log('Reference image available:', !!refImage);
      
      const newImage = await kieClient.generateImage(autoPrompt, image, refImage);
      setImage(newImage);
      
      console.log('Auto-application successful');
      
    } catch (err) {
      console.error('Auto-application failed:', err);
      setError(err instanceof Error ? err.message : "Failed to apply reference image automatically.");
      if (imageBeforePreview) {
        setImage(imageBeforePreview);
      }
    } finally {
      setIsLoading(false);
    }
  }, [image, imageBeforePreview]);

  const handleGenericImageChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setter(imageData);
        
        if (setter === setReferenceImage && image && imageData) {
          setTimeout(() => {
            handleAutoReferenceApplication(imageData);
          }, 100);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = '';
  };

  const ImageInput = ({ title, image, onRemove, onChange, id, actionText }: { title: string; image: string | null; onRemove: () => void; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; id: string; actionText: string; }) => (
    <div className="image-input-group">
      <h3>{title}</h3>
      <input type="file" id={id} accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      {image ? (
        <div className="image-input-preview">
          <img src={image} alt={`${title} preview`} />
          <button onClick={onRemove} aria-label={`Remove ${title}`}>&times;</button>
        </div>
      ) : (
        <label htmlFor={id} className="image-input-label">
          <UploadIcon />
          <span>{actionText}</span>
        </label>
      )}
    </div>
  );

  if (view === 'upload') {
    return (
      <div className="upload-view">
        {showPinModal && (
          <div className="pin-modal-overlay" onClick={(e) => console.log('Modal overlay clicked', e)}>
            <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pin-modal-header">
                <h3>Enter PIN Code</h3>
                <button 
                  className="pin-modal-close" 
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                >
                  ×
                </button>
              </div>
              <div className="pin-modal-body">
                <p>Please enter the 4-digit PIN code to access image upload:</p>
                <div className="pin-input-container">
                  <input
                    type="password"
                    value={pinInput}
                    onChange={handlePinInputChange}
                    onKeyPress={handlePinKeyPress}
                    placeholder="••••"
                    className={`pin-input ${pinError ? 'error' : ''}`}
                    maxLength={4}
                    autoFocus
                  />
                </div>
                {pinError && <div className="pin-error">{pinError}</div>}
                <div className="pin-modal-actions">
                  <button 
                    onClick={handlePinSubmit}
                    disabled={pinInput.length !== 4}
                    className="btn btn-primary"
                  >
                    Submit
                  </button>
                  <button 
                    onClick={() => {
                      setShowPinModal(false);
                      setPinInput('');
                      setPinError('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div
          className={`hero-section ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          <h1 className="hero-title">Imagina</h1>
          <p className="hero-tagline">Your AI-powered creative partner for stunning image edits. Upload a photo to begin.</p>
          <div className="hero-cta">
            <input type="file" id="image-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={handleUploadClick} className="btn btn-primary">
              Upload Image
            </button>
          </div>
          <p className="hero-drop-text">or drop a file anywhere</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-view">
      {showPinModal && (
        <div className="pin-modal-overlay" onClick={(e) => console.log('Modal overlay clicked', e)}>
          <div className="pin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pin-modal-header">
              <h3>Enter PIN Code</h3>
              <button 
                className="pin-modal-close" 
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput('');
                  setPinError('');
                }}
              >
                ×
              </button>
            </div>
            <div className="pin-modal-body">
              <p>Please enter the 4-digit PIN code to access image upload:</p>
              <div className="pin-input-container">
                <input
                  type="password"
                  value={pinInput}
                  onChange={handlePinInputChange}
                  onKeyPress={handlePinKeyPress}
                  placeholder="••••"
                  className={`pin-input ${pinError ? 'error' : ''}`}
                  maxLength={4}
                  autoFocus
                />
              </div>
              {pinError && <div className="pin-error">{pinError}</div>}
              <div className="pin-modal-actions">
                <button 
                  onClick={handlePinSubmit}
                  disabled={pinInput.length !== 4}
                  className="btn btn-primary"
                >
                  Submit
                </button>
                <button 
                  onClick={() => {
                    setShowPinModal(false);
                    setPinInput('');
                    setPinError('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isMasking && image && (
        <MaskEditor
          imageSrc={image}
          initialMaskSrc={maskImage}
          onSave={(maskDataUrl) => {
            setMaskImage(maskDataUrl);
            setIsMasking(false);
          }}
          onCancel={() => setIsMasking(false)}
          ai={null}
        />
      )}
      <header className="app-header">
        <h1 className="app-title">Imagina</h1>
        <div className="header-controls">
          <button className="btn btn-icon" onClick={handleUndo} disabled={historyIndex <= 0} title="Undo">
            <UndoIcon />
          </button>
          <button className="btn btn-icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo">
            <RedoIcon />
          </button>
          <button className="btn btn-icon" onClick={handleDownloadImage} disabled={!image} title="Download Image">
            <DownloadIcon />
          </button>
          <input type="file" id="new-file-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          <label htmlFor="new-file-upload" className="btn btn-secondary">
             Upload New
          </label>
        </div>
      </header>
      <div className="app-layout">
        <nav className="main-nav">
            <button onClick={() => setActiveTab('edit')} className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}><EditIcon /><span>Edit</span></button>
            <button onClick={() => setActiveTab('layers')} className={`tab-button ${activeTab === 'layers' ? 'active' : ''}`}><LayersIcon /><span>Layers</span></button>
            <button onClick={() => setActiveTab('effects')} className={`tab-button ${activeTab === 'effects' ? 'active' : ''}`}><EffectsIcon /><span>Effects</span></button>
            <button onClick={() => setActiveTab('assistant')} className={`tab-button ${activeTab === 'assistant' ? 'active' : ''}`}><AssistantIcon /><span>Assistant</span></button>
            <button onClick={() => setActiveTab('favorites')} className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}><StarIcon filled={activeTab === 'favorites'} /><span>Favorites</span></button>
        </nav>
        <aside className="control-panel">
          <div className="tab-content">
            {activeTab === 'edit' && (
              <div className="control-group">
                <h2>Prompt</h2>
                <div className="prompt-container">
                  <textarea
                    className="prompt-textarea"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your edit..."
                    aria-label="Prompt for image editing"
                  />
                  <div className="prompt-buttons-container">
                    <button
                      className="btn-prompt-action btn-enhance-prompt"
                      onClick={handleEnhancePrompt}
                      disabled={!prompt || isEnhancingPrompt}
                      title="Enhance Prompt"
                    >
                      {isEnhancingPrompt ? <div className="spinner-small" /> : '✨'}
                    </button>
                    <button
                      className={`btn-prompt-action btn-voice-prompt ${isListening ? 'listening' : ''}`}
                      onClick={toggleListening}
                      title="Use Voice"
                    >
                      🎤
                    </button>
                  </div>
                </div>
                <button onClick={() => handleSubmit(prompt)} disabled={isLoading || !prompt || !image || !!suggestions} className="btn btn-primary">
                  {isLoading ? 'Generating...' : 'Apply Edit'}
                </button>
                 {error && !suggestions && <p className="error-message" role="alert">{error}</p>}
              </div>
            )}
            {activeTab === 'layers' && (
              <div className="control-group layers-tab">
                 <h2>Layers & Inputs</h2>
                 <div className="image-input-group">
                    <h3>Masking</h3>
                    {maskImage ? (
                        <div className="image-input-preview with-controls">
                           <div className="mask-preview-image-container">
                                {image && <img src={image} alt="Original" className="mask-preview-base" />}
                                <img src={maskImage} alt="Mask" className="mask-preview-overlay" />
                            </div>
                           <div className="mask-preview-controls">
                               <button className="btn btn-secondary" onClick={() => setIsMasking(true)}>Edit Mask</button>
                               <button className="btn btn-secondary" onClick={() => setMaskImage(null)}>Remove</button>
                           </div>
                        </div>
                    ) : (
                        <button className="btn btn-secondary" onClick={() => setIsMasking(true)} disabled={!image}>Create Mask</button>
                    )}
                 </div>
                 <ImageInput
                  id="reference-image-upload"
                  title="Virtual Try-On"
                  image={referenceImage}
                  actionText="Drop garment here"
                  onRemove={() => setReferenceImage(null)}
                  onChange={(e) => handleGenericImageChange(e, setReferenceImage)}
                />
                 <ImageInput
                  id="style-director-upload"
                  title="Style Director"
                  image={styleDirectorImage}
                  actionText="Upload Style Image"
                  onRemove={() => setStyleDirectorImage(null)}
                  onChange={(e) => handleGenericImageChange(e, setStyleDirectorImage)}
                />
              </div>
            )}
            {activeTab === 'effects' && (
              <div className="control-group">
                <h2>Effects Library</h2>
                <div className="effects-group">
                    <h3>Quick Effects</h3>
                    <div className="quick-effects-grid">
                        {QUICK_EFFECTS.map(effect => (
                            <button key={effect.name} onClick={() => handleQuickEffect(effect.prompt)} className="btn btn-secondary">{effect.name}</button>
                        ))}
                    </div>
                </div>
                <div className="effects-group">
                    <h3>Filters</h3>
                    <div className="quick-effects-grid">
                        {PREDEFINED_FILTERS.map(filter => (
                            <button key={filter.name} onClick={() => handleQuickEffect(filter.prompt)} className="btn btn-secondary">{filter.name}</button>
                        ))}
                    </div>
                </div>
                 <div className="effects-group">
                    <h3>Artistic Styles</h3>
                    <div className="quick-effects-grid">
                        {ARTISTIC_STYLES.map(style => (
                            <button key={style.name} onClick={() => handleQuickEffect(style.prompt)} className="btn btn-secondary">{style.name}</button>
                        ))}
                    </div>
                </div>
              </div>
            )}
            {activeTab === 'assistant' && (
              <div className="control-group">
                 <h2>AI Assistant</h2>
                  <div className="assistant-categories">
                    <div className="assistant-category">
                        <h3>Photography Essentials</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetTechnicalAdvice} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><SettingsIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Technical Advice</span>
                                    <span className="assistant-btn-desc">Camera settings and techniques.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetColorGradingIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><PaletteIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Color Grading</span>
                                    <span className="assistant-btn-desc">Color correction and grading.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetCompositionIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><GridIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Composition</span>
                                    <span className="assistant-btn-desc">Framing and composition tips.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetLightingIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><SunIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Lighting</span>
                                    <span className="assistant-btn-desc">Light setup and mood.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleDepthMaster} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ApertureIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Depth Master</span>
                                    <span className="assistant-btn-desc">Aperture & bokeh control.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleFocusStacking} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><FocusIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Focus Stacking</span>
                                    <span className="assistant-btn-desc">Extended depth of field.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleLongExposure} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><TimerIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Long Exposure</span>
                                    <span className="assistant-btn-desc">Time-based effects.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleHDRBlending} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><StackIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">HDR Blending</span>
                                    <span className="assistant-btn-desc">Dynamic range mastery.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleMacroPrecision} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><TargetIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Macro Precision</span>
                                    <span className="assistant-btn-desc">Extreme close-up expertise.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handlePerspectiveWizard} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CompassIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Perspective Wizard</span>
                                    <span className="assistant-btn-desc">Viewpoint & geometry correction.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ImageEditor;
