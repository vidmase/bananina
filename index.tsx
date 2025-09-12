/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fix for SpeechRecognition TypeScript errors by adding type definitions for the Web Speech API.
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [key: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof webkitSpeechRecognition;
  }
}

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { kieClient } from './kieClient';
import { deepseekClient } from './deepseekClient';
import { nanoBananaClient } from './nanoBananaClient';
import MaskEditor from './MaskEditor';

// --- ICONS ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
const LayersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>;
const EffectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 2-2.5 2.5 3 3L19 5" /><path d="m14 4-1 1" /><path d="m10 8-1 1" /><path d="m20 10-1 1" /><path d="m18 12-1 1" /><path d="m12 18-1 1" /><path d="m8 22-1-1" /><path d="m4 18-1 1" /><path d="m2 16 1-1" /><path d="M9 3.5c-2.42 2.4-2.42 6.3 0 8.7 .9.9 2.1.9 3 0" /><path d="M14.5 9c-2.42 2.4-2.42 6.3 0 8.7.9.9 2.1.9 3 0" /><path d="M22 22s-4-4-7-4" /></svg>;
const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>;
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3-2.3" /></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`star-icon ${filled ? 'filled' : ''}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
// --- ASSISTANT ICONS ---
const LightbulbIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const PaletteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.667 0-.424-.103-.822-.289-1.17-.189-.354-.45-.65-.759-.883-.31-.23-.68-.37-1.07-.428-.39-.06-.77-.02-1.13.12-.36.14-.68.36-1.02.65-.32.27-.67.52-.98.81-.33.29-.62.63-.88.98-.26.35-.48.71-.65 1.08-.18.37-.28.75-.28 1.15C6.333 21.254 7.07 22 8 22s1.667-.746 1.667-1.667c0-.424-.103-.822-.289-1.17-.189-.354-.45-.65-.759-.883-.31-.23-.68-.37-1.07-.428-.39-.06-.77-.02-1.13.12-.36.14-.68.36-1.02.65-.32.27-.67.52-.98.81-.33.29-.62.63-.88.98-.26.35-.48.71-.65 1.08-.18.37-.28.75-.28 1.15C4.333 21.254 5.07 22 6 22s1.667-.746 1.667-1.667c0-.424-.103-.822-.289-1.17-.189-.354-.45-.65-.759-.883-.31-.23-.68-.37-1.07-.428-.39-.06-.77-.02-1.13.12-.36.14-.68.36-1.02.65-.32.27-.67.52-.98.81-.33.29-.62.63-.88.98-.26.35-.48.71-.65 1.08-.18.37-.28.75-.28 1.15C2.333 21.254 3.07 22 4 22s1.667-.746 1.667-1.667c0-.424-.103-.822-.289-1.17-.189-.354-.45-.65-.759-.883-.31-.23-.68-.37-1.07-.428-.39-.06-.77-.02-1.13.12-.36.14-.68.36-1.02.65-.32.27-.67.52-.98.81-.33.29-.62.63-.88.98-.26.35-.48.71-.65 1.08-.18.37-.28.75-.28 1.15C.333 21.254 1.07 22 2 22s1.667-.746 1.667-1.667c0-.424-.103-.822-.289-1.17-.189-.354-.45-.65-.759-.883a2.667 2.667 0 0 0-2.13-.28c-1.13.14-2.18.78-2.83 1.65-.65.88-1 1.96-1 3.08 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
const MountainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const ShirtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.04c.535-1.619.363-3.338-.5-4.544s-2.925-1.035-4.544-.5C3.373 10.535 1.654 12.363.956 14a1 1 0 0 0 1.414 1.414c.886-.886 1.815-1.48 2.828-1.777.712-.21 1.45-.147 2.15.195.7.342 1.25.9 1.588 1.588.342.7.405 1.438.195 2.15-.298 1.013-.89 1.942-1.777 2.828a1 1 0 0 0 1.414 1.414c1.637-.7 3.465-2.42 4.004-3.938z"/><path d="M20.044 3.96a1 1 0 0 0-1.414-1.414c-1.013.298-1.942.89-2.828 1.777-.7.342-1.438.405-2.15.195-.7-.342-1.25-.9-1.588-1.588-.342-.7-.405-1.438-.195-2.15.298-1.013.89-1.942 1.777-2.828a1 1 0 0 0-1.414-1.414c-.7 1.637-2.42 3.465-3.938 4.004s-3.338-.363-4.544.5-1.035 2.925-.5 4.544c.535 1.619 2.363 3.338 3.938 4.004a1 1 0 0 0 1.414-1.414c-.886-.886-1.48-1.815-1.777-2.828-.21-.712-.147-1.45.195-2.15.342-.7.9-1.25 1.588-1.588.7-.342 1.438-.405 2.15-.195 1.013.298 1.942.89 2.828 1.777a1 1 0 0 0 1.414-1.414c-1.637-.7-3.465-2.42-4.004-3.938z"/></svg>;
const BoxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2H1.78A1.78 1.78 0 0 0 0 3.78v8.44A1.78 1.78 0 0 0 1.78 14h10.44A1.78 1.78 0 0 0 14 12.22V3.78A1.78 1.78 0 0 0 12.22 2z"/><path d="m5.13 7.6 2.83-2.83"/><path d="M10 12.22V22h8.22a1.78 1.78 0 0 0 1.78-1.78v-8.44a1.78 1.78 0 0 0-1.78-1.78H14"/><path d="M18.88 16.5 16 13.67"/></svg>;
const SofaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1H6v-1a2 2 0 0 0-4 0Z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>;
const ChairIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9V7a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M14 17a2 2 0 0 1-2-2V5"/><path d="M6 15a2 2 0 0 0-2 2v3"/><path d="M6 5v12a2 2 0 0 0 2 2h4"/><path d="M5 7v2h14V7Z"/></svg>;
const PaintRollerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 6h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"/><path d="M19 12h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v-4Z"/><path d="M4 12H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2v-4Z"/><path d="M12 12v3a1 1 0 0 0 1 1h.5a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-1a1 1 0 0 1-1-1V3"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const WindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>;
const ZapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const FilmIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="2.18" ry="2.18"/><line x1="7" x2="7" y1="2" y2="22"/><line x1="17" x2="17" y1="2" y2="22"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="2" x2="22" y1="7" y2="7"/><line x1="2" x2="22" y1="17" y2="17"/></svg>;
const RocketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>;
const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const BrainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>;
const WandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2m0 16v-2m8-6h-2m-16 0h2m13.4-9.4-1.4 1.4M6.6 17.4l-1.4 1.4m0-12.8 1.4 1.4m11.8 11.8-1.4-1.4"/><circle cx="12" cy="12" r="2"/></svg>;
const GamepadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>;
const PuzzleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19.439 7.85c-.049.322-.059.648-.026.975.056.506.194.999.462 1.43.134.216.288.424.418.651.13.227.226.475.288.734.062.259.094.53.094.803 0 .847-.012 1.694-.012 2.54 0 .735-.039 1.47-.039 2.205v.025c0 .84-.194 1.654-.556 2.394-.362.74-.9 1.365-1.565 1.82a4.51 4.51 0 0 1-2.094.616L15 21.75H9l-.604-.016a4.493 4.493 0 0 1-2.094-.616c-.665-.455-1.203-1.08-1.565-1.82-.362-.74-.556-1.554-.556-2.394v-.025c0-.735-.039-1.47-.039-2.205 0-.846-.012-1.693-.012-2.54 0-.273.032-.544.094-.803a2.014 2.014 0 0 1 .707-1.385C5.194 9.818 5.348 9.61 5.482 9.394c.268-.431.406-.924.462-1.43.033-.327.023-.653-.026-.975C5.867 6.716 5.8 6.444 5.8 6.17V6c0-.847.194-1.661.556-2.401C6.718 2.859 7.256 2.234 7.921 1.779A4.51 4.51 0 0 1 10.015 1.163L10.62 1.147h2.76l.604.016c.729.044 1.418.24 2.094.616.665.455 1.203 1.08 1.565 1.82.362.74.556 1.554.556 2.401v.17c0 .274-.067.546-.118.819z"/></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const CarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 9.6a2 2 0 0 0-1.6-1.4C16.6 8.2 16.3 8 16 8H8c-.3 0-.6.2-.8.2-.6.2-1.2.8-1.6 1.4L3.5 11.2C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>;
const WrenchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const GaugeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>;
const FlameIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const CogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m1.05 9 1.93-.55"/><path d="m21.02 15 1.93.55"/><path d="M7 12H1"/><path d="M23 12h-6"/><path d="m1.05 15 1.93.55"/><path d="m21.02 9 1.93-.55"/></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const ThermometerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>;
const RadioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265L16.24 7.76z"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/></svg>;
const BatteryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/><line x1="14" x2="14" y1="11" y2="13"/></svg>;
const CircuitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 9h6v6H9V9z"/><path d="M9 1v2"/><path d="M15 1v2"/><path d="M9 21v2"/><path d="M15 21v2"/><path d="M1 9h2"/><path d="M1 15h2"/><path d="M21 9h2"/><path d="M21 15h2"/></svg>;
const SmileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const BabyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6l-3-9z"/><path d="M12 3v9"/><circle cx="8" cy="20" r="2"/><circle cx="16" cy="20" r="2"/><path d="M10 20h4"/><path d="M9 20v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>;
const CrownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L14.5 8.5l4.5-1.5a.5.5 0 0 1 .65.65L18.5 12l1.15 4.35a.5.5 0 0 1-.65.65L14.5 15.5l-2.062 5.234a.5.5 0 0 1-.876 0L9.5 15.5 5 17a.5.5 0 0 1-.65-.65L5.5 12 4.35 7.65a.5.5 0 0 1 .65-.65L9.5 8.5l2.062-5.234Z"/></svg>;
const MakeupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const GlassesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/><path d="M14 15a2 2 0 0 0-4 0"/></svg>;
const HairIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 9v4c0 1 0 2 1 3s2 1 3 1h6c1 0 2 0 3-1s1-2 1-3V9c0-4-3-7-7-7z"/><path d="M8 21c0-1 0-2 1-3"/><path d="M16 21c0-1 0-2-1-3"/></svg>;
const MirrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>;
const AgeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>;
const FitnessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 8.5L9 7l1.5 1.5L12 7l1.5 1.5L15 7l1.5 1.5"/><path d="M7.5 15.5L9 17l1.5-1.5L12 17l1.5-1.5L15 17l1.5-1.5"/><rect width="20" height="6" x="2" y="9" rx="2"/></svg>;
const PoseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v5l-2 3v6"/><path d="M12 12l2 3v6"/><path d="M12 7l-2-2"/><path d="M12 7l2-2"/></svg>;
const ApertureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m14.31 8 5.74 9.94"/><path d="M9.69 8h11.48"/><path d="m7.38 12 5.74-9.94"/><path d="M9.69 16 3.95 6.06"/><path d="M14.31 16H2.83"/><path d="m16.62 12-5.74 9.94"/></svg>;
const FocusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="m21 12-6 0m-6 0-6 0"/></svg>;
const TimerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>;
const StackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>;
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const CompassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/></svg>;
const MagnetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15h15l-1-6H7l-1 6z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>;
const PrismIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
const ScanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>;
const CalibrationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/><path d="M9 9h6v4H9V9z"/></svg>;
const BlueprintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M9 9h6v6H9V9z"/><path d="M9 3v2"/><path d="M15 3v2"/><path d="M9 19v2"/><path d="M15 19v2"/><path d="M3 9h2"/><path d="M3 15h2"/><path d="M19 9h2"/><path d="M19 15h2"/></svg>;
const RulerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.3 8.7 8.7 21.3c-.4.4-1 .4-1.4 0l-5.6-5.6c-.4-.4-.4-1 0-1.4L14.3 2.7c.4-.4 1-.4 1.4 0l5.6 5.6c.4.4.4 1 0 1.4Z"/><path d="m7 10 2-2"/><path d="m13 16 2-2"/><path d="m19 22-2-2"/></svg>;
const WindowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M12 3v18"/><path d="M3 12h18"/></svg>;
const DoorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><circle cx="16" cy="12" r="1"/></svg>;
const StairsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22V12h4V8h4V4h6"/></svg>;
const LampIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2h6l3 7H6l3-7Z"/><path d="M12 9v13"/><path d="M9 22h6"/></svg>;
const TextureIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M7 7h.01"/><path d="M17 7h.01"/><path d="M7 17h.01"/><path d="M17 17h.01"/><path d="M12 12h.01"/></svg>;
const PlantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M12 9a3 3 0 0 1 3-3 3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V9Z"/><path d="M12 22v-4"/></svg>;
const BalconyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8"/><path d="M2 18h20"/></svg>;
const WavesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>;
const ForestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0a3 3 0 0 1-1.1-5.8v0L3 10v0a3 3 0 0 1 3-3v0a3 3 0 0 1 3 3v0a3 3 0 0 1 1 0Z"/><path d="M7 21v-3"/><path d="M15 10v.2A3 3 0 0 0 16.1 16v0H20v0a3 3 0 0 0 1.1-5.8v0L21 10v0a3 3 0 0 0-3-3v0a3 3 0 0 0-3 3v0a3 3 0 0 0-1 0Z"/><path d="M17 21v-3"/></svg>;
const DesertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21s-4-3-4-9 4-9 4-9"/><path d="M16 3s4 3 4 9-4 9-4 9"/><path d="M15 9h-6l-3 9h12l-3-9Z"/></svg>;
const SnowflakeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>;
const RainIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="m8 19 2-3 2 3"/><path d="m16 19 2-3 2 3"/></svg>;
const CanyonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18L12 4 3 20z"/><path d="M12 4v16"/><path d="M8 12h8"/></svg>;
const VolcanoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20l-4-8-4 2-4-2-4 8z"/><path d="M12 4l-2 4h4l-2-4z"/><circle cx="12" cy="2" r="1"/><circle cx="10" cy="3" r="0.5"/><circle cx="14" cy="3" r="0.5"/></svg>;
const ValleyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4L12 12 4 4"/><path d="M12 12v8"/><path d="M8 16l4 4 4-4"/></svg>;
const LighthouseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L8 6v14h8V6l-4-4z"/><path d="M8 10h8"/><path d="M8 14h8"/><path d="M6 20h12"/><path d="M12 2l8 4"/></svg>;
const IslandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="17" rx="10" ry="4"/><path d="M8 12c0-3 2-5 4-5s4 2 4 5"/><path d="M12 7V3"/><path d="M10 5l4-2"/><path d="M14 5l-4-2"/></svg>;

