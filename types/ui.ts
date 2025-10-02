/**
 * UI Type Definitions
 * Types for UI components, interactions, and visual elements
 */

import { ReactNode, CSSProperties } from 'react';

// ===== Common UI Types =====

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'info' | 'outline';
export type Status = 'idle' | 'loading' | 'success' | 'error' | 'warning';
export type Theme = 'dark' | 'light' | 'auto';
export type Position = 'top' | 'right' | 'bottom' | 'left' | 'center';
export type Alignment = 'start' | 'center' | 'end' | 'stretch';

// ===== Icon Types =====

export interface IconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export type IconComponent = React.FC<IconProps>;

// ===== Button Types =====

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  hapticFeedback?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  title?: string;
}

// ===== Modal Types =====

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: Size | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  footer?: ReactNode;
  hapticFeedback?: boolean;
  preventScroll?: boolean;
  restoreFocus?: boolean;
}

// ===== Toast Types =====

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// ===== Input Types =====

export interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  size?: Size;
  variant?: 'default' | 'filled' | 'outlined';
  error?: string | boolean;
  success?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  prefix?: ReactNode;
  suffix?: ReactNode;
  className?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

// ===== Select/Dropdown Types =====

export interface SelectOption<T = unknown> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps<T = unknown> {
  options: SelectOption<T>[];
  value?: T;
  defaultValue?: T;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  size?: Size;
  error?: string | boolean;
  className?: string;
  onChange?: (value: T | T[] | null) => void;
  onSearch?: (query: string) => void;
}

// ===== Card Types =====

export interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  footer?: ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
  className?: string;
  onClick?: () => void;
}

// ===== Tooltip Types =====

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: Position;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

// ===== Slider Types =====

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  marks?: Array<{ value: number; label?: string }>;
  className?: string;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
}

// ===== Tab Types =====

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab?: string;
  defaultTab?: string;
  variant?: 'default' | 'pills' | 'underline';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  onChange?: (tabId: string) => void;
}

// ===== Accordion Types =====

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string[];
  allowMultiple?: boolean;
  className?: string;
  onChange?: (openIds: string[]) => void;
}

// ===== Progress Types =====

export interface ProgressProps {
  value: number;
  max?: number;
  size?: Size;
  variant?: 'default' | 'gradient' | 'striped';
  showLabel?: boolean;
  label?: string;
  color?: string;
  className?: string;
}

// ===== Spinner Types =====

export interface SpinnerProps {
  size?: Size | number;
  color?: string;
  variant?: 'circular' | 'dots' | 'bars';
  className?: string;
}

// ===== Badge Types =====

export interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  dot?: boolean;
  count?: number;
  max?: number;
  className?: string;
}

// ===== Avatar Types =====

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: Size | number;
  variant?: 'circle' | 'square' | 'rounded';
  fallback?: ReactNode;
  className?: string;
}

// ===== Divider Types =====

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: Size;
  label?: string;
  className?: string;
}

// ===== Skeleton Types =====

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  count?: number;
  className?: string;
}

// ===== Dialog Types =====

export interface DialogProps extends ModalProps {
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmVariant?: Variant;
  loading?: boolean;
  danger?: boolean;
}

// ===== Popover Types =====

export interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  position?: Position;
  offset?: number;
  closeOnClickOutside?: boolean;
  className?: string;
}

// ===== Menu Types =====

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

export interface MenuProps {
  items: MenuItem[];
  trigger?: ReactNode;
  position?: Position;
  className?: string;
  onSelect?: (itemId: string) => void;
}

// ===== Notification Types =====

export interface Notification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ToastAction;
  timestamp?: Date;
  read?: boolean;
}

export interface NotificationCenterProps {
  notifications: Notification[];
  maxVisible?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onMarkAsRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onClearAll?: () => void;
}

// ===== Color Picker Types =====

export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  format?: 'hex' | 'rgb' | 'hsl';
  presets?: string[];
  showAlpha?: boolean;
  className?: string;
  onChange?: (color: string) => void;
}

// ===== Drag & Drop Types =====

export interface DragItem {
  id: string;
  type: string;
  data: unknown;
}

export interface DropZoneProps {
  accept?: string | string[];
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  onDrop?: (files: File[]) => void;
  onError?: (error: Error) => void;
  children?: ReactNode;
  className?: string;
}

// ===== Loading Overlay Types =====

export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  spinner?: ReactNode;
  blur?: boolean;
  className?: string;
}

// ===== Empty State Types =====

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// ===== Error Boundary Types =====

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// ===== Layout Types =====

export interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  className?: string;
}

export interface GridProps {
  children: ReactNode;
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: Size;
  className?: string;
}

export interface StackProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  spacing?: Size;
  align?: Alignment;
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  wrap?: boolean;
  className?: string;
}



