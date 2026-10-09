import { useData } from '../context/DataContext';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast, isFuture, isWithinInterval } from 'date-fns';
import { MapPin, Plus, Calendar, Wallet, ChevronRight } from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function Trips() {
  const { state, addTrip, deleteTrip, getCurrencySymbol } = useData();
  const currency = getCurrencySymbol();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', budget: '' });

  const getTripSpend = (tripId) =>
    state.expenses.filter(e => e.tripId === tripId).reduce((s, e) => s + Number(e.amount), 0);

  const getTripStatus = (trip) => {
    const now = new Date();
    const start = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);
    if (isFuture(start)) return { label: 'Upcoming', color: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' };
    if (isPast(end)) return { label: 'Completed', color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-400' };
    return { label: 'Active', color: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400' };
  };

  const sortedTrips = useMemo(() => {
    return [...state.trips].sort((a, b) => {
      const statusOrder = { 'Active': 0, 'Upcoming': 1, 'Completed': 2 };
      const sa = getTripStatus(a).label;
      const sb = getTripStatus(b).label;
      if (statusOrder[sa] !== statusOrder[sb]) return statusOrder[sa] - statusOrder[sb];
      return new Date(b.startDate) - new Date(a.startDate);
    });
  }, [state.trips]);

  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate || !form.budget) return;
    addTrip({
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: Number(form.budget),
    });
    setForm({ name: '', startDate: '', endDate: '', budget: '' });
    setShowModal(false);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Trips</h1>
        <button onClick={() => setShowModal(true)}
          className="btn btn-primary text-sm py-2 px-4">
          <Plus size={18} /> New Trip
        </button>
      </div>

      {/* Trip Cards */}
      {sortedTrips.length === 0 ? (
        <EmptyState
          icon="✈️"
          title="No trips yet"
          description="Create a trip to track travel expenses separately"
          actionLabel="Create Trip"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="space-y-4">
          {sortedTrips.map((trip, i) => {
            const spent = getTripSpend(trip.id);
            const status = getTripStatus(trip);
            const budget = Number(trip.budget);
            return (
              <div
                key={trip.id}
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="card p-5 cursor-pointer hover:shadow-lg transition-all animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <MapPin size={20} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-base dark:text-white">{trip.name}</h3>
                      <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} />
                        {format(parseISO(trip.startDate), 'MMM d')} - {format(parseISO(trip.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronRight size={16} className="text-surface-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-3">
                    <p className="text-xs text-surface-500">Budget</p>
                    <p className="font-bold text-sm tabular-nums dark:text-white">{currency}{budget.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-3">
                    <p className="text-xs text-surface-500">Spent</p>
                    <p className={`font-bold text-sm tabular-nums ${spent > budget ? 'text-danger-500' : 'text-success-500'}`}>
                      {currency}{spent.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <ProgressBar value={spent} max={budget} size="sm" colorScheme="auto" showPercentage />
              </div>
            );
          })}
        </div>
      )}

      {/* Add Trip Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Trip">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Trip Name</label>
            <input className="input" placeholder="e.g. Goa Trip"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Start Date</label>
              <input type="date" className="input"
                value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">End Date</label>
              <input type="date" className="input"
                value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Budget</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 font-semibold">{currency}</span>
              <input type="number" className="input pl-10" placeholder="10000"
                value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <button onClick={handleSave} className="btn btn-primary w-full mt-2"
            disabled={!form.name || !form.startDate || !form.endDate || !form.budget}>
            Create Trip
          </button>
        </div>
      </Modal>
    </div>
  );
}
