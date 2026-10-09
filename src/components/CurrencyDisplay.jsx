const SIZE_CLASSES = {
  sm: 'text-sm font-medium',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
};

const TYPE_COLORS = {
  expense: 'text-danger-500',
  earning: 'text-success-500',
  neutral: 'text-surface-900 dark:text-surface-100',
};

const SIGN_MAP = {
  expense: '−',
  earning: '+',
  neutral: '',
};

export default function CurrencyDisplay({
  amount = 0,
  type = 'neutral',
  currencySymbol = '₹',
  size = 'md',
}) {
  const formattedAmount = Number(Math.abs(amount) || 0).toLocaleString('en-IN');

  return (
    <span
      className={`tabular-nums ${SIZE_CLASSES[size] || SIZE_CLASSES.md} ${
        TYPE_COLORS[type] || TYPE_COLORS.neutral
      }`}
    >
      {SIGN_MAP[type]}
      {currencySymbol}
      {formattedAmount}
    </span>
  );
}
