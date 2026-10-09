import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import AddEarning from './pages/AddEarning';
import History from './pages/History';
import Search from './pages/Search';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import FocusSession from './pages/FocusSession';
import Discipline from './pages/Discipline';
import Debts from './pages/Debts';

function AppContent() {
  useKeyboardShortcuts();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-row min-h-dvh bg-surface-50 dark:bg-surface-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-grow min-h-dvh min-w-0 overflow-x-hidden pb-16 md:pb-0">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-expense" element={<AddExpense />} />
            <Route path="/add-earning" element={<AddEarning />} />
            <Route path="/history" element={<History />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/search" element={<Search />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/:id" element={<TripDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/focus-session" element={<FocusSession />} />
            <Route path="/discipline" element={<Discipline />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
