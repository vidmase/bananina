import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { kieClient } from '../kieClient';
import { geminiClient, CompositionSuggestion } from '../geminiClient';
import { nanoBananaClient } from '../nanoBananaClient';
import MaskEditor from '../MaskEditor';
import { GeminiAnalysisPanel } from './editor';
import { DeepAnalysisPanel } from './editor/DeepAnalysisPanel';


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

const ASSISTANT_CATEGORIES = {
  photography: {
    name: 'Photography',
    suggestions: [
      { id: 'color-grading', name: 'Cinematic Color Grade', desc: 'Apply professional color grading styles.' },
      { id: 'lighting-effects', name: 'Lighting Effects', desc: 'Add realistic or creative lighting.' },
      { id: 'photo-style', name: 'Photography Style', desc: 'Mimic different photographic styles.' },
      { id: 'composition', name: 'Composition', desc: 'Improve the framing and composition.' },
      { id: 'depth-of-field', name: 'Depth of Field', desc: 'Add a blurry background (bokeh).' },
      { id: 'enhance-details', name: 'Enhance Details', desc: 'Sharpen and clarify the image.' },
    ]
  },
  people: {
    name: 'People & Portraits',
    suggestions: [
      { id: 'change-outfit', name: 'Change Outfit', desc: 'Dress the subject in different clothing.' },
      { id: 'change-hair', name: 'Change Hairstyle', desc: 'Experiment with different hair styles and colors.' },
      { id: 'skin-retouch', name: 'Skin Retouch', desc: 'Smooth skin and remove minor blemishes.' },
      { id: 'portrait-lighting', name: 'Portrait Lighting', desc: 'Add professional studio lighting effects.' },
      { id: 'change-expression', name: 'Facial Expression', desc: 'Subtly alter the subject\'s facial expression.' },
      { id: 'add-accessories', name: 'Add Accessories', desc: 'Add hats, glasses, or jewelry to the subject.' },
    ]
  },
  creative: {
    name: 'Creative & Fun',
    suggestions: [
      { id: 'add-elements', name: 'Add Elements', desc: 'Insert new objects or effects.' },
      { id: 'storybook', name: 'Storybook Style', desc: 'Illustrate the image.' },
      { id: 'artistic-style', name: 'Artistic Style', desc: 'Transform into different art styles.' },
      { id: 'fantasy-theme', name: 'Fantasy Theme', desc: 'Add magical or fantasy elements.' },
      { id: 'vintage-effect', name: 'Vintage Effect', desc: 'Apply retro or vintage styling.' },
      { id: 'futuristic-look', name: 'Futuristic Look', desc: 'Add sci-fi or cyberpunk elements.' },
    ]
  },
};

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
  // State variables
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

  const [colorBalance, setColorBalance] = useState({
    shadows: { r: 0, g: 0, b: 0 },
    midtones: { r: 0, g: 0, b: 0 },
    highlights: { r: 0, g: 0, b: 0 }
  });

  const [promptVariations, setPromptVariations] = useState<{ name: string; prompt: string }[] | null>(null);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState<boolean>(false);
  const [selectedSuggestionForVariations, setSelectedSuggestionForVariations] = useState<any | null>(null);

  // Constraint to preserve facial features for People & Portraits category
  const FACIAL_PRESERVATION_CONSTRAINT =
    'Do not change any facial features, expression, face shape, skin tone, eyes, nose, mouth, birthmarks, scars, or hairstyle. Keep all aspects of the face exactly as in the original image';

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

  const validatePin = (inputPin: string): boolean => {
    return inputPin === '1256';
  };

  const handlePinSubmit = () => {
    if (validatePin(pinInput)) {
      setIsAuthenticated(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      // Automatically open the project (trigger file picker) after successful PIN
      // Slight delay ensures the modal state updates before opening the dialog
      setTimeout(() => {
        document.getElementById('image-upload')?.click();
      }, 100);
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

  useEffect(() => {
    if (pinInput.length === 4) {
      handlePinSubmit();
    }
  }, [pinInput]);

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
      const isPeople = PEOPLE_CATEGORIES.has(activeSuggestionCategory);
      const promptToUse = isPeople && !currentPrompt.includes(FACIAL_PRESERVATION_CONSTRAINT)
        ? `${currentPrompt}. ${FACIAL_PRESERVATION_CONSTRAINT}`
        : currentPrompt;
      const newImage = await generateImage(promptToUse, image);
      setImage(newImage);
      updateHistory(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [image, generateImage, updateHistory, activeSuggestionCategory]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  // Enhanced suggestion generation using Gemini
  const handleSuggestionClick = useCallback(async (suggestion: any) => {
    console.log('=== handleSuggestionClick CALLED ===');
    console.log('Suggestion:', suggestion);
    console.log('Image exists:', !!image);
    if (!image) {
      console.log('No image available, returning early');
      return;
    }

    console.log('Setting loading state...');
    setIsFetchingSuggestions(true);
    setSuggestions([
      { id: 0, status: 'loading' },
      { id: 1, status: 'loading' },
      { id: 2, status: 'loading' },
    ]);
    console.log('Set loading suggestions, calling generateSuggestion...');

    const generateSuggestion = async (index: number) => {
      console.log(`=== Generating suggestion ${index} ===`);
      try {
        // Temporarily force fallback for testing
        const fallbackSuggestions = [
          {
            name: 'Enhance Quality',
            prompt: `Enhance the ${suggestion.name.toLowerCase()} in this image. ${suggestion.desc} Apply professional improvements while maintaining the natural look and feel.`
          },
          {
            name: 'Stylize Look',
            prompt: `Apply stylistic improvements for ${suggestion.name.toLowerCase()}. ${suggestion.desc} Create a more polished and visually appealing result.`
          },
          {
            name: 'Optimize Details',
            prompt: `Optimize and refine the ${suggestion.name.toLowerCase()} aspects. ${suggestion.desc} Focus on enhancing the most important visual elements.`
          }
        ];

        const fallbackSuggestion = fallbackSuggestions[index] || fallbackSuggestions[0];
        console.log(`Using fallback suggestion ${index}:`, fallbackSuggestion);

        setSuggestions(currentSuggestions =>
          currentSuggestions?.map(s =>
            s.id === index ? { 
              ...s, 
              status: 'success', 
              generatedSuggestion: fallbackSuggestion 
            } : s
          ) || []
        );
        console.log('Updated suggestions state for index', index);
        // Note: currentSuggestions is not accessible here, but we can check the state in React DevTools
      } catch (err) {
        console.error(`Error generating suggestion ${index}:`, err);
        
        // Fallback to generic suggestions when Gemini API is unavailable
        const fallbackSuggestions = [
          {
            name: 'Enhance Quality',
            prompt: `Enhance the ${suggestion.name.toLowerCase()} in this image. ${suggestion.desc} Apply professional improvements while maintaining the natural look and feel.`
          },
          {
            name: 'Stylize Look',
            prompt: `Apply stylistic improvements for ${suggestion.name.toLowerCase()}. ${suggestion.desc} Create a more polished and visually appealing result.`
          },
          {
            name: 'Optimize Details',
            prompt: `Optimize and refine the ${suggestion.name.toLowerCase()} aspects. ${suggestion.desc} Focus on enhancing the most important visual elements.`
          }
        ];

        const fallbackSuggestion = fallbackSuggestions[index] || fallbackSuggestions[0];

        setSuggestions(currentSuggestions =>
          currentSuggestions?.map(s =>
            s.id === index ? { 
              ...s, 
              status: 'success', 
              generatedSuggestion: fallbackSuggestion 
            } : s
          ) || []
        );
        console.log('Used fallback suggestion', index, ':', fallbackSuggestion);
      }
    };

    // Generate 3 context-aware suggestions
    console.log('Starting to generate all 3 suggestions...');
    [0, 1, 2].forEach(i => {
      console.log(`Calling generateSuggestion for index ${i}`);
      generateSuggestion(i);
    });
    setIsFetchingSuggestions(false);
  }, [image]);

  return (
    <div className="image-editor-container" style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'var(--background-color, #0a0a0a)',
      color: 'var(--text-color, #ffffff)'
    }}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
          }
        }}
        style={{ display: 'none' }}
        id="image-upload"
      />

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden' 
      }}>
        {/* Left/Main Area - Image Display */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem',
          minWidth: 0
        }}>
          {!image ? (
            <div style={{ 
              textAlign: 'center',
              padding: '3rem',
              border: '2px dashed var(--border-color, #333)',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('image-upload')?.click()}
            >
              <UploadIcon />
              <h2 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Upload an Image</h2>
              <p style={{ color: 'var(--text-secondary, #999)', margin: 0 }}>
                Click here or drag and drop an image to get started
              </p>
            </div>
          ) : (
            <div style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={image} 
                alt="Uploaded" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px'
                }} 
              />
            </div>
          )}

          {/* Prompt Input Area */}
          {image && (
            <div style={{ 
              width: '100%',
              maxWidth: '800px',
              marginTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                background: 'var(--surface-color, #1a1a1a)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #333)'
              }}>
                <input
                  type="text"
                  className="prompt-input"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSubmit(prompt);
                    }
                  }}
                  placeholder="Describe how you want to edit this image..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-color, #fff)',
                    fontSize: '1rem',
                    padding: '0.5rem'
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSubmit(prompt)}
                  disabled={isLoading || !prompt.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: isLoading || !prompt.trim() ? '#333' : 'var(--primary-color, #6366f1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '1rem',
                    fontWeight: 500
                  }}
                >
                  {isLoading ? 'Generating...' : 'Generate'}
                </button>
              </div>
              {error && (
                <p style={{ 
                  color: 'var(--error-color, #ff3b30)', 
                  marginTop: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - AI Analysis Panels */}
        {image && (
          <div style={{ 
            width: '400px', 
            maxWidth: '90vw',
            borderLeft: '1px solid var(--border-color, #333)',
            overflowY: 'auto',
            padding: '1rem',
            background: 'var(--surface-color, #0f0f0f)'
          }}>
            {/* Deep Analysis Panel - New Component */}
            <DeepAnalysisPanel
              currentImage={image}
              onApplyPrompt={(prompt) => {
                setPrompt(prompt);
                // Auto-scroll to prompt input and focus
                setTimeout(() => {
                  const promptInput = document.querySelector('.prompt-input');
                  if (promptInput) {
                    promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    (promptInput as HTMLTextAreaElement).focus();
                  }
                }, 100);
              }}
            />
            
            {/* Spacing */}
            <div style={{ height: '1rem' }} />
            
            {/* Original Gemini Analysis Panel */}
            <GeminiAnalysisPanel
              currentImage={image}
              onApplyPrompt={(prompt) => {
                setPrompt(prompt);
                // Scroll to prompt input
                setTimeout(() => {
                  const promptInput = document.querySelector('.prompt-input');
                  if (promptInput) {
                    promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    (promptInput as HTMLTextAreaElement).focus();
                  }
                }, 100);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
