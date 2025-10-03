# UI Component Library Migration Guide

This guide shows how to replace existing UI elements in `ImageEditor.tsx` with the new UI component library.

## ✅ What Was Created

### New Components (`components/ui/`)
- ✅ **Button.tsx** - Standardized button with variants, loading, icons
- ✅ **Modal.tsx** - Accessible modal with keyboard support
- ✅ **Toast.tsx** - Notification system with auto-dismiss
- ✅ **styles.css** - Component styles
- ✅ **index.ts** - Barrel exports
- ✅ **README.md** - Component documentation
- ✅ **examples.tsx** - Usage examples

### Integration
- ✅ Updated `App.tsx` to include `ToastProvider`
- ✅ Updated `index.css` to import component styles

---

## 🔄 Migration Examples

### 1. Replace Basic Buttons

**Before:**
```tsx
<button className="btn btn-primary" onClick={handleSubmit}>
  Submit
</button>
```

**After:**
```tsx
import { Button } from '../ui';

<Button variant="primary" onClick={handleSubmit}>
  Submit
</Button>
```

### 2. Replace Loading Buttons

**Before:**
```tsx
<button className="btn btn-primary" disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Generate'}
</button>
```

**After:**
```tsx
<Button variant="primary" loading={isLoading} onClick={handleGenerate}>
  Generate
</Button>
```

### 3. Replace Error Messages with Toast

**Before:**
```tsx
const [error, setError] = useState<string | null>(null);

// In render:
{error && <div className="error-message">{error}</div>}

// In handler:
try {
  // ...
} catch (err) {
  setError(err instanceof Error ? err.message : "An error occurred");
}
```

**After:**
```tsx
import { useToast } from '../ui';

const toast = useToast();

// No error state needed!

// In handler:
try {
  // ...
  toast.success('Image generated successfully!');
} catch (err) {
  toast.error(err instanceof Error ? err.message : "An error occurred");
}
```

### 4. Replace PIN Modal

**Before:**
```tsx
{showPinModal && (
  <div className="modal-overlay" onClick={...}>
    <div className="modal">
      {/* PIN modal content */}
    </div>
  </div>
)}
```

**After:**
```tsx
import { Modal, Button } from '../ui';

<Modal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  title="Enter PIN"
  size="sm"
>
  <input
    type="password"
    value={pinInput}
    onChange={handlePinInputChange}
    placeholder="Enter 4-digit PIN"
  />
  {pinError && <p className="error-text">{pinError}</p>}
</Modal>
```

### 5. Replace Image Preview Modal

**Before:**
```tsx
{showImagePreview && (
  <div className="image-preview-overlay" onClick={closeImagePreview}>
    {/* Complex preview logic */}
  </div>
)}
```

**After:**
```tsx
<Modal
  isOpen={showImagePreview}
  onClose={closeImagePreview}
  size="full"
  showCloseButton={true}
  className="image-preview-modal"
>
  <div className="preview-container">
    <img 
      src={previewImageSrc} 
      alt="Preview"
      style={{
        transform: `scale(${zoomLevel}) translate(${panPosition.x}px, ${panPosition.y}px)`
      }}
    />
  </div>
</Modal>
```

---

## 📝 Step-by-Step Migration Plan

### Phase 1: Replace Simple Buttons (15 mins)

Find all `<button className="btn btn-*">` and replace with `<Button variant="*">`:

```tsx
// Import at top
import { Button } from '../ui';

// Replace instances:
<button className="btn btn-primary">     → <Button variant="primary">
<button className="btn btn-secondary">   → <Button variant="secondary">
<button className="btn btn-tool">        → <Button variant="ghost" size="sm">
```

### Phase 2: Add Toast Notifications (10 mins)

```tsx
// Import at top
import { useToast } from '../ui';

// In component:
const toast = useToast();

// Replace error states:
setError(message) → toast.error(message)

// Add success notifications:
toast.success('Image generated successfully!');
toast.success('Edit applied!');
toast.info('Processing image...');
```

### Phase 3: Replace Modals (20 mins)

