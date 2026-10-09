import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Plus, Settings, TrendingDown, TrendingUp, HandCoins, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '__add__', icon: Plus, label: 'Add' },
  { path: '/debts', icon: HandCoins, label: 'Udhar' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') setAddMenuOpen(false);
  }, []);

  useEffect(() => {
    if (addMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [addMenuOpen, handleEscape]);

  const handleNavClick = (path) => {
    if (path === '__add__') {
      setAddMenuOpen((prev) => !prev);
    } else {
      setAddMenuOpen(false);
      navigate(path);
    }
  };

  const handleAddOption = (type) => {
    setAddMenuOpen(false);
    if (type === 'expense') navigate('/add-expense');
    if (type === 'earning') navigate('/add-earning');
    if (type === 'debts') navigate('/debts');
  };

  return (
    <>
      {/* Overlay to close menu */}
      {addMenuOpen && (
        <div
          className="fixed inset-0 z-[39]"
          onClick={() => setAddMenuOpen(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom md:hidden">
        {/* Add Menu Popup */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-4 flex flex-col gap-2 transition-all duration-300 ${
            addMenuOpen
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            onClick={() => handleAddOption('debts')}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-warning-50 dark:bg-warning-500/15 text-warning-600 dark:text-warning-400 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-full bg-warning-500/20 flex items-center justify-center">
              <HandCoins size={16} />
            </div>
            Udhar / Jama Khatabook
          </button>
          <button
            onClick={() => handleAddOption('earning')}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-success-50 dark:bg-success-500/15 text-success-600 dark:text-success-400 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-full bg-success-500/20 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            Add Earning
          </button>
          <button
            onClick={() => handleAddOption('expense')}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-danger-50 dark:bg-danger-500/15 text-danger-600 dark:text-danger-400 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-full bg-danger-500/20 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
            Add Expense
          </button>
        </div>

        {/* Navigation Bar */}
        <div className="glass border-t border-surface-200/70 dark:border-surface-700/50 px-2 pt-2 pb-1.5 shadow-[0_-8px_24px_rgba(20,33,42,0.06)]">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {NAV_ITEMS.map((item) => {
              const isAdd = item.path === '__add__';
              const isActive = !isAdd && location.pathname === item.path;
              const Icon = item.icon;

              if (isAdd) {
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    className="relative -mt-6 group"
                    aria-label="Add transaction"
                  >
                    <div
                      className={`w-14 h-14 rounded-full gradient-primary shadow-lg flex items-center justify-center transition-all duration-300 ${
                        addMenuOpen
                          ? 'rotate-45 shadow-primary-500/40'
                          : 'shadow-primary-500/30 group-hover:shadow-xl group-active:scale-90'
                      }`}
                    >
                      {addMenuOpen ? (
                        <X size={24} className="text-white" strokeWidth={2.5} />
                      ) : (
                        <Plus size={24} className="text-white" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all duration-200 min-w-[56px] ${
                    isActive
                      ? 'text-primary-500'
                      : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300'
                  }`}
                  aria-label={item.label}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className="transition-all duration-200"
                  />
                  <span className={`text-[10px] font-medium transition-all duration-200 ${
                    isActive ? 'text-primary-500' : ''
                  }`}>
                    {item.label}
                  </span>
                  {/* Active indicator dot */}
                  <div
                    className={`w-1 h-1 rounded-full bg-primary-500 transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
