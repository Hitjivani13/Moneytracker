import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import {
  HandCoins, Plus, Search, Filter, CheckCircle2, AlertCircle, Clock,
  ArrowUpRight, ArrowDownLeft, Trash2, Edit2, Check, DollarSign, Scale, User
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Debts() {
  const { state, addDebt, updateDebt, deleteDebt, settleDebt, getCurrencySymbol } = useData();
  const currency = getCurrencySymbol();

  const debts = state.debts || [];

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, given, taken, pending, settled
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState(null);

  // Form states
  const [form, setForm] = useState({
    personName: '',
    type: 'given', // 'given' (Udhar Aapyu) or 'taken' (Jama Lidhi)
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    paymentMode: state.paymentModes[0]?.id || 'pm-cash',
    notes: '',
    syncWithBalance: true,
  });

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState('');
  const [syncSettleWithBalance, setSyncSettleWithBalance] = useState(true);

  // Calculations
  const stats = useMemo(() => {
    let toCollect = 0; // Money given to others (pending)
    let toRepay = 0;   // Money borrowed from others (pending)
    let totalGiven = 0;
    let totalTaken = 0;

    debts.forEach((d) => {
      const remaining = Math.max(0, Number(d.amount) - Number(d.settledAmount || 0));
      if (d.type === 'given') {
        totalGiven += Number(d.amount);
        if (d.status !== 'settled' && remaining > 0) {
          toCollect += remaining;
        }
      } else {
        totalTaken += Number(d.amount);
        if (d.status !== 'settled' && remaining > 0) {
          toRepay += remaining;
        }
      }
    });

    return {
      toCollect,
      toRepay,
      netBalance: toCollect - toRepay,
      totalGiven,
      totalTaken,
    };
  }, [debts]);

  // Filtered List
  const filteredDebts = useMemo(() => {
    return debts
      .filter((d) => {
        // Tab Filter
        if (activeTab === 'given' && d.type !== 'given') return false;
        if (activeTab === 'taken' && d.type !== 'taken') return false;
        if (activeTab === 'pending' && d.status === 'settled') return false;
        if (activeTab === 'settled' && d.status !== 'settled') return false;

        // Search Filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const nameMatch = d.personName?.toLowerCase().includes(q);
          const notesMatch = d.notes?.toLowerCase().includes(q);
          return nameMatch || notesMatch;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  }, [debts, activeTab, search]);

  const handleOpenAddModal = (type = 'given') => {
    setEditingDebt(null);
    setForm({
      personName: '',
      type,
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: '',
      paymentMode: state.paymentModes[0]?.id || 'pm-cash',
      notes: '',
      syncWithBalance: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (debt) => {
    setEditingDebt(debt);
    setForm({
      personName: debt.personName,
      type: debt.type,
      amount: debt.amount,
      date: debt.date || format(new Date(), 'yyyy-MM-dd'),
      dueDate: debt.dueDate || '',
      paymentMode: debt.paymentMode || state.paymentModes[0]?.id || 'pm-cash',
      notes: debt.notes || '',
      syncWithBalance: false, // Don't double sync on edit
    });
    setShowAddModal(true);
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!form.personName.trim() || !form.amount || Number(form.amount) <= 0) return;

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        personName: form.personName.trim(),
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
        dueDate: form.dueDate,
        paymentMode: form.paymentMode,
        notes: form.notes,
      });
    } else {
      addDebt(
        {
          personName: form.personName.trim(),
          type: form.type,
          amount: Number(form.amount),
          date: form.date,
          dueDate: form.dueDate,
          paymentMode: form.paymentMode,
          notes: form.notes,
        },
        form.syncWithBalance
      );
    }
    setShowAddModal(false);
  };

  const handleOpenSettleModal = (debt) => {
    setSelectedDebtForSettle(debt);
    const remaining = Math.max(0, Number(debt.amount) - Number(debt.settledAmount || 0));
    setSettleAmount(remaining.toString());
    setSyncSettleWithBalance(true);
    setShowSettleModal(true);
  };

  const handleConfirmSettle = (e) => {
    e.preventDefault();
    if (!selectedDebtForSettle || !settleAmount || Number(settleAmount) <= 0) return;

    settleDebt(selectedDebtForSettle.id, Number(settleAmount), syncSettleWithBalance);
    setShowSettleModal(false);
    setSelectedDebtForSettle(null);
  };

  return (
    <div className="page-container">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500">
              <HandCoins size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold dark:text-white tracking-tight">
                Udhar & Jama (Khatabook)
              </h1>
              <p className="text-xs sm:text-sm text-surface-500">
                Track money lent to people & borrowed debts
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddModal('given')}
            className="btn btn-primary text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus size={16} /> Udhar Aapyu (Given)
          </button>
          <button
            onClick={() => handleOpenAddModal('taken')}
            className="btn btn-outline text-xs sm:text-sm py-2.5 px-4 flex items-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus size={16} /> Jama Lidhi (Taken)
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* To Collect (Given) */}
        <div className="card p-5 border-l-4 border-l-warning-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                To Collect (ઉધાર આપ્યા)
              </p>
              <p className="text-2xl font-extrabold text-warning-600 dark:text-warning-400 mt-1">
                {currency}{stats.toCollect.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-surface-400 mt-1">Pending from friends/others</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-warning-500/15 text-warning-500 flex items-center justify-center">
              <ArrowUpRight size={24} />
            </div>
          </div>
        </div>

        {/* To Repay (Taken) */}
        <div className="card p-5 border-l-4 border-l-danger-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                To Repay (જમા લીધા)
              </p>
              <p className="text-2xl font-extrabold text-danger-600 dark:text-danger-400 mt-1">
                {currency}{stats.toRepay.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-surface-400 mt-1">Debts you owe to others</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-danger-500/15 text-danger-500 flex items-center justify-center">
              <ArrowDownLeft size={24} />
            </div>
          </div>
        </div>

        {/* Net Outstanding Balance */}
        <div className="card p-5 border-l-4 border-l-primary-500 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
                Net Outstanding
              </p>
              <p className={`text-2xl font-extrabold mt-1 ${
                stats.netBalance >= 0
                  ? 'text-success-600 dark:text-success-400'
                  : 'text-danger-600 dark:text-danger-400'
              }`}>
                {stats.netBalance >= 0 ? '+' : ''}{currency}{stats.netBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-surface-400 mt-1">
                {stats.netBalance >= 0 ? 'Net positive asset' : 'Net overall liability'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary-500/15 text-primary-500 flex items-center justify-center">
              <Scale size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none z-10" size={18} />
          <input
            type="text"
            className="input !pl-10 text-sm"
            placeholder="Search person or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-100 dark:bg-surface-800/60 p-1.5 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'given', label: 'Given (ઉધાર)' },
            { id: 'taken', label: 'Taken (જમા)' },
            { id: 'pending', label: 'Pending' },
            { id: 'settled', label: 'Settled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Debt List */}
      {filteredDebts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-400 mx-auto flex items-center justify-center mb-4">
            <HandCoins size={32} />
          </div>
          <h3 className="text-lg font-bold dark:text-white">No records found</h3>
          <p className="text-xs text-surface-500 max-w-sm mx-auto mt-1 mb-6">
            Start tracking money given to or taken from friends/relatives.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => handleOpenAddModal('given')}
              className="btn btn-primary text-xs py-2 px-4"
            >
              <Plus size={14} /> Add Udhar Given
            </button>
            <button
              onClick={() => handleOpenAddModal('taken')}
              className="btn btn-outline text-xs py-2 px-4"
            >
              <Plus size={14} /> Add Jama Taken
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((debt) => {
            const isGiven = debt.type === 'given';
            const total = Number(debt.amount);
            const settled = Number(debt.settledAmount || 0);
            const remaining = Math.max(0, total - settled);
            const isSettled = debt.status === 'settled' || remaining === 0;
            const progressPercent = Math.min(100, Math.round((settled / total) * 100));

            return (
              <div
                key={debt.id}
                className={`card p-5 relative transition-all border ${
                  isSettled
                    ? 'border-surface-200 dark:border-surface-700/60 opacity-85'
                    : isGiven
                    ? 'border-warning-500/30 hover:border-warning-500'
                    : 'border-danger-500/30 hover:border-danger-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isGiven
                        ? 'bg-warning-500/15 text-warning-600 dark:text-warning-400'
                        : 'bg-danger-500/15 text-danger-600 dark:text-danger-400'
                    }`}>
                      <User size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base dark:text-white leading-tight">
                        {debt.personName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isGiven
                            ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400'
                            : 'bg-danger-500/10 text-danger-600 dark:text-danger-400'
                        }`}>
                          {isGiven ? 'Udhar Given (આપ્યા)' : 'Jama Taken (લીધા)'}
                        </span>

                        {isSettled ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-success-500/10 text-success-600 dark:text-success-400 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Settled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-lg dark:text-white">
                      {currency}{total.toLocaleString('en-IN')}
                    </p>
                    {!isSettled && (
                      <p className={`text-xs font-bold ${
                        isGiven ? 'text-warning-600 dark:text-warning-400' : 'text-danger-600 dark:text-danger-400'
                      }`}>
                        {currency}{remaining.toLocaleString('en-IN')} left
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress bar if partially settled */}
                {settled > 0 && !isSettled && (
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] text-surface-500 mb-1">
                      <span>Settled: {currency}{settled.toLocaleString('en-IN')}</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success-500 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Meta details */}
                <div className="text-xs text-surface-500 flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 pt-2 border-t border-surface-100 dark:border-surface-700/40">
                  <span>📅 Date: {format(new Date(debt.date || debt.createdAt), 'MMM d, yyyy')}</span>
                  {debt.dueDate && (
                    <span className="flex items-center gap-1 text-warning-600 dark:text-warning-400">
                      <Clock size={12} /> Due: {format(new Date(debt.dueDate), 'MMM d, yyyy')}
                    </span>
                  )}
                  {debt.notes && (
                    <span className="truncate max-w-[200px]" title={debt.notes}>
                      📝 {debt.notes}
                    </span>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    {!isSettled && (
                      <button
                        onClick={() => handleOpenSettleModal(debt)}
                        className="btn btn-success text-xs py-1.5 px-3 flex items-center gap-1 font-bold"
                      >
                        <Check size={14} /> Settle / Pay
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(debt)}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => deleteDebt(debt.id)}
                      className="p-1.5 rounded-lg text-danger-400 hover:text-danger-600 hover:bg-danger-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== ADD / EDIT DEBT MODAL ===== */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingDebt ? 'Edit Record' : 'Add Udhar / Jama Record'}
      >
        <form onSubmit={handleSaveForm} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-surface-100 dark:bg-surface-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'given' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                form.type === 'given'
                  ? 'bg-warning-500 text-white shadow-md'
                  : 'text-surface-600 dark:text-surface-400'
              }`}
            >
              <ArrowUpRight size={16} /> Udhar Given (આપ્યા)
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: 'taken' })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                form.type === 'taken'
                  ? 'bg-danger-500 text-white shadow-md'
                  : 'text-surface-600 dark:text-surface-400'
              }`}
            >
              <ArrowDownLeft size={16} /> Jama Taken (લીધા)
            </button>
          </div>

          {/* Person Name */}
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
              Person Name (વ્યક્તિનું નામ) *
            </label>
            <input
              type="text"
              required
              className="input text-sm"
              placeholder="e.g. Rahul Sharma, Ramesh Bhai"
              value={form.personName}
              onChange={(e) => setForm({ ...form, personName: e.target.value })}
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
                Amount (રકમ) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 font-bold text-sm pointer-events-none z-10">
                  {currency}
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  className="input !pl-9 text-sm"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
                Date (તારીખ)
              </label>
              <input
                type="date"
                className="input text-sm"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          {/* Target Return Date & Payment Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
                Target Return Date (જમા ક્યારે મળશે?)
              </label>
              <input
                type="date"
                className="input text-sm"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
                Payment Mode
              </label>
              <select
                className="input text-sm"
                value={form.paymentMode}
                onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              >
                {state.paymentModes.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.icon} {pm.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
              Notes / Description (નોંધ)
            </label>
            <input
              type="text"
              className="input text-sm"
              placeholder="e.g. Dinner bill split, Emergency loan"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Real Balance Sync Checkbox */}
          {!editingDebt && (
            <div className="p-3.5 rounded-2xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/60 flex items-start gap-3">
              <input
                type="checkbox"
                id="syncWithBalance"
                className="mt-1 w-4 h-4 accent-primary-500 rounded cursor-pointer"
                checked={form.syncWithBalance}
                onChange={(e) => setForm({ ...form, syncWithBalance: e.target.checked })}
              />
              <label htmlFor="syncWithBalance" className="text-xs cursor-pointer select-none">
                <span className="font-bold text-surface-900 dark:text-white block">
                  Reflect in Real Money Savings & Expenses
                </span>
                <span className="text-surface-500 text-[11px] block mt-0.5">
                  {form.type === 'given'
                    ? 'Logs this as an Outflow Expense right now so your cash balance stays real.'
                    : 'Logs this as an Inflow Earning right now so your available balance increases.'}
                </span>
              </label>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full text-sm py-3 font-bold mt-2">
            {editingDebt ? 'Save Changes' : 'Save Record'}
          </button>
        </form>
      </Modal>

      {/* ===== SETTLE DEBT MODAL ===== */}
      <Modal
        isOpen={showSettleModal}
        onClose={() => setShowSettleModal(false)}
        title="Settle / Collect Payment"
      >
        {selectedDebtForSettle && (
          <form onSubmit={handleConfirmSettle} className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-xs">
              <p className="text-surface-500">Person Name:</p>
              <p className="font-extrabold text-base text-surface-900 dark:text-white mt-0.5">
                {selectedDebtForSettle.personName}
              </p>
              <div className="flex justify-between mt-2 pt-2 border-t border-primary-500/10 text-xs font-semibold">
                <span>Total Amount: {currency}{Number(selectedDebtForSettle.amount).toLocaleString('en-IN')}</span>
                <span className="text-primary-600 dark:text-primary-400">
                  Remaining: {currency}{(Number(selectedDebtForSettle.amount) - Number(selectedDebtForSettle.settledAmount || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-surface-600 dark:text-surface-400 mb-1 block">
                Settlement Amount ({currency})
              </label>
              <input
                type="number"
                required
                min="1"
                max={Number(selectedDebtForSettle.amount) - Number(selectedDebtForSettle.settledAmount || 0)}
                className="input text-sm"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/60 flex items-start gap-3">
              <input
                type="checkbox"
                id="syncSettleWithBalance"
                className="mt-1 w-4 h-4 accent-success-500 rounded cursor-pointer"
                checked={syncSettleWithBalance}
                onChange={(e) => setSyncSettleWithBalance(e.target.checked)}
              />
              <label htmlFor="syncSettleWithBalance" className="text-xs cursor-pointer select-none">
                <span className="font-bold text-surface-900 dark:text-white block">
                  Reflect Settlement in Real Savings
                </span>
                <span className="text-surface-500 text-[11px] block mt-0.5">
                  {selectedDebtForSettle.type === 'given'
                    ? 'Returned money will be added as Income/Earning into your real balance!'
                    : 'Repaid money will be deducted as Expense from your real balance!'}
                </span>
              </label>
            </div>

            <button type="submit" className="btn btn-success w-full text-sm py-3 font-bold mt-2">
              <Check size={16} /> Confirm Settlement
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
