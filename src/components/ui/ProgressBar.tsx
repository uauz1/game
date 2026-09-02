import { cn } from '@/utils/helpers';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  color?: string;
}

export function ProgressBar({ current, total, className, color = '#7056E8' }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className={cn('h-2 rounded-full bg-white/10 overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
}
