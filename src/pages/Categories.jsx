import { useData } from '../context/DataContext';
import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';

const EMOJI_GRID = ['🏠','🎮','💊','🎵','🐕','✈️','🎁','💰','📱','🏋️','🍕','☕','🛒','📚','💼','🏥','🚌','🎬','💡','📦','👗','🎯','🏖️','🍿','🔧','🎓','🚀','💎','🌮','🧘'];
const COLOR_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#A855F7', '#EC4899',
];

export default function Categories() {
  const { state, addCategory, deleteCategory } = useData();
  const [activeTab, setActiveTab] = useState('expense');
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '📦', color: '#6366F1' });

  const categories = activeTab === 'expense' ? state.categories.expense : state.categories.earning;

  const handleSave = () => {
    if (!form.name || !form.icon) return;
    addCategory(activeTab, { name: form.name, icon: form.icon, color: form.color });
    setForm({ name: '', icon: '📦', color: '#6366F1' });
    setShowModal(false);
  };

  const handleDelete = (id) => {
    deleteCategory(activeTab, id);
    setDeleteConfirm(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Categories</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 mb-6">
        {['expense', 'earning'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-surface-500'
            }`}
          >
            {tab === 'expense' ? '💸 Expense' : '💰 Earning'}
          </button>
        ))}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className="relative card min-h-[118px] p-4 text-center group animate-scale-in"
            style={{
              animationDelay: `${i * 40}ms`,
              background: `${cat.color}10`,
              borderColor: `${cat.color}30`,
            }}
          >
            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(cat.id);
              }}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-surface-100 dark:bg-surface-700 opacity-0 group-hover:opacity-100 md:opacity-0 max-md:opacity-60 transition-opacity"
            >
              <X size={12} className="text-surface-500" />
            </button>
            <span className="text-3xl block mb-2">{cat.icon}</span>
            <span className="block text-xs font-medium leading-tight dark:text-surface-300 break-words">{cat.name}</span>

            {/* Delete Confirmation */}
            {deleteConfirm === cat.id && (
              <div className="absolute inset-0 bg-white/95 dark:bg-surface-800/95 rounded-2xl flex flex-col items-center justify-center gap-2 p-2 animate-scale-in z-10">
                <p className="text-xs text-danger-500 font-medium">Delete?</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConfirm(null)}
                    className="text-xs px-2 py-1 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400">
                    No
                  </button>
                  <button onClick={() => handleDelete(cat.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-danger-500 text-white">
                    Yes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Category Button */}
        <button
          onClick={() => setShowModal(true)}
          className="card min-h-[118px] p-4 text-center border-2 border-dashed border-surface-300 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
        >
          <span className="text-2xl block mb-2">
            <Plus size={28} className="mx-auto text-surface-400" />
          </span>
          <span className="text-xs font-medium text-surface-500">Add New</span>
        </button>
      </div>

      {/* Add Category Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Category">
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1 block">Name</label>
            <input className="input" placeholder="Category name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2 block">
              Icon <span className="text-lg ml-1">{form.icon}</span>
            </label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJI_GRID.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`text-xl p-1.5 rounded-lg transition-all ${
                    form.icon === emoji
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 scale-110'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-700'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.color === color ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center py-3">
            <div className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: `${form.color}20`, color: form.color }}>
              {form.icon} {form.name || 'Category'}
            </div>
          </div>

          <button onClick={handleSave} className="btn btn-primary w-full"
            disabled={!form.name}>
            Add Category
          </button>
        </div>
      </Modal>
    </div>
  );
}
