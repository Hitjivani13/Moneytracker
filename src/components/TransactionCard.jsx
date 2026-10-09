import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionCard({
  transaction,
  type = 'expense',
  categories = [],
  currencySymbol = '₹',
  onEdit,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const category = categories.find(
    (c) => c.id === transaction.category || c.id === transaction.categoryId || c.name === transaction.category
  );

  const emoji = category?.icon || (type === 'expense' ? '💸' : '💰');
  const categoryName = category?.name || transaction.category || 'Uncategorized';
  const categoryColor = category?.color || (type === 'expense' ? '#EF4444' : '#10B981');

  const formattedDate = (() => {
    try {
      return format(new Date(transaction.date), 'dd MMM');
    } catch {
      return '';
    }
  })();

  const formattedAmount = Number(transaction.amount || 0).toLocaleString('en-IN');

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div className="card p-3.5 md:p-4 animate-slide-up group">
      <div className="flex items-center gap-3">
        {/* Category Emoji Icon */}
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${categoryColor}18` }}
        >
          {emoji}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-surface-900 dark:text-surface-100 truncate">
            {transaction.description || transaction.source || categoryName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-surface-400 dark:text-surface-500 truncate">
              {categoryName}
            </span>
            <span className="text-surface-300 dark:text-surface-600 text-xs">·</span>
            <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap">
              {formattedDate}
            </span>
            {transaction.paymentMode && (
              <>
                <span className="text-surface-300 dark:text-surface-600 text-xs">·</span>
                <span className="text-xs text-surface-400 dark:text-surface-500 truncate">
                  {transaction.paymentMode}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right shrink-0 mr-1">
          <p
            className={`font-bold text-sm tabular-nums ${
              type === 'expense'
                ? 'text-danger-500'
                : 'text-success-500'
            }`}
          >
            {type === 'expense' ? '−' : '+'}
            {currencySymbol}
            {formattedAmount}
          </p>
        </div>

        {/* Three-dot Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-surface-400 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150"
            aria-label="Transaction options"
          >
            <MoreVertical size={16} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-surface-800 rounded-xl shadow-xl border border-surface-100 dark:border-surface-700 py-1 z-20 animate-scale-in">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (onEdit) {
                    onEdit(transaction);
                  } else {
                    navigate(type === 'expense' ? `/add-expense?edit=${transaction.id}` : `/add-earning?edit=${transaction.id}`);
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700/60 transition-colors duration-150"
              >
                <Edit2 size={14} className="text-primary-500" />
                Edit
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(transaction);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors duration-150"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
