# Type Definitions

Centralized TypeScript type definitions for the Bananina image editor.

## 📁 Structure

```
types/
├── api.ts        # API-related types (Kie.ai, Gemini, DeepSeek, etc.)
├── editor.ts     # Editor state and functionality types
├── ui.ts         # UI component types
├── index.ts      # Barrel export for all types
└── README.md     # This file
```

## 📚 Type Categories

### API Types (`api.ts`)

Types for all API integrations:

- **KieAPI** - Kie.ai Image Edit API types
- **GeminiAPI** - Google Gemini API types
- **DeepSeekAPI** - DeepSeek chat completion types
- **NanoBananaAPI** - Nano Banana editing types
- **ImageUploadAPI** - Image hosting service types

```typescript
import { KieAPI, GeminiAPI } from './types';

const request: KieAPI.CreateTaskRequest = {
  model: 'qwen/image-edit',
  input: {
    prompt: 'Edit this image',
    image_url: 'https://...'
  }
};
```

### Editor Types (`editor.ts`)

Types for editor functionality:

- **Image Types** - Image data, metadata, dimensions
- **Editor State** - View state, loading states, UI states
- **Edit History** - History entries, undo/redo
- **Color Adjustments** - RGB, color balance
- **Suggestions & AI** - AI suggestions, variations
- **Filters & Effects** - Filter and effect definitions
- **Settings** - Editor preferences

```typescript
import { EditorState, HistoryEntry, Suggestion } from './types';

const editorState: EditorState = {
  currentImage: 'data:image/png;base64,...',
  view: 'editor',
  activeTab: 'edit',
  isLoading: false,
  // ...
};
```

### UI Types (`ui.ts`)

Types for UI components:

- **Common Types** - Size, Variant, Status, Theme
- **Component Props** - Button, Modal, Toast, Input, etc.
- **Layout Types** - Container, Grid, Stack
- **Interaction Types** - Drag & Drop, Loading, Empty State

```typescript
import { ButtonProps, ModalProps, ToastType } from './types';

const buttonProps: ButtonProps = {
  variant: 'primary',
  size: 'md',
  loading: false
};
```

## 🎯 Usage

### Import Specific Types

```typescript
// Import from specific modules
import { KieAPI } from './types/api';
import { EditorState } from './types/editor';
import { ButtonProps } from './types/ui';
```

### Import from Index (Recommended)

```typescript
// Import from barrel export
import { 
  KieAPI, 
  EditorState, 
  ButtonProps,
  ToastType 
} from './types';
```

### Namespace Usage

```typescript
import { KieAPI, GeminiAPI } from './types';

// Use namespace types
const kieInput: KieAPI.ImageEditInput = { /* ... */ };
const geminiRequest: GeminiAPI.GenerateContentRequest = { /* ... */ };
```

## 📖 Examples

### API Client

```typescript
import { KieAPI, APIResponse } from './types';

class KieClient {
  async createTask(
    request: KieAPI.CreateTaskRequest
  ): Promise<KieAPI.CreateTaskResponse> {
    // Implementation
  }

  async getTaskStatus(
    taskId: string
  ): Promise<KieAPI.TaskStatus> {
    // Implementation
  }
}
```

### Editor Component

```typescript
import { 
  EditorState, 
  EditorView, 
  HistoryEntry,
  ImageDataURL 
} from './types';

const ImageEditor: React.FC = () => {
  const [state, setState] = useState<EditorState>({
    currentImage: null,
    view: 'upload',
    activeTab: 'edit',
    isLoading: false,
    // ...
  });

  const handleImageUpload = (image: ImageDataURL) => {
    setState(prev => ({
      ...prev,
      currentImage: image,
      view: 'editor'
    }));
  };
};
```

### UI Components

```typescript
import { ButtonProps, ModalProps, Toast } from './types';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  // ...
}) => {
  // Component implementation
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  // ...
}) => {
  // Component implementation
};
```

## 🔍 Type Utilities

### Generic Types

```typescript
// API Response wrapper
APIResponse<T> // Wraps any data type in API response format

// Callbacks
ProgressCallback // (progress: number) => void
ErrorCallback    // (error: Error) => void
SuccessCallback<T> // (data: T) => void
```

### Union Types

```typescript
// Common unions
Size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
Variant: 'primary' | 'secondary' | 'ghost' | 'danger' | ...
ImageFormat: 'png' | 'jpeg' | 'webp' | 'gif'
ToastType: 'success' | 'error' | 'warning' | 'info'
```

### Interface Extensions

You can extend types for custom needs:

```typescript
import { EditorState, ButtonProps } from './types';

// Extend EditorState
interface ExtendedEditorState extends EditorState {
  customField: string;
}

// Extend ButtonProps
interface CustomButtonProps extends ButtonProps {
  customProp: boolean;
}
```

## 🎨 Best Practices

### 1. Use Namespaces for API Types

```typescript
// Good - Clear and organized
import { KieAPI } from './types';
const request: KieAPI.CreateTaskRequest = { /* ... */ };

// Avoid - Potential naming conflicts
import { CreateTaskRequest } from './types';
```

### 2. Import Only What You Need

```typescript
// Good - Specific imports
import { ButtonProps, ModalProps } from './types/ui';

// Avoid - Unnecessary imports
import * as Types from './types';
```

### 3. Use Type Aliases for Complex Types

```typescript
import { EditorState, ImageDataURL } from './types';

// Create aliases for frequently used types
type ImageHandler = (image: ImageDataURL) => void;
type StateUpdater = (state: EditorState) => EditorState;
```

### 4. Document Custom Types

```typescript
/**
 * Custom editor configuration
 * Extends the base EditorState with project-specific fields
 */
export interface CustomEditorConfig extends EditorState {
  projectId: string;
  workspaceId: string;
}
```

## 🔄 Migration Guide

### Updating Existing Code

**Before:**
```typescript
// Inline type definitions
const handleSubmit = async (
  prompt: string, 
  image: string
): Promise<string> => {
  // ...
};
```

**After:**
```typescript
import { ImageDataURL, EditResult } from './types';

const handleSubmit = async (
  prompt: string, 
  image: ImageDataURL
): Promise<EditResult> => {
  // ...
};
```

## 📝 Type Checklist

When adding new features, ensure:

- [ ] Types are defined in the appropriate file (api/editor/ui)
- [ ] Types are exported from index.ts
- [ ] Complex types use namespaces (for APIs)
- [ ] Documentation comments are added for complex types
- [ ] Generic types are used where appropriate
- [ ] Types are reusable and not overly specific

## 🆘 Common Issues

### Type 'X' is not assignable to type 'Y'

**Solution:** Check if you're using the correct type. Use type assertions only when necessary.

```typescript
// If needed, use type assertion
const image = dataUrl as ImageDataURL;
```

### Cannot find module './types'

**Solution:** Ensure you're importing from the correct path.

```typescript
// Correct
import { ButtonProps } from './types';
import { ButtonProps } from '../types';

// If types folder is in src/
import { ButtonProps } from '@/types';
```

### Circular dependency detected

**Solution:** Avoid circular imports. Use type-only imports when needed.

```typescript
import type { EditorState } from './types/editor';
```

## 🚀 Future Additions

Planned type additions:

- [ ] WebSocket types for real-time features
- [ ] Database types for persistence
- [ ] Plugin system types
- [ ] Theme customization types
- [ ] Analytics event types

---

For component-specific types, see the component documentation in `components/ui/README.md`.




