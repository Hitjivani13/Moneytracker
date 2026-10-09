import { useData } from '../context/DataContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, Trash2, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ProgressBar from '../components/ProgressBar';
import TransactionCard from '../components/TransactionCard';
import EmptyState from '../components/EmptyState';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, deleteTrip, deleteExpense, getCurrencySymbol } = useData();
  const currency = getCurrencySymbol();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const trip = state.trips.find(t => t.id === id);

  const tripExpenses = useMemo(() =>
    state.expenses.filter(e => e.tripId === id).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [state.expenses, id]
  );

  const totalSpent = tripExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const categoryBreakdown = useMemo(() => {
    const map = {};
    tripExpenses.forEach(e => {
      const cat = state.categories.expense.find(c => c.id === e.category);
      const name = cat ? cat.name : 'Other';
      const color = cat ? cat.color : '#94A3B8';
      const icon = cat ? cat.icon : '📦';
      if (!map[name]) map[name] = { name, color, icon, total: 0 };
      map[name].total += Number(e.amount);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [tripExpenses, state.categories.expense]);

  if (!trip) {
    return (
      <div className="page-container">
        <EmptyState icon="🔍" title="Trip not found" description="This trip doesn't exist"
          actionLabel="Go Back" onAction={() => navigate('/trips')} />
      </div>
    );
  }

  const budget = Number(trip.budget);
  const remaining = budget - totalSpent;

  const handleDeleteTrip = () => {
    deleteTrip(trip.id);
    navigate('/trips');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/trips')}
          className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
          <ArrowLeft size={20} className="dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold dark:text-white">{trip.name}</h1>
          <p className="text-xs text-surface-500 flex items-center gap-1">
            <Calendar size={12} />
            {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="gradient-primary rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-xs text-white/70">Budget</p>
            <p className="text-lg font-bold tabular-nums">{currency}{budget.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-white/70">Spent</p>
            <p className="text-lg font-bold tabular-nums">{currency}{totalSpent.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-white/70">Remaining</p>
            <p className={`text-lg font-bold tabular-nums ${remaining < 0 ? 'text-red-300' : ''}`}>
              {currency}{Math.abs(remaining).toLocaleString('en-IN')}
              {remaining < 0 ? ' over' : ''}
            </p>
          </div>
        </div>
        <div className="bg-white/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-700"
            style={{ width: `${Math.min((totalSpent / budget) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-white/70 text-right mt-1">
          {((totalSpent / budget) * 100).toFixed(0)}% used
        </p>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card p-4 mb-6">
          <h3 className="font-semibold mb-3 dark:text-white">Category Breakdown</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="total" cx="50%" cy="50%"
                    outerRadius={55} innerRadius={30}>
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${currency}${Number(v).toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {categoryBreakdown.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                    <span className="dark:text-surface-300">{cat.icon} {cat.name}</span>
                  </span>
                  <span className="font-semibold tabular-nums dark:text-white">
                    {currency}{cat.total.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add expense to trip */}
      <button
        onClick={() => navigate(`/add-expense?tripId=${trip.id}`)}
        className="btn btn-outline w-full mb-4"
      >
        <Plus size={18} /> Add Expense to Trip
      </button>

      {/* Trip Expenses */}
      <h3 className="font-semibold mb-3 dark:text-white">
        Expenses ({tripExpenses.length})
      </h3>

      {tripExpenses.length === 0 ? (
        <EmptyState icon="📝" title="No expenses yet" description="Add expenses linked to this trip" />
      ) : (
        <div className="space-y-2 mb-6">
          {tripExpenses.map(e => (
            <TransactionCard
              key={e.id}
              transaction={e}
              type="expense"
              categories={state.categories.expense}
              currencySymbol={currency}
              onDelete={() => deleteExpense(e.id)}
            />
          ))}
        </div>
      )}

      {/* Delete Trip */}
      {!showDeleteConfirm ? (
        <button onClick={() => setShowDeleteConfirm(true)}
          className="btn btn-ghost text-danger-500 w-full mt-4">
          <Trash2 size={16} /> Delete Trip
        </button>
      ) : (
        <div className="card p-4 border-danger-200 dark:border-danger-900 mt-4">
          <p className="text-sm font-medium text-danger-500 mb-3">Are you sure? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost flex-1">Cancel</button>
            <button onClick={handleDeleteTrip} className="btn btn-danger flex-1">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
