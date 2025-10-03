# How to Integrate New PinModal into ImageEditor.tsx

## 🎯 Goal
Replace your current PIN modal implementation with the new `PinModal` component that automatically opens the file picker after successful PIN entry.

---

## 📋 Step-by-Step Integration

### Step 1: Import PinModal

Add to the top of `ImageEditor.tsx`:

```tsx
import { PinModal } from './editor';
```

### Step 2: Find Your Current PIN Modal Code

Look for code similar to:

```tsx
{showPinModal && (
  <div className="modal-overlay" onClick={...}>
    <div className="modal">
      <h2>Enter PIN Code</h2>
      <input value={pinInput} onChange={handlePinInputChange} />
      {pinError && <p>{pinError}</p>}
      <button onClick={handlePinSubmit}>Submit</button>
      <button onClick={() => setShowPinModal(false)}>Cancel</button>
    </div>
  </div>
)}
```

### Step 3: Replace with New PinModal

Replace the entire modal code block with:

```tsx
<PinModal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    // Auto-trigger file picker after successful PIN
    document.getElementById('image-upload')?.click();
  }}
  validatePin={(pin) => pin === '1256'}
/>
```

### Step 4: Ensure Hidden File Input Exists

Make sure you have a hidden file input with the ID:

```tsx
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
```

### Step 5: Remove Old PIN Code

You can now remove these old implementations:
- ❌ Old PIN modal JSX
- ❌ `handlePinInputChange` function
- ❌ `handlePinSubmit` function  
- ❌ `validatePin` function (unless used elsewhere)
- ❌ `pinInput` state
- ❌ `pinError` state

**Keep only:**
- ✅ `showPinModal` state (still needed)

---

## 🔍 Find & Replace Guide

### Find in ImageEditor.tsx

Search for:
```
{showPinModal &&
```

Should find code around **line 117-189** (approximate)

### Replace With

```tsx
<PinModal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    document.getElementById('image-upload')?.click();
  }}
  validatePin={(pin) => pin === '1256'}
/>
```

---

## ✅ Complete Before/After

### BEFORE (Old Implementation)

```tsx
// States
const [showPinModal, setShowPinModal] = useState<boolean>(false);
const [pinInput, setPinInput] = useState<string>('');
const [pinError, setPinError] = useState<string>('');

// Functions
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
      document.getElementById('image-upload')?.click();
    }, 100);
  } else {
    setPinError('Invalid PIN code');
    setPinInput('');
    setTimeout(() => setPinError(''), 3000);
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

// JSX (50+ lines)
{showPinModal && (
  <div className="modal-overlay" onClick={...}>
    <div className="modal">
      <h2>Enter PIN Code</h2>
      <p>Please enter the 4-digit PIN code to access image upload:</p>
      <input
        type="password"
        value={pinInput}
        onChange={handlePinInputChange}
        placeholder="••••"
      />
      {pinError && <p className="error">{pinError}</p>}
      <div className="modal-buttons">
        <button onClick={handlePinSubmit}>Submit</button>
        <button onClick={() => setShowPinModal(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}
```

### AFTER (New Implementation)

```tsx
import { PinModal } from './editor';

// States - ONLY need this one!
const [showPinModal, setShowPinModal] = useState<boolean>(false);

// JSX - Just 7 lines!
<PinModal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    document.getElementById('image-upload')?.click();
  }}
  validatePin={(pin) => pin === '1256'}
/>
```

**Reduction**: 
- 📉 **80+ lines** → **7 lines** (91% reduction)
- 📉 **3 states** → **1 state** (67% reduction)
- 📉 **4 functions** → **0 functions** (100% reduction)

---

## 🎨 Features Included

✅ **Auto-Submit**: Validates when 4 digits entered  
✅ **Auto-Open**: File picker opens automatically  
✅ **Visual Dots**: Shows PIN entry progress  
✅ **Error Handling**: Shake animation on invalid PIN  
✅ **Accessibility**: Keyboard support (Enter to submit)  
✅ **Focus Management**: Auto-focuses input  
✅ **Mobile Friendly**: Touch-optimized  
✅ **Cancel Button**: Easy to dismiss  

---

## 🔧 Customization Options

### Change PIN

```tsx
<PinModal
  validatePin={(pin) => pin === 'YOUR_PIN_HERE'}
  // ... other props
/>
```

### Multiple Valid PINs

```tsx
<PinModal
  validatePin={(pin) => ['1256', '0000', '9999'].includes(pin)}
  // ... other props
/>
```

### Async PIN Validation (API)

```tsx
<PinModal
  validatePin={async (pin) => {
    const response = await fetch('/api/validate-pin', {
      method: 'POST',
      body: JSON.stringify({ pin })
    });
    return response.ok;
  }}
  // ... other props
/>
```

### Disable Auto-Open

If you don't want auto-file-picker, just don't trigger it:

```tsx
<PinModal
  onSuccess={() => {
    // Do something else instead
    toast.success('PIN accepted!');
    // Don't call fileInputRef.current?.click()
  }}
  // ... other props
/>
```

---

## ⚙️ Advanced: With useImageUpload Hook

For even cleaner code, use the `useImageUpload` hook:

```tsx
import { PinModal } from '@/components/editor';
import { useImageUpload } from '@/hooks';
import { useToast } from '@/components/ui';

const ImageEditor: React.FC = () => {
  const toast = useToast();
  const [showPinModal, setShowPinModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleFileInput } = useImageUpload({
    onUpload: (dataUrl, file) => {
      setImage(dataUrl);
      toast.success(`${file.name} loaded!`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => fileInputRef.current?.click()}
        validatePin={(pin) => pin === '1256'}
      />
    </>
  );
};
```

---

## 🧪 Testing Checklist

After integration, test:

- [ ] Click upload button shows PIN modal
- [ ] Typing 4 digits auto-submits (no button click)
- [ ] Valid PIN closes modal automatically
- [ ] File picker opens automatically after valid PIN
- [ ] Invalid PIN shows error and clears input
- [ ] Escape key closes modal
- [ ] Cancel button closes modal
- [ ] Can select and load an image
- [ ] Works on mobile/touch devices

---

## 🎊 Result

**Seamless User Flow:**
1. User clicks "Upload" → PIN modal appears
2. User types 4 digits → Auto-validates
3. Valid PIN → Modal closes, File picker opens
4. User selects image → Editor loads

**No manual Submit button needed!** ✨

---

See `PinModalExample.tsx` for a complete working example!




