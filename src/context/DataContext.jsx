import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_EARNING_CATEGORIES,
  DEFAULT_PAYMENT_MODES,
} from '../utils/constants';
import { loadState, saveState, exportData as storageExportData, importData as storageImportData, resetData as storageResetData, loadFromIndexedDB, enableDiskAutoSave, isDiskAutoSaveActive, loadFromDiskFile, createSafetySnapshot, getSafetySnapshots, deleteSnapshot as storageDeleteSnapshot } from '../utils/storage';
import { getNextOccurrence } from '../utils/recurring';
import { sendNotification } from '../utils/notifications';

// ─── Sound Utilities ─────────────────────────────────────────────────────────
export const playAlarmSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.0);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playBeepSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio error", e);
  }
};

// ─── Initial State ────────────────────────────────────────────────────────────

const defaultState = {
  expenses: [],
  earnings: [],
  trips: [],
  debts: [],
  categories: {
    expense: DEFAULT_EXPENSE_CATEGORIES,
    earning: DEFAULT_EARNING_CATEGORIES,
  },
  paymentModes: DEFAULT_PAYMENT_MODES,
  settings: {
    currency: '₹',
    dailyLimit: 0,
    monthlyLimit: 0,
    recurringTransactions: [],
  },
  punishments: [],
  syncCode: '',
  isTimerActive: false,
};

// ─── Action Types ─────────────────────────────────────────────────────────────

