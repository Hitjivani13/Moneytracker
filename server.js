const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5181;
const DB_DIR = path.join(__dirname, 'db');
const DB_FILE = path.join(DB_DIR, 'database.json');
const BACKUPS_DIR = path.join(DB_DIR, 'backups');

// Ensure database directories exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// Initial default database structure if file doesn't exist
const DEFAULT_DB = {
  expenses: [
    {
      id: "7d2ff938-50d9-45ee-839d-6eb94e7dc585",
      description: "Chai",
      amount: 60,
      date: "2026-08-17",
      category: "cat-food",
      paymentMode: "pm-cash",
      createdAt: "2026-08-17T15:28:30.925Z"
    },
    {
      id: "493fb397-a256-4c2c-8b80-4e6a249cffb8",
      description: "Zerox",
      amount: 10,
      date: "2026-08-17",
      category: "cat-education",
      paymentMode: "pm-cash",
      createdAt: "2026-08-17T15:28:47.285Z"
    },
    {
      id: "2b311281-3e2c-44f3-b7ad-ef56fb864d99",
      description: "Chai",
      amount: 20,
      date: "2026-08-18",
      category: "cat-food",
      paymentMode: "pm-cash",
      createdAt: "2026-08-18T15:56:22.674Z"
    }
  ],
  earnings: [],
  trips: [],
  categories: {
    expense: [
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
      { id: 'cat-other-expense', name: 'Other', icon: '📦', color: '#64748B' },
    ],
    earning: [
      { id: 'earn-salary', name: 'Salary', icon: '💼', color: '#10B981' },
      { id: 'earn-freelance', name: 'Freelance', icon: '💻', color: '#3B82F6' },
      { id: 'earn-investment', name: 'Investment', icon: '📈', color: '#8B5CF6' },
      { id: 'earn-business', name: 'Business', icon: '🏢', color: '#F59E0B' },
      { id: 'earn-gift', name: 'Gift', icon: '🎁', color: '#EC4899' },
      { id: 'earn-refund', name: 'Refund', icon: '💸', color: '#06B6D4' },
      { id: 'earn-pocket-money', name: 'Pocket Money', icon: '👛', color: '#6366F1' },
      { id: 'earn-other', name: 'Other', icon: '💰', color: '#64748B' },
    ]
  },
  paymentModes: [
    { id: 'pm-cash', name: 'Cash', icon: '💵' },
    { id: 'pm-upi', name: 'UPI', icon: '📲' },
    { id: 'pm-card', name: 'Card', icon: '💳' },
    { id: 'pm-netbanking', name: 'Net Banking', icon: '🏦' },
    { id: 'pm-wallet', name: 'Wallet', icon: '👛' },
  ],
  settings: {
    currency: '₹',
    dailyLimit: 0,
    monthlyLimit: 0,
    recurringTransactions: [],
  },
  punishments: [],
  syncCode: '',
  isTimerActive: false
};

// Initialize DB file if missing
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2));
  console.log('📦 Created local hard-drive database:', DB_FILE);
}

// CORS headers
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', dbPath: DB_FILE }));
    return;
  }

  if (url.pathname === '/api/data' && req.method === 'GET') {
    try {
      const dataStr = fs.readFileSync(DB_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(dataStr);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (url.pathname === '/api/data' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        
        // Save to main db.json atomically
        const tempPath = `${DB_FILE}.tmp`;
        fs.writeFileSync(tempPath, JSON.stringify(parsed, null, 2));
        fs.renameSync(tempPath, DB_FILE);

        // Save rolling daily backup file in db/backups
        const todayStr = new Date().toISOString().split('T')[0];
        const backupPath = path.join(BACKUP_DIR = BACKUPS_DIR, `db-backup-${todayStr}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(parsed, null, 2));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON', details: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🗄️ Paisa Pro Local Hard-Drive Database Server`);
  console.log(`   Running at: http://localhost:${PORT}`);
  console.log(`   DB File:    ${DB_FILE}`);
  console.log(`===================================================`);
});
