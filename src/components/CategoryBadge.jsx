export default function CategoryBadge({ category }) {
  if (!category) return null;

  const { icon, name, color = '#6366F1' } = category;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      style={{
        backgroundColor: `${color}26`,
        color: color,
      }}
    >
      {icon && <span className="text-xs leading-none">{icon}</span>}
      {name}
    </span>
  );
}