const ActionTypes = {
  ADD_EXPENSE: 'ADD_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',
  ADD_EARNING: 'ADD_EARNING',
  UPDATE_EARNING: 'UPDATE_EARNING',
  DELETE_EARNING: 'DELETE_EARNING',
  ADD_TRIP: 'ADD_TRIP',
  UPDATE_TRIP: 'UPDATE_TRIP',
  DELETE_TRIP: 'DELETE_TRIP',
  ADD_DEBT: 'ADD_DEBT',
  UPDATE_DEBT: 'UPDATE_DEBT',
  DELETE_DEBT: 'DELETE_DEBT',
  ADD_CATEGORY: 'ADD_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',
  ADD_PAYMENT_MODE: 'ADD_PAYMENT_MODE',
  DELETE_PAYMENT_MODE: 'DELETE_PAYMENT_MODE',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  ADD_RECURRING: 'ADD_RECURRING',
  UPDATE_RECURRING: 'UPDATE_RECURRING',
  DELETE_RECURRING: 'DELETE_RECURRING',
  IMPORT_DATA: 'IMPORT_DATA',
  RESET_DATA: 'RESET_DATA',
  ADD_PUNISHMENT: 'ADD_PUNISHMENT',
  UPDATE_PUNISHMENT: 'UPDATE_PUNISHMENT',
  DELETE_PUNISHMENT: 'DELETE_PUNISHMENT',
  SET_PUNISHMENTS: 'SET_PUNISHMENTS',
  SET_SYNC_CODE: 'SET_SYNC_CODE',
  SYNC_FULL_STATE: 'SYNC_FULL_STATE',
  SET_TIMER_ACTIVE: 'SET_TIMER_ACTIVE',
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function dataReducer(state, action) {
  switch (action.type) {
    // ── Expenses ───────────────────────────────────────────────────────
    case ActionTypes.ADD_EXPENSE:
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
      };

    case ActionTypes.UPDATE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.map((exp) =>
          exp.id === action.payload.id ? { ...exp, ...action.payload.data } : exp
        ),
      };

    case ActionTypes.DELETE_EXPENSE:
      return {
        ...state,
        expenses: state.expenses.filter((exp) => exp.id !== action.payload),
      };

    // ── Earnings ──────────────────────────────────────────────────────
    case ActionTypes.ADD_EARNING:
      return {
        ...state,
        earnings: [...state.earnings, action.payload],
      };

    case ActionTypes.UPDATE_EARNING:
      return {
        ...state,
        earnings: state.earnings.map((earn) =>
          earn.id === action.payload.id ? { ...earn, ...action.payload.data } : earn
        ),
      };

    case ActionTypes.DELETE_EARNING:
      return {
        ...state,
        earnings: state.earnings.filter((earn) => earn.id !== action.payload),
      };

    // ── Trips ─────────────────────────────────────────────────────────
    case ActionTypes.ADD_TRIP:
      return {
        ...state,
        trips: [...state.trips, action.payload],
      };

    case ActionTypes.UPDATE_TRIP:
      return {
        ...state,
        trips: state.trips.map((trip) =>
          trip.id === action.payload.id ? { ...trip, ...action.payload.data } : trip
        ),
      };

    case ActionTypes.DELETE_TRIP:
      return {
        ...state,
        trips: state.trips.filter((trip) => trip.id !== action.payload),
      };

    // ── Debts / Udhar-Jama ─────────────────────────────────────────────
    case ActionTypes.ADD_DEBT:
      return {
        ...state,
        debts: [...(state.debts || []), action.payload],
      };

    case ActionTypes.UPDATE_DEBT:
      return {
        ...state,
        debts: (state.debts || []).map((debt) =>
          debt.id === action.payload.id ? { ...debt, ...action.payload.data } : debt
        ),
      };

    case ActionTypes.DELETE_DEBT:
      return {
        ...state,
        debts: (state.debts || []).filter((debt) => debt.id !== action.payload),
      };

    // ── Categories ────────────────────────────────────────────────────
    case ActionTypes.ADD_CATEGORY:
      return {
        ...state,
        categories: {
          ...state.categories,
          [action.payload.categoryType]: [
            ...state.categories[action.payload.categoryType],
            action.payload.category,
          ],
        },
      };

    case ActionTypes.DELETE_CATEGORY:
      return {
        ...state,
        categories: {
          ...state.categories,
          [action.payload.categoryType]: state.categories[
            action.payload.categoryType
          ].filter((cat) => cat.id !== action.payload.id),
        },
      };

    // ── Payment Modes ─────────────────────────────────────────────────
    case ActionTypes.ADD_PAYMENT_MODE:
      return {
        ...state,
        paymentModes: [...state.paymentModes, action.payload],
      };

    case ActionTypes.DELETE_PAYMENT_MODE:
      return {
        ...state,
        paymentModes: state.paymentModes.filter((pm) => pm.id !== action.payload),
      };

    // ── Settings ──────────────────────────────────────────────────────
    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    // ── Recurring Transactions ────────────────────────────────────────
    case ActionTypes.ADD_RECURRING:
      return {
        ...state,
        settings: {
          ...state.settings,
          recurringTransactions: [
            ...state.settings.recurringTransactions,
            action.payload,
          ],
        },
      };

    case ActionTypes.UPDATE_RECURRING:
      return {
        ...state,
        settings: {
          ...state.settings,
          recurringTransactions: state.settings.recurringTransactions.map((rt) =>
            rt.id === action.payload.id ? { ...rt, ...action.payload.data } : rt
          ),
        },
      };

    case ActionTypes.DELETE_RECURRING:
      return {
        ...state,
        settings: {
          ...state.settings,
          recurringTransactions: state.settings.recurringTransactions.filter(
            (rt) => rt.id !== action.payload
          ),
        },
      };

    case ActionTypes.ADD_PUNISHMENT:
      return {
        ...state,
        punishments: [...(state.punishments || []), action.payload],
      };

    case ActionTypes.UPDATE_PUNISHMENT:
      return {
        ...state,
        punishments: (state.punishments || []).map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        ),
      };

    case ActionTypes.DELETE_PUNISHMENT:
      return {
        ...state,
        punishments: (state.punishments || []).filter((p) => p.id !== action.payload),
      };

    case ActionTypes.SET_PUNISHMENTS:
      return {
        ...state,
        punishments: action.payload,
      };

    case ActionTypes.SET_SYNC_CODE:
      return {
        ...state,
        syncCode: action.payload,
      };

    case ActionTypes.SET_TIMER_ACTIVE:
      return {
        ...state,
        isTimerActive: action.payload,
      };

    case ActionTypes.SYNC_FULL_STATE:
      return {
        ...state,
        ...action.payload,
      };

    // ── Import / Reset ────────────────────────────────────────────────
    case ActionTypes.IMPORT_DATA:
      return { ...action.payload };

    case ActionTypes.RESET_DATA:
      return { ...defaultState };

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext();

// ─── Provider ─────────────────────────────────────────────────────────────────

