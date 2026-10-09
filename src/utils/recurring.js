import { v4 as uuidv4 } from 'uuid';
import { format, addDays, addWeeks, addMonths, addYears, isBefore, isToday, startOfDay } from 'date-fns';

export const processRecurringTransactions = (recurringTransactions, addExpense, addEarning, updateRecurringTransaction) => {
  if (!recurringTransactions || recurringTransactions.length === 0) return;

  const today = startOfDay(new Date());
  
  recurringTransactions.forEach(rt => {
    if (!rt.active) return;
    
    let nextDate = startOfDay(new Date(rt.nextDate));
    
    // Process all missed and current dates
    while (isBefore(nextDate, today) || isToday(nextDate)) {
      const transaction = {
        id: uuidv4(),
        description: rt.description,
        amount: rt.amount,
        date: format(nextDate, 'yyyy-MM-dd'),
        category: rt.category,
        paymentMode: rt.paymentMode,
      };

      if (rt.type === 'expense') {
        addExpense(transaction);
      } else {
        addEarning({ ...transaction, source: rt.description });
      }

      // Calculate next occurrence
      let newNextDate;
      switch (rt.frequency) {
        case 'daily':
          newNextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          newNextDate = addWeeks(nextDate, 1);
          break;
        case 'monthly':
          newNextDate = addMonths(nextDate, 1);
          break;
        case 'yearly':
          newNextDate = addYears(nextDate, 1);
          break;
        default:
          newNextDate = addMonths(nextDate, 1);
      }

      updateRecurringTransaction(rt.id, { nextDate: format(newNextDate, 'yyyy-MM-dd') });
      nextDate = newNextDate;
    }
  });
};

export const getNextOccurrence = (frequency, fromDate) => {
  const date = new Date(fromDate);
  switch (frequency) {
    case 'daily': return addDays(date, 1);
    case 'weekly': return addWeeks(date, 1);
    case 'monthly': return addMonths(date, 1);
    case 'yearly': return addYears(date, 1);
    default: return addMonths(date, 1);
  }
};