// Before/After Slider Component
interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ beforeImage, afterImage, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const updateSliderPosition = (clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const position = ((clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, position)));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div className={`before-after-slider ${className} ${isDragging ? 'dragging' : ''}`} ref={containerRef}>
      <div className="before-after-container">
        {/* Before image - visible on the left side */}
        <div 
          className="before-image-container"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img src={beforeImage} alt="Before" className="before-image" />
        </div>
        
        {/* After image - visible on the right side */}
        <div 
          className="after-image-container" 
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <img src={afterImage} alt="After" className="after-image" />
        </div>
        
        {/* Slider handle */}
        <div 
          className="slider-handle" 
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="slider-line"></div>
          <div className="slider-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8L22 12L18 16"/>
              <path d="M6 8L2 12L6 16"/>
            </svg>
          </div>
        </div>
        
        {/* Labels */}
        <div className="before-label" style={{ opacity: sliderPosition > 20 ? 1 : 0 }}>BEFORE</div>
        <div className="after-label" style={{ opacity: sliderPosition < 80 ? 1 : 0 }}>AFTER</div>
      </div>
    </div>
  );
};

const QUICK_EFFECTS = [
  { name: 'Remove BG', prompt: 'remove the background, output a transparent PNG' },
  { name: 'Pixar Style', prompt: 'convert to a 3D pixar animated movie style' },
  { name: 'Watercolor', prompt: 'turn into a watercolor painting' },
  { name: 'Neon Punk', prompt: 'apply a neon punk aesthetic' },
  { name: 'B&W', prompt: 'convert to a high contrast black and white photo' },
  { name: 'Vintage', prompt: 'make the image look like a vintage photograph from the 1960s' },
];

const PREDEFINED_FILTERS = [
  { name: 'Sepia', prompt: 'apply a classic sepia tone to the image' },
  { name: 'Vignette', prompt: 'add a subtle, dark vignette effect to the corners of the image' },
  { name: 'Grayscale', prompt: 'convert the image to grayscale' },
  { name: 'Invert Colors', prompt: 'invert the colors of the image' },
  { name: 'Solarize', prompt: 'apply a solarize filter effect' },
];

const ARTISTIC_STYLES = [
  { name: 'Oil Painting', prompt: 'transform the image into a classic oil painting with visible brushstrokes and rich texture' },
  { name: 'Sketch', prompt: 'convert the image into a detailed pencil sketch with fine lines and shading' },
  { name: 'Cartoon', prompt: 'reimagine the image in a vibrant, bold-lined cartoon style' },
  { name: 'Impressionist', prompt: 'apply an impressionist painting style, focusing on light and movement with short, thick brushstrokes' },
  { name: 'Pop Art', prompt: 'transform the image into a vibrant, colorful pop art style like Andy Warhol' },
  { name: 'Cyberpunk', prompt: 'give the image a futuristic, neon-drenched cyberpunk aesthetic with glowing lights and a gritty atmosphere' },
  { name: 'Steampunk', prompt: 'recreate the image with a steampunk theme, incorporating gears, cogs, brass, and Victorian-era technology' },
  { name: 'Stained Glass', prompt: 'transform the image into a beautiful stained glass window with bold black outlines and vibrant, translucent colors' },
];

const LOADING_MESSAGES = [
  "Painting with pixels...",
  "Consulting the creative AI...",
  "Warming up the digital canvas...",
  "Adding a touch of magic...",
  "Reticulating splines...",
];

type ActiveTab = 'edit' | 'layers' | 'effects' | 'assistant' | 'favorites';
type Suggestion = { name: string; prompt: string; category?: string; };

const assistantCategoryIcons: { [key: string]: () => React.JSX.Element } = {
    'Technical Advice': SettingsIcon,
    'Color Grading': PaletteIcon,
    'Composition': GridIcon,
    'Lighting': SunIcon,
    'Fashion Stylist': ShirtIcon,
    'Portrait Studio': UserIcon,
    'Architectural Styles': HomeIcon,
    'Interior Makeover': SofaIcon,
    'Furniture': ChairIcon,
    'Interior Palettes': PaintRollerIcon,
    'Declutter': TrashIcon,
    'Background Swap': MountainIcon,
    'Season & Weather': WindIcon,
    'Creative Concepts': LightbulbIcon,
    'Storyteller': BookOpenIcon,
    'VFX Supervisor': SparklesIcon,
    'Prop Master': BoxIcon,
    'Photo Restoration': CameraIcon,
    'AI Enhancement': ZapIcon,
    'Style Transfer': WandIcon,
    'Cinematic Effects': FilmIcon,
    'Futuristic Tech': RocketIcon,
    'Emotion & Mood': HeartIcon,
    'Smart Analysis': BrainIcon,
    'Gaming & Fantasy': GamepadIcon,
    'Problem Solver': PuzzleIcon,
    'Trend Predictor': TrendingUpIcon,
    'Vision Enhancement': EyeIcon,
    'Body Kit Designer': CarIcon,
    'Engine Tuning': WrenchIcon,
    'Performance Gauge': GaugeIcon,
    'Exhaust System': FlameIcon,
    'Suspension Setup': CogIcon,
    'Safety Upgrades': ShieldIcon,
    'Cooling System': ThermometerIcon,
    'Audio System': RadioIcon,
    'Electrical Mods': BatteryIcon,
    'ECU Tuning': CircuitIcon,
    'Expression Coach': SmileIcon,
    'Group Dynamics': UsersIcon,
    'Child Photography': BabyIcon,
    'Glamour Shots': CrownIcon,
    'Beauty Retouching': MakeupIcon,
    'Eyewear Styling': GlassesIcon,
    'Hair Styling': HairIcon,
    'Skin Perfection': MirrorIcon,
    'Age Enhancement': AgeIcon,
    'Body Contouring': FitnessIcon,
    'Pose Director': PoseIcon,
    'Depth Master': ApertureIcon,
    'Focus Stacking': FocusIcon,
    'Long Exposure': TimerIcon,
    'HDR Blending': StackIcon,
    'Macro Precision': TargetIcon,
    'Perspective Wizard': CompassIcon,
    'Motion Capture': MagnetIcon,
    'Light Spectrum': PrismIcon,
    'Frame Analysis': ScanIcon,
    'Camera Calibration': CalibrationIcon,
    'Space Planning': BlueprintIcon,
    'Room Measurements': RulerIcon,
    'Window Design': WindowIcon,
    'Door Styling': DoorIcon,
    'Staircase Design': StairsIcon,
    'Lighting Design': LampIcon,
    'Material Textures': TextureIcon,
    'Biophilic Design': PlantIcon,
    'Outdoor Spaces': BalconyIcon,
    'Ceiling Features': LayersIcon,
    'Ocean Waves': WavesIcon,
    'Forest Depths': ForestIcon,
    'Desert Landscapes': DesertIcon,
    'Winter Scenes': SnowflakeIcon,
    'Storm Weather': RainIcon,
    'Canyon Views': CanyonIcon,
    'Volcanic Terrain': VolcanoIcon,
    'Valley Vistas': ValleyIcon,
    'Coastal Beacons': LighthouseIcon,
    'Tropical Islands': IslandIcon,
};