const RECOVERED_AUGUST_EXPENSES = [
  {
    id: "7d2ff938-50d9-45ee-839d-6eb94e7dc585",
    description: "Chai",
    amount: 60,
    date: "2026-08-17",
    category: "cat-food",
    paymentMode: "pm-cash",
    createdAt: "2026-08-17T15:28:30.925Z"
  },
  {
    id: "493fb397-a256-4c2c-8b80-4e6a249cffb8",
    description: "Zerox",
    amount: 10,
    date: "2026-08-17",
    category: "cat-education",
    paymentMode: "pm-cash",
    createdAt: "2026-08-17T15:28:47.285Z"
  },
  {
    id: "2b311281-3e2c-44f3-b7ad-ef56fb864d99",
    description: "Chai",
    amount: 20,
    date: "2026-08-18",
    category: "cat-food",
    paymentMode: "pm-cash",
    createdAt: "2026-08-18T15:56:22.674Z"
  }
];

const loadAndMigrateState = () => {
  const loaded = loadState() || defaultState;

  let migrated = false;

  // Auto-restore recovered August expenses if expenses array is currently empty
  let expensesList = loaded.expenses || [];
  if (expensesList.length === 0) {
    expensesList = [...RECOVERED_AUGUST_EXPENSES];
    migrated = true;
  }

  const expenseCategories = loaded.categories?.expense || [];
  const earningCategories = loaded.categories?.earning || [];

  const updatedExpenses = [...expenseCategories];
  DEFAULT_EXPENSE_CATEGORIES.forEach(defCat => {
    if (!updatedExpenses.some(c => c.id === defCat.id)) {
      updatedExpenses.push(defCat);
      migrated = true;
    }
  });

  const updatedEarnings = [...earningCategories];
  DEFAULT_EARNING_CATEGORIES.forEach(defCat => {
    if (!updatedEarnings.some(c => c.id === defCat.id)) {
      updatedEarnings.push(defCat);
      migrated = true;
    }
  });

  if (!loaded.punishments) {
    loaded.punishments = [];
    migrated = true;
  }

  if (!loaded.debts) {
    loaded.debts = [];
    migrated = true;
  }

  if (loaded.syncCode === undefined) {
    loaded.syncCode = '';
    migrated = true;
  }

  if (loaded.isTimerActive === undefined) {
    loaded.isTimerActive = false;
    migrated = true;
  }

  return {
    ...loaded,
    expenses: expensesList,
    debts: loaded.debts || [],
    categories: {
      expense: updatedExpenses,
      earning: updatedEarnings,
    },
    punishments: loaded.punishments || [],
    syncCode: loaded.syncCode || '',
    isTimerActive: loaded.isTimerActive || false,
  };
};

