/**
 * PinModal Component
 * PIN authentication modal with auto-submit and auto-file-picker
 */

import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from '../ui';

export interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  validatePin: (pin: string) => boolean;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  validatePin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setError('');
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (validatePin(pinInput)) {
      onClose();
      // Small delay to allow modal to close before opening file picker
      setTimeout(() => {
        onSuccess();
      }, 150);
    } else {
      setError('Invalid PIN code');
      setPinInput('');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (pinInput.length === 4) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinInput]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPinInput(value);
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pinInput.length === 4) {
      handleSubmit();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enter PIN Code"
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={pinInput.length !== 4}
            fullWidth
          >
            Unlock
          </Button>
        </>
      }
    >
      <div className="pin-modal-content">
        <p className="pin-modal-description">
          Enter your 4-digit PIN to access the editor
        </p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pinInput}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          className={`pin-input ${error ? 'error' : ''}`}
          placeholder="••••"
          autoComplete="off"
        />

        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < pinInput.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {error && <p className="pin-error">{error}</p>}
      </div>
    </Modal>
  );
};

export default PinModal;