const suggestionCategoryToClassName: { [key: string]: string } = {
    'Technical Advice': 'photography',
    'Color Grading': 'photography',
    'Composition': 'photography',
    'Lighting': 'photography',
    'Fashion Stylist': 'people',
    'Portrait Studio': 'people',
    'Architectural Styles': 'architecture',
    'Interior Makeover': 'architecture',
    'Furniture': 'architecture',
    'Interior Palettes': 'architecture',
    'Declutter': 'architecture',
    'Background Swap': 'landscapes',
    'Season & Weather': 'landscapes',
    'Creative Concepts': 'creative',
    'Storyteller': 'creative',
    'VFX Supervisor': 'creative',
    'Prop Master': 'creative',
    'Photo Restoration': 'photography',
    'AI Enhancement': 'creative',
    'Style Transfer': 'creative',
    'Cinematic Effects': 'creative',
    'Futuristic Tech': 'creative',
    'Emotion & Mood': 'people',
    'Smart Analysis': 'photography',
    'Gaming & Fantasy': 'creative',
    'Problem Solver': 'photography',
    'Trend Predictor': 'creative',
    'Vision Enhancement': 'photography',
    'Body Kit Designer': 'automotive',
    'Engine Tuning': 'automotive',
    'Performance Gauge': 'automotive',
    'Exhaust System': 'automotive',
    'Suspension Setup': 'automotive',
    'Safety Upgrades': 'automotive',
    'Cooling System': 'automotive',
    'Audio System': 'automotive',
    'Electrical Mods': 'automotive',
    'ECU Tuning': 'automotive',
    'Expression Coach': 'people',
    'Group Dynamics': 'people',
    'Child Photography': 'people',
    'Glamour Shots': 'people',
    'Beauty Retouching': 'people',
    'Eyewear Styling': 'people',
    'Hair Styling': 'people',
    'Skin Perfection': 'people',
    'Age Enhancement': 'people',
    'Body Contouring': 'people',
    'Pose Director': 'people',
    'Depth Master': 'photography',
    'Focus Stacking': 'photography',
    'Long Exposure': 'photography',
    'HDR Blending': 'photography',
    'Macro Precision': 'photography',
    'Perspective Wizard': 'photography',
    'Motion Capture': 'photography',
    'Light Spectrum': 'photography',
    'Frame Analysis': 'photography',
    'Camera Calibration': 'photography',
    'Space Planning': 'architecture',
    'Room Measurements': 'architecture',
    'Window Design': 'architecture',
    'Door Styling': 'architecture',
    'Staircase Design': 'architecture',
    'Lighting Design': 'architecture',
    'Material Textures': 'architecture',
    'Biophilic Design': 'architecture',
    'Outdoor Spaces': 'architecture',
    'Ceiling Features': 'architecture',
    'Ocean Waves': 'landscapes',
    'Forest Depths': 'landscapes',
    'Desert Landscapes': 'landscapes',
    'Winter Scenes': 'landscapes',
    'Storm Weather': 'landscapes',
    'Canyon Views': 'landscapes',
    'Volcanic Terrain': 'landscapes',
    'Valley Vistas': 'landscapes',
    'Coastal Beacons': 'landscapes',
    'Tropical Islands': 'landscapes',
};

