import React, { useState, useEffect } from 'react';

export interface TransactionData {
  id?: number;
  amount: number | string;
  category: string;
  type: string;
  description: string;
  date: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: TransactionData) => void;
  initialData?: TransactionData | null;
}

export default function AddTransactionModal({ isOpen, onClose, onAdd, initialData }: Props) {
  const [amount, setAmount] = useState<string | number>('');
  const [category, setCategory] = useState('Food');
  const [type, setType] = useState('expense');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData && isOpen) {
      setAmount(initialData.amount);
      setCategory(initialData.category);
      setType(initialData.type);
      setDescription(initialData.description || '');
      setDate((initialData.date as string).substring(0, 10));
    } else if (isOpen && !initialData) {
      setAmount('');
      setCategory('Food');
      setType('expense');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...(initialData && { id: initialData.id }),
      amount: typeof amount === 'string' ? parseFloat(amount) : amount,
      category,
      type,
      description,
      date
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] rounded-2xl w-full max-w-md shadow-xl border border-slate-800 overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50">
          <h3 className="text-xl font-bold text-white">{initialData ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-3 rounded-lg font-bold transition-colors ${type === 'expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-[#0f172a] text-slate-400 border border-slate-800'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-3 rounded-lg font-bold transition-colors ${type === 'income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#0f172a] text-slate-400 border border-slate-800'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400">₹</span>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors appearance-none"
              >
                {type === 'expense' ? (
                  <>
                    <option>Food</option>
                    <option>Transport</option>
                    <option>Utilities</option>
                    <option>Entertainment</option>
                    <option>Shopping</option>
                    <option>Other</option>
                  </>
                ) : (
                  <>
                    <option>Salary</option>
                    <option>Freelance</option>
                    <option>Investments</option>
                    <option>Gift</option>
                    <option>Other</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0f172a] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors [color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description (Optional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors"
              placeholder="e.g. Groceries at Whole Foods"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-bold py-3 rounded-lg transition-colors mt-4"
          >
            Save Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
