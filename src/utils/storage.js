import { STORAGE_KEY } from './constants';

// ─── IndexedDB Backup Layer & Safety Snapshots Vault ─────────────────────────
// IndexedDB is more persistent than localStorage — it survives cache/cookie
// clears in most browsers, providing a reliable fallback.

const DB_NAME = 'PaisaProBackupDB';
const DB_VERSION = 2; // Incremented for snapshots object store
const STORE_NAME = 'backups';
const SNAPSHOTS_STORE = 'snapshots';
const BACKUP_KEY = 'latest-state';
const SNAPSHOTS_LOCAL_KEY = 'paisa-pro-safety-snapshots';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const saveToIndexedDB = async (state) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      state,
      savedAt: new Date().toISOString(),
    }, BACKUP_KEY);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB backup failed (non-critical):', err);
  }
};

export const loadFromIndexedDB = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(BACKUP_KEY);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.state) {
          console.log(`✅ IndexedDB backup found (saved: ${result.savedAt})`);
          resolve(result.state);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return null;
  }
};

export const clearIndexedDBBackup = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(BACKUP_KEY);
  } catch (err) {
    console.warn('IndexedDB clear failed:', err);
  }
};

// ─── Safety Snapshots Vault ──────────────────────────────────────────────────
// Snapshots are NEVER deleted by resetData(). They form an un-wipeable
// recovery history that lets users restore pre-reset or historical states.

export const createSafetySnapshot = async (state, label = 'Auto Snapshot') => {
  if (!state || (!state.expenses && !state.earnings)) return null;

  const snapshot = {
    id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    label,
    timestamp: new Date().toISOString(),
    expenseCount: (state.expenses || []).length,
    earningCount: (state.earnings || []).length,
    state,
  };

  // 1. Save to IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    store.put(snapshot);
  } catch (err) {
    console.warn('Failed to save snapshot to IndexedDB:', err);
  }

  // 2. Save metadata + state to localStorage history list (rolling last 15)
  try {
    const existingRaw = localStorage.getItem(SNAPSHOTS_LOCAL_KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [snapshot, ...existing].slice(0, 15);
    localStorage.setItem(SNAPSHOTS_LOCAL_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to update localStorage snapshots:', err);
  }

  console.log(`🛡️ Safety snapshot created: "${label}" (${snapshot.expenseCount} expenses, ${snapshot.earningCount} earnings)`);
  return snapshot;
};

export const getSafetySnapshots = async () => {
  // Try IndexedDB first
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    const request = store.getAll();
    const snapshots = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (snapshots && snapshots.length > 0) {
      return snapshots.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  } catch (err) {
    console.warn('IndexedDB snapshot fetch failed, trying localStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(SNAPSHOTS_LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
};

export const deleteSnapshot = async (id) => {
  try {
    const db = await openDB();
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite');
    const store = tx.objectStore(SNAPSHOTS_STORE);
    store.delete(id);
  } catch (err) {}

  try {
    const raw = localStorage.getItem(SNAPSHOTS_LOCAL_KEY);
    if (raw) {
      const filtered = JSON.parse(raw).filter(s => s.id !== id);
      localStorage.setItem(SNAPSHOTS_LOCAL_KEY, JSON.stringify(filtered));
    }
  } catch (e) {}
};

// ─── File System Access API (Direct Hard-Drive Auto-Save) ─────────────────────
// Uses showSaveFilePicker() to write directly to a physical file on user's
// hard drive. No server needed. Browser does everything automatically.
// Once enabled, every state change auto-writes to the chosen disk file.

let _diskFileHandle = null;
let _diskSaveTimeout = null;

export const isDiskAutoSaveActive = () => !!_diskFileHandle;

export const enableDiskAutoSave = async (initialState) => {
  try {
    _diskFileHandle = await window.showSaveFilePicker({
      suggestedName: 'paisa-pro-data.json',
      types: [{
        description: 'JSON Data File',
        accept: { 'application/json': ['.json'] },
      }],
    });
    console.log('💾 Disk Auto-Save enabled! File handle acquired.');
    if (initialState) {
      const writable = await _diskFileHandle.createWritable();
      await writable.write(JSON.stringify(initialState, null, 2));
      await writable.close();
      console.log('💾 Initial state written to disk file successfully.');
    }
    return true;
  } catch (err) {
    console.warn('Disk Auto-Save cancelled or not supported:', err.message);
    _diskFileHandle = null;
    return false;
  }
};

export const saveToDisk = async (state) => {
  if (!_diskFileHandle) return;
  // Debounce: wait 500ms after last change before writing to disk
  clearTimeout(_diskSaveTimeout);
  _diskSaveTimeout = setTimeout(async () => {
    try {
      const writable = await _diskFileHandle.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
    } catch (err) {
      console.warn('Disk write failed (file may be locked):', err.message);
      _diskFileHandle = null; // Reset handle if write fails
    }
  }, 500);
};

export const loadFromDiskFile = async () => {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{
        description: 'JSON Data File',
        accept: { 'application/json': ['.json'] },
      }],
    });
    _diskFileHandle = handle; // Keep handle for future auto-saves
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    if (data && (data.expenses || data.earnings)) {
      console.log('📂 Loaded data from disk file:', handle.name);
      return data;
    }
  } catch (err) {
    console.warn('Disk file load cancelled or failed:', err.message);
  }
  return null;
};

// ─── localStorage (Primary) ─────────────────────────────────────────────────

export const loadState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return null;
    return JSON.parse(serialized);
  } catch (err) {
    console.error('Failed to load state:', err);
    return null;
  }
};

export const saveState = (state) => {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    // 1. Mirror to IndexedDB (survives cache clears)
    saveToIndexedDB(state);
    // 2. Auto-save to physical disk file (if enabled by user)
    saveToDisk(state);
  } catch (err) {
    console.error('Failed to save state:', err);
  }
};

export const exportData = (state) => {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `paisa-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    // Validate structure
    if (!data.expenses || !data.earnings || !data.categories || !data.settings) {
      throw new Error('Invalid data format');
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const resetData = async (currentState) => {
  // CRITICAL SAFEGUARD: Before resetting active state, take an automatic "Pre-Reset" snapshot
  // so the user can restore their data from the Safety Vault at any time!
  if (currentState && (
    (currentState.expenses && currentState.expenses.length > 0) ||
    (currentState.earnings && currentState.earnings.length > 0)
  )) {
    await createSafetySnapshot(currentState, `Pre-Reset Snapshot (${new Date().toLocaleDateString()})`);
  }

  localStorage.removeItem(STORAGE_KEY);
  clearIndexedDBBackup();
  // Note: Snapshots in SNAPSHOTS_STORE & SNAPSHOTS_LOCAL_KEY are PRESERVED!
};