// Helper function to extract base64 data from data URL
const extractBase64Data = (base64DataUrl: string): string | null => {
  const match = base64DataUrl.match(/^data:(.*?);base64,(.*)$/);
  if (!match) return null;
  return match[2];
};

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(LOADING_MESSAGES[0]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [styleDirectorImage, setStyleDirectorImage] = useState<string | null>(null);
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [isMasking, setIsMasking] = useState<boolean>(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // New states for Art Director feature
  const [view, setView] = useState<'upload' | 'editor'>('upload');
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState<boolean>(false);
  const [imageBeforePreview, setImageBeforePreview] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // PIN validation
  const validatePin = (inputPin: string): boolean => {
    // For simplicity, directly compare the PIN
    // In production, use proper authentication with hashed passwords
    return inputPin === '1256';
  };

  const handlePinSubmit = () => {
    if (validatePin(pinInput)) {
      setIsAuthenticated(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      // Session expires after 1 hour for security
      setTimeout(() => {
        setIsAuthenticated(false);
      }, 3600000);
    } else {
      setPinError('Invalid PIN code');
      setPinInput('');
      // Clear error after 3 seconds
      setTimeout(() => setPinError(''), 3000);
    }
  };

  const handleUploadClick = () => {
    console.log('Upload button clicked, isAuthenticated:', isAuthenticated);
    console.log('showPinModal before:', showPinModal);
    if (!isAuthenticated) {
      setShowPinModal(true);
      console.log('Setting showPinModal to true');
    } else {
      document.getElementById('image-upload')?.click();
    }
  };

  const handlePinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4); // Only digits, max 4
    setPinInput(value);
    setPinError('');
  };

  const handlePinKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pinInput.length === 4) {
      handlePinSubmit();
    }
  };


  const [image, setImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('edit');


  // Undo/Redo state
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Favorites state
  const [favorites, setFavorites] = useState<Suggestion[]>([]);

  // Speech Recognition ref
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Using kie.ai client instead of Google GenAI SDK

  // Effect to set a random loading message
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      interval = window.setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 2000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  // Effect for speech recognition setup
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech Recognition API is not supported in this browser.");
      return;
    }
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;
    recognition.continuous = false; // Process one utterance at a time.
    recognition.interimResults = false; // We only want the final, most accurate result.
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Get the transcript from the first result.
      const transcript = event.results[0][0].transcript;
      
      // Append the final transcript to the prompt.
      if (transcript) {
          setPrompt(prev => (prev.trim() ? prev + ' ' : '') + transcript.trim());
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, []);

  // ---- Undo/Redo Logic ----
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

  // ---- Image Handling Logic ----
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setView('editor');
      // Initialize history
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
      // Skip Nano Banana API due to upload issues, use KIE client directly
      console.log('Using KIE client for image editing');
      
      let enhancedPrompt = currentPrompt;
      
      // Add specific editing context to ensure the API modifies the uploaded image
      if (maskImage || styleDirectorImage || referenceImage) {
        enhancedPrompt = `Modify the uploaded image by: ${currentPrompt}. Preserve the original subject and composition while applying the requested changes.`;
      } else {
        enhancedPrompt = `Apply the following changes to the uploaded image: ${currentPrompt}. Keep the original image structure and only modify as requested.`;
      }
      
      // Use KIE client directly for more reliable image editing
      return await kieClient.generateImage(enhancedPrompt, baseImage);
  }, [maskImage, styleDirectorImage, referenceImage]);

  // ---- Main AI Submit Logic ----
  const handleSubmit = useCallback(async (currentPrompt: string) => {
    if (!image || !currentPrompt) return;

    setIsLoading(true);
    setError(null);
    setSuggestions(null); // Close suggestions panel if a new prompt is submitted

    try {
      const newImage = await generateImage(currentPrompt, image);
      setImage(newImage);
      updateHistory(newImage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [image, generateImage, updateHistory]);

  // ---- Prompt Enhancement ----
  const handleEnhancePrompt = useCallback(async () => {
    if (!prompt) return;
    setIsEnhancingPrompt(true);
    try {
        const enhancedPrompt = await deepseekClient.enhancePrompt(prompt);
        setPrompt(enhancedPrompt);
    } catch (err) {
        console.error("Error enhancing prompt:", err);
        // Fallback to basic enhancement
        const fallbackPrompt = `${prompt}, professional photography, high quality, detailed, cinematic lighting, sharp focus`;
        setPrompt(fallbackPrompt);
    } finally {
        setIsEnhancingPrompt(false);
    }
  }, [prompt]);

  // ---- Voice Prompting ----
  const toggleListening = () => {
      if (isListening) {
          recognitionRef.current?.stop();
      } else {
          recognitionRef.current?.start();
      }
      setIsListening(!isListening);
  };

  // ---- Favorites Logic ----
  const isFavorite = useCallback((suggestion: Suggestion) => {
    return favorites.some(fav => fav.prompt === suggestion.prompt);
  }, [favorites]);

  const toggleFavorite = useCallback((suggestion: Suggestion) => {
    setFavorites(prev => {
        const isAlreadyFavorite = prev.some(fav => fav.prompt === suggestion.prompt);
        if (isAlreadyFavorite) {
            return prev.filter(fav => fav.prompt !== suggestion.prompt);
        } else {
            return [...prev, suggestion];
        }
    });
  }, []);

  // ---- AI Assistant Logic ----
  const createSuggestionHandler = (systemInstruction: string, featureName: string) => useCallback(async () => {
    if (!image) return;

    setActiveSuggestionCategory(featureName);
    setIsFetchingSuggestions(true);
    setError(null);
    setSuggestions(null);

    try {
      // Use DeepSeek to generate dynamic suggestions based on the image
      const aiSuggestions = await deepseekClient.generateSuggestions(systemInstruction, "the uploaded image");
      
      const suggestionsWithCategory = aiSuggestions.map((s: {name: string, prompt: string}) => ({
        ...s,
        category: featureName,
      }));
      setSuggestions(suggestionsWithCategory);

    } catch (err) {
      console.error(`${featureName} Error:`, err);
      // Fallback to predefined suggestions if DeepSeek fails
      const fallbackSuggestions = getPredefinedSuggestions(featureName);
      const suggestionsWithCategory = fallbackSuggestions.map((s: {name: string, prompt: string}) => ({
        ...s,
        category: featureName,
      }));
      setSuggestions(suggestionsWithCategory);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [image]);

  const handlePreview = useCallback(async (previewPrompt: string) => {
    if (!image) return;
    setError(null);
    setIsPreviewLoading(previewPrompt);

    try {
        // If this is the first preview, save the original image state
        if (!imageBeforePreview) {
            setImageBeforePreview(image);
        }
        
        // Generate from original image for consistent previews
        const baseImageForPreview = imageBeforePreview || image;
        const newImage = await generateImage(previewPrompt, baseImageForPreview);
        setImage(newImage);
    } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate preview.");
        // Revert to original if preview fails
        if (imageBeforePreview) {
          setImage(imageBeforePreview);
        }
    } finally {
        setIsPreviewLoading(null);
    }
}, [image, imageBeforePreview, generateImage]);

// Helper function to provide predefined suggestions
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
    'Color Grading': [
      { name: 'Cinematic Grade', prompt: 'Apply a warm, golden-hour cinematic color grade with rich shadows' },
      { name: 'Cool Tone', prompt: 'Add a cool, blue-tinted color grade with high contrast' },
      { name: 'Vintage Look', prompt: 'Apply a vintage film color grade with faded highlights and warm tones' }
    ],
    'Composition': [
      { name: 'Rule of Thirds', prompt: 'Recompose using the rule of thirds for better visual balance' },
      { name: 'Leading Lines', prompt: 'Add leading lines to guide the viewer\'s eye to the main subject' },
      { name: 'Frame Focus', prompt: 'Create natural framing elements to highlight the main subject' }
    ],
    'Lighting': [
      { name: 'Dramatic Lighting', prompt: 'Apply dramatic, high-contrast Rembrandt lighting from the side' },
      { name: 'Soft Portrait', prompt: 'Use soft, diffused lighting for a flattering portrait effect' },
      { name: 'Golden Hour', prompt: 'Simulate warm, golden-hour lighting with long shadows' }
    ],
    'Background Swap': [
      { name: 'Urban Scene', prompt: 'Replace background with a bustling cityscape at sunset' },
      { name: 'Nature Setting', prompt: 'Place in a serene forest with dappled sunlight' },
      { name: 'Studio Setup', prompt: 'Use a clean, professional studio background' }
    ],
    'Fashion Stylist': [
      { name: 'Formal Wear', prompt: 'Change outfit to elegant formal attire' },
      { name: 'Casual Style', prompt: 'Update to trendy casual streetwear' },
      { name: 'Vintage Fashion', prompt: 'Apply vintage 1950s fashion styling' }
    ],
    'Architectural Styles': [
      { name: 'Modern Minimalist', prompt: 'Transform to clean, modern minimalist architecture' },
      { name: 'Gothic Revival', prompt: 'Apply Gothic architectural elements with ornate details' },
      { name: 'Art Deco', prompt: 'Style with Art Deco geometric patterns and luxury materials' }
    ],
    'Storyteller': [
      { name: 'Adventure Scene', prompt: 'Transform into an epic adventure scene with dramatic action' },
      { name: 'Fairy Tale', prompt: 'Create a whimsical fairy tale atmosphere with magical elements' },
      { name: 'Sci-Fi Story', prompt: 'Turn into a futuristic sci-fi scene with advanced technology' }
    ]
  };
  
  return suggestions[category] || [
    { name: 'Enhance', prompt: 'Enhance and improve the overall quality of the image' },
    { name: 'Stylize', prompt: 'Apply artistic styling and creative effects' },
    { name: 'Optimize', prompt: 'Optimize colors, lighting, and composition' }
  ];
};

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
    "You are an AI Art Director. Analyze the user's image and provide three creative and transformative ideas. Each suggestion should be a concise, actionable prompt that dramatically alters the image's style or subject.",
    "Creative Concepts"
  );
  const handleGetTechnicalAdvice = createSuggestionHandler(
    "You are an AI Photography Expert. Analyze the user's image and provide three technical suggestions to improve the photo. Focus on camera settings, exposure, focus, or other technical aspects. Each suggestion should be a clear, actionable prompt.",
    "Technical Advice"
  );

  const handleGetColorGradingIdeas = createSuggestionHandler(
    "You are an AI Colorist. Analyze the user's image and suggest three different professional color grades. Each suggestion should be an actionable prompt describing a specific cinematic or artistic color style (e.g., 'Apply a warm, golden-hour cinematic grade' or 'Give it a high-contrast, moody blue tone').",
    "Color Grading"
  );
  const handleGetColorAdvice = createSuggestionHandler(
    "You are an AI Colorist. Analyze the user's image and suggest three different professional color grades. Each suggestion should be an actionable prompt describing a specific cinematic or artistic color style (e.g., 'Apply a warm, golden-hour cinematic grade' or 'Give it a high-contrast, moody blue tone').",
    "Color Grading"
  );
  const handleGetCompositionIdeas = createSuggestionHandler(
    "You are an AI Composition Coach, an expert in photographic principles like the rule of thirds, leading lines, framing, and balance. Analyze the user's image and provide three distinct, actionable suggestions to improve its composition. Each suggestion should be a clear instruction the user can follow, like a specific crop or a generative fill idea. Frame your suggestions as if you are a helpful coach.",
    "Composition"
  );
  const handleGetLightingIdeas = createSuggestionHandler(
    "You are an AI Lighting Director. Analyze the user's image and suggest three different professional lighting setups. Each suggestion should be a clear, actionable prompt describing a specific lighting style (e.g., 'Apply dramatic, high-contrast Rembrandt lighting from the top-left' or 'Relight the scene with a soft, warm, golden-hour glow').",
    "Lighting"
  );
  const handleGetBackgroundIdeas = createSuggestionHandler(
    "You are an AI Background Wizard. Analyze the user's image and suggest three creative and fitting new backgrounds. Each suggestion should be an actionable prompt that describes replacing the current background with a new scene (e.g., 'Replace the background with a bustling, futuristic cityscape at night' or 'Place the subject in a serene, misty forest at dawn').",
    "Background Swap"
  );
  const handleGetStoryIdeas = createSuggestionHandler(
    "You are an AI Storyteller. Look at the user's image and invent three imaginative story-based prompts that transform the scene. Each suggestion should be an actionable prompt that turns the image into a narrative moment (e.g., 'Turn the person into a space explorer discovering a new alien planet' or 'Reimagine the scene as a page from a vintage fairytale book').",
    "Storyteller"
  );

  const handleGetFashionAdvice = createSuggestionHandler(
    "You are an AI Fashion Stylist. Analyze the clothing and style of any person in the image. Suggest three different outfits or style changes. Each suggestion should be a clear, actionable prompt to alter their fashion (e.g., 'Change the t-shirt to a formal tuxedo', 'Give them a futuristic cyberpunk jacket').",
    "Fashion Stylist"
  );

  const handleGetArchitectureIdeas = createSuggestionHandler(
    "You are an AI Architectural Advisor. Analyze any buildings or structures in the image. Provide three creative suggestions to alter the architectural style (e.g., 'transform the building into a futuristic brutalist structure', 'reimagine the house in a cozy cottage style with a thatched roof'). Each suggestion should be an actionable prompt.",
    "Architectural Styles"
  );

  const handleGetVFXIdeas = createSuggestionHandler(
    "You are an AI VFX Supervisor. Analyze the user's image and suggest three dramatic visual effects to add. Each suggestion should be a clear, actionable prompt (e.g., 'add magical glowing particles swirling around the subject', 'make it look like an explosion is happening in the background', 'add cinematic lens flare and anamorphic streaks').",
    "VFX Supervisor"
  );

  const handleGetPropIdeas = createSuggestionHandler(
    "You are an AI Prop Master. Analyze the scene in the user's image and suggest three interesting props to add or replace. Each suggestion should be an actionable prompt that enhances the story or theme of the image (e.g., 'place a mysterious, old leather-bound book on the table', 'have the subject hold a glowing lantern', 'replace the coffee cup with an ornate, steaming teacup').",
    "Prop Master"
  );

  const handleGetInteriorDesignIdeas = createSuggestionHandler(
    "You are an AI Interior Designer. Analyze the room in the user's image and provide three complete makeover suggestions in different styles (e.g., Scandinavian, Mid-Century Modern, Industrial). Each suggestion should be an actionable prompt describing the new style.",
    "Interior Makeover"
  );

  const handleGetFurnitureIdeas = createSuggestionHandler(
    "You are an AI Furniture Specialist. Analyze the furniture in the user's image. Suggest three specific changes, like adding a new piece of furniture, replacing an existing one, or changing its style. Each suggestion should be a clear, actionable prompt (e.g., 'Replace the coffee table with a rustic wooden one', 'Add a comfortable accent chair in the corner').",
    "Furniture"
  );

  const handleGetColorPaletteIdeas = createSuggestionHandler(
    "You are an AI Color Consultant. Analyze the color scheme of the interior space in the user's image. Suggest three new, harmonious color palettes. Each suggestion should be an actionable prompt describing the new colors for the walls, furniture, and accents (e.g., 'Change the wall color to a calming sage green and add warm beige accents').",
    "Interior Palettes"
  );

  const handleGetDeclutterIdeas = createSuggestionHandler(
    "You are an AI Decluttering Expert, a master of minimalism and organization. Analyze the interior space in the user's image and suggest three ways to simplify and declutter the scene. Each suggestion should be an actionable prompt focused on removing objects to create a cleaner, more spacious look (e.g., 'Remove all items from the coffee table for a minimalist look', 'Clear the bookshelf, leaving only a few select items').",
    "Declutter"
  );
  
  const handleGetPortraitIdeas = createSuggestionHandler(
    "You are an AI Portrait Photographer. Analyze the person in the user's image. Provide three suggestions to enhance their portrait. These could include changing facial expression, hair style, or adding subtle makeup. Each suggestion should be a clear, actionable prompt.",
    "Portrait Studio"
  );

  const handleGetSeasonWeatherIdeas = createSuggestionHandler(
    "You are Mother Nature's AI assistant. Analyze the landscape or outdoor scene in the user's image. Suggest three changes to the season or weather. Each suggestion should be an actionable prompt describing a new atmosphere (e.g., 'transform the scene into a snowy winter landscape', 'add dramatic storm clouds and rain', 'change the foliage to vibrant autumn colors').",
    "Season & Weather"
  );

  // New AI Assistants
  const handleGetPhotoRestorationIdeas = createSuggestionHandler(
    "You are an AI Photo Restoration Expert. Analyze the user's image for signs of damage, aging, or quality issues. Suggest three specific restoration improvements like removing scratches, fixing faded colors, reducing noise, or enhancing old photographs. Each suggestion should be a clear, actionable prompt.",
    "Photo Restoration"
  );

  const handleGetAIEnhancementIdeas = createSuggestionHandler(
    "You are an AI Enhancement Specialist. Analyze the user's image and suggest three cutting-edge AI-powered improvements. Focus on modern techniques like super-resolution, detail enhancement, or intelligent upscaling. Each suggestion should be an actionable prompt using advanced AI capabilities.",
    "AI Enhancement"
  );

  const handleGetStyleTransferIdeas = createSuggestionHandler(
    "You are an AI Style Transfer Artist. Analyze the user's image and suggest three artistic style transfers from famous artists or art movements. Each suggestion should transform the image into a different artistic style (e.g., 'apply Van Gogh's Starry Night brushstroke style', 'transform into Picasso's cubist style', 'recreate in Japanese ukiyo-e woodblock print style').",
    "Style Transfer"
  );

  const handleGetCinematicIdeas = createSuggestionHandler(
    "You are an AI Cinematographer. Analyze the user's image and suggest three cinematic effects to make it look like a movie scene. Focus on film techniques like depth of field, color grading, lens effects, or dramatic lighting. Each suggestion should be an actionable prompt for creating cinematic atmosphere.",
    "Cinematic Effects"
  );

  const handleGetFuturisticIdeas = createSuggestionHandler(
    "You are an AI Futurist. Analyze the user's image and suggest three ways to add futuristic or sci-fi elements. Think holographic displays, advanced technology, cyberpunk aesthetics, or space-age designs. Each suggestion should be an actionable prompt to modernize or futurize the scene.",
    "Futuristic Tech"
  );

  const handleGetEmotionMoodIdeas = createSuggestionHandler(
    "You are an AI Emotion Specialist. Analyze the mood and emotional tone of the user's image. Suggest three ways to enhance or change the emotional impact through color, lighting, or atmospheric effects. Each suggestion should be an actionable prompt to evoke specific feelings (e.g., 'make it more melancholic with cooler tones and soft lighting', 'add warmth and joy with golden hour lighting').",
    "Emotion & Mood"
  );

  const handleGetSmartAnalysisIdeas = createSuggestionHandler(
    "You are an AI Image Analyst. Carefully examine the user's image and identify three specific technical or compositional improvements based on your analysis. Use your AI vision to spot issues humans might miss, like subtle color casts, minor focus problems, or composition tweaks. Each suggestion should be a precise, actionable prompt.",
    "Smart Analysis"
  );

  const handleGetGamingFantasyIdeas = createSuggestionHandler(
    "You are an AI Game Art Director. Analyze the user's image and suggest three ways to transform it into gaming or fantasy art. Think RPG aesthetics, magical elements, fantasy creatures, or video game environments. Each suggestion should be an actionable prompt to create epic, fantastical scenes.",
    "Gaming & Fantasy"
  );

  const handleGetProblemSolverIdeas = createSuggestionHandler(
    "You are an AI Problem Solver. Analyze the user's image for any visual problems or imperfections. Suggest three specific fixes for common issues like overexposure, underexposure, blur, noise, unwanted objects, or distracting elements. Each suggestion should be a clear, actionable prompt to solve a specific problem.",
    "Problem Solver"
  );

  const handleGetTrendPredictions = createSuggestionHandler(
    "You are an AI Trend Predictor specializing in visual aesthetics and social media trends. Analyze the image and suggest modifications to make it more aligned with current viral trends, popular aesthetics, or emerging visual styles. Consider color palettes, composition techniques, filters, and visual elements that are currently performing well on social platforms. Provide specific, actionable suggestions for making the image more shareable and trend-forward.",
    "Trend Predictor"
  );

  // Car Tuning AI Assistants
  const handleBodyKitDesign = createSuggestionHandler(
    "You are an AI Body Kit Designer specializing in automotive aesthetics and aerodynamics. Analyze the car image and suggest body kit modifications including front/rear bumpers, side skirts, spoilers, and aerodynamic enhancements. Consider the car's style, performance goals, and visual impact. Provide specific recommendations for widebody kits, splitters, diffusers, and other exterior modifications that would enhance both appearance and functionality.",
    "Body Kit Designer"
  );

  const handleEngineTuning = createSuggestionHandler(
    "You are an AI Engine Tuning Specialist with expertise in performance modifications and power enhancement. Analyze the car and suggest engine tuning modifications including turbocharger upgrades, intake systems, exhaust headers, engine internals, and ECU tuning. Consider the engine type, performance goals, and reliability factors. Provide specific recommendations for horsepower gains, torque improvements, and supporting modifications needed.",
    "Engine Tuning"
  );

  const handlePerformanceGauge = createSuggestionHandler(
    "You are an AI Performance Gauge Specialist focusing on instrumentation and monitoring systems. Analyze the car's dashboard and suggest performance gauge upgrades including boost gauges, wideband O2 sensors, oil pressure/temperature gauges, and digital displays. Consider the car's modifications, performance needs, and driver information requirements. Provide specific recommendations for gauge placement, brands, and monitoring parameters.",
    "Performance Gauge"
  );

  const handleExhaustSystem = createSuggestionHandler(
    "You are an AI Exhaust System Designer specializing in performance exhaust modifications. Analyze the car and suggest exhaust system upgrades including headers, high-flow catalytic converters, resonators, mufflers, and exhaust tips. Consider sound characteristics, performance gains, emissions compliance, and visual appeal. Provide specific recommendations for exhaust routing, materials, and sound tuning.",
    "Exhaust System"
  );

  const handleSuspensionSetup = createSuggestionHandler(
    "You are an AI Suspension Tuning Expert specializing in handling and ride quality optimization. Analyze the car and suggest suspension modifications including coilovers, springs, dampers, sway bars, and alignment settings. Consider the car's intended use (street, track, drift), weight distribution, and handling characteristics. Provide specific recommendations for spring rates, damping settings, and geometry adjustments.",
    "Suspension Setup"
  );

  const handleSafetyUpgrades = createSuggestionHandler(
    "You are an AI Safety Systems Specialist focusing on automotive safety modifications. Analyze the car and suggest safety upgrades including roll cages, racing seats, harnesses, fire suppression systems, and protective equipment. Consider the car's intended use, safety regulations, and driver protection needs. Provide specific recommendations for safety equipment brands, installation requirements, and certification standards.",
    "Safety Upgrades"
  );

  const handleCoolingSystem = createSuggestionHandler(
    "You are an AI Cooling System Engineer specializing in thermal management for modified vehicles. Analyze the car and suggest cooling system upgrades including radiators, intercoolers, oil coolers, and cooling fans. Consider the car's power level, operating conditions, and heat generation. Provide specific recommendations for cooling capacity, airflow optimization, and temperature management solutions.",
    "Cooling System"
  );

  const handleAudioSystem = createSuggestionHandler(
    "You are an AI Car Audio Specialist focusing on high-performance sound systems. Analyze the car's interior and suggest audio system upgrades including head units, speakers, amplifiers, and subwoofers. Consider the car's acoustics, power requirements, and sound quality goals. Provide specific recommendations for component placement, sound deadening, and system tuning for optimal audio performance.",
    "Audio System"
  );

  const handleElectricalMods = createSuggestionHandler(
    "You are an AI Automotive Electrical Specialist focusing on electrical system modifications. Analyze the car and suggest electrical upgrades including alternators, batteries, wiring harnesses, and power distribution. Consider the car's electrical demands, aftermarket accessories, and reliability requirements. Provide specific recommendations for electrical capacity, wiring gauge, and system protection.",
    "Electrical Mods"
  );

  const handleECUTuning = createSuggestionHandler(
    "You are an AI ECU Tuning Specialist with expertise in engine management and performance calibration. Analyze the car and suggest ECU tuning modifications including fuel maps, ignition timing, boost control, and safety parameters. Consider the car's modifications, fuel type, and performance goals. Provide specific recommendations for tuning approaches, supporting modifications, and safety margins for reliable operation.",
    "ECU Tuning"
  );

  // People & Portraits AI Assistants
  const handleExpressionCoach = createSuggestionHandler(
    "You are an AI Expression Coach specializing in facial expressions and emotional photography. Analyze the portrait and suggest ways to enhance or modify facial expressions to convey specific emotions or moods. Consider micro-expressions, eye contact, smile authenticity, and overall emotional impact. Provide specific recommendations for expression adjustments, emotional storytelling, and connecting with viewers.",
    "Expression Coach"
  );

  const handleGroupDynamics = createSuggestionHandler(
    "You are an AI Group Dynamics Specialist focusing on multi-person photography and social interactions. Analyze the group photo and suggest improvements for positioning, interactions, and relationships between subjects. Consider body language, spacing, hierarchy, and group chemistry. Provide specific recommendations for arrangement, poses, and creating natural group dynamics.",
    "Group Dynamics"
  );

  const handleChildPhotography = createSuggestionHandler(
    "You are an AI Child Photography Expert specializing in capturing authentic moments with young subjects. Analyze the image and suggest techniques for working with children, creating engaging environments, and capturing natural expressions. Consider age-appropriate poses, playful interactions, and developmental stages. Provide specific recommendations for child-friendly photography approaches.",
    "Child Photography"
  );

  const handleGlamourShots = createSuggestionHandler(
    "You are an AI Glamour Photography Director specializing in high-fashion and luxury portrait aesthetics. Analyze the portrait and suggest glamorous enhancements including dramatic lighting, elegant poses, and sophisticated styling. Consider fashion photography techniques, luxury aesthetics, and editorial quality. Provide specific recommendations for creating stunning, magazine-worthy glamour shots.",
    "Glamour Shots"
  );

  const handleBeautyRetouching = createSuggestionHandler(
    "You are an AI Beauty Retouching Specialist focusing on natural-looking skin enhancement and facial refinement. Analyze the portrait and suggest beauty retouching techniques including skin smoothing, blemish removal, and feature enhancement while maintaining authenticity. Consider natural beauty standards and subtle improvements. Provide specific recommendations for professional beauty retouching.",
    "Beauty Retouching"
  );

  const handleEyewearStyling = createSuggestionHandler(
    "You are an AI Eyewear Styling Expert specializing in glasses, sunglasses, and optical accessories in portraits. Analyze the image and suggest eyewear modifications, reflections management, and styling enhancements. Consider face shapes, frame styles, lens reflections, and overall aesthetic balance. Provide specific recommendations for eyewear photography and styling.",
    "Eyewear Styling"
  );

  const handleHairStyling = createSuggestionHandler(
    "You are an AI Hair Styling Consultant specializing in hair photography and styling enhancements. Analyze the portrait and suggest hair modifications including texture, volume, color, and styling adjustments. Consider face shapes, hair types, lighting effects on hair, and current trends. Provide specific recommendations for hair enhancement and styling in photography.",
    "Hair Styling"
  );

  const handleSkinPerfection = createSuggestionHandler(
    "You are an AI Skin Perfection Specialist focusing on natural skin enhancement and complexion improvement. Analyze the portrait and suggest skin refinement techniques including texture smoothing, tone evening, and natural glow enhancement. Consider skin types, lighting conditions, and maintaining realistic appearance. Provide specific recommendations for achieving flawless yet natural-looking skin.",
    "Skin Perfection"
  );

  const handleAgeEnhancement = createSuggestionHandler(
    "You are an AI Age Enhancement Expert specializing in age-related portrait modifications and life stage photography. Analyze the portrait and suggest age-appropriate enhancements or modifications including maturity adjustments, wisdom lines, or youthful vitality. Consider natural aging processes, dignity, and authentic representation. Provide specific recommendations for age-sensitive portrait enhancement.",
    "Age Enhancement"
  );

  const handleBodyContouring = createSuggestionHandler(
    "You are an AI Body Contouring Specialist focusing on natural body shape enhancement and posture improvement in portraits. Analyze the image and suggest body contouring techniques including posture adjustments, silhouette enhancement, and natural body line improvements. Consider body positivity, natural proportions, and healthy representation. Provide specific recommendations for flattering body photography.",
    "Body Contouring"
  );

  const handlePoseDirector = createSuggestionHandler(
    "You are an AI Pose Director specializing in portrait positioning and body language optimization. Analyze the portrait and suggest pose improvements including hand placement, body angles, head positioning, and overall stance. Consider the subject's personality, the photo's purpose, and creating engaging poses. Provide specific recommendations for dynamic and flattering pose direction.",
    "Pose Director"
  );

  // Photography Essentials AI Assistants
  const handleDepthMaster = createSuggestionHandler(
    "You are an AI Depth of Field Master specializing in aperture control and bokeh effects. Analyze the image and suggest depth of field modifications including background blur, subject isolation, and creative bokeh techniques. Consider focal length, aperture settings, and artistic depth effects. Provide specific recommendations for achieving professional depth control and dimensional storytelling.",
    "Depth Master"
  );

  const handleFocusStacking = createSuggestionHandler(
    "You are an AI Focus Stacking Expert specializing in extended depth of field techniques. Analyze the image and suggest focus stacking improvements for macro photography, landscapes, and product shots. Consider focus planes, sharpness zones, and detail enhancement. Provide specific recommendations for achieving maximum sharpness throughout the entire image using focus stacking methods.",
    "Focus Stacking"
  );

  const handleLongExposure = createSuggestionHandler(
    "You are an AI Long Exposure Specialist focusing on time-based photography effects. Analyze the image and suggest long exposure techniques including motion blur, light trails, water smoothing, and cloud streaking. Consider shutter speeds, neutral density filters, and creative motion effects. Provide specific recommendations for capturing time and movement in stunning long exposure photography.",
    "Long Exposure"
  );

  const handleHDRBlending = createSuggestionHandler(
    "You are an AI HDR Blending Expert specializing in high dynamic range photography. Analyze the image and suggest HDR techniques for capturing extreme contrast scenes, shadow/highlight recovery, and tone mapping. Consider exposure bracketing, luminosity masks, and natural HDR processing. Provide specific recommendations for achieving balanced exposures with enhanced dynamic range.",
    "HDR Blending"
  );

  const handleMacroPrecision = createSuggestionHandler(
    "You are an AI Macro Photography Precision Expert focusing on extreme close-up techniques. Analyze the image and suggest macro photography improvements including magnification ratios, focus precision, lighting for small subjects, and detail enhancement. Consider working distances, depth of field challenges, and macro-specific techniques. Provide specific recommendations for achieving stunning macro photography results.",
    "Macro Precision"
  );

  const handlePerspectiveWizard = createSuggestionHandler(
    "You are an AI Perspective Wizard specializing in viewpoint and geometric corrections. Analyze the image and suggest perspective modifications including keystone correction, lens distortion fixes, and creative viewpoint changes. Consider architectural photography, wide-angle distortions, and perspective control. Provide specific recommendations for achieving perfect geometric accuracy and creative perspectives.",
    "Perspective Wizard"
  );

  const handleMotionCapture = createSuggestionHandler(
    "You are an AI Motion Capture Specialist focusing on freezing and capturing movement. Analyze the image and suggest motion photography techniques including high-speed capture, panning shots, and action freezing. Consider shutter speeds, tracking techniques, and dynamic compositions. Provide specific recommendations for capturing sharp, dynamic motion in sports, wildlife, and action photography.",
    "Motion Capture"
  );

  const handleLightSpectrum = createSuggestionHandler(
    "You are an AI Light Spectrum Analyst specializing in color temperature and spectral analysis. Analyze the image and suggest light spectrum modifications including white balance corrections, color temperature adjustments, and spectral color enhancements. Consider different light sources, color rendering, and spectral photography techniques. Provide specific recommendations for achieving accurate and creative color spectrum control.",
    "Light Spectrum"
  );

  const handleFrameAnalysis = createSuggestionHandler(
    "You are an AI Frame Analysis Expert specializing in compositional structure and visual flow. Analyze the image and suggest frame composition improvements including rule of thirds, leading lines, symmetry, and visual balance. Consider crop ratios, negative space, and compositional techniques. Provide specific recommendations for achieving powerful and engaging frame compositions.",
    "Frame Analysis"
  );

  const handleCameraCalibration = createSuggestionHandler(
    "You are an AI Camera Calibration Specialist focusing on technical image optimization and sensor corrections. Analyze the image and suggest calibration improvements including lens corrections, sensor noise reduction, and optical aberration fixes. Consider camera profiles, lens distortions, and technical image quality. Provide specific recommendations for achieving technically perfect camera calibration and image optimization.",
    "Camera Calibration"
  );

  // Architecture & Interiors AI Assistants
  const handleSpacePlanning = createSuggestionHandler(
    "You are an AI Space Planning Expert specializing in optimal room layouts and spatial organization. Analyze the architectural space and suggest improvements for furniture arrangement, traffic flow, and functional zones. Consider ergonomics, accessibility, and space efficiency. Provide specific recommendations for maximizing spatial utility and creating harmonious room layouts.",
    "Space Planning"
  );

  const handleRoomMeasurements = createSuggestionHandler(
    "You are an AI Measurement Specialist focusing on architectural proportions and spatial dimensions. Analyze the room and suggest improvements to scale, proportions, and dimensional relationships. Consider golden ratio principles, human scale, and visual balance. Provide specific recommendations for achieving proper architectural proportions and spatial harmony.",
    "Room Measurements"
  );

  const handleWindowDesign = createSuggestionHandler(
    "You are an AI Window Design Expert specializing in natural light optimization and architectural fenestration. Analyze the windows and suggest improvements for size, placement, style, and light control. Consider daylight harvesting, privacy, ventilation, and architectural style. Provide specific recommendations for enhancing natural light and window aesthetics.",
    "Window Design"
  );

  const handleDoorStyling = createSuggestionHandler(
    "You are an AI Door Design Specialist focusing on entryways, transitions, and architectural details. Analyze the doors and suggest improvements for style, materials, hardware, and proportions. Consider architectural consistency, functionality, and visual impact. Provide specific recommendations for creating impressive and functional door designs.",
    "Door Styling"
  );

  const handleStaircaseDesign = createSuggestionHandler(
    "You are an AI Staircase Design Expert specializing in vertical circulation and architectural drama. Analyze the staircase and suggest improvements for design, materials, railings, and spatial integration. Consider safety, aesthetics, and architectural impact. Provide specific recommendations for creating stunning and functional staircase designs.",
    "Staircase Design"
  );

  const handleLightingDesign = createSuggestionHandler(
    "You are an AI Lighting Design Consultant specializing in architectural illumination and ambiance creation. Analyze the lighting and suggest improvements for fixtures, placement, layering, and mood. Consider task lighting, accent lighting, and architectural highlighting. Provide specific recommendations for creating sophisticated lighting schemes.",
    "Lighting Design"
  );

  const handleMaterialTextures = createSuggestionHandler(
    "You are an AI Material Specialist focusing on surface textures, finishes, and tactile experiences. Analyze the materials and suggest improvements for textures, patterns, and material combinations. Consider durability, maintenance, and sensory appeal. Provide specific recommendations for creating rich material palettes and textural interest.",
    "Material Textures"
  );

  const handleBiophilicDesign = createSuggestionHandler(
    "You are an AI Biophilic Design Expert specializing in nature integration and wellness-focused spaces. Analyze the interior and suggest improvements for plant integration, natural materials, and nature-inspired elements. Consider air quality, mental wellness, and connection to nature. Provide specific recommendations for creating healthy, nature-connected living spaces.",
    "Biophilic Design"
  );

  const handleOutdoorSpaces = createSuggestionHandler(
    "You are an AI Outdoor Living Specialist focusing on terraces, balconies, gardens, and exterior spaces. Analyze the outdoor areas and suggest improvements for furniture, landscaping, privacy, and weather protection. Consider indoor-outdoor flow, seasonal use, and outdoor comfort. Provide specific recommendations for creating beautiful and functional outdoor living spaces.",
    "Outdoor Spaces"
  );

  const handleCeilingFeatures = createSuggestionHandler(
    "You are an AI Ceiling Design Expert specializing in overhead architectural elements and vertical space enhancement. Analyze the ceiling and suggest improvements for height, details, lighting integration, and visual interest. Consider coffered ceilings, exposed beams, and architectural moldings. Provide specific recommendations for creating dramatic and functional ceiling designs.",
    "Ceiling Features"
  );

  // Landscapes & Scenery AI Assistants
  const handleOceanWaves = createSuggestionHandler(
    "You are an AI Ocean Photography Expert specializing in seascapes and wave dynamics. Analyze the ocean scene and suggest improvements for wave motion, water clarity, foam patterns, and coastal elements. Consider tidal effects, wave energy, and marine atmosphere. Provide specific recommendations for creating dramatic and captivating ocean imagery.",
    "Ocean Waves"
  );

  const handleForestDepths = createSuggestionHandler(
    "You are an AI Forest Specialist focusing on woodland scenes and natural depth. Analyze the forest landscape and suggest improvements for tree density, light filtering, undergrowth details, and atmospheric perspective. Consider seasonal changes, wildlife integration, and forest floor elements. Provide specific recommendations for creating immersive forest environments.",
    "Forest Depths"
  );

  const handleDesertLandscapes = createSuggestionHandler(
    "You are an AI Desert Environment Expert specializing in arid landscapes and geological formations. Analyze the desert scene and suggest improvements for sand textures, rock formations, heat shimmer effects, and desert vegetation. Consider lighting conditions, erosion patterns, and desert wildlife. Provide specific recommendations for creating authentic desert atmospheres.",
    "Desert Landscapes"
  );

  const handleWinterScenes = createSuggestionHandler(
    "You are an AI Winter Photography Specialist focusing on snow-covered landscapes and cold weather effects. Analyze the winter scene and suggest improvements for snow texture, ice formations, frost patterns, and winter lighting. Consider seasonal atmosphere, winter wildlife, and cold weather phenomena. Provide specific recommendations for creating magical winter imagery.",
    "Winter Scenes"
  );

  const handleStormWeather = createSuggestionHandler(
    "You are an AI Weather Dynamics Expert specializing in dramatic storm conditions and atmospheric effects. Analyze the weather scene and suggest improvements for cloud formations, lightning effects, rain patterns, and storm intensity. Consider wind effects, atmospheric pressure, and storm lighting. Provide specific recommendations for creating powerful weather imagery.",
    "Storm Weather"
  );

  const handleCanyonViews = createSuggestionHandler(
    "You are an AI Canyon Geology Specialist focusing on rock formations and geological landscapes. Analyze the canyon scene and suggest improvements for rock stratification, erosion patterns, depth perspective, and geological colors. Consider sedimentary layers, canyon lighting, and geological time scales. Provide specific recommendations for creating dramatic canyon vistas.",
    "Canyon Views"
  );

  const handleVolcanicTerrain = createSuggestionHandler(
    "You are an AI Volcanic Landscape Expert specializing in igneous formations and geothermal features. Analyze the volcanic scene and suggest improvements for lava flows, volcanic rock textures, geothermal activity, and volcanic atmosphere. Consider magma effects, volcanic gases, and geological processes. Provide specific recommendations for creating dynamic volcanic landscapes.",
    "Volcanic Terrain"
  );

  const handleValleyVistas = createSuggestionHandler(
    "You are an AI Valley Geography Specialist focusing on lowland landscapes and river systems. Analyze the valley scene and suggest improvements for terrain contours, water features, vegetation patterns, and atmospheric perspective. Consider river meandering, valley formation, and ecosystem diversity. Provide specific recommendations for creating serene valley panoramas.",
    "Valley Vistas"
  );

  const handleCoastalBeacons = createSuggestionHandler(
    "You are an AI Coastal Architecture Expert specializing in lighthouse structures and maritime landscapes. Analyze the coastal scene and suggest improvements for lighthouse design, beacon lighting, coastal erosion, and maritime atmosphere. Consider navigation elements, coastal weather, and maritime history. Provide specific recommendations for creating iconic coastal imagery.",
    "Coastal Beacons"
  );

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
  
  const handleGenericImageChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setter(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
    // Reset file input to allow re-uploading the same file
    e.target.value = '';
  };

  const ImageInput = ({
    title,
    image,
    onRemove,
    onChange,
    id,
    actionText,
  }: {
    title: string;
    image: string | null;
    onRemove: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id: string;
    actionText: string;
  }) => (
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
        {/* PIN Entry Modal */}
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
      {/* PIN Entry Modal */}
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
                  title="Reference Image"
                  image={referenceImage}
                  actionText="Upload Reference"
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
                                    <span className="assistant-btn-desc">Geometric corrections.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleMotionCapture} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><MagnetIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Motion Capture</span>
                                    <span className="assistant-btn-desc">Freeze dynamic action.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleLightSpectrum} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><PrismIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Light Spectrum</span>
                                    <span className="assistant-btn-desc">Color temperature control.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleFrameAnalysis} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ScanIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Frame Analysis</span>
                                    <span className="assistant-btn-desc">Compositional structure.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleCameraCalibration} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CalibrationIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Camera Calibration</span>
                                    <span className="assistant-btn-desc">Technical optimization.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>People &amp; Portraits</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn people" onClick={handleGetFashionAdvice} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ShirtIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Fashion Stylist</span>
                                    <span className="assistant-btn-desc">Style and wardrobe advice.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleGetPortraitIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><UserIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Portrait Studio</span>
                                    <span className="assistant-btn-desc">Professional portrait tips.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleExpressionCoach} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><SmileIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Expression Coach</span>
                                    <span className="assistant-btn-desc">Emotional storytelling.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleGroupDynamics} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><UsersIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Group Dynamics</span>
                                    <span className="assistant-btn-desc">Multi-person positioning.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleChildPhotography} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><BabyIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Child Photography</span>
                                    <span className="assistant-btn-desc">Young subject expertise.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleGlamourShots} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CrownIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Glamour Shots</span>
                                    <span className="assistant-btn-desc">High-fashion luxury.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleBeautyRetouching} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><MakeupIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Beauty Retouching</span>
                                    <span className="assistant-btn-desc">Natural enhancement.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleEyewearStyling} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><GlassesIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Eyewear Styling</span>
                                    <span className="assistant-btn-desc">Glasses & reflections.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleHairStyling} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><HairIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Hair Styling</span>
                                    <span className="assistant-btn-desc">Texture & volume.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleSkinPerfection} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><MirrorIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Skin Perfection</span>
                                    <span className="assistant-btn-desc">Complexion enhancement.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleAgeEnhancement} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><AgeIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Age Enhancement</span>
                                    <span className="assistant-btn-desc">Life stage photography.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleBodyContouring} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><FitnessIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Body Contouring</span>
                                    <span className="assistant-btn-desc">Natural shape enhancement.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handlePoseDirector} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><PoseIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Pose Director</span>
                                    <span className="assistant-btn-desc">Body language optimization.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>Architecture &amp; Interiors</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleGetArchitectureIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><HomeIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Architectural Styles</span>
                                    <span className="assistant-btn-desc">Building and structure styles.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleGetInteriorDesignIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><SofaIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Interior Makeover</span>
                                    <span className="assistant-btn-desc">Complete room redesigns.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleGetFurnitureIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ChairIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Furniture</span>
                                    <span className="assistant-btn-desc">Furniture selection and styling.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleGetColorPaletteIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><PaintRollerIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Interior Palettes</span>
                                    <span className="assistant-btn-desc">Color schemes for interiors.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleGetDeclutterIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><TrashIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Declutter</span>
                                    <span className="assistant-btn-desc">Minimalist organization.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleSpacePlanning} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><BlueprintIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Space Planning</span>
                                    <span className="assistant-btn-desc">Optimal room layouts.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleRoomMeasurements} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><RulerIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Room Measurements</span>
                                    <span className="assistant-btn-desc">Proportions & dimensions.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleWindowDesign} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><WindowIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Window Design</span>
                                    <span className="assistant-btn-desc">Natural light optimization.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleDoorStyling} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><DoorIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Door Styling</span>
                                    <span className="assistant-btn-desc">Entryway design.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleStaircaseDesign} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><StairsIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Staircase Design</span>
                                    <span className="assistant-btn-desc">Vertical circulation.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleLightingDesign} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><LampIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Lighting Design</span>
                                    <span className="assistant-btn-desc">Architectural illumination.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleMaterialTextures} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><TextureIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Material Textures</span>
                                    <span className="assistant-btn-desc">Surface finishes.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleBiophilicDesign} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><PlantIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Biophilic Design</span>
                                    <span className="assistant-btn-desc">Nature integration.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleOutdoorSpaces} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><BalconyIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Outdoor Spaces</span>
                                    <span className="assistant-btn-desc">Exterior living areas.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn architecture" onClick={handleCeilingFeatures} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><LayersIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Ceiling Features</span>
                                    <span className="assistant-btn-desc">Overhead design elements.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>Landscapes &amp; Scenery</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleGetBackgroundIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><MountainIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Background Swap</span>
                                    <span className="assistant-btn-desc">Replace the background.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleGetSeasonWeatherIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><WindIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Season &amp; Weather</span>
                                    <span className="assistant-btn-desc">Change the atmosphere.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleGetSeasonWeatherIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><WindIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Sky Enhancement</span>
                                    <span className="assistant-btn-desc">Dramatic sky and cloud effects.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleGetBackgroundIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><MountainIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Water Features</span>
                                    <span className="assistant-btn-desc">Rivers, lakes, and ocean scenes.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleOceanWaves} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><WavesIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Ocean Waves</span>
                                    <span className="assistant-btn-desc">Seascapes and wave dynamics.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleForestDepths} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ForestIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Forest Depths</span>
                                    <span className="assistant-btn-desc">Woodland scenes and natural depth.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleDesertLandscapes} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><DesertIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Desert Landscapes</span>
                                    <span className="assistant-btn-desc">Arid environments and formations.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleWinterScenes} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><SnowflakeIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Winter Scenes</span>
                                    <span className="assistant-btn-desc">Snow-covered landscapes.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleStormWeather} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><RainIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Storm Weather</span>
                                    <span className="assistant-btn-desc">Dramatic weather conditions.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleCanyonViews} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CanyonIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Canyon Views</span>
                                    <span className="assistant-btn-desc">Rock formations and geology.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleVolcanicTerrain} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><VolcanoIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Volcanic Terrain</span>
                                    <span className="assistant-btn-desc">Igneous formations and geothermal.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleValleyVistas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ValleyIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Valley Vistas</span>
                                    <span className="assistant-btn-desc">Lowland landscapes and rivers.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleCoastalBeacons} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><LighthouseIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Coastal Beacons</span>
                                    <span className="assistant-btn-desc">Lighthouse and maritime scenes.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn landscapes" onClick={handleTropicalIslands} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><IslandIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Tropical Islands</span>
                                    <span className="assistant-btn-desc">Paradise landscapes and ecosystems.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>AI Enhancement & Restoration</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetPhotoRestorationIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CameraIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Photo Restoration</span>
                                    <span className="assistant-btn-desc">Fix old or damaged photos.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn creative" onClick={handleGetAIEnhancementIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ZapIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">AI Enhancement</span>
                                    <span className="assistant-btn-desc">Super-resolution & upscaling.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetVisionEnhancementIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><EyeIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Vision Enhancement</span>
                                    <span className="assistant-btn-desc">Improve clarity & detail.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetProblemSolverIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><PuzzleIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Problem Solver</span>
                                    <span className="assistant-btn-desc">Fix visual issues.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>Style & Cinema</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn creative" onClick={handleGetStyleTransferIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><WandIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Style Transfer</span>
                                    <span className="assistant-btn-desc">Apply famous art styles.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn creative" onClick={handleGetCinematicIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><FilmIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Cinematic Effects</span>
                                    <span className="assistant-btn-desc">Movie-quality visuals.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn people" onClick={handleGetEmotionMoodIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><HeartIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Emotion & Mood</span>
                                    <span className="assistant-btn-desc">Enhance emotional impact.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>Future & Fantasy</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn creative" onClick={handleGetFuturisticIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><RocketIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Futuristic Tech</span>
                                    <span className="assistant-btn-desc">Add sci-fi elements.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn creative" onClick={handleGetGamingFantasyIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><GamepadIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Gaming & Fantasy</span>
                                    <span className="assistant-btn-desc">RPG & magical aesthetics.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div className="assistant-category">
                        <h3>Smart Analysis & Trends</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn photography" onClick={handleGetSmartAnalysisIdeas} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><BrainIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Smart Analysis</span>
                                    <span className="assistant-btn-desc">AI-powered insights.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn creative" onClick={handleGetTrendPredictions} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><TrendingUpIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Trend Predictor</span>
                                    <span className="assistant-btn-desc">Make it viral-worthy.</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="assistant-category">
                        <h3>🏎️ Car Tuning</h3>
                        <div className="suggestion-buttons">
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleBodyKitDesign} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CarIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Body Kit Designer</span>
                                    <span className="assistant-btn-desc">Aerodynamic enhancements.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleEngineTuning} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><WrenchIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Engine Tuning</span>
                                    <span className="assistant-btn-desc">Power enhancement.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handlePerformanceGauge} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><GaugeIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Performance Gauge</span>
                                    <span className="assistant-btn-desc">Monitoring systems.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleExhaustSystem} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><FlameIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Exhaust System</span>
                                    <span className="assistant-btn-desc">Sound & performance.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleSuspensionSetup} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CogIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Suspension Setup</span>
                                    <span className="assistant-btn-desc">Handling optimization.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleSafetyUpgrades} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ShieldIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Safety Upgrades</span>
                                    <span className="assistant-btn-desc">Protection systems.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleCoolingSystem} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><ThermometerIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Cooling System</span>
                                    <span className="assistant-btn-desc">Thermal management.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleAudioSystem} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><RadioIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Audio System</span>
                                    <span className="assistant-btn-desc">High-performance sound.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleElectricalMods} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><BatteryIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">Electrical Mods</span>
                                    <span className="assistant-btn-desc">Power & wiring upgrades.</span>
                                </div>
                            </button>
                            <button className="btn btn-secondary assistant-btn automotive" onClick={handleECUTuning} disabled={isFetchingSuggestions}>
                                <div className="assistant-btn-icon-container"><CircuitIcon /></div>
                                <div className="assistant-btn-text-container">
                                    <span className="assistant-btn-title">ECU Tuning</span>
                                    <span className="assistant-btn-desc">Engine management.</span>
                                </div>
                            </button>
                        </div>
                    </div>
                  </div>
              </div>
            )}
            {activeTab === 'favorites' && (
                <div className="control-group favorites-tab">
                    <h2>Favorites</h2>
                    {favorites.length === 0 ? (
                        <div className="favorites-empty">
                            <h3>No Favorites Yet!</h3>
                            <p>Find suggestions in the <strong>Assistant</strong> tab and click the star to save them here for later.</p>
                        </div>
                    ) : (
                        <div className="favorites-list">
                            {favorites.map((fav, i) => {
                                const IconComponent = fav.category ? assistantCategoryIcons[fav.category] : LightbulbIcon;
                                const categoryClass = fav.category ? suggestionCategoryToClassName[fav.category] : '';
                                return (
                                    <div key={i} className={`favorite-card ${categoryClass}`}>
                                        <div className="favorite-card-visual">
                                            {IconComponent && <IconComponent />}
                                        </div>
                                        <div className="favorite-card-content">
                                            <div className="favorite-card-header">
                                                <h3>{fav.name}</h3>
                                                <button className="btn-favorite" onClick={() => toggleFavorite(fav)} title="Remove from Favorites">
                                                    <StarIcon filled={true} />
                                                </button>
                                            </div>
                                            <p className="favorite-prompt-text">{fav.prompt}</p>
                                            <div className="favorite-card-actions">
                                                <button className="btn btn-secondary" onClick={() => setPrompt(fav.prompt)}>
                                                    Send to Prompt Box
                                                </button>
                                                <button className="btn btn-primary" onClick={() => { setPrompt(fav.prompt); handleSubmit(fav.prompt); }}>
                                                    Apply Now
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
          </div>
        </aside>

        {(isFetchingSuggestions || suggestions) && (
          <aside className="suggestions-panel">
            <header className="suggestions-panel-header">
              <h2>{activeSuggestionCategory}</h2>
              <button className="btn-close-panel" onClick={handleCancelAndRevert} aria-label="Close suggestions">&times;</button>
            </header>
            <div className="suggestions-panel-body">
              {error && <p className="error-message" role="alert">{error}</p>}
              {isFetchingSuggestions ? (
                <div className="skeleton-loader">
                  <div className="skeleton-card"></div>
                  <div className="skeleton-card"></div>
                  <div className="skeleton-card"></div>
                </div>
              ) : (
                suggestions && suggestions.map((s, i) => (
                  <div key={i} className="suggestion-card">
                    <div className="suggestion-card-content">
                      <h3>{s.name}</h3>
                      <p>{s.prompt}</p>
                    </div>
                    <div className="suggestion-card-actions">
                      <button
                        className="btn-favorite"
                        onClick={() => toggleFavorite(s)}
                        title={isFavorite(s) ? 'Remove from Favorites' : 'Add to Favorites'}
                      >
                        <StarIcon filled={isFavorite(s)} />
                      </button>
                      <button 
                        className="btn btn-secondary btn-preview"
                        onClick={() => handlePreview(s.prompt)}
                        disabled={!!isPreviewLoading}
                      >
                        {isPreviewLoading === s.prompt ? <div className="spinner-small-light"></div> : 'Preview'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <footer className="suggestions-panel-footer">
              <button className="btn btn-primary" onClick={handleConfirmSelection} disabled={!imageBeforePreview}>
                Apply Selection
              </button>
            </footer>
          </aside>
        )}

        <main className="main-workspace">
          <div className="image-display">
            {isLoading && !isPreviewLoading && (
              <div className="loader">
                <div className="spinner" />
                <p>{loadingMessage}</p>
              </div>
            )}
            {image ? (
              <>
                {imageBeforePreview && (
                  <div className="slider-toggle-controls">
                    <button
                      className="reset-btn"
                      onClick={handleResetToOriginal}
                      title="Reset to original image"
                    >
                      Reset
                    </button>
                  </div>
                )}
                {imageBeforePreview ? (
                  <BeforeAfterSlider
                    beforeImage={imageBeforePreview}
                    afterImage={image}
                    className="main-image-slider"
                  />
                ) : (
                  <img
                    src={image}
                    alt="Editable image"
                  />
                )}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}