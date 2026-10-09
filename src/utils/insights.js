import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  subMonths,
  isSameMonth,
  isSameYear,
  eachDayOfInterval,
  isWithinInterval,
} from 'date-fns';

/**
 * Get the top spending category from a list of expenses.
 * @param {Array} expenses - Array of expense objects with { amount, category }
 * @param {Array} categories - Array of category objects with { id, name, icon, color }
 * @returns {{ name, icon, color, total, percentage } | null}
 */
export const getTopSpendingCategory = (expenses, categories) => {
  if (!expenses || expenses.length === 0) return null;

  const totals = {};
  let grandTotal = 0;

  expenses.forEach((exp) => {
    const catId = exp.category;
    totals[catId] = (totals[catId] || 0) + Number(exp.amount);
    grandTotal += Number(exp.amount);
  });

  if (grandTotal === 0) return null;

  let topId = null;
  let topTotal = 0;

  Object.entries(totals).forEach(([catId, total]) => {
    if (total > topTotal) {
      topId = catId;
      topTotal = total;
    }
  });

  const cat = categories.find((c) => c.id === topId) || {
    name: 'Unknown',
    icon: '❓',
    color: '#94A3B8',
  };

  return {
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    total: topTotal,
    percentage: Math.round((topTotal / grandTotal) * 100),
  };
};

/**
 * Calculate the average daily spend for a given month/year.
 * @param {Array} expenses
 * @param {number} month - 0-indexed month (0 = January)
 * @param {number} year
 * @returns {number} average daily spend
 */
export const getAverageDailySpend = (expenses, month, year) => {
  if (!expenses || expenses.length === 0) return 0;

  const refDate = new Date(year, month, 1);
  const start = startOfMonth(refDate);
  const end = endOfMonth(refDate);

  const monthExpenses = expenses.filter((exp) => {
    const date = parseISO(exp.date);
    return isWithinInterval(date, { start, end });
  });

  const totalSpend = monthExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const today = new Date();
  const isCurrentMonth = isSameMonth(today, refDate) && isSameYear(today, refDate);

  // If current month, divide by days elapsed so far; otherwise by total days in month
  const daysCount = isCurrentMonth
    ? Math.max(today.getDate(), 1)
    : getDaysInMonth(refDate);

  return totalSpend / daysCount;
};

/**
 * Count how many days in the current month daily spending exceeded the daily limit.
 * @param {Array} expenses
 * @param {number} dailyLimit
 * @returns {number}
 */
export const getBudgetExceededCount = (expenses, dailyLimit) => {
  if (!expenses || expenses.length === 0 || !dailyLimit || dailyLimit <= 0) return 0;

  const now = new Date();
  const start = startOfMonth(now);
  const end = new Date(now); // up to today

  const days = eachDayOfInterval({ start, end });

  // Build a map of date -> total spend
  const dailyTotals = {};
  expenses.forEach((exp) => {
    const date = parseISO(exp.date);
    if (isWithinInterval(date, { start, end })) {
      const key = format(date, 'yyyy-MM-dd');
      dailyTotals[key] = (dailyTotals[key] || 0) + Number(exp.amount);
    }
  });

  let exceededCount = 0;
  days.forEach((day) => {
    const key = format(day, 'yyyy-MM-dd');
    if ((dailyTotals[key] || 0) > dailyLimit) {
      exceededCount++;
    }
  });

  return exceededCount;
};

/**
 * Get a breakdown of spending by category, sorted by total descending.
 * @param {Array} expenses
 * @param {Array} categories
 * @returns {Array<{ name, icon, color, total, percentage }>}
 */
export const getCategoryBreakdown = (expenses, categories) => {
  if (!expenses || expenses.length === 0) return [];

  const totals = {};
  let grandTotal = 0;

  expenses.forEach((exp) => {
    const catId = exp.category;
    totals[catId] = (totals[catId] || 0) + Number(exp.amount);
    grandTotal += Number(exp.amount);
  });

  if (grandTotal === 0) return [];

  const breakdown = Object.entries(totals).map(([catId, total]) => {
    const cat = categories.find((c) => c.id === catId) || {
      name: 'Unknown',
      icon: '❓',
      color: '#94A3B8',
    };
    return {
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      total,
      percentage: Math.round((total / grandTotal) * 100),
    };
  });

  return breakdown.sort((a, b) => b.total - a.total);
};

/**
 * Get a breakdown of spending by payment mode, sorted by total descending.
 * @param {Array} expenses
 * @param {Array} paymentModes
 * @returns {Array<{ name, icon, total, percentage }>}
 */
export const getPaymentModeBreakdown = (expenses, paymentModes) => {
  if (!expenses || expenses.length === 0) return [];

  const totals = {};
  let grandTotal = 0;

  expenses.forEach((exp) => {
    const modeId = exp.paymentMode;
    totals[modeId] = (totals[modeId] || 0) + Number(exp.amount);
    grandTotal += Number(exp.amount);
  });

  if (grandTotal === 0) return [];

  const breakdown = Object.entries(totals).map(([modeId, total]) => {
    const mode = paymentModes.find((m) => m.id === modeId) || {
      name: 'Unknown',
      icon: '❓',
    };
    return {
      name: mode.name,
      icon: mode.icon,
      total,
      percentage: Math.round((total / grandTotal) * 100),
    };
  });

  return breakdown.sort((a, b) => b.total - a.total);
};

