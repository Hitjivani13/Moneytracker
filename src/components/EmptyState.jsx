export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 animate-fade-in">
      {/* Icon / Emoji */}
      {icon && (
        <div className="text-5xl mb-4 opacity-80">{icon}</div>
      )}

      {/* Title */}
      {title && (
        <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300 mb-1.5">
          {title}
        </h3>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-surface-400 dark:text-surface-500 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary mt-5"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
