# UI Component Library

A modern, accessible, and reusable UI component library for the Bananina image editor.

## Components

### Button

Versatile button component with multiple variants, sizes, and states.

```tsx
import { Button } from './components/ui';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Danger</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With loading state
<Button loading>Loading...</Button>

// With icons
<Button icon={<PlusIcon />}>Add Item</Button>
<Button icon={<SaveIcon />} iconPosition="right">Save</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Disabled haptic feedback
<Button hapticFeedback={false}>No Haptics</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `icon`: ReactNode
- `iconPosition`: 'left' | 'right'
- `fullWidth`: boolean
- `hapticFeedback`: boolean (default: true)

---

### Modal

Accessible modal dialog with keyboard support and animations.

```tsx
import { Modal } from './components/ui';

const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md"
>
  <p>Modal content goes here</p>
</Modal>

// With footer
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  footer={
    <>
      <Button variant="ghost" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

**Props:**
- `isOpen`: boolean (required)
- `onClose`: () => void (required)
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `showCloseButton`: boolean (default: true)
- `closeOnBackdropClick`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)
- `footer`: ReactNode

**Features:**
- Focus trap
- Keyboard navigation (Escape to close)
- Body scroll lock
- Backdrop click to close
- Smooth animations
- Haptic feedback

---

### Toast

Notification system with auto-dismiss and multiple types.

```tsx
import { useToast } from './components/ui';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Image saved successfully!');
  };

  const handleError = () => {
    toast.error('Failed to save image', 7000); // Custom duration
  };

  const handleWarning = () => {
    toast.warning('This action cannot be undone');
  };

  const handleInfo = () => {
    toast.info('Processing your request...');
  };

  // With action button
  const handleWithAction = () => {
    toast.addToast({
      type: 'success',
      message: 'Image exported',
      action: {
        label: 'View',
        onClick: () => console.log('View clicked')
      }
    });
  };

  return (
    <div>
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button onClick={handleError}>Show Error</Button>
    </div>
  );
}
```

**Methods:**
- `toast.success(message, duration?)`: Show success notification
- `toast.error(message, duration?)`: Show error notification
- `toast.warning(message, duration?)`: Show warning notification
- `toast.info(message, duration?)`: Show info notification
- `toast.addToast(toast)`: Add custom toast

**Toast Props:**
- `type`: 'success' | 'error' | 'warning' | 'info'
- `message`: string
- `duration`: number (milliseconds, default: 5000, 0 for no auto-dismiss)
- `action`: { label: string, onClick: () => void }

**Features:**
- Auto-dismiss with customizable duration
- Type-based icons and colors
- Haptic feedback based on type
- Action buttons
- Manual dismiss
- Smooth enter/exit animations
- Mobile responsive (bottom position on mobile)

---

## Setup

1. **Add to App.tsx:**

```tsx
import { ToastProvider } from './components/ui';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

2. **Styles are automatically imported** via `index.css`

---

## Accessibility

All components follow WAI-ARIA guidelines:

- **Button**: Proper focus states, keyboard navigation
- **Modal**: Focus trap, keyboard shortcuts, ARIA labels
- **Toast**: ARIA live regions, screen reader announcements

---

## Customization

Components use CSS custom properties from your theme. You can customize by modifying variables in `index.css`:

```css
:root {
  --primary-color: #6366f1;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  /* ... */
}
```

---

## Examples

See the examples in `components/ImageEditor.tsx` for real-world usage patterns.



