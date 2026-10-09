import { useData } from '../context/DataContext';
import { useState, useMemo, useRef } from 'react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import TransactionCard from '../components/TransactionCard';
import EmptyState from '../components/EmptyState';

export default function Search() {
  const { state, deleteExpense, deleteEarning, getCurrencySymbol } = useData();
  const currency = getCurrencySymbol();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const allTransactions = useMemo(() => {
    const items = [
      ...state.expenses.map(e => ({ ...e, _type: 'expense', _searchText: `${e.description} ${(state.categories.expense.find(c => c.id === e.category) || {}).name || ''}`.toLowerCase() })),
      ...state.earnings.map(e => ({ ...e, _type: 'earning', _searchText: `${e.source || e.description} ${(state.categories.earning.find(c => c.id === e.category) || {}).name || ''}`.toLowerCase() })),
    ];
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [state.expenses, state.earnings, state.categories]);

  const results = useMemo(() => {
    return allTransactions.filter(t => {
      if (query && !t._searchText.includes(query.toLowerCase())) return false;
      if (typeFilter !== 'all' && t._type !== typeFilter) return false;
      if (paymentMode !== 'all' && t.paymentMode !== paymentMode) return false;
      if (dateFrom && dateTo) {
        try {
          const d = parseISO(t.date);
          if (!isWithinInterval(d, { start: parseISO(dateFrom), end: parseISO(dateTo) })) return false;
        } catch { return false; }
      } else if (dateFrom) {
        if (t.date < dateFrom) return false;
      } else if (dateTo) {
        if (t.date > dateTo) return false;
      }
      return true;
    });
  }, [allTransactions, query, typeFilter, paymentMode, dateFrom, dateTo]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setPaymentMode('all');
    setTypeFilter('all');
  };

  const hasActiveFilters = dateFrom || dateTo || paymentMode !== 'all' || typeFilter !== 'all';

  return (
    <div className="page-container">
      {/* Search Input */}
      <div className="relative mb-4">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search transactions..."
          autoFocus
          className="input pl-11 pr-10"
        />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-primary-500 text-white'
              : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400'
          }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {hasActiveFilters && (
            <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">Active</span>
          )}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-primary-500 font-medium">
            Clear all
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-4 mb-4 space-y-4 animate-slide-down">
          {/* Type Filter */}
          <div>
            <label className="text-xs font-medium text-surface-500 mb-2 block">Type</label>
            <div className="flex gap-2">
              {[{ key: 'all', label: 'All' }, { key: 'expense', label: 'Expenses' }, { key: 'earning', label: 'Earnings' }].map(f => (
                <button
                  key={f.key}
                  onClick={() => setTypeFilter(f.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    typeFilter === f.key
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm" />
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-xs font-medium text-surface-500 mb-2 block">Payment Mode</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setPaymentMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  paymentMode === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                }`}
              >All</button>
              {state.paymentModes.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMode(pm.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    paymentMode === pm.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
                  }`}
                >
                  {pm.icon} {pm.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-surface-500 mb-3">
        {query || hasActiveFilters
          ? `${results.length} result${results.length !== 1 ? 's' : ''} found`
          : `${allTransactions.length} total transactions`}
      </p>

      {/* Results */}
      {results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No results found"
          description={query ? `No transactions matching "${query}"` : "Try adjusting your filters"}
        />
      ) : (
        <div className="space-y-2">
          {results.map(t => (
            <TransactionCard
              key={t.id}
              transaction={t}
              type={t._type}
              categories={t._type === 'expense' ? state.categories.expense : state.categories.earning}
              currencySymbol={currency}
              onDelete={() => t._type === 'expense' ? deleteExpense(t.id) : deleteEarning(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
