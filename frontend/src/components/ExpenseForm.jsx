import React, { useState, useEffect } from 'react';
import { X, IndianRupee } from 'lucide-react';

const CATEGORIES = [
  { value: 'Housing', emoji: '🏠', color: '#3b82f6' },
  { value: 'Transportation', emoji: '🚗', color: '#8b5cf6' },
  { value: 'Food & Dining', emoji: '🍽️', color: '#f59e0b' },
  { value: 'Utilities', emoji: '💡', color: '#06b6d4' },
  { value: 'Healthcare', emoji: '💊', color: '#ef4444' },
  { value: 'Education', emoji: '📚', color: '#10b981' },
  { value: 'Shopping', emoji: '🛍️', color: '#ec4899' },
  { value: 'Entertainment', emoji: '🎮', color: '#f97316' },
  { value: 'Travel', emoji: '✈️', color: '#14b8a6' },
  { value: 'Investments', emoji: '📈', color: '#84cc16' },
  { value: 'Miscellaneous', emoji: '📦', color: '#6b7280' },
];

const ExpenseForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: new Date(initialData.date).toISOString().split('T')[0],
      });
    } else {
      setFormData({
        title: '',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, amount: Number(formData.amount) });
  };

  const selectedCat = CATEGORIES.find(c => c.value === formData.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div>
            <h3 className="font-display text-xl font-bold text-white">
              {initialData ? '✏️ Edit Expense' : '+ Add Expense'}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">All amounts in Indian Rupees (₹)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Expense Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-dark pl-4"
                placeholder="e.g. Swiggy Order, Petrol, Rent..."
              />
            </div>

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <IndianRupee size={15} className="text-slate-500" />
                  </div>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    className="input-dark"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="input-dark pl-4"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-white/5 bg-white/3 text-slate-400 hover:border-white/15 hover:text-slate-200'
                    }`}
                    style={{
                      backgroundColor: formData.category === cat.value ? `${cat.color}20` : '',
                      borderColor: formData.category === cat.value ? cat.color : '',
                    }}
                  >
                    <span className="text-base leading-none">{cat.emoji}</span>
                    <span className="truncate">{cat.value}</span>
                  </button>
                ))}
              </div>
              {!formData.category && <p className="text-rose-400 text-xs mt-1">Please select a category</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Note <span className="text-slate-600">(Optional)</span></label>
              <textarea
                name="description"
                rows="2"
                value={formData.description}
                onChange={handleChange}
                className="input-dark pl-4 resize-none leading-relaxed"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-white/5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.category}
              className="btn-primary text-sm py-2.5 px-6"
            >
              {initialData ? 'Save Changes' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;
export { CATEGORIES };
