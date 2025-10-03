/**
 * Button Component
 * Reusable button with variants, sizes, loading states, and haptic feedback
 */

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { haptics } from '../../utils/haptics';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      hapticFeedback = true,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (hapticFeedback && !disabled && !loading) {
        haptics.buttonPress();
      }
      onClick?.(e);
    };

    const baseClasses = [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth ? 'btn-full' : '',
      loading ? 'btn-loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading && (
          <span className="btn-spinner">
            <svg className="spinner" viewBox="0 0 24 24">
              <circle className="spinner-circle" cx="12" cy="12" r="10" />
            </svg>
          </span>
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="btn-icon btn-icon-left">{icon}</span>
        )}
        {children && <span className="btn-content">{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="btn-icon btn-icon-right">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;




