import type { Category } from '@/types';
import * as Icons from 'lucide-react';
import { cn } from '@/utils/helpers';

interface CategoryIconProps {
  category: Category;
  size?: number;
  className?: string;
}

export function CategoryIcon({ category, size = 24, className }: CategoryIconProps) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[category.icon];
  if (!IconComponent) return null;
  return (
    <div
      className={cn('rounded-2xl flex items-center justify-center shrink-0', className)}
      style={{ backgroundColor: category.color + '20', color: category.color, width: size + 16, height: size + 16 }}
    >
      <IconComponent style={{ width: size, height: size }} />
    </div>
  );
}

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export function DynamicIcon({ name, size = 24, className, color }: DynamicIconProps) {
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} style={{ width: size, height: size, color }} />;
}
