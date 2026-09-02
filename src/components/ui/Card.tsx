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
        hoverable && 'cursor-pointer hover:scale-[1.02] hover:shadow-soft',
        selected && 'ring-2 ring-purple shadow-glow-purple',
        glow && 'shadow-card',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
