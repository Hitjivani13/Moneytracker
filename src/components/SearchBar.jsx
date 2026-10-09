import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  onFocus,
  autoFocus = false,
}) {
  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400 dark:text-surface-500">
        <Search size={18} />
      </div>

      {/* Input */}
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="input pl-10 pr-10"
      />

      {/* Clear Button */}
      {value && (
        <button
          onClick={() => onChange?.('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