/**
 * Helper: get expenses for a specific month.
 */
const getExpensesForMonth = (expenses, date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return expenses.filter((exp) => {
    const d = parseISO(exp.date);
    return isWithinInterval(d, { start, end });
  });
};

/**
 * Helper: sum amounts in a list of transactions.
 */
const sumAmounts = (transactions) =>
  transactions.reduce((sum, t) => sum + Number(t.amount), 0);

/**
 * Generate 3-5 smart insights based on current data.
 * @param {Array} expenses
 * @param {Array} earnings
 * @param {Array} categories - expense categories
 * @param {object} settings - { dailyLimit, monthlyLimit, currency }
 * @returns {Array<{ message: string, type: 'info'|'warning'|'success' }>}
 */
export const getSmartInsights = (expenses, earnings, categories, settings) => {
  const insights = [];
  const now = new Date();

  const thisMonthExpenses = getExpensesForMonth(expenses, now);
  const lastMonthExpenses = getExpensesForMonth(expenses, subMonths(now, 1));
  const thisMonthEarnings = getExpensesForMonth(earnings, now); // same filter logic works

  const thisMonthTotal = sumAmounts(thisMonthExpenses);
  const lastMonthTotal = sumAmounts(lastMonthExpenses);
  const thisMonthIncome = sumAmounts(thisMonthEarnings);

  // 1. Top category insight if > 30%
  const topCat = getTopSpendingCategory(thisMonthExpenses, categories);
  if (topCat && topCat.percentage > 30) {
    insights.push({
      message: `You spend ${topCat.percentage}% on ${topCat.name} ${topCat.icon}`,
      type: 'info',
    });
  }

  // 2. Daily budget exceeded count
  if (settings.dailyLimit && settings.dailyLimit > 0) {
    const exceeded = getBudgetExceededCount(expenses, settings.dailyLimit);
    if (exceeded > 0) {
      insights.push({
        message: `You exceeded your daily budget ${exceeded} time${exceeded > 1 ? 's' : ''} this month`,
        type: 'warning',
      });
    }
  }

  // 3. Spending comparison with last month
  if (lastMonthTotal > 0) {
    const changePercent = Math.round(
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
    );
    if (changePercent > 0) {
      insights.push({
        message: `Your spending is ${changePercent}% higher than last month`,
        type: 'warning',
      });
    } else if (changePercent < 0) {
      insights.push({
        message: `Your spending is ${Math.abs(changePercent)}% lower than last month`,
        type: 'success',
      });
    }
  }

  // 4. Savings percentage if earnings exist
  if (thisMonthIncome > 0) {
    const saved = thisMonthIncome - thisMonthTotal;
    const savingsPercent = Math.round((saved / thisMonthIncome) * 100);
    if (savingsPercent > 0) {
      insights.push({
        message: `You've saved ${savingsPercent}% of your income this month 🎉`,
        type: 'success',
      });
    } else {
      insights.push({
        message: `You've overspent your income by ${Math.abs(savingsPercent)}% this month`,
        type: 'warning',
      });
    }
  }

  // 5. Category spending change vs last month (pick the one with biggest increase)
  if (lastMonthExpenses.length > 0 && thisMonthExpenses.length > 0) {
    const thisBreakdown = {};
    thisMonthExpenses.forEach((exp) => {
      thisBreakdown[exp.category] = (thisBreakdown[exp.category] || 0) + Number(exp.amount);
    });
    const lastBreakdown = {};
    lastMonthExpenses.forEach((exp) => {
      lastBreakdown[exp.category] = (lastBreakdown[exp.category] || 0) + Number(exp.amount);
    });

    let biggestIncreaseCat = null;
    let biggestIncreasePercent = 0;

    Object.entries(thisBreakdown).forEach(([catId, thisTotal]) => {
      const lastTotal = lastBreakdown[catId];
      if (lastTotal && lastTotal > 0) {
        const change = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
        if (change > biggestIncreasePercent) {
          biggestIncreasePercent = change;
          biggestIncreaseCat = catId;
        }
      }
    });

    if (biggestIncreaseCat && biggestIncreasePercent > 10) {
      const cat = categories.find((c) => c.id === biggestIncreaseCat);
      if (cat) {
        insights.push({
          message: `${cat.name} spending increased by ${biggestIncreasePercent}% vs last month`,
          type: 'info',
        });
      }
    }
  }

  // Return 3-5 insights (cap at 5)
  return insights.slice(0, 5);
};

/**
 * Get monthly comparison data for bar charts.
 * @param {Array} expenses
 * @param {Array} earnings
 * @param {number} numMonths - number of past months to include
 * @returns {Array<{ month: string, year: number, income: number, expense: number }>}
 */
export const getMonthlyComparison = (expenses, earnings, numMonths = 6) => {
  const result = [];
  const now = new Date();

  for (let i = numMonths - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthExpenses = expenses.filter((exp) => {
      const d = parseISO(exp.date);
      return isWithinInterval(d, { start, end });
    });

    const monthEarnings = earnings.filter((earn) => {
      const d = parseISO(earn.date);
      return isWithinInterval(d, { start, end });
    });

    result.push({
      month: format(date, 'MMM'),
      year: date.getFullYear(),
      income: sumAmounts(monthEarnings),
      expense: sumAmounts(monthExpenses),
    });
  }

  return result;
};
