import { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Check, Receipt } from 'lucide-react';

const AddExpense = () => {
  const { state, addExpense, updateExpense, getCurrencySymbol } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const urlTripId = searchParams.get('tripId');
  const currencySymbol = getCurrencySymbol();

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState(() => {
    return state.categories.expense[0]?.id || '';
  });
  const [paymentMode, setPaymentMode] = useState(() => {
    return state.paymentModes[0]?.id || '';
  });
  const [tripId, setTripId] = useState(urlTripId || '');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Pre-fill on edit
  useEffect(() => {
    if (editId) {
      const expense = state.expenses.find((e) => e.id === editId);
      if (expense) {
        setAmount(String(expense.amount));
        setDescription(expense.description || '');
        setDate(format(new Date(expense.date), 'yyyy-MM-dd'));
        setCategory(expense.category || '');
        setPaymentMode(expense.paymentMode || '');
        setTripId(expense.tripId || '');
      }
    }
  }, [editId, state.expenses]);

  // Active trips
  const activeTrips = useMemo(
    () => state.trips.filter((t) => !t.endDate || new Date(t.endDate) >= new Date()),
    [state.trips]
  );

  // Quick amount buttons
  const quickAmounts = [100, 500, 1000, 5000];

  const handleQuickAmount = (val) => {
    setAmount(String(val));
    setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    // Allow only one decimal point
    const parts = val.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(val);
    setErrors((prev) => ({ ...prev, amount: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Enter a valid amount';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);

    const selectedCat = state.categories.expense.find(c => c.id === category);
    const descText = description.trim() || selectedCat?.name || 'Other Expense';

    const expenseData = {
      description: descText,
      amount: parseFloat(amount),
      date,
      category,
      paymentMode,
      tripId: tripId || undefined,
    };

    if (editId) {
      updateExpense(editId, expenseData);
    } else {
      addExpense(expenseData);
    }

    setTimeout(() => navigate(-1), 150);
  };

  // Display amount
  const displayAmount = amount
    ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(parseFloat(amount) || 0)
    : '0';

  return (
    <div className="page-container">
      {/* ===== HEADER ===== */}
      <div className="flex items-center gap-3 mb-6 animate-slide-down">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost w-10 h-10 !p-0 rounded-full"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full gradient-danger flex items-center justify-center">
            <Receipt size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-surface-900 dark:text-white">
            {editId ? 'Edit Expense' : 'Add Expense'}
          </h1>
        </div>
      </div>

      {/* ===== AMOUNT INPUT ===== */}
      <div className="card p-6 mb-5 text-center animate-slide-up">
        <p className="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-2">
          Amount
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="text-2xl font-bold text-surface-400 dark:text-surface-500">
            {currencySymbol}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            className="text-4xl font-bold text-center bg-transparent border-none outline-none w-48 sm:w-64 tabular-nums text-surface-900 dark:text-white placeholder:text-surface-200 dark:placeholder:text-surface-700"
            autoFocus
          />
        </div>
        {errors.amount && (
          <p className="text-xs text-danger-500 mt-2 animate-fade-in">{errors.amount}</p>
        )}

        {/* Quick amount buttons */}
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          {quickAmounts.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleQuickAmount(val)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                amount === String(val)
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {currencySymbol}{new Intl.NumberFormat('en-IN').format(val)}
            </button>
          ))}
        </div>
      </div>

      {/* ===== FORM FIELDS ===== */}
      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
            Description <span className="text-surface-400 dark:text-surface-600 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            placeholder="What did you spend on?"
            className="input"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </div>

        {/* Category selector */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {state.categories.expense.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex min-h-12 items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all duration-200 border ${
                  category === cat.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500/20 shadow-sm'
                    : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-600'
                }`}
              >
                <span className="text-base shrink-0">{cat.icon}</span>
                <span className="min-w-0 leading-tight break-words">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Payment mode selector */}
        <div>
          <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2">
            Payment Mode
          </label>
          <div className="flex flex-wrap gap-2">
            {state.paymentModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setPaymentMode(mode.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  paymentMode === mode.id
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                    : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
                }`}
              >
                <span className="text-sm">{mode.icon}</span>
                {mode.name}
              </button>
            ))}
          </div>
        </div>

        {/* Trip link (optional) */}
        {activeTrips.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-1.5">
              Link to Trip <span className="text-surface-400 dark:text-surface-600 font-normal">(optional)</span>
            </label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="input appearance-none"
            >
              <option value="">No trip</option>
              {activeTrips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ===== SAVE BUTTON ===== */}
      <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full py-3.5 text-base shadow-lg shadow-primary-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Check size={18} />
          {saving ? 'Saving...' : editId ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
    </div>
  );
};

export default AddExpense;