export function DataProvider({ children }) {
  // Load persisted state or fall back to defaults
  const initialState = loadAndMigrateState();

  const [state, dispatch] = useReducer(dataReducer, initialState);
  const [recoveredFromBackup, setRecoveredFromBackup] = useState(false);

  // On mount: If localStorage is empty, try recovering from IndexedDB backup
  useEffect(() => {
    const localData = loadState();
    const isEmptyState = !localData || (
      (!localData.expenses || localData.expenses.length === 0) &&
      (!localData.earnings || localData.earnings.length === 0)
    );

    if (isEmptyState) {
      loadFromIndexedDB().then((backupState) => {
        if (backupState && (
          (backupState.expenses && backupState.expenses.length > 0) ||
          (backupState.earnings && backupState.earnings.length > 0)
        )) {
          console.log('🔄 Recovering data from IndexedDB backup...');
          dispatch({ type: ActionTypes.IMPORT_DATA, payload: backupState });
          setRecoveredFromBackup(true);
          setTimeout(() => setRecoveredFromBackup(false), 8000);
        }
      });
    }
  }, []);

  // Auto-save to localStorage + IndexedDB on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // ── Helper Functions ──────────────────────────────────────────────

  const addExpense = useCallback(
    (expense) => {
      const newExpense = {
        ...expense,
        id: expense.id || uuidv4(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_EXPENSE, payload: newExpense });
    },
    [dispatch]
  );

  const updateExpense = useCallback(
    (id, data) => {
      dispatch({ type: ActionTypes.UPDATE_EXPENSE, payload: { id, data } });
    },
    [dispatch]
  );

  const deleteExpense = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_EXPENSE, payload: id });
    },
    [dispatch]
  );

  const addEarning = useCallback(
    (earning) => {
      const newEarning = {
        ...earning,
        id: earning.id || uuidv4(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_EARNING, payload: newEarning });
    },
    [dispatch]
  );

  const updateEarning = useCallback(
    (id, data) => {
      dispatch({ type: ActionTypes.UPDATE_EARNING, payload: { id, data } });
    },
    [dispatch]
  );

  const deleteEarning = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_EARNING, payload: id });
    },
    [dispatch]
  );

  const addTrip = useCallback(
    (trip) => {
      const newTrip = {
        ...trip,
        id: trip.id || uuidv4(),
        expenses: trip.expenses || [],
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_TRIP, payload: newTrip });
    },
    [dispatch]
  );

  const updateTrip = useCallback(
    (id, data) => {
      dispatch({ type: ActionTypes.UPDATE_TRIP, payload: { id, data } });
    },
    [dispatch]
  );

  const deleteTrip = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_TRIP, payload: id });
    },
    [dispatch]
  );

  // ── Debts / Udhar-Jama ─────────────────────────────────────────────
  const addDebt = useCallback(
    (debt, syncWithBalance = true) => {
      const newDebt = {
        ...debt,
        id: debt.id || uuidv4(),
        status: debt.status || 'pending',
        settledAmount: Number(debt.settledAmount || 0),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_DEBT, payload: newDebt });

      if (syncWithBalance) {
        if (newDebt.type === 'given') {
          addExpense({
            description: `Udhar given to ${newDebt.personName}`,
            amount: Number(newDebt.amount),
            date: newDebt.date || format(new Date(), 'yyyy-MM-dd'),
            category: 'cat-udhar',
            paymentMode: newDebt.paymentMode || 'pm-cash',
            notes: newDebt.notes || 'Udhar / Money Given',
          });
        } else if (newDebt.type === 'taken') {
          addEarning({
            description: `Jama taken from ${newDebt.personName}`,
            amount: Number(newDebt.amount),
            date: newDebt.date || format(new Date(), 'yyyy-MM-dd'),
            category: 'earn-other',
            paymentMode: newDebt.paymentMode || 'pm-cash',
            notes: newDebt.notes || 'Jama / Money Borrowed',
          });
        }
      }
    },
    [dispatch, addExpense, addEarning]
  );

  const updateDebt = useCallback(
    (id, data) => {
      dispatch({ type: ActionTypes.UPDATE_DEBT, payload: { id, data } });
    },
    [dispatch]
  );

  const deleteDebt = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_DEBT, payload: id });
    },
    [dispatch]
  );

  const settleDebt = useCallback(
    (id, customSettleAmount, syncWithBalance = true) => {
      const targetDebt = (state.debts || []).find((d) => d.id === id);
      if (!targetDebt) return;

      const remaining = Number(targetDebt.amount) - Number(targetDebt.settledAmount || 0);
      const amountToSettle = customSettleAmount !== undefined ? Number(customSettleAmount) : remaining;
      const newSettledTotal = Number(targetDebt.settledAmount || 0) + amountToSettle;
      const isFullySettled = newSettledTotal >= Number(targetDebt.amount);

      dispatch({
        type: ActionTypes.UPDATE_DEBT,
        payload: {
          id,
          data: {
            settledAmount: newSettledTotal,
            status: isFullySettled ? 'settled' : 'pending',
            settledAt: isFullySettled ? new Date().toISOString() : targetDebt.settledAt,
          },
        },
      });

      if (syncWithBalance && amountToSettle > 0) {
        if (targetDebt.type === 'given') {
          addEarning({
            description: `Udhar returned by ${targetDebt.personName}`,
            amount: amountToSettle,
            date: format(new Date(), 'yyyy-MM-dd'),
            category: 'earn-udhar-return',
            paymentMode: 'pm-cash',
            notes: `Settled Udhar debt (${isFullySettled ? 'Full' : 'Partial'})`,
          });
        } else if (targetDebt.type === 'taken') {
          addExpense({
            description: `Repaid Jama to ${targetDebt.personName}`,
            amount: amountToSettle,
            date: format(new Date(), 'yyyy-MM-dd'),
            category: 'cat-udhar',
            paymentMode: 'pm-cash',
            notes: `Repaid Jama debt (${isFullySettled ? 'Full' : 'Partial'})`,
          });
        }
      }
    },
    [state.debts, dispatch, addEarning, addExpense]
  );

  const addCategory = useCallback(
    (type, category) => {
      const newCategory = {
        ...category,
        id: category.id || uuidv4(),
      };
      dispatch({
        type: ActionTypes.ADD_CATEGORY,
        payload: { categoryType: type, category: newCategory },
      });
    },
    [dispatch]
  );

  const deleteCategory = useCallback(
    (type, id) => {
      dispatch({
        type: ActionTypes.DELETE_CATEGORY,
        payload: { categoryType: type, id },
      });
    },
    [dispatch]
  );

  const addPaymentMode = useCallback(
    (mode) => {
      const newMode = {
        ...mode,
        id: mode.id || uuidv4(),
      };
      dispatch({ type: ActionTypes.ADD_PAYMENT_MODE, payload: newMode });
    },
    [dispatch]
  );

  const deletePaymentMode = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_PAYMENT_MODE, payload: id });
    },
    [dispatch]
  );

  const updateSettings = useCallback(
    (settings) => {
      dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings });
    },
    [dispatch]
  );

  const addRecurringTransaction = useCallback(
    (transaction) => {
      const nextDate =
        transaction.nextDate ||
        format(
          getNextOccurrence(transaction.frequency, transaction.startDate || new Date()),
          'yyyy-MM-dd'
        );
      const newTransaction = {
        ...transaction,
        id: transaction.id || uuidv4(),
        nextDate,
        active: transaction.active !== undefined ? transaction.active : true,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_RECURRING, payload: newTransaction });
    },
    [dispatch]
  );

  const updateRecurringTransaction = useCallback(
    (id, data) => {
      dispatch({ type: ActionTypes.UPDATE_RECURRING, payload: { id, data } });
    },
    [dispatch]
  );

  const deleteRecurringTransaction = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_RECURRING, payload: id });
    },
    [dispatch]
  );

  const handleExportData = useCallback(() => {
    storageExportData(state);
  }, [state]);

  const handleImportData = useCallback(
    (jsonString) => {
      const result = storageImportData(jsonString);
      if (result.success) {
        dispatch({ type: ActionTypes.IMPORT_DATA, payload: result.data });
      }
      return result;
    },
    [dispatch]
  );

  const handleResetData = useCallback(async () => {
    await storageResetData(state);
    dispatch({ type: ActionTypes.RESET_DATA });
  }, [state, dispatch]);

  const handleCreateSnapshot = useCallback(
    async (label) => {
      return await createSafetySnapshot(state, label);
    },
    [state]
  );

  const handleRestoreSnapshot = useCallback(
    (snapshotState) => {
      dispatch({ type: ActionTypes.IMPORT_DATA, payload: snapshotState });
    },
    [dispatch]
  );

  const getCurrencySymbol = useCallback(() => {
    return state.settings.currency;
  }, [state.settings.currency]);

  const handleEnableDiskAutoSave = useCallback(async () => {
    return await enableDiskAutoSave(state);
  }, [state]);

  // ── Punishments Actions ──────────────────────────────────────────
  const addPunishment = useCallback(
    (punishment) => {
      const newPunishment = {
        ...punishment,
        id: punishment.id || uuidv4(),
        multiplier: punishment.multiplier || 1,
        status: punishment.status || 'active',
        createdAt: punishment.createdAt || new Date().toISOString(),
        lastDoubledAt: punishment.lastDoubledAt || new Date().toISOString(),
      };
      dispatch({ type: ActionTypes.ADD_PUNISHMENT, payload: newPunishment });
    },
    [dispatch]
  );

  const updatePunishment = useCallback(
    (id, data) => {
      dispatch({ type: ActionTypes.UPDATE_PUNISHMENT, payload: { id, data } });
    },
    [dispatch]
  );

  const deletePunishment = useCallback(
    (id) => {
      dispatch({ type: ActionTypes.DELETE_PUNISHMENT, payload: id });
    },
    [dispatch]
  );

  const setSyncCode = useCallback(
    (code) => {
      dispatch({ type: ActionTypes.SET_SYNC_CODE, payload: code });
    },
    [dispatch]
  );

  const setTimerActive = useCallback(
    (active) => {
      dispatch({ type: ActionTypes.SET_TIMER_ACTIVE, payload: active });
    },
    [dispatch]
  );

  const syncFullState = useCallback(
    (fullState) => {
      dispatch({ type: ActionTypes.SYNC_FULL_STATE, payload: fullState });
    },
    [dispatch]
  );

  // ── Cloud Sync Background Worker ──────────────────────────────────
  const lastSyncedStateRef = useRef(null);

  const pullFromCloud = useCallback(async (code) => {
    if (!code) return;
    try {
      const response = await fetch(`https://kvdb.io/paisa_pro_6B5hR7M8mN4/${code}`);
      if (response.ok) {
        const cloudData = await response.json();
        if (cloudData && JSON.stringify(cloudData) !== JSON.stringify(state)) {
          lastSyncedStateRef.current = cloudData;
          dispatch({ type: ActionTypes.SYNC_FULL_STATE, payload: cloudData });
        }
      }
    } catch (e) {
      console.error("Failed to pull from cloud:", e);
    }
  }, [state, dispatch]);

  // Pull on load
  useEffect(() => {
    if (state.syncCode) {
      pullFromCloud(state.syncCode);
    }
  }, [state.syncCode]);

  // Debounced auto-push
  useEffect(() => {
    if (!state.syncCode) return;

    if (lastSyncedStateRef.current && JSON.stringify(state) === JSON.stringify(lastSyncedStateRef.current)) {
      return;
    }

    const delay = state.isTimerActive ? 15000 : 2500;
    const handler = setTimeout(async () => {
      try {
        const stateStr = JSON.stringify(state);
        const response = await fetch(`https://kvdb.io/paisa_pro_6B5hR7M8mN4/${state.syncCode}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: stateStr,
        });
        if (response.ok) {
          lastSyncedStateRef.current = state;
          console.log("State synced to cloud successfully.");
        }
      } catch (e) {
        console.error("Failed to sync state to cloud:", e);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [state, state.syncCode, state.isTimerActive]);

  // ── Punishment Doubling Background Worker ────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const updatedPunishments = (state.punishments || []).map(p => {
        if ((p.status === 'active' || p.status === 'snoozed') && p.lastDoubledAt) {
          const lastDoubled = new Date(p.lastDoubledAt).getTime();
          // Check 24 hours (86400000ms)
          if (now - lastDoubled >= 24 * 60 * 60 * 1000) {
            changed = true;
            const nextMultiplier = (p.multiplier || 1) * 2;
            playAlarmSound();
            sendNotification(
              "💀 Penalty Doubled!",
              `Penalty "${p.description}" has doubled to ${nextMultiplier}x!`
            );
            return {
              ...p,
              multiplier: nextMultiplier,
              lastDoubledAt: new Date(now).toISOString(),
            };
          }
        }
        return p;
      });

      if (changed) {
        dispatch({ type: ActionTypes.SET_PUNISHMENTS, payload: updatedPunishments });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [state.punishments]);

  // ── Context Value ─────────────────────────────────────────────────

  const value = {
    state,
    dispatch,
    // Expenses
    addExpense,
    updateExpense,
    deleteExpense,
    // Earnings
    addEarning,
    updateEarning,
    deleteEarning,
    // Trips
    addTrip,
    updateTrip,
    deleteTrip,
    // Debts / Udhar-Jama
    addDebt,
    updateDebt,
    deleteDebt,
    settleDebt,
    // Categories
    addCategory,
    deleteCategory,
    // Payment Modes
    addPaymentMode,
    deletePaymentMode,
    // Settings
    updateSettings,
    // Recurring
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    // Data Management
    exportData: handleExportData,
    importData: handleImportData,
    resetData: handleResetData,
    // Helpers
    getCurrencySymbol,
    // Punishments
    addPunishment,
    updatePunishment,
    deletePunishment,
    // Sync
    setSyncCode,
    pullFromCloud,
    syncFullState,
    setTimerActive,
    // Recovery & Snapshots
    recoveredFromBackup,
    createSnapshot: handleCreateSnapshot,
    getSnapshots: getSafetySnapshots,
    restoreSnapshot: handleRestoreSnapshot,
    deleteSnapshot: storageDeleteSnapshot,
    // File System Auto-Save (Direct to Hard Drive)
    enableDiskAutoSave: handleEnableDiskAutoSave,
    isDiskAutoSaveActive,
    loadFromDiskFile,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// ─── Custom Hook ──────────────────────────────────────────────────────────────

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
