import { useState } from 'react';
import { useData, playAlarmSound } from '../context/DataContext';
import { sendNotification } from '../utils/notifications';
import { ShieldAlert, Trash2, CheckCircle2, Moon, Skull, Plus, AlertTriangle, AlertOctagon } from 'lucide-react';
import Modal from '../components/Modal';

export default function Discipline() {
  const { state, addPunishment, updatePunishment, deletePunishment, addExpense } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const currencySymbol = state.settings.currency || '₹';

  const handleAdd = (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    addPunishment({
      description,
      amount: Number(amount),
      multiplier: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastDoubledAt: new Date().toISOString(),
    });

    setDescription('');
    setAmount('');
    setShowAddModal(false);
  };

  const handleResolve = (p) => {
    // Resolve the penalty
    updatePunishment(p.id, { status: 'resolved' });

    // Deduct/Add as an expense to the transactions list
    addExpense({
      description: `💀 Penalty Resolved: ${p.description} (${p.multiplier}x)`,
      amount: p.amount * p.multiplier,
      date: new Date().toISOString().split('T')[0],
      category: 'cat-other-expense',
      paymentMode: 'pm-cash', // Default payment mode
    });

    sendNotification("🎯 Penalty Resolved", `Added expense of ${currencySymbol}${(p.amount * p.multiplier).toLocaleString()} for resolving penalty.`);
  };

  const handleSnooze = (id, currentStatus) => {
    const nextStatus = currentStatus === 'snoozed' ? 'active' : 'snoozed';
    updatePunishment(id, { status: nextStatus });
  };

  // Debug tool: Age 24 hours immediately to trigger doubling multiplier
  const handleDebugAge24Hours = (p) => {
    const newMultiplier = p.multiplier * 2;
    playAlarmSound();
    
    // Trigger notification
    sendNotification(
      "💀 Penalty Doubled! (Debug)",
      `Penalty "${p.description}" has doubled to ${newMultiplier}x!`
    );

    updatePunishment(p.id, {
      multiplier: newMultiplier,
      lastDoubledAt: new Date().toISOString(),
    });
  };

  const activePunishments = (state.punishments || []).filter(p => p.status !== 'resolved');
  const resolvedPunishments = (state.punishments || []).filter(p => p.status === 'resolved');

  // Check if any active penalty has multiplier > 1 (i.e. has doubled at least once)
  const doubledPenalties = activePunishments.filter(p => p.multiplier > 1);

  return (
    <div className="page-container">
      {/* ===== HEADER ===== */}
      <div className="mb-6 animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight dark:text-white flex items-center gap-2">
            <Skull className="text-danger-500 fill-danger-500/10" size={28} />
            Discipline & Penalties
          </h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-1">
            Track accountability. Penalties double in multiplier if left unresolved for 24 hours.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary text-xs py-2.5 px-4 flex items-center gap-2 self-start md:self-auto shadow-md"
        >
          <Plus size={16} />
          Create Penalty
        </button>
      </div>

      {/* ===== SCARY SYSTEM WARNING BANNER ===== */}
      {doubledPenalties.length > 0 && (
        <div className="mb-6 card border-danger-500/30 bg-danger-500/5 animate-pulse-soft p-4 flex items-start gap-4">
          <div className="p-3 bg-danger-500/10 text-danger-500 rounded-xl">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-danger-600 dark:text-danger-400 text-sm">⚠️ High Intensity Penalties Active</h3>
            <p className="text-xs text-surface-600 dark:text-surface-300 mt-1">
              You have {doubledPenalties.length} unresolved penalty(ies) that have doubled in intensity. Resolve them immediately before they double again!
            </p>
          </div>
        </div>
      )}

      {/* ===== PENALTY LISTINGS ===== */}
      <div className="grid grid-cols-1 gap-6">
        {/* Active & Snoozed */}
        <div>
          <h2 className="text-base font-bold text-surface-900 dark:text-white mb-3">Active Penalties ({activePunishments.length})</h2>
          {activePunishments.length === 0 ? (
            <div className="card p-8 text-center text-surface-400 dark:text-surface-500 text-sm">
              ✨ No active penalties. You are staying fully disciplined!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePunishments.map((p) => {
                const totalCost = p.amount * p.multiplier;
                return (
                  <div key={p.id} className="card p-5 border-l-4 border-danger-500/80 flex flex-col justify-between gap-4 relative overflow-hidden">
                    {/* Snooze overlay banner if snoozed */}
                    {p.status === 'snoozed' && (
                      <div className="absolute top-2 right-2 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Moon size={10} /> Snoozed
                      </div>
                    )}

                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-base text-surface-900 dark:text-white truncate pr-16">{p.description}</h3>
                      </div>
                      <p className="text-[10px] text-surface-400 mt-1">
                        Created: {new Date(p.createdAt).toLocaleDateString()} &bull; Last Doubled: {new Date(p.lastDoubledAt).toLocaleDateString()}
                      </p>

                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-danger-500 tabular-nums">
                          {currencySymbol}{totalCost.toLocaleString()}
                        </span>
                        {p.multiplier > 1 && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-danger-500/10 text-danger-600 dark:text-danger-400 rounded-md">
                            {p.multiplier}x Multiplier
                          </span>
                        )}
                        <span className="text-xs text-surface-400">
                          (Base: {currencySymbol}{p.amount})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-100 dark:border-surface-700/50">
                      <button
                        onClick={() => handleResolve(p)}
                        className="btn btn-primary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={14} />
                        Resolve ({currencySymbol}{totalCost})
                      </button>
                      <button
                        onClick={() => handleSnooze(p.id, p.status)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          p.status === 'snoozed'
                            ? 'bg-surface-200 text-surface-800 dark:bg-surface-700 dark:text-white'
                            : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-50'
                        }`}
                      >
                        {p.status === 'snoozed' ? 'Unsnooze' : 'Snooze'}
                      </button>
                      <button
                        onClick={() => handleDebugAge24Hours(p)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-warning-600 border border-warning-500/20 bg-warning-500/5 hover:bg-warning-500/10 transition-all"
                        title="Force 24h multiplier double for testing"
                      >
                        ⚡ Double (24h)
                      </button>
                      <button
                        onClick={() => deletePunishment(p.id)}
                        className="p-2 text-danger-500 hover:bg-danger-500/5 rounded-xl transition-all border border-transparent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resolved Penalties History */}
        {resolvedPunishments.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-surface-500 mb-3">Resolved Accountability History</h2>
            <div className="card divide-y divide-surface-100 dark:divide-surface-700/50 overflow-hidden">
              {resolvedPunishments.slice(0, 5).map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-surface-900 dark:text-white line-through">{p.description}</span>
                    <p className="text-[10px] text-surface-400 mt-0.5">
                      Completed as transaction expense. Base was {currencySymbol}{p.amount}.
                    </p>
                  </div>
                  <span className="font-bold text-surface-500">
                    -{currencySymbol}{(p.amount * p.multiplier).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Punishment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="💀 Set Penalty accountability"
      >
        <form onSubmit={handleAdd} className="space-y-4 p-1">
          <div>
            <label className="text-xs font-bold text-surface-500 mb-1 block">Description of Violation</label>
            <input
              type="text"
              placeholder="e.g. Broke focus session or overspent limit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-surface-500 mb-1 block">Penalty Amount / Base Fee ({currencySymbol})</label>
            <input
              type="number"
              placeholder="e.g. 200"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full text-sm py-2.5"
          >
            Create Penalty
          </button>
        </form>
      </Modal>
    </div>
  );
}
