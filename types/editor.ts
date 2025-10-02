/**
 * Editor Type Definitions
 * Types for the image editor, edit history, and editing operations
 */

// ===== Image Types =====

export type ImageDataURL = string;
export type ImageURL = string;
export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif';
export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageMetadata {
  format: ImageFormat;
  mimeType: ImageMimeType;
  size: number; // bytes
  dimensions: ImageDimensions;
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface ImageFile {
  dataUrl: ImageDataURL;
  metadata: ImageMetadata;
  name?: string;
}

// ===== Editor State =====

export type EditorView = 'upload' | 'editor';
export type EditorTab = 'edit' | 'filters' | 'effects' | 'assistant' | 'history' | 'settings';

export interface EditorState {
  // Current image
  currentImage: ImageDataURL | null;
  
  // Additional images
  referenceImage: ImageDataURL | null;
  maskImage: ImageDataURL | null;
  styleDirectorImage: ImageDataURL | null;
  
  // View state
  view: EditorView;
  activeTab: EditorTab;
  
  // Loading states
  isLoading: boolean;
  isEnhancingPrompt: boolean;
  isMasking: boolean;
  isFetchingSuggestions: boolean;
  isGeneratingVariations: boolean;
  
  // Input states
  prompt: string;
  error: string | null;
  
  // UI states
  isDragOver: boolean;
  loadingMessage: string;
  
  // Preview states
  showImagePreview: boolean;
  previewImageSrc: string;
  imageBeforePreview: ImageDataURL | null;
  isPreviewLoading: string | null;
}

// ===== Edit History =====

export interface HistoryEntry {
  id: string;
  image: ImageDataURL;
  timestamp: Date;
  operation?: string;
  prompt?: string;
}

export interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries?: number;
}

// ===== Color Adjustments =====

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ColorBalance {
  shadows: RGBColor;
  midtones: RGBColor;
  highlights: RGBColor;
}

export interface ColorAdjustments {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  temperature?: number;
  tint?: number;
  balance?: ColorBalance;
}

// ===== Zoom & Pan =====

export interface Point {
  x: number;
  y: number;
}

export interface ZoomState {
  level: number;
  minLevel: number;
  maxLevel: number;
}

export interface PanState {
  position: Point;
  isDragging: boolean;
  dragStart: Point;
}

export interface ViewportState {
  zoom: ZoomState;
  pan: PanState;
}

// ===== Suggestions & AI =====

export interface Suggestion {
  id: string;
  name: string;
  prompt: string;
  description?: string;
  category?: string;
  status?: 'loading' | 'success' | 'error';
  generatedSuggestion?: {
    name: string;
    prompt: string;
  };
}

export interface PromptVariation {
  id: string;
  name: string;
  prompt: string;
  basedOn?: string;
}

export interface AssistantCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  suggestions: Array<{
    id: string;
    name: string;
    desc: string;
  }>;
}

// ===== Filters & Effects =====

export interface Filter {
  id: string;
  name: string;
  prompt: string;
  thumbnail?: ImageDataURL;
  category?: 'color' | 'artistic' | 'vintage' | 'modern';
}

export interface Effect {
  id: string;
  name: string;
  prompt: string;
  intensity?: number;
  preview?: ImageDataURL;
}

// ===== Masking =====

export interface MaskState {
  isActive: boolean;
  brushSize: number;
  isErasing: boolean;
  isAutoSelecting: boolean;
  maskData: ImageDataURL | null;
}

export interface MaskSettings {
  feather: number;
  opacity: number;
  color: string;
}

// ===== Export Settings =====

export interface ExportSettings {
  format: ImageFormat;
  quality: number; // 0-100
  scale: number; // 0.1-2.0
  preserveMetadata: boolean;
  filename?: string;
}

export interface ExportResult {
  dataUrl: ImageDataURL;
  blob: Blob;
  size: number;
  format: ImageFormat;
}

// ===== Favorites =====

export interface Favorite {
  id: string;
  image: ImageDataURL;
  prompt?: string;
  createdAt: Date;
  tags?: string[];
  metadata?: ImageMetadata;
}

// ===== Settings =====

export interface EditorSettings {
  // Performance
  imageQuality: 'low' | 'medium' | 'high';
  enableHaptics: boolean;
  autoSave: boolean;
  
  // UI
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  theme: 'dark' | 'light' | 'auto';
  
  // Editing
  defaultPrompt?: string;
  preserveFacialFeatures: boolean;
  maxHistorySize: number;
  
  // API
  preferredModel: 'kie' | 'gemini' | 'deepseek' | 'nanoBanana';
  apiTimeout: number;
  retryAttempts: number;
}

// ===== Voice Recognition =====

export interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

// ===== Authentication =====

export interface AuthState {
  isAuthenticated: boolean;
  sessionExpiry?: Date;
  showPinModal: boolean;
  pinInput: string;
  pinError: string;
}

// ===== Canvas =====

export interface CanvasState {
  context: CanvasRenderingContext2D | null;
  dimensions: ImageDimensions;
  scale: number;
  offset: Point;
}

// ===== Edit Operation =====

export interface EditOperation {
  type: 'generate' | 'filter' | 'adjust' | 'mask' | 'effect';
  prompt?: string;
  filter?: Filter;
  adjustments?: ColorAdjustments;
  mask?: MaskState;
  effect?: Effect;
  timestamp: Date;
}

export interface EditResult {
  success: boolean;
  image?: ImageDataURL;
  error?: string;
  operation: EditOperation;
  duration?: number;
}

// ===== Keyboard Shortcuts =====

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: string;
  description: string;
  enabled?: boolean;
}

// ===== Template =====

export interface PromptTemplate {
  id: string;
  name: string;
  prompt: string;
  category?: string;
  tags?: string[];
  isFavorite?: boolean;
  usageCount?: number;
}

// ===== Batch Editing =====

export interface BatchEditJob {
  id: string;
  images: ImageDataURL[];
  operation: EditOperation;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: EditResult[];
}



