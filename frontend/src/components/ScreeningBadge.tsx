import { cn, getMatchLabel } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ScreeningBadgeProps {
  score: number;
  color: 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

export default function ScreeningBadge({ score, color, size = 'md' }: ScreeningBadgeProps) {
  const Icon = color === 'green' ? CheckCircle : color === 'yellow' ? AlertTriangle : XCircle;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const colorClasses = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        sizeClasses[size],
        colorClasses[color]
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      {score}% — {getMatchLabel(color)}
    </span>
  );
}
