import { useData } from '../context/DataContext';
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, parseISO, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import TransactionCard from '../components/TransactionCard';
import DateGroupHeader from '../components/DateGroupHeader';
import EmptyState from '../components/EmptyState';

export default function History() {
  const { state, deleteExpense, deleteEarning, getCurrencySymbol } = useData();
  const currency = getCurrencySymbol();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filter, setFilter] = useState('all');

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const transactions = useMemo(() => {
    let items = [];

    if (filter !== 'earning') {
      state.expenses
        .filter(e => {
          const d = parseISO(e.date);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        })
        .forEach(e => items.push({ ...e, _type: 'expense' }));
    }

    if (filter !== 'expense') {
      state.earnings
        .filter(e => {
          const d = parseISO(e.date);
          return isWithinInterval(d, { start: monthStart, end: monthEnd });
        })
        .forEach(e => items.push({ ...e, _type: 'earning' }));
    }

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  }, [state.expenses, state.earnings, monthStart, monthEnd, filter]);

  const grouped = useMemo(() => {
    const groups = {};
    transactions.forEach(t => {
      const key = t.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [transactions]);

  const monthlyIncome = useMemo(() =>
    state.earnings
      .filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      })
      .reduce((s, e) => s + Number(e.amount), 0),
    [state.earnings, monthStart, monthEnd]
  );

  const monthlyExpense = useMemo(() =>
    state.expenses
      .filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      })
      .reduce((s, e) => s + Number(e.amount), 0),
    [state.expenses, monthStart, monthEnd]
  );

  const handleDelete = (id, type) => {
    if (type === 'expense') deleteExpense(id);
    else deleteEarning(id);
  };

  const getDailyTotal = (items) =>
    items.reduce((s, t) => s + (t._type === 'expense' ? -1 : 1) * Number(t.amount), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <h1 className="text-3xl font-extrabold mb-8 dark:text-white tracking-tight">History</h1>

      {/* Month Selector */}
      <div className="flex items-center justify-between mb-6 card p-4.5 bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700/50">
        <button onClick={() => setSelectedMonth(prev => subMonths(prev, 1))}
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
          <ChevronLeft size={22} className="text-surface-500" />
        </button>
        <span className="font-bold text-lg dark:text-white tracking-tight">
          {format(selectedMonth, 'MMMM yyyy')}
        </span>
        <button onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
          <ChevronRight size={22} className="text-surface-500" />
        </button>
      </div>

      {/* Type Filter (Segment Control style) */}
      <div className="flex p-1 bg-surface-100 dark:bg-surface-900/60 border border-surface-200/40 dark:border-surface-800 rounded-2xl mb-6 shadow-inner">
        {[{ key: 'all', label: 'All' }, { key: 'expense', label: 'Expenses' }, { key: 'earning', label: 'Earnings' }].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filter === f.key
                ? 'bg-white dark:bg-surface-800 text-primary-500 dark:text-white shadow-sm'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="card p-6 mb-8 bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700/50">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Income</p>
            <p className="text-xl font-bold text-success-500 tabular-nums">
              {currency}{monthlyIncome.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Expenses</p>
            <p className="text-xl font-bold text-danger-500 tabular-nums">
              {currency}{monthlyExpense.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">Net</p>
            <p className={`text-xl font-bold tabular-nums ${monthlyIncome - monthlyExpense >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {currency}{(monthlyIncome - monthlyExpense).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      {grouped.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No transactions"
          description="No transactions found for this month"
        />
      ) : (
        <div className="space-y-2">
          {grouped.map(([date, items]) => (
            <div key={date} className="animate-slide-up">
              <DateGroupHeader
                date={date}
                total={Math.abs(getDailyTotal(items))}
                currencySymbol={currency}
                type={getDailyTotal(items) >= 0 ? 'earning' : 'expense'}
              />
              <div className="space-y-2 mt-2 mb-4">
                {items.map(t => (
                  <TransactionCard
                    key={t.id}
                    transaction={t}
                    type={t._type}
                    categories={t._type === 'expense' ? state.categories.expense : state.categories.earning}
                    currencySymbol={currency}
                    onDelete={() => handleDelete(t.id, t._type)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
