import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-[#F5486A]', text: 'text-white font-bold' },
  secondary: { container: 'bg-[#4C3FC4]', text: 'text-white font-semibold' },
  outline: { container: 'border border-gray-300 bg-white', text: 'text-gray-800 font-semibold' },
  ghost: { container: 'bg-transparent', text: 'text-[#4C3FC4] font-semibold' },
  destructive: { container: 'bg-red-500', text: 'text-white font-semibold' },
};

const sizeStyles: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-3 py-2 rounded-full', text: 'text-sm' },
  md: { container: 'px-4 py-3 rounded-full', text: 'text-base' },
  lg: { container: 'px-8 py-4 rounded-full', text: 'text-base font-bold' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps & { className?: string }) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={`flex-row items-center justify-center gap-2 ${v.container} ${s.container} ${fullWidth ? 'w-full' : ''} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'outline' ? '#4C3FC4' : '#fff'} />}
      <Text className={`${v.text} ${s.text}`}>{children}</Text>
    </Pressable>
  );
}
