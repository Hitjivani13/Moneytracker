const SIZE_MAP = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

const COLOR_MAP = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
};

function getAutoColor(percentage) {
  if (percentage < 50) return 'bg-success-500';
  if (percentage <= 80) return 'bg-warning-500';
  return 'bg-danger-500';
}

function getAutoTextColor(percentage) {
  if (percentage < 50) return 'text-success-600 dark:text-success-400';
  if (percentage <= 80) return 'text-warning-600 dark:text-warning-400';
  return 'text-danger-600 dark:text-danger-400';
}

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercentage = false,
  size = 'md',
  colorScheme = 'primary',
}) {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const clampedWidth = Math.min(percentage, 100);

  const barColor =
    colorScheme === 'auto' ? getAutoColor(percentage) : COLOR_MAP[colorScheme] || COLOR_MAP.primary;

  const textColor =
    colorScheme === 'auto'
      ? getAutoTextColor(percentage)
      : `text-surface-600 dark:text-surface-400`;

  const heightClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className="w-full">
      {/* Label and Percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs font-medium text-surface-600 dark:text-surface-400">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
              {percentage}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={`w-full rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden ${heightClass}`}
      >
        {/* Fill */}
        <div
          className={`${heightClass} rounded-full ${barColor} animate-progress transition-all duration-500 ease-out`}
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
    </div>
  );
}
