import { NavLink } from 'react-router-dom';
import { Home, Clock, MapPin, Settings, BarChart3, Tag, Sparkles, HandCoins, X } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function Sidebar({ isOpen, onClose }) {
  const { state } = useData();

  const NAV_ITEMS = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/history', icon: Clock, label: 'History' },
    { path: '/debts', icon: HandCoins, label: 'Udhar & Jama' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/trips', icon: MapPin, label: 'Trips' },
    { path: '/categories', icon: Tag, label: 'Categories' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Click-Away Backdrop (Only on Mobile when Sidebar is open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-surface-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[17.5rem] bg-surface-900 h-screen shrink-0 transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 md:flex ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo */}
        <div className="flex items-center justify-between px-6 py-7 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Sparkles className="text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">Paisa Pro</span>
              <p className="text-[10px] font-semibold text-primary-300 tracking-[0.16em] uppercase">Personal finance</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-xl hover:bg-white/10 text-surface-400"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 pb-2 text-[10px] font-bold tracking-[0.16em] uppercase text-surface-500">Menu</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-950/30'
                      : 'text-surface-400 hover:text-white hover:bg-white/[0.07]'
                  }`
                }
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Quick Stats / Footer */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-200 font-bold text-sm shrink-0">
              P
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Personal wallet</p>
              <p className="text-[10px] text-surface-500 truncate">Your data, your control</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