```tsx
import { Modal } from '../ui';

// PIN Modal
<Modal isOpen={showPinModal} onClose={() => setShowPinModal(false)} title="Enter PIN" size="sm">
  {/* PIN content */}
</Modal>

// Settings Modal
<Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Settings">
  {/* Settings content */}
</Modal>

// Preview Modal
<Modal isOpen={showImagePreview} onClose={closeImagePreview} size="full">
  {/* Preview content */}
</Modal>
```

---

## 🎯 Quick Wins

### 1. Standardize All Buttons (Start Here!)

**Search & Replace in ImageEditor.tsx:**

```tsx
// Find: <button className="btn btn-primary"
// Replace: <Button variant="primary"

// Find: <button className="btn btn-secondary"
// Replace: <Button variant="secondary"

// Add closing tags and import
```

### 2. Add Success Notifications

After successful operations, add:
```tsx
toast.success('Operation completed!');
```

### 3. Replace Error Display

Remove `{error && <div className="error-message">{error}</div>}` and use:
```tsx
toast.error(errorMessage);
```

---

## 🔍 Component Locations in ImageEditor

### Buttons to Replace

**Line ~509-512:**
```tsx
<button className="btn btn-secondary" onClick={clearMask}>
  Clear
</button>
```
→ `<Button variant="secondary" onClick={clearMask}>Clear</Button>`

**Line ~180-182:**
```tsx
<button 
  className={`btn btn-tool ${isAutoSelecting ? 'active' : ''}`}
  onClick={...}>
```
→ `<Button variant={isAutoSelecting ? 'primary' : 'ghost'} size="sm" onClick={...}>`

### Modals to Replace

**PIN Modal (~Line 117-189)**
**Image Preview Modal (~Line 121-231)**

### Toast Opportunities

**After image generation (~Line 412-414):**
```tsx
const newImage = await generateImage(promptToUse, image);
setImage(newImage);
updateHistory(newImage);
// Add: toast.success('Image generated successfully!');
```

**After errors (~Line 415-417):**
```tsx
} catch (err) {
  setError(err instanceof Error ? err.message : "An unknown error occurred.");
  // Replace with: toast.error(err instanceof Error ? err.message : "An unknown error occurred");
}
```

---

## 💡 Best Practices

### 1. Use Semantic Variants
- `primary` - Main actions (Submit, Generate, Save)
- `secondary` - Secondary actions (Cancel, Reset)
- `ghost` - Tertiary actions (Tools, Settings)
- `danger` - Destructive actions (Delete, Clear)
- `success` - Positive confirmations

### 2. Toast Messages
- **Success**: Brief, positive messages ("Saved!", "Done!", "Success!")
- **Error**: Specific error messages with context
- **Warning**: Cautionary messages before actions
- **Info**: Neutral information or progress updates

### 3. Modal Sizes
- `sm` - Confirmations, quick inputs (400px)
- `md` - Forms, settings (600px)
- `lg` - Complex content (800px)
- `full` - Image previews, detailed views

### 4. Loading States
```tsx
<Button loading={isProcessing} onClick={handleProcess}>
  Process
</Button>
```

---

## 🧪 Testing Checklist

After migration:

- [ ] All buttons have haptic feedback
- [ ] Loading states show spinners
- [ ] Modals can be closed with Escape
- [ ] Modals trap focus properly
- [ ] Toast notifications auto-dismiss
- [ ] Error messages appear as toasts
- [ ] Success messages appear as toasts
- [ ] Buttons have proper hover states
- [ ] Mobile responsive (test on small screens)
- [ ] Keyboard navigation works

---

## 📚 Next Steps

After completing this migration:

1. **Remove old button styles** from CSS that are now unused
2. **Create custom hooks** for common patterns (e.g., `useConfirm`)
3. **Add more UI components** (Input, Select, Card, etc.)
4. **Break down ImageEditor** into smaller components
5. **Add keyboard shortcuts** using the new button system

---

## 🆘 Need Help?

- Check `components/ui/README.md` for component documentation
- See `components/ui/examples.tsx` for usage examples
- All components support standard HTML attributes
- TypeScript will show you available props with IntelliSense

---

**Estimated Migration Time**: 1-2 hours for complete migration

**Benefits**:
- ✨ Consistent UI across the app
- 🎯 Better UX with proper loading states
- ♿ Improved accessibility
- 📱 Better mobile experience
- 🔧 Easier to maintain
- ⚡ Better performance with optimized components




