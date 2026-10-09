import { isToday, isYesterday, format } from 'date-fns';

function formatDateLabel(dateString) {
  try {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEE, dd MMM');
  } catch {
    return dateString || '';
  }
}

export default function DateGroupHeader({
  date,
  total = 0,
  currencySymbol = '₹',
  type = 'expense',
}) {
  const label = formatDateLabel(date);
  const formattedTotal = Number(Math.abs(total) || 0).toLocaleString('en-IN');

  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-surface-50/80 dark:bg-surface-950/80 -mx-1 px-1 pt-3 pb-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            type === 'expense'
              ? 'text-danger-500'
              : 'text-success-500'
          }`}
        >
          {type === 'expense' ? '−' : '+'}
          {currencySymbol}
          {formattedTotal}
        </span>
      </div>
      <div className="h-px bg-surface-200 dark:bg-surface-700/60 mt-2" />
    </div>
  );
}
