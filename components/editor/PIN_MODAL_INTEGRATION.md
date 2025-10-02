# PinModal Integration Guide

## 🔐 Auto-Open File Picker After PIN Entry

The PinModal has been updated to **automatically trigger the file picker** when a valid PIN is entered, without requiring the Submit button.

---

## ✅ How It Works

1. User enters 4 digits
2. PIN validates automatically (no Submit click needed)
3. Modal closes
4. File picker opens automatically (100ms delay)
5. User selects image
6. Editor loads

---

## 📝 Implementation

### Step 1: Create Hidden File Input

```tsx
import { useRef } from 'react';

const fileInputRef = useRef<HTMLInputElement>(null);

// In your JSX
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleFileChange}
  style={{ display: 'none' }}
  id="image-upload"
/>
```

### Step 2: Use PinModal with onSuccess

```tsx
import { PinModal } from '@/components/editor';

const [showPinModal, setShowPinModal] = useState(false);

<PinModal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    // Automatically open file picker
    fileInputRef.current?.click();
    // or
    document.getElementById('image-upload')?.click();
  }}
  validatePin={(pin) => pin === '1256'}
/>
```

### Step 3: Trigger PIN Modal Instead of Direct Upload

```tsx
const handleUploadClick = () => {
  // Don't open file picker directly
  // Open PIN modal first
  setShowPinModal(true);
};

<Button onClick={handleUploadClick}>
  Upload Image
</Button>
```

---

## 🎯 Complete Example

```tsx
import React, { useState, useRef } from 'react';
import { PinModal } from '@/components/editor';
import { Button, useToast } from '@/components/ui';
import { useImageEditor, useImageHistory } from '@/hooks';

const ImageEditorWithPIN: React.FC = () => {
  const toast = useToast();
  const { setImage, setView } = useImageEditor();
  const { resetHistory } = useImageHistory();
  const [showPinModal, setShowPinModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PIN validation
  const validatePin = (pin: string): boolean => {
    return pin === '1256';
  };

  // Called automatically after successful PIN entry
  const handlePinSuccess = () => {
    // Automatically trigger file picker
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImage(dataUrl);
      resetHistory(dataUrl);
      setView('editor');
      toast.success('Image loaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      {/* Upload button - shows PIN modal */}
      <Button variant="primary" onClick={() => setShowPinModal(true)}>
        Upload Image
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* PIN Modal - auto-opens file picker on success */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        validatePin={validatePin}
      />
    </div>
  );
};
```

---

## 🎨 Features

### Auto-Submit

✅ **Automatic submission when 4 digits entered**
- No need to click Submit
- Validates immediately
- Closes modal automatically

### Auto-Open File Picker

✅ **File picker opens automatically after valid PIN**
- 100ms delay for smooth transition
- Modal closes first
- File picker appears immediately

### Error Handling

✅ **Visual feedback for invalid PIN**
- Error message displays
- Input clears automatically
- Shake animation
- 3-second auto-clear

---

## 🔄 Flow Diagram

```
User Clicks "Upload"
        ↓
PIN Modal Opens
        ↓
User Types 4 Digits
        ↓
Auto-Validation (no Submit click needed)
        ↓
Valid PIN?
   ├─ YES → Modal Closes → File Picker Opens (100ms delay)
   └─ NO  → Error Message → Input Clears → Try Again
```

---

## 💡 Customization

### Change PIN Validation

```tsx
const validatePin = (pin: string): boolean => {
  // Your custom validation
  return pin === 'YOUR_PIN';
  
  // Or multiple PINs
  const validPins = ['1256', '0000', '9999'];
  return validPins.includes(pin);
  
  // Or API validation
  return await validatePinWithAPI(pin);
};
```

### Change Auto-Open Delay

```tsx
// In PinModal.tsx line 45
setTimeout(() => {
  onSuccess();
}, 100); // Change this value (milliseconds)

// 0ms = instant
// 100ms = smooth (recommended)
// 300ms = noticeable delay
```

### Disable Auto-Submit

If you want to require the Submit button:

```tsx
// In PinModal.tsx, remove or comment out:
useEffect(() => {
  if (pinInput.length === 4) {
    handleSubmit();
  }
}, [pinInput]);
```

---

## 🎯 Integration with ImageEditor

### Current ImageEditor.tsx

Update your existing code to use the new PinModal:

```tsx
// Import
import { PinModal } from './editor';

// Add ref
const fileInputRef = useRef<HTMLInputElement>(null);

// Replace your PIN modal with:
<PinModal
  isOpen={showPinModal}
  onClose={() => setShowPinModal(false)}
  onSuccess={() => {
    // Auto-trigger file picker
    fileInputRef.current?.click();
    // Or if you have an ID
    document.getElementById('image-upload')?.click();
  }}
  validatePin={(pin) => pin === '1256'}
/>

// Your hidden input:
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={handleImageUpload}
  style={{ display: 'none' }}
  id="image-upload"
/>
```

---

## ✨ What Changed

### Before
1. Enter PIN
2. Click Submit button ⬅️ Extra step
3. Modal closes
4. File picker opens

### After
1. Enter 4 digits
2. ✨ **Auto-validates and closes** ⬅️ No button click!
3. ✨ **File picker opens automatically**

---

## 🧪 Testing

Test the flow:

1. Click "Upload Image" button
2. PIN modal appears
3. Type `1256`
4. Modal should close automatically
5. File picker should open automatically
6. Select an image
7. Image should load

**No Submit button click needed!** ✅

---

## 🎊 Benefits

- ⚡ **Faster**: One less click required
- 🎯 **Smoother**: Seamless flow
- 💫 **Better UX**: Auto-submission feels natural
- ✨ **Auto-trigger**: File picker opens without manual action

---

See `PinModalExample.tsx` for a complete working example!



