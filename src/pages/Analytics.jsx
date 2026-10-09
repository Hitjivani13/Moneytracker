import { useData } from '../context/DataContext';
import { useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval, eachDayOfInterval, getDaysInMonth } from 'date-fns';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  TrendingUp, TrendingDown, Sparkles, BarChart3, ArrowUpRight, ArrowDownRight,
  PieChart as PieChartIcon, Wallet, Calendar
} from 'lucide-react';
import EmptyState from '../components/EmptyState';

const CHART_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#EF4444', '#3B82F6', '#22C55E', '#F97316'];

export default function Analytics() {
  const { state, getCurrencySymbol } = useData();
  const currency = getCurrencySymbol();
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  // Current month expenses & earnings
  const monthExpenses = useMemo(() =>
    state.expenses.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    }), [state.expenses, thisMonthStart, thisMonthEnd]);

  const monthEarnings = useMemo(() =>
    state.earnings.filter(e => {
      const d = parseISO(e.date);
      return isWithinInterval(d, { start: thisMonthStart, end: thisMonthEnd });
    }), [state.earnings, thisMonthStart, thisMonthEnd]);

  const totalExpense = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = monthEarnings.reduce((s, e) => s + Number(e.amount), 0);

  // Average daily spend
  const avgDailySpend = useMemo(() => {
    const daysPassed = Math.max(1, now.getDate());
    return totalExpense / daysPassed;
  }, [totalExpense, now]);

  // Top spending category
  const categoryBreakdown = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => {
      const cat = state.categories.expense.find(c => c.id === e.category);
      const key = cat ? cat.id : 'other';
      if (!map[key]) map[key] = {
        name: cat?.name || 'Other', icon: cat?.icon || '📦',
        color: cat?.color || '#94A3B8', total: 0
      };
      map[key].total += Number(e.amount);
    });
    const arr = Object.values(map).sort((a, b) => b.total - a.total);
    const total = arr.reduce((s, c) => s + c.total, 0);
    return arr.map(c => ({ ...c, percentage: total > 0 ? ((c.total / total) * 100).toFixed(1) : 0 }));
  }, [monthExpenses, state.categories.expense]);

  // Payment mode breakdown
  const paymentBreakdown = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => {
      const pm = state.paymentModes.find(p => p.id === e.paymentMode);
      const key = pm ? pm.id : 'other';
      if (!map[key]) map[key] = { name: pm?.name || 'Other', icon: pm?.icon || '💳', total: 0 };
      map[key].total += Number(e.amount);
    });
    const arr = Object.values(map).sort((a, b) => b.total - a.total);
    const total = arr.reduce((s, c) => s + c.total, 0);
    return arr.map(c => ({ ...c, percentage: total > 0 ? ((c.total / total) * 100).toFixed(1) : 0 }));
  }, [monthExpenses, state.paymentModes]);

  // Monthly comparison (last 6 months)
  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(now, i));
      const mEnd = endOfMonth(subMonths(now, i));
      const income = state.earnings
        .filter(e => { const d = parseISO(e.date); return isWithinInterval(d, { start: mStart, end: mEnd }); })
        .reduce((s, e) => s + Number(e.amount), 0);
      const expense = state.expenses
        .filter(e => { const d = parseISO(e.date); return isWithinInterval(d, { start: mStart, end: mEnd }); })
        .reduce((s, e) => s + Number(e.amount), 0);
      data.push({ month: format(mStart, 'MMM'), income, expense });
    }
    return data;
  }, [state.expenses, state.earnings, now]);

  // Savings rate
  const savingsRate = totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Smart insights
  const insights = useMemo(() => {
    const msgs = [];
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      if (Number(top.percentage) > 30) {
        msgs.push({ message: `You spend ${top.percentage}% on ${top.icon} ${top.name}`, type: 'warning' });
      }
    }
    if (savingsRate > 0) {
      msgs.push({ message: `You've saved ${savingsRate.toFixed(0)}% of your income this month`, type: savingsRate > 20 ? 'success' : 'info' });
    }
    if (avgDailySpend > 0) {
      msgs.push({ message: `Average daily spending: ${currency}${avgDailySpend.toFixed(0)}`, type: 'info' });
    }
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const prevExpense = state.expenses
      .filter(e => { const d = parseISO(e.date); return isWithinInterval(d, { start: prevMonthStart, end: prevMonthEnd }); })
      .reduce((s, e) => s + Number(e.amount), 0);
    if (prevExpense > 0 && totalExpense > 0) {
      const change = ((totalExpense - prevExpense) / prevExpense * 100).toFixed(0);
      msgs.push({
        message: `Spending is ${Math.abs(change)}% ${Number(change) > 0 ? 'higher' : 'lower'} than last month`,
        type: Number(change) > 0 ? 'warning' : 'success'
      });
    }
    if (state.settings.dailyLimit > 0) {
      const exceededDays = monthExpenses.reduce((acc, e) => {
        acc[e.date] = (acc[e.date] || 0) + Number(e.amount);
        return acc;
      }, {});
      const exceeded = Object.values(exceededDays).filter(v => v > state.settings.dailyLimit).length;
      if (exceeded > 0) {
        msgs.push({ message: `You exceeded daily budget ${exceeded} time${exceeded > 1 ? 's' : ''} this month`, type: 'warning' });
      }
    }
    return msgs;
  }, [categoryBreakdown, savingsRate, avgDailySpend, totalExpense, monthExpenses, state]);

  const hasData = state.expenses.length > 0 || state.earnings.length > 0;

  if (!hasData) {
    return (
      <div className="page-container">
        <h1 className="text-2xl font-bold mb-6 dark:text-white flex items-center gap-2">
          <BarChart3 size={24} /> Analytics
        </h1>
        <EmptyState icon="📊" title="Not enough data"
          description="Start adding transactions to see analytics and insights" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1 dark:text-white">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="tabular-nums">
            {p.name}: {currency}{Number(p.value).toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <h1 className="text-3xl font-extrabold mb-8 dark:text-white flex items-center gap-2.5 tracking-tight">
        <BarChart3 size={28} className="text-primary-500" /> Analytics
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-primary-500" />
            <span className="text-xs font-semibold text-surface-500">Avg Daily Spend</span>
          </div>
          <p className="text-2xl font-extrabold tabular-nums dark:text-white tracking-tight">
            {currency}{avgDailySpend.toFixed(0)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-success-500" />
            <span className="text-xs font-semibold text-surface-500">Savings Rate</span>
          </div>
          <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${savingsRate >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
            {savingsRate.toFixed(0)}%
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-warning-500" />
            <span className="text-xs font-semibold text-surface-500">Top Category</span>
          </div>
          <p className="text-base font-bold dark:text-white truncate tracking-tight">
            {categoryBreakdown[0]?.icon} {categoryBreakdown[0]?.name || 'N/A'}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-primary-500" />
            <span className="text-xs font-semibold text-surface-500">Inc vs Exp</span>
          </div>
          <p className="text-base font-bold dark:text-white tracking-tight">
            {totalIncome > totalExpense ? (
              <span className="text-success-500 flex items-center gap-1.5"><ArrowUpRight size={16} /> Surplus</span>
            ) : (
              <span className="text-danger-500 flex items-center gap-1.5"><ArrowDownRight size={16} /> Deficit</span>
            )}
          </p>
        </div>
      </div>

      {/* Monthly Comparison Bar Chart */}
      <div className="card p-6 mb-8">
        <h3 className="text-base font-bold dark:text-white flex items-center gap-2 mb-6 tracking-tight">
          <BarChart3 size={18} className="text-primary-500" /> Income vs Expenses
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false}
              stroke="var(--color-surface-200)" />
            <XAxis dataKey="month" axisLine={false} tickLine={false}
              tick={{ fill: 'var(--color-surface-500)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} width={45}
              tick={{ fill: 'var(--color-surface-500)', fontSize: 11 }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Pie Chart */}
      {categoryBreakdown.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-base font-bold dark:text-white flex items-center gap-2 mb-6 tracking-tight">
            <PieChartIcon size={18} className="text-primary-500" /> Spending by Category
          </h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryBreakdown} dataKey="total" cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80} paddingAngle={3}
                >
                  {categoryBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${currency}${Number(v).toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2 mt-2">
              {categoryBreakdown.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: cat.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="dark:text-surface-300">{cat.icon} {cat.name}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-surface-500">{cat.percentage}%</span>
                    <span className="font-semibold tabular-nums dark:text-white">
                      {currency}{cat.total.toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Mode Breakdown */}
      {paymentBreakdown.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-base font-bold dark:text-white flex items-center gap-2 mb-6 tracking-tight">
            💳 Payment Modes
          </h3>
          <div className="space-y-4">
            {paymentBreakdown.map((pm, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="dark:text-surface-300 font-medium">{pm.icon} {pm.name}</span>
                  <span className="font-bold tabular-nums dark:text-white">
                    {currency}{pm.total.toLocaleString('en-IN')} ({pm.percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pm.percentage}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length]
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-base font-bold dark:text-white flex items-center gap-2 mb-4 tracking-tight">
            <Sparkles size={18} className="text-warning-500" /> Insights
          </h3>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-2xl text-sm font-semibold tracking-wide ${
                insight.type === 'warning' ? 'bg-warning-50 dark:bg-warning-900/10 text-warning-700 dark:text-warning-400' :
                insight.type === 'success' ? 'bg-success-50 dark:bg-success-900/10 text-success-700 dark:text-success-400' :
                'bg-primary-50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400'
              }`}>
                <span className="text-base mt-0.5">
                  {insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : '💡'}
                </span>
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
