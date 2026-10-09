// Default expense categories with emoji icons and colors
export const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'cat-food', name: 'Food & Dining', icon: '🍔', color: '#EF4444' },
  { id: 'cat-transport', name: 'Transport', icon: '🚗', color: '#F59E0B' },
  { id: 'cat-shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: '💡', color: '#8B5CF6' },
  { id: 'cat-entertainment', name: 'Entertainment', icon: '🎬', color: '#06B6D4' },
  { id: 'cat-health', name: 'Health', icon: '🏥', color: '#10B981' },
  { id: 'cat-education', name: 'Education', icon: '📚', color: '#3B82F6' },
  { id: 'cat-groceries', name: 'Groceries', icon: '🥦', color: '#22C55E' },
  { id: 'cat-rent', name: 'Rent', icon: '🏠', color: '#6366F1' },
  { id: 'cat-travel', name: 'Travel', icon: '✈️', color: '#0EA5E9' },
  { id: 'cat-subscriptions', name: 'Subscriptions', icon: '📱', color: '#A855F7' },
  { id: 'cat-udhar', name: 'Udhar / Debt Given', icon: '🤝', color: '#F97316' },
  { id: 'cat-other-expense', name: 'Other', icon: '📦', color: '#64748B' },
];

export const DEFAULT_EARNING_CATEGORIES = [
  { id: 'earn-salary', name: 'Salary', icon: '💼', color: '#10B981' },
  { id: 'earn-freelance', name: 'Freelance', icon: '💻', color: '#3B82F6' },
  { id: 'earn-investment', name: 'Investment', icon: '📈', color: '#8B5CF6' },
  { id: 'earn-business', name: 'Business', icon: '🏢', color: '#F59E0B' },
  { id: 'earn-gift', name: 'Gift', icon: '🎁', color: '#EC4899' },
  { id: 'earn-refund', name: 'Refund', icon: '💸', color: '#06B6D4' },
  { id: 'earn-pocket-money', name: 'Pocket Money', icon: '👛', color: '#6366F1' },
  { id: 'earn-udhar-return', name: 'Udhar Returned', icon: '↩️', color: '#14B8A6' },
  { id: 'earn-other', name: 'Other', icon: '💰', color: '#64748B' },
];

export const DEFAULT_PAYMENT_MODES = [
  { id: 'pm-cash', name: 'Cash', icon: '💵' },
  { id: 'pm-upi', name: 'UPI', icon: '📲' },
  { id: 'pm-card', name: 'Card', icon: '💳' },
  { id: 'pm-netbanking', name: 'Net Banking', icon: '🏦' },
  { id: 'pm-wallet', name: 'Wallet', icon: '👛' },
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export const KEYBOARD_SHORTCUTS = [
  { key: 'a', action: 'Add Expense', path: '/add-expense' },
  { key: 'e', action: 'Add Earning', path: '/add-earning' },
  { key: '/', action: 'Search', path: '/search' },
  { key: 'h', action: 'Go Home', path: '/' },
];

export const STORAGE_KEY = 'paisa-pro-data';
