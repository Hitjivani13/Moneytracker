import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Moon, Sun, Download, Upload, Trash2, Bell, Keyboard,
  Shield, Plus, RotateCcw, AlertTriangle, Repeat, X, Check,
  ShieldCheck, History, Clock, Save, RefreshCw, HardDrive, FolderOpen
} from 'lucide-react';
import Modal from '../components/Modal';
import { CURRENCIES, FREQUENCY_OPTIONS, KEYBOARD_SHORTCUTS } from '../utils/constants';
import { requestNotificationPermission } from '../utils/notifications';

export default function Settings() {
  const { state, updateSettings, addRecurringTransaction, deleteRecurringTransaction,
    updateRecurringTransaction, exportData, importData, resetData, getCurrencySymbol,
    createSnapshot, getSnapshots, restoreSnapshot, deleteSnapshot,
    enableDiskAutoSave, isDiskAutoSaveActive, loadFromDiskFile } = useData();
  const { theme, toggleTheme } = useTheme();
  const currency = getCurrencySymbol();
  const fileInputRef = useRef(null);

  const [dailyLimit, setDailyLimit] = useState(state.settings.dailyLimit || '');
  const [monthlyLimit, setMonthlyLimit] = useState(state.settings.monthlyLimit || '');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [limitSaved, setLimitSaved] = useState(false);
  const [importStatus, setImportStatus] = useState(null);
  
  // Snapshots Vault state
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotMsg, setSnapshotMsg] = useState(null);

  // Disk Auto-Save state
  const [diskSaveActive, setDiskSaveActive] = useState(false);
  const [diskMsg, setDiskMsg] = useState(null);

  const loadSnapshotsList = async () => {
    if (getSnapshots) {
      const list = await getSnapshots();
      setSnapshots(list || []);
    }
  };

  useEffect(() => {
    loadSnapshotsList();
  }, []);

  const handleManualSnapshot = async () => {
    if (createSnapshot) {
      await createSnapshot(`Manual Snapshot (${new Date().toLocaleDateString()})`);
      setSnapshotMsg('Snapshot created!');
      setTimeout(() => setSnapshotMsg(null), 3000);
      loadSnapshotsList();
    }
  };

  const handleRestoreFromSnapshot = (snap) => {
    if (restoreSnapshot && snap.state) {
      restoreSnapshot(snap.state);
      setSnapshotMsg(`Restored from "${snap.label}"!`);
      setTimeout(() => setSnapshotMsg(null), 3000);
    }
  };

  const handleDeleteSnapshot = async (id) => {
    if (deleteSnapshot) {
      await deleteSnapshot(id);
      loadSnapshotsList();
    }
  };

  const [recurringForm, setRecurringForm] = useState({
    description: '', amount: '', type: 'expense', category: '',
    paymentMode: state.paymentModes[0]?.id || '', frequency: 'monthly', nextDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleSaveLimits = () => {
    updateSettings({
      dailyLimit: Number(dailyLimit) || 0,
      monthlyLimit: Number(monthlyLimit) || 0,
    });
    setLimitSaved(true);
    setTimeout(() => setLimitSaved(false), 2000);
  };

  const handleNotification = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? 'granted' : 'denied');
  };

  const handleExport = () => exportData();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = importData(ev.target.result);
      setImportStatus(result ? 'success' : 'error');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    await resetData();
    setShowResetConfirm(false);
    window.location.reload();
  };

  const handleAddRecurring = () => {
    if (!recurringForm.description || !recurringForm.amount) return;
    addRecurringTransaction({
      description: recurringForm.description,
      amount: Number(recurringForm.amount),
      type: recurringForm.type,
      category: recurringForm.category,
      paymentMode: recurringForm.paymentMode,
      frequency: recurringForm.frequency,
      nextDate: recurringForm.nextDate,
      active: true,
    });
    setRecurringForm({
      description: '', amount: '', type: 'expense', category: '',
      paymentMode: state.paymentModes[0]?.id || '', frequency: 'monthly',
      nextDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setShowRecurringModal(false);
  };

  const currentCategories = recurringForm.type === 'expense'
    ? state.categories.expense
    : state.categories.earning;

  const SectionTitle = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3.5 mb-4 mt-10">
      <Icon size={20} className="text-primary-500" />
      <h2 className="font-bold text-lg dark:text-white tracking-tight">{title}</h2>
    </div>
  );

  const SettingRow = ({ children, className = '' }) => (
    <div className={`card p-6 mb-6 ${className}`}>{children}</div>
  );

  return (
    <div className="page-container">
      <h1 className="text-3xl font-extrabold mb-3 dark:text-white tracking-tight">Settings</h1>
      <p className="text-base text-surface-500 mb-8">Customize your Paisa Pro experience</p>

      {/* ===== APPEARANCE ===== */}
      <SectionTitle icon={Sun} title="Appearance" />
      <SettingRow>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={20} className="text-primary-400" /> : <Sun size={20} className="text-warning-500" />}
            <div>
              <p className="font-medium text-sm dark:text-white">Dark Mode</p>
              <p className="text-xs text-surface-500">{theme === 'dark' ? 'Dark theme active' : 'Light theme active'}</p>
            </div>
          </div>
          <button onClick={toggleTheme}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
              theme === 'dark' ? 'bg-primary-500' : 'bg-surface-300'
            }`}>
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              theme === 'dark' ? 'left-5.5' : 'left-0.5'
            }`} />
          </button>
        </div>
      </SettingRow>

      {/* ===== CURRENCY ===== */}
      <SectionTitle icon={Shield} title="Currency" />
      <SettingRow>
        <div className="flex gap-2 flex-wrap">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => updateSettings({ currency: c.symbol })}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                state.settings.currency === c.symbol
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                  : 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400'
              }`}
            >
              {c.symbol} {c.code}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* ===== SPENDING LIMITS ===== */}
      <SectionTitle icon={AlertTriangle} title="Spending Limits" />
      <SettingRow>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-surface-500 mb-1 block">Daily Limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-semibold text-sm">{currency}</span>
              <input type="number" className="input pl-8 text-sm" placeholder="0"
                value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-surface-500 mb-1 block">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-semibold text-sm">{currency}</span>
              <input type="number" className="input pl-8 text-sm" placeholder="0"
                value={monthlyLimit} onChange={e => setMonthlyLimit(e.target.value)} />
            </div>
          </div>
          <button onClick={handleSaveLimits}
            className={`btn w-full text-sm ${limitSaved ? 'btn-success' : 'btn-primary'}`}>
            {limitSaved ? <><Check size={16} /> Saved!</> : 'Save Limits'}
          </button>
        </div>
      </SettingRow>

      {/* ===== RECURRING TRANSACTIONS ===== */}
      <SectionTitle icon={Repeat} title="Recurring Transactions" />
      {(state.settings.recurringTransactions || []).length > 0 ? (
        <div className="space-y-2 mb-3">
          {state.settings.recurringTransactions.map(rt => (
            <SettingRow key={rt.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm dark:text-white">{rt.description}</p>
                  <p className="text-xs text-surface-500">
                    {currency}{Number(rt.amount).toLocaleString('en-IN')} • {rt.frequency} •
                    Next: {rt.nextDate ? format(new Date(rt.nextDate), 'MMM d') : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRecurringTransaction(rt.id, { active: !rt.active })}
                    className={`w-10 h-6 rounded-full transition-all relative ${rt.active ? 'bg-success-500' : 'bg-surface-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${rt.active ? 'left-4.5' : 'left-0.5'}`} />
                  </button>
                  <button onClick={() => deleteRecurringTransaction(rt.id)}
                    className="p-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 text-surface-400 hover:text-danger-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </SettingRow>
          ))}
        </div>
      ) : (
        <SettingRow>
          <p className="text-sm text-surface-500 text-center py-2">No recurring transactions</p>
        </SettingRow>
      )}
      <button onClick={() => setShowRecurringModal(true)} className="btn btn-outline w-full text-sm mb-4">
        <Plus size={16} /> Add Recurring Transaction
      </button>

      {/* ===== NOTIFICATIONS ===== */}
      <SectionTitle icon={Bell} title="Notifications" />
      <SettingRow>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm dark:text-white">Browser Notifications</p>
            <p className="text-xs text-surface-500">
              Status: <span className={`font-medium ${notifStatus === 'granted' ? 'text-success-500' : notifStatus === 'denied' ? 'text-danger-500' : 'text-warning-500'}`}>
                {notifStatus === 'granted' ? 'Enabled' : notifStatus === 'denied' ? 'Denied' : notifStatus === 'unsupported' ? 'Not supported' : 'Not set'}
              </span>
            </p>
          </div>
          {notifStatus !== 'granted' && notifStatus !== 'unsupported' && (
            <button onClick={handleNotification} className="btn btn-primary text-xs py-2 px-3">
              Enable
            </button>
          )}
        </div>
      </SettingRow>

      {/* ===== KEYBOARD SHORTCUTS ===== */}
      <SectionTitle icon={Keyboard} title="Keyboard Shortcuts" />
      <SettingRow>
        <div className="space-y-2">
          {KEYBOARD_SHORTCUTS.map(s => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <span className="text-sm text-surface-600 dark:text-surface-400">{s.action}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-surface-100 dark:bg-surface-700 text-xs font-mono font-bold text-surface-700 dark:text-surface-300 border border-surface-200 dark:border-surface-600">
                {s.key.toUpperCase()}
              </kbd>
            </div>
          ))}
        </div>
      </SettingRow>

      {/* ===== HARD DRIVE AUTO-SAVE ===== */}
      <SectionTitle icon={HardDrive} title="Hard Drive Auto-Save" />
      <SettingRow>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm dark:text-white">Auto-Save to Disk File</p>
              <p className="text-xs text-surface-500">
                {diskSaveActive
                  ? '✅ Active — Every change auto-saves to your chosen file'
                  : 'Pick a file on your computer. All changes will auto-save there.'}
              </p>
            </div>
            <button
              onClick={async () => {
                const ok = await enableDiskAutoSave();
                setDiskSaveActive(ok);
                if (ok) {
                  setDiskMsg('💾 Auto-Save enabled! Data will write to your disk file.');
                  setTimeout(() => setDiskMsg(null), 4000);
                }
              }}
              className={`btn ${diskSaveActive ? 'btn-success' : 'btn-primary'} text-xs py-2 px-3 flex items-center gap-1.5 shrink-0`}
            >
              <HardDrive size={14} />
              {diskSaveActive ? 'Change File' : 'Enable Auto-Save'}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700">
            <div>
              <p className="font-medium text-sm dark:text-white">Restore from Disk File</p>
              <p className="text-xs text-surface-500">Load data from a previously saved auto-save file</p>
            </div>
            <button
              onClick={async () => {
                const data = await loadFromDiskFile();
                if (data) {
                  importData(JSON.stringify(data));
                  setDiskSaveActive(true);
                  setDiskMsg('📂 Data restored from disk file! Auto-save is now active.');
                  setTimeout(() => setDiskMsg(null), 4000);
                }
              }}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
            >
              <FolderOpen size={14} /> Load from Disk
            </button>
          </div>

          {diskMsg && (
            <div className="p-3 bg-success-500/10 text-success-600 dark:text-success-400 text-xs font-semibold rounded-xl animate-fade-in flex items-center gap-2">
              <Check size={14} /> {diskMsg}
            </div>
          )}
        </div>
      </SettingRow>

      {/* ===== DATA MANAGEMENT ===== */}
      <SectionTitle icon={Shield} title="Data Management" />
      <div className="space-y-2">
        <SettingRow>
          <button onClick={handleExport} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Download size={18} className="text-primary-500" />
              <div className="text-left">
                <p className="font-medium text-sm dark:text-white">Export Data</p>
                <p className="text-xs text-surface-500">Download all data as JSON</p>
              </div>
            </div>
          </button>
        </SettingRow>

        <SettingRow>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Upload size={18} className="text-success-500" />
              <div className="text-left">
                <p className="font-medium text-sm dark:text-white">Import Data</p>
                <p className="text-xs text-surface-500">
                  {importStatus === 'success' ? '✅ Import successful!' : importStatus === 'error' ? '❌ Import failed' : 'Restore from JSON backup'}
                </p>
              </div>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </SettingRow>

        {/* ===== SAFETY VAULT & SNAPSHOTS ===== */}
        <SectionTitle icon={ShieldCheck} title="Safety Vault & Data Recovery" />
        <SettingRow>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm dark:text-white">Snapshot Recovery History</p>
                <p className="text-xs text-surface-500">Un-wipeable recovery snapshots saved before resets or edits</p>
              </div>
              <button onClick={handleManualSnapshot} className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5 shrink-0">
                <Save size={14} /> Create Snapshot
              </button>
            </div>

            {snapshotMsg && (
              <div className="p-3 bg-success-500/10 text-success-600 dark:text-success-400 text-xs font-semibold rounded-xl animate-fade-in flex items-center gap-2">
                <Check size={14} /> {snapshotMsg}
              </div>
            )}

            {snapshots.length === 0 ? (
              <p className="text-xs text-surface-400 italic py-2">No historical snapshots found yet. Snapshots are auto-created before resets.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {snapshots.map((snap) => (
                  <div key={snap.id} className="p-3 rounded-xl border border-surface-200 dark:border-surface-700/60 bg-surface-50/50 dark:bg-surface-900/30 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-surface-900 dark:text-white truncate">{snap.label}</p>
                      <p className="text-[10px] text-surface-400 flex items-center gap-2 mt-0.5">
                        <span><Clock size={10} className="inline mr-0.5" />{new Date(snap.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>{snap.expenseCount} expenses, {snap.earningCount} earnings</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRestoreFromSnapshot(snap)}
                        className="px-2.5 py-1.5 rounded-lg bg-primary-500 text-white font-bold hover:bg-primary-600 transition-all flex items-center gap-1"
                        title="Restore this snapshot into app workspace"
                      >
                        <RotateCcw size={12} /> Restore
                      </button>
                      <button
                        onClick={() => exportData(snap.state)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-white hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
                        title="Download snapshot JSON"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1.5 rounded-lg text-danger-400 hover:text-danger-600 hover:bg-danger-500/10 transition-all"
                        title="Delete snapshot"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SettingRow>

        {/* ===== RESET DATA ===== */}
        <SettingRow className="border-danger-200 dark:border-danger-900/30">
          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-3 w-full">
              <Trash2 size={18} className="text-danger-500" />
              <div className="text-left">
                <p className="font-medium text-sm text-danger-500">Reset Active Workspace</p>
                <p className="text-xs text-surface-500">Auto-saves a Pre-Reset snapshot to Safety Vault before clearing active view</p>
              </div>
            </button>
          ) : (
            <div>
              <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-xl mb-4">
                <p className="text-xs text-danger-600 dark:text-danger-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle size={16} /> Resetting Active Workspace
                </p>
                <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1">
                  Don't worry: an automatic <strong>Pre-Reset Safety Snapshot</strong> will be saved to your Safety Vault before clearing. You can restore it anytime!
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="btn btn-ghost flex-1 text-sm">Cancel</button>
                <button onClick={handleReset} className="btn btn-danger flex-1 text-sm">
                  <Trash2 size={14} /> Yes, Reset Workspace
                </button>
              </div>
            </div>
          )}
        </SettingRow>
      </div>

      {/* App Version */}
      <p className="text-center text-xs text-surface-400 mt-8 mb-4">
        Paisa Pro v1.0.0 • Made with 💜
      </p>

      {/* ===== RECURRING MODAL ===== */}
      <Modal isOpen={showRecurringModal} onClose={() => setShowRecurringModal(false)} title="Add Recurring Transaction">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Description</label>
            <input className="input" placeholder="e.g. Rent, Netflix"
              value={recurringForm.description} onChange={e => setRecurringForm({ ...recurringForm, description: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 font-semibold">{currency}</span>
              <input type="number" className="input pl-8" placeholder="0"
                value={recurringForm.amount} onChange={e => setRecurringForm({ ...recurringForm, amount: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Type</label>
              <select className="input" value={recurringForm.type}
                onChange={e => setRecurringForm({ ...recurringForm, type: e.target.value, category: '' })}>
                <option value="expense">Expense</option>
                <option value="earning">Earning</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Frequency</label>
              <select className="input" value={recurringForm.frequency}
                onChange={e => setRecurringForm({ ...recurringForm, frequency: e.target.value })}>
                {FREQUENCY_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Category</label>
            <select className="input" value={recurringForm.category}
              onChange={e => setRecurringForm({ ...recurringForm, category: e.target.value })}>
              <option value="">Select category</option>
              {currentCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Start Date</label>
            <input type="date" className="input"
              value={recurringForm.nextDate} onChange={e => setRecurringForm({ ...recurringForm, nextDate: e.target.value })} />
          </div>
          <button onClick={handleAddRecurring} className="btn btn-primary w-full"
            disabled={!recurringForm.description || !recurringForm.amount}>
            Add Recurring
          </button>
        </div>
      </Modal>
    </div>
  );
}
