import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function LimitWarning({
  type = 'daily',
  current = 0,
  limit = 0,
  currencySymbol = '₹',
}) {
  if (!limit || limit <= 0) return null;

  const percentage = Math.round((current / limit) * 100);

  if (percentage < 50) return null;

  const formattedCurrent = Number(current).toLocaleString('en-IN');
  const formattedLimit = Number(limit).toLocaleString('en-IN');
  const label = type === 'daily' ? 'Daily' : 'Monthly';

  // Determine severity
  let config;
  if (percentage > 100) {
    config = {
      icon: <AlertTriangle size={18} />,
      bg: 'bg-danger-50 dark:bg-danger-500/10',
      border: 'border-danger-200 dark:border-danger-500/20',
      text: 'text-danger-700 dark:text-danger-400',
      iconColor: 'text-danger-500',
      message: `${label} limit exceeded! ${currencySymbol}${formattedCurrent} of ${currencySymbol}${formattedLimit} spent.`,
    };
  } else if (percentage >= 80) {
    config = {
      icon: <AlertCircle size={18} />,
      bg: 'bg-warning-50 dark:bg-warning-500/10',
      border: 'border-warning-200 dark:border-warning-500/20',
      text: 'text-warning-700 dark:text-warning-400',
      iconColor: 'text-warning-500',
      message: `${label} limit warning! ${currencySymbol}${formattedCurrent} of ${currencySymbol}${formattedLimit} (${percentage}%) spent.`,
    };
  } else {
    config = {
      icon: <Info size={18} />,
      bg: 'bg-primary-50 dark:bg-primary-500/10',
      border: 'border-primary-200 dark:border-primary-500/20',
      text: 'text-primary-700 dark:text-primary-400',
      iconColor: 'text-primary-500',
      message: `${label} spending: ${currencySymbol}${formattedCurrent} of ${currencySymbol}${formattedLimit} (${percentage}%).`,
    };
  }

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded-xl border ${config.bg} ${config.border} animate-slide-down`}
    >
      <div className={`shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </div>
      <p className={`text-sm font-medium leading-relaxed ${config.text}`}>
        {config.message}
      </p>
    </div>
  );
}
