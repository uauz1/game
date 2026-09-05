import type { ReactNode } from 'react';
import { cn } from '@/utils/helpers';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
  glow?: boolean;
}

export function Card({ children, className, onClick, hoverable, selected, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card-base glass p-6',
        hoverable && 'cursor-pointer hover:-translate-y-1 hover:shadow-card',
        selected && 'ring-1 ring-[#f6b94f]/80 border-[#f6b94f]/65 shadow-glow-purple',
        glow && 'shadow-card',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}