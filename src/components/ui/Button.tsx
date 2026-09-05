import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/helpers';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-[#ffd477] bg-[linear-gradient(180deg,#ffd477,#e9a73c)] text-[#1b160e] hover:brightness-105 shadow-glow-purple',
  secondary: 'border border-[#f6b94f]/30 bg-[#f6b94f]/10 text-[#ffd477] hover:bg-[#f6b94f]/15',
  outline: 'border border-[#f6b94f]/50 bg-black/20 text-[#ffd477] hover:bg-[#f6b94f]/10 hover:border-[#f6b94f]/80',
  ghost: 'border border-transparent text-off-white/75 hover:bg-white/5 hover:text-white',
  danger: 'bg-coral text-white hover:bg-coral-dark shadow-glow-coral',
  success: 'border border-[#f6b94f]/35 bg-[#f6b94f]/12 text-[#ffe1a0] hover:bg-[#f6b94f]/18',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-5 py-2.5 text-base rounded-[14px]',
  lg: 'px-6 py-3 text-lg rounded-2xl',
  xl: 'px-8 py-4 text-xl rounded-[20px]',
};

export function Button({ variant = 'primary', size = 'md', children, fullWidth, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'btn-primary inline-flex items-center justify-center gap-2 font-cairo font-black transition-all duration-200 active:scale-[.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed',
        VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}