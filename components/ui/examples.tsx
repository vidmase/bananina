/**
 * UI Component Examples
 * Demonstrating usage of Button, Modal, and Toast components
 */

import React, { useState } from 'react';
import { Button, Modal, useToast } from './index';

// Example: Using Buttons
export const ButtonExamples: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      <h2>Button Examples</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="success">Success</Button>
        <Button variant="outline">Outline</Button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>

      <div>
        <Button loading={loading} onClick={handleClick}>
          {loading ? 'Loading...' : 'Click to Load'}
        </Button>
      </div>

      <div>
        <Button 
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
            </svg>
          }
        >
          With Icon
        </Button>
      </div>

      <div>
        <Button fullWidth variant="primary">Full Width Button</Button>
      </div>

      <div>
        <Button disabled>Disabled Button</Button>
      </div>
    </div>
  );
};

// Example: Using Modal
export const ModalExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Modal Examples</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button onClick={() => setIsOpen(true)}>Open Basic Modal</Button>
        <Button onClick={() => setConfirmOpen(true)} variant="danger">
          Open Confirmation
        </Button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        size="md"
      >
        <p>This is a basic modal with some content.</p>
        <p>You can close it by clicking the X button, pressing Escape, or clicking outside.</p>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Action"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                alert('Confirmed!');
                setConfirmOpen(false);
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete this item? This action cannot be undone.</p>
      </Modal>
    </div>
  );
};

// Example: Using Toast
export const ToastExample: React.FC = () => {
  const toast = useToast();

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Toast Examples</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '300px' }}>
        <Button 
          variant="success" 
          onClick={() => toast.success('Operation completed successfully!')}
        >
          Show Success Toast
        </Button>

        <Button 
          variant="danger" 
          onClick={() => toast.error('An error occurred. Please try again.')}
        >
          Show Error Toast
        </Button>

        <Button 
          variant="secondary" 
          onClick={() => toast.warning('This action requires confirmation.')}
        >
          Show Warning Toast
        </Button>

        <Button 
          onClick={() => toast.info('New features are available!')}
        >
          Show Info Toast
        </Button>

        <Button 
          variant="outline"
          onClick={() => {
            toast.addToast({
              type: 'success',
              message: 'Image exported successfully',
              action: {
                label: 'View',
                onClick: () => alert('View clicked!')
              },
              duration: 0 // Won't auto-dismiss
            });
          }}
        >
          Show Toast with Action
        </Button>

        <Button 
          variant="ghost"
          onClick={() => {
            toast.success('Short message', 2000);
          }}
        >
          Quick Toast (2s)
        </Button>
      </div>
    </div>
  );
};

// Example: Combined usage in a realistic scenario
export const ImageEditorExample: React.FC = () => {
  const toast = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveImage = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    toast.success('Image saved successfully!', 3000);
  };

  const handleExport = () => {
    toast.addToast({
      type: 'success',
      message: 'Image exported to Downloads',
      action: {
        label: 'Open Folder',
        onClick: () => alert('Opening Downloads folder...')
      }
    });
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Realistic Usage Example</h2>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <Button 
          variant="primary" 
          loading={isProcessing}
          onClick={handleSaveImage}
          icon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12a.5.5 0 0 0 .5-.5V3.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 3.707V11.5a.5.5 0 0 0 .5.5z"/>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            </svg>
          }
        >
          Save Image
        </Button>

        <Button variant="secondary" onClick={handleExport}>
          Export
        </Button>

        <Button variant="ghost" onClick={() => setShowSettings(true)}>
          Settings
        </Button>
      </div>

      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Editor Settings"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                setShowSettings(false);
                toast.success('Settings saved');
              }}
            >
              Save Settings
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" />
            <span>Enable auto-save</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" defaultChecked />
            <span>Show grid overlay</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" />
            <span>Enable haptic feedback</span>
          </label>
        </div>
      </Modal>
    </div>
  );
};

// Full demo component
export const UIComponentDemo: React.FC = () => {
  return (
    <div>
      <ButtonExamples />
      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
      <ModalExample />
      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
      <ToastExample />
      <hr style={{ margin: '2rem 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />
      <ImageEditorExample />
    </div>
  );
};

export default UIComponentDemo;




