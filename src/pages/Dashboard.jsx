import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, isToday, startOfDay, endOfDay } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, ArrowRight, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import TransactionCard from '../components/TransactionCard';
import LimitWarning from '../components/LimitWarning';
import EmptyState from '../components/EmptyState';
import { getCategoryBreakdown, getPaymentModeBreakdown, getSmartInsights } from '../utils/insights';

const Dashboard = () => {
  const { state, getCurrencySymbol, recoveredFromBackup } = useData();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const currencySymbol = getCurrencySymbol();

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const currentMonthLabel = format(new Date(), 'MMMM yyyy');

  // Current month boundaries
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Filter current month data
  const monthExpenses = useMemo(
    () =>
      state.expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd;
      }),
    [state.expenses, monthStart, monthEnd]
  );

  const monthEarnings = useMemo(
    () =>
      state.earnings.filter((e) => {
        const d = new Date(e.date);
        return d >= monthStart && d <= monthEnd;
      }),
    [state.earnings, monthStart, monthEnd]
  );

  const todayExpenses = useMemo(
    () =>
      state.expenses.filter((e) => {
        const d = new Date(e.date);
        return d >= todayStart && d <= todayEnd;
      }),
    [state.expenses, todayStart, todayEnd]
  );

  // Stat calculations
  const totalEarned = useMemo(() => monthEarnings.reduce((s, e) => s + Number(e.amount), 0), [monthEarnings]);
  const totalSpent = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses]);
  const netBalance = totalEarned - totalSpent;
  const todaySpending = useMemo(() => todayExpenses.reduce((s, e) => s + Number(e.amount), 0), [todayExpenses]);

  // Format currency
  const fmt = (amount) =>
    new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);

  // Category breakdown for pie chart
  const categoryData = useMemo(
    () => getCategoryBreakdown(monthExpenses, state.categories.expense).map(c => ({
      ...c, value: c.total, percent: c.percentage
    })),
    [monthExpenses, state.categories.expense]
  );

  // Smart insights
  const insights = useMemo(
    () =>
      getSmartInsights(state.expenses, state.earnings, state.categories.expense, state.settings),
    [state.expenses, state.earnings, state.settings, state.categories]
  );

  // Recent transactions (last 5, combined & sorted by date desc)
  const recentTransactions = useMemo(() => {
    const allTx = [
      ...state.expenses.map((e) => ({ ...e, type: 'expense' })),
      ...state.earnings.map((e) => ({ ...e, type: 'earning' })),
    ];
    allTx.sort((a, b) => new Date(b.date) - new Date(a.date));
    return allTx.slice(0, 5);
  }, [state.expenses, state.earnings]);

  // Limits
  const { dailyLimit, monthlyLimit } = state.settings;

  // Pie chart custom tooltip
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card px-3 py-2 text-sm font-medium shadow-lg">
          <span>{data.icon} {data.name}</span>
          <p className="tabular-nums text-xs mt-0.5 opacity-80">
            {currencySymbol}{fmt(data.value)} ({data.percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Insight type styling
  const insightStyles = {
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
  };

  const insightIcons = {
    info: '💡',
    warning: '⚠️',
    success: '✅',
  };

  return (
    <div className="page-container">
      {/* ===== HEADER ===== */}
      <div className="mb-8 animate-slide-up">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400 mb-2">
              Your financial overview
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white tracking-tight">
              {greeting}<span className="inline-block ml-1.5">👋</span>
            </h1>
            <p className="text-surface-500 dark:text-surface-400 text-sm mt-2">
              Here’s how your money is moving in {currentMonthLabel}.
            </p>
          </div>
          <button
            onClick={() => navigate('/add-expense')}
            className="btn btn-primary shrink-0 w-11 h-11 md:w-auto md:h-auto !p-0 md:!px-4 md:!py-3 rounded-full md:rounded-xl shadow-lg shadow-primary-500/25"
            aria-label="Add Expense"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Add transaction</span>
          </button>
        </div>
      </div>

      {/* ===== RECOVERY NOTIFICATION ===== */}
      {recoveredFromBackup && (
        <div className="mb-4 card border-success-500/30 bg-success-500/5 p-4 flex items-center gap-3 animate-slide-down">
          <ShieldCheck size={20} className="text-success-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-success-700 dark:text-success-400">Data Auto-Recovered!</p>
            <p className="text-xs text-surface-500 dark:text-surface-400">Your data was restored from an automatic IndexedDB backup. All transactions are safe.</p>
          </div>
        </div>
      )}

      {/* ===== LIMIT WARNINGS ===== */}
      {dailyLimit > 0 && (
        <div className="mb-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <LimitWarning type="daily" limit={dailyLimit} current={todaySpending} currencySymbol={currencySymbol} />
        </div>
      )}
      {monthlyLimit > 0 && (
        <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <LimitWarning type="monthly" limit={monthlyLimit} current={totalSpent} currencySymbol={currencySymbol} />
        </div>
      )}

      {/* ===== STAT CARDS (2x2 mobile, 4-col desktop) ===== */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5 mb-7">
        <StatCard
          title="Total Earned"
          value={`${currencySymbol}${fmt(totalEarned)}`}
          icon={<TrendingUp size={18} />}
          gradient="gradient-success"
          className="animate-slide-up"
          style={{ animationDelay: '0.05s' }}
        />
        <StatCard
          title="Total Spent"
          value={`${currencySymbol}${fmt(totalSpent)}`}
          icon={<TrendingDown size={18} />}
          gradient="gradient-danger"
          className="animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        />
        <StatCard
          title="Net Balance"
          value={`${currencySymbol}${fmt(Math.abs(netBalance))}`}
          icon={<Wallet size={18} />}
          gradient="gradient-primary"
          subtitle={netBalance < 0 ? 'Deficit' : 'Surplus'}
          className="animate-slide-up"
          style={{ animationDelay: '0.15s' }}
        />
        <StatCard
          title="Today's Spending"
          value={`${currencySymbol}${fmt(todaySpending)}`}
          icon={<TrendingDown size={16} />}
          gradient="gradient-warning"
          className="animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        />
      </div>

      {/* ===== MONTHLY BUDGET PROGRESS ===== */}
      {monthlyLimit > 0 && (
        <div className="card p-5 md:p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-surface-400 mb-1">Spending plan</p>
              <h3 className="text-base font-bold text-surface-700 dark:text-surface-300 tracking-tight">Monthly budget</h3>
            </div>
            <span className="tabular-nums text-sm font-semibold text-surface-500 dark:text-surface-400">
              {currencySymbol}{fmt(totalSpent)} / {currencySymbol}{fmt(monthlyLimit)}
            </span>
          </div>
          <ProgressBar
            value={totalSpent}
            max={monthlyLimit}
            colorScheme="auto"
          />
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-3 font-medium">
            {totalSpent <= monthlyLimit
              ? `${currencySymbol}${fmt(monthlyLimit - totalSpent)} remaining`
              : `Exceeded by ${currencySymbol}${fmt(totalSpent - monthlyLimit)}`}
          </p>
        </div>
      )}

      {/* ===== CATEGORY BREAKDOWN ===== */}
      {categoryData.length > 0 && (
        <div className="card p-5 md:p-6 mb-8 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-surface-400 mb-1">This month</p>
            <h3 className="text-base font-bold text-surface-700 dark:text-surface-300 tracking-tight">Spending by category</h3>
          </div>

          {/* Pie Chart */}
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {categoryData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={entry.color}
                      className="transition-all duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category bars */}
          <div className="space-y-3">
            {categoryData.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-lg w-7 text-center flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-surface-700 dark:text-surface-300 truncate">
                      {cat.name}
                    </span>
                    <span className="tabular-nums text-xs font-semibold text-surface-600 dark:text-surface-400 ml-2">
                      {cat.percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full animate-progress"
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
                <span className="tabular-nums text-xs font-medium text-surface-500 dark:text-surface-400 flex-shrink-0">
                  {currencySymbol}{fmt(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== SMART INSIGHTS ===== */}
      {insights.length > 0 && (
        <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles size={18} className="text-amber-500" />
            <h3 className="text-base font-bold text-surface-700 dark:text-surface-300 tracking-tight">
              Helpful insights
            </h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border px-5 py-4 text-sm font-semibold tracking-wide shadow-sm transition-all duration-200 hover:shadow ${insightStyles[insight.type] || insightStyles.info}`}
              >
                <span className="mr-2">{insightIcons[insight.type] || '💡'}</span>
                {insight.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== RECENT TRANSACTIONS ===== */}
      <div className="animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-surface-400 mb-1">Latest activity</p>
            <h3 className="text-base font-bold text-surface-700 dark:text-surface-300 tracking-tight">Recent transactions</h3>
          </div>
          {recentTransactions.length > 0 && (
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 text-sm font-bold text-primary-500 hover:text-primary-600 transition-colors"
            >
              See all <ArrowRight size={16} />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="Start tracking your money by adding your first expense or earning."
            actionLabel="Add Expense"
            onAction={() => navigate('/add-expense')}
          />
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <TransactionCard
                key={`${tx.type}-${tx.id}`}
                transaction={tx}
                type={tx.type}
                categories={
                  tx.type === 'expense'
                    ? state.categories.expense
                    : state.categories.earning
                }
                currencySymbol={currencySymbol}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom spacer for FAB / nav */}
      <div className="h-4" />
    </div>
  );
};

export default Dashboard;
