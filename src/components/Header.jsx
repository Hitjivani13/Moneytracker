import { useState } from 'react';
import { useData } from '../context/DataContext';
import { Menu, Cloud, RefreshCw, X, Check, Copy } from 'lucide-react';
import Modal from './Modal';

export default function Header({ onToggleSidebar }) {
  const { state, setSyncCode, pullFromCloud } = useData();
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const fullCode = `PAISA-${code}`;
    setSyncCode(fullCode);
  };

  const handleLinkCode = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    setIsSyncing(true);
    setSyncError('');
    try {
      const code = inputCode.trim().toUpperCase();
      setSyncCode(code);
      await pullFromCloud(code);
      setIsSyncing(false);
      setInputCode('');
    } catch (err) {
      console.error(err);
      setSyncError('Failed to pull initial state from cloud.');
      setIsSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!state.syncCode) return;
    setIsSyncing(true);
    try {
      await pullFromCloud(state.syncCode);
      setIsSyncing(false);
    } catch (e) {
      setIsSyncing(false);
    }
  };

  const copyCode = () => {
    if (!state.syncCode) return;
    navigator.clipboard.writeText(state.syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-30 glass border-b border-surface-200/70 dark:border-surface-700/50 px-4 md:px-8 py-3.5 flex items-center justify-between">
        {/* Mobile Left: Menu Toggle + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-all active:scale-95"
            aria-label="Toggle Sidebar Menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-md shadow-primary-500/20">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-base text-surface-900 dark:text-white tracking-tight">Paisa Pro</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.14em]">Your workspace</span>
            <h2 className="font-bold text-sm text-surface-700 dark:text-surface-300">Default wallet</h2>
          </div>
        </div>

        {/* Right: Cloud Sync Action */}
        <button
          onClick={() => setShowSyncModal(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
            state.syncCode
              ? 'bg-success-500/10 text-success-600 dark:text-success-400 border border-success-500/20'
              : 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20'
          }`}
        >
          <Cloud size={14} className={state.syncCode ? 'animate-pulse-soft' : ''} />
          <span>{state.syncCode ? 'Cloud Active' : 'Cloud Sync'}</span>
        </button>
      </header>

      {/* Cloud Sync Modal */}
      <Modal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="☁️ Automatic Cloud Sync"
      >
        <div className="space-y-5 p-1">
          <p className="text-xs text-surface-500 leading-relaxed">
            Synchronize your data automatically between your PC and mobile device in real-time. Powered by secure, CORS-enabled cloud buckets on kvdb.io.
          </p>

          {state.syncCode ? (
            <div className="card p-4 border border-success-500/20 bg-success-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-success-500">Active Sync Code</span>
                  <p className="font-mono text-lg font-bold tracking-wider text-surface-900 dark:text-white mt-0.5">
                    {state.syncCode}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyCode}
                    className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-600 dark:text-surface-300 transition-all active:scale-95"
                    title="Copy Code"
                  >
                    {copied ? <Check size={16} className="text-success-500" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="p-2 rounded-lg bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-600 dark:text-surface-300 transition-all active:scale-95 disabled:opacity-50"
                    title="Force Sync"
                  >
                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-surface-400 dark:text-surface-500 leading-relaxed">
                ✓ Auto-sync pushes state every 2.5s (when idle) or every 15s (during timers).
                <br />
                ✓ Pulls cloud state automatically on launch. Enter this code on another device to link them.
              </div>
              <button
                onClick={() => setSyncCode('')}
                className="btn btn-outline text-danger-500 hover:bg-danger-500/5 hover:text-danger-500 border-danger-500/20 w-full text-xs py-2 mt-2"
              >
                Disconnect Link
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-800 text-center">
                <span className="text-xs text-surface-500 block mb-2">No active sync link. Set up to sync.</span>
                <button
                  onClick={generateCode}
                  className="btn btn-primary text-xs py-2 shadow-md"
                >
                  Generate Sync Code
                </button>
              </div>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200 dark:border-surface-700" />
                </div>
                <span className="relative px-3 bg-white dark:bg-surface-800 text-[10px] text-surface-400 uppercase font-bold">
                  OR LINK AN EXISTING DEVICE
                </span>
              </div>

              <form onSubmit={handleLinkCode} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-surface-500 mb-1 block">ENTER CODE FROM PC/PHONE</label>
                  <input
                    type="text"
                    placeholder="e.g. PAISA-XXXXXX"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="input font-mono text-sm tracking-widest text-center"
                    required
                  />
                </div>
                {syncError && <p className="text-xs text-danger-500">{syncError}</p>}
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="btn btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Linking Devices...
                    </>
                  ) : (
                    'Link Devices & Pull Data'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
