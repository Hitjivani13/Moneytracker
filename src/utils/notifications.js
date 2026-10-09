export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title, body, icon = '💰') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon });
  } catch (e) {
    // Silently fail on mobile browsers that don't support Notification constructor
  }
};

export const checkDailyLimit = (todayTotal, dailyLimit) => {
  if (!dailyLimit || dailyLimit <= 0) return null;
  const percentage = (todayTotal / dailyLimit) * 100;
  if (percentage >= 100) {
    return { type: 'exceeded', message: `Daily limit exceeded! Spent ₹${todayTotal.toFixed(0)} of ₹${dailyLimit} limit.`, percentage };
  }
  if (percentage >= 80) {
    return { type: 'warning', message: `Approaching daily limit! Spent ₹${todayTotal.toFixed(0)} of ₹${dailyLimit} (${percentage.toFixed(0)}%).`, percentage };
  }
  return null;
};

export const checkMonthlyLimit = (monthTotal, monthlyLimit) => {
  if (!monthlyLimit || monthlyLimit <= 0) return null;
  const percentage = (monthTotal / monthlyLimit) * 100;
  if (percentage >= 100) {
    return { type: 'exceeded', message: `Monthly limit exceeded! Spent ₹${monthTotal.toFixed(0)} of ₹${monthlyLimit} budget.`, percentage };
  }
  if (percentage >= 80) {
    return { type: 'warning', message: `Approaching monthly limit! ${percentage.toFixed(0)}% of budget used.`, percentage };
  }
  if (percentage >= 50) {
    return { type: 'info', message: `${percentage.toFixed(0)}% of monthly budget used.`, percentage };
  }
  return null;
};
