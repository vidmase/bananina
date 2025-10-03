/**
 * PinModal Usage Example
 * Shows how to use PinModal with automatic file picker on success
 */

import React, { useState, useRef } from 'react';
import { PinModal } from './PinModal';
import { Button } from '../ui';

export const PinModalExample: React.FC = () => {
  const [showPinModal, setShowPinModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    // Show PIN modal instead of opening file picker directly
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    // Automatically trigger file picker after successful PIN entry
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      // Process the file...
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        console.log('Image loaded:', dataUrl.substring(0, 50) + '...');
        // Set image, start editing, etc.
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePin = (pin: string): boolean => {
    return pin === '1256'; // Your PIN validation logic
  };

  return (
    <div>
      <h2>PIN Modal with Auto File Picker</h2>
      
      <Button variant="primary" onClick={handleUploadClick}>
        Upload Image (Requires PIN)
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handlePinSuccess}
        validatePin={validatePin}
      />
    </div>
  );
};

export default PinModalExample;




