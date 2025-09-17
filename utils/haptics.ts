/**
 * Haptic Feedback Utilities
 * Provides modern haptic feedback for user interactions
 */

// Check if the device supports haptic feedback
const supportsHaptics = (): boolean => {
  return 'vibrate' in navigator || 'hapticFeedback' in navigator;
};

// Haptic feedback patterns
export const HapticPatterns = {
  // Light tap for button presses
  light: [10],
  
  // Medium tap for selections
  medium: [20],
  
  // Strong tap for confirmations
  strong: [50],
  
  // Double tap for special actions
  double: [10, 50, 10],
  
  // Success pattern
  success: [10, 30, 10, 30, 10],
  
  // Error pattern
  error: [100, 50, 100],
  
  // Notification pattern
  notification: [20, 100, 20],
  
  // Long press pattern
  longPress: [200],
  
  // Subtle feedback for hover effects
  subtle: [5],
} as const;

// Main haptic feedback function
export const triggerHaptic = (pattern: keyof typeof HapticPatterns = 'light'): void => {
  if (!supportsHaptics()) return;
  
  try {
    // Use the modern Vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate(HapticPatterns[pattern]);
    }
    
    // For devices that support more advanced haptics (iOS Safari, etc.)
    if ('hapticFeedback' in navigator) {
      // @ts-ignore - This is a newer API not yet in TypeScript definitions
      navigator.hapticFeedback?.impact?.(pattern === 'light' ? 'light' : pattern === 'medium' ? 'medium' : 'heavy');
    }
  } catch (error) {
    // Silently fail if haptics are not supported
    console.debug('Haptic feedback not supported:', error);
  }
};

// Convenience functions for common interactions
export const haptics = {
  // Button press
  buttonPress: () => triggerHaptic('light'),
  
  // Button hover (very subtle)
  buttonHover: () => triggerHaptic('subtle'),
  
  // Selection/toggle
  select: () => triggerHaptic('medium'),
  
  // Success action
  success: () => triggerHaptic('success'),
  
  // Error/failure
  error: () => triggerHaptic('error'),
  
  // Notification
  notify: () => triggerHaptic('notification'),
  
  // Long press
  longPress: () => triggerHaptic('longPress'),
  
  // Strong confirmation
  confirm: () => triggerHaptic('strong'),
  
  // Double tap
  doubleTap: () => triggerHaptic('double'),
};

// Hook for React components to easily add haptic feedback
export const useHaptics = () => {
  return {
    triggerHaptic,
    haptics,
    supportsHaptics: supportsHaptics(),
  };
};

// CSS class names for haptic-enabled elements
export const hapticClasses = {
  button: 'haptic-button',
  hover: 'haptic-hover',
  select: 'haptic-select',
} as const;

// Auto-attach haptic feedback to elements with specific classes
export const initializeHaptics = (): void => {
  if (typeof document === 'undefined') return;
  
  // Add event listeners for haptic classes
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains(hapticClasses.button)) {
      haptics.buttonPress();
    } else if (target.classList.contains(hapticClasses.select)) {
      haptics.select();
    }
  });
  
  document.addEventListener('mouseenter', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains(hapticClasses.hover)) {
      haptics.buttonHover();
    }
  }, true);
};

export default haptics;
