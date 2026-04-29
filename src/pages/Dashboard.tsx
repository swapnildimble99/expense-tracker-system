import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import {ArrowUpRight, ArrowDownRight, DollarSign, Trash2, Edit2, Download, ArrowUpDown} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

type SortKey = 'date' | 'amount' | 'category';

function SetBudgetModal({ onClose, onSave }: { onClose: () => void, onSave: (category: string, amount: number) => Promise<void> }) {
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = [
    'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(category, parseFloat(amount));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] rounded-2xl w-full max-w-sm shadow-xl border border-slate-800 overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#1e293b]/50">
          <h3 className="text-lg font-bold text-white">Set Budget Goal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-colors appearance-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Amount</label>
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
          <button 
            type="submit"
            disabled={saving}
            className="w-full bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-bold py-3 rounded-lg transition-colors mt-6 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Budget'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Dashboard({ refreshTrigger, onEditTransaction }: { refreshTrigger: number, onEditTransaction: (tx: any) => void }) {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const fetchData = async () => {
    try {
      const [txRes, bRes] = await Promise.all([
        fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/budgets', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (txRes.ok && bRes.ok) {
        const txData = await txRes.json();
        const bData = await bRes.json();
        setTransactions(txData);
        setBudgets(bData);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, refreshTrigger]);

  const deleteTransaction = async (id: number) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveBudget = async (category: string, amount: number) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ category, amount })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to save budget');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving budget');
    }
  };

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'amount') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
      // Optional: adjust by type (expense as negative?) 
      // But usually just raw amount for sorting by amount is fine.
    } else if (sortConfig.key === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else {
      aVal = aVal.toString().toLowerCase();
      bVal = bVal.toString().toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvRows = [headers.join(',')];
    
    sortedTransactions.forEach(tx => {
      const date = typeof tx.date === 'string' ? tx.date.substring(0, 10) : new Date(tx.date).toISOString().substring(0, 10);
      const row = [
        date,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        `"${tx.category}"`,
        tx.type,
        tx.amount
      ];
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex h-full items-center justify-center text-slate-400">Loading...</div>;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const expByCat = transactions.filter(t => t.type === 'expense').reduce((acc: any, t) => {
    acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
    return acc;
  }, {});
  
  const pieData = Object.keys(expByCat).map(key => ({ name: key, value: expByCat[key] }));
  const COLORS = ['#38bdf8', '#fb7185', '#34d399', '#fbbf24', '#a78bfa', '#94a3b8'];

  // format for bar chart by date
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const barData = last7Days.map(date => {
    const dayTrans = transactions.filter(t => {
      const txDateStr = typeof t.date === 'string' ? t.date : new Date(t.date).toISOString();
      return txDateStr.startsWith(date);
    });
    const income = dayTrans.filter(t => t.type === 'income').reduce((a, t) => a + parseFloat(t.amount), 0);
    const expense = dayTrans.filter(t => t.type === 'expense').reduce((a, t) => a + parseFloat(t.amount), 0);
    return { name: date.split('-').slice(1).join('/'), income, expense };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {error && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm font-medium">{error}</div>}
      
      {/* Stats Cards */}
      {/* Header element to adapt to theme */}
      <header className="-mx-8 -mt-8 mb-8 h-20 bg-[#1e293b]/50 border-b border-slate-800 flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">Financial Overview</h1>
          <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">Current</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-slate-400 text-sm font-medium">Total Balance</div>
            <div className="p-2 bg-[#38bdf8]/10 rounded-lg">
              <DollarSign className="text-[#38bdf8] w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">₹{balance.toFixed(2)}</div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-slate-400 text-sm font-medium">Total Income</div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ArrowUpRight className="text-emerald-400 w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">₹{totalIncome.toFixed(2)}</div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="text-slate-400 text-sm font-medium">Total Expense</div>
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <ArrowDownRight className="text-rose-400 w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white mt-2">₹{totalExpense.toFixed(2)}</div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 flex flex-col">
          <h3 className="text-white font-bold text-lg mb-6">Cash Flow (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '14px' }}
                />
                <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 flex flex-col">
          <h3 className="text-white font-bold text-lg mb-6">Expenses by Category</h3>
          <div className="h-64 flex-grow">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '14px', color: '#fff' }}
                  />
                </PieChart>
               </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No expenses yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Goals section */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Category Budgets</h3>
          <button 
            onClick={() => setIsBudgetModalOpen(true)}
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 border border-slate-700 rounded-lg transition-colors"
          >
            Set Goal
          </button>
        </div>
        {budgets.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No budgets set. Set monthly goals in settings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map(b => {
              const spent = expByCat[b.category] || 0;
              const limit = parseFloat(b.amount);
              const percent = Math.min((spent / limit) * 100, 100);
              const isOver = spent > limit;
              return (
                <div key={b.id} className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 font-semibold">{b.category}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${isOver ? 'bg-rose-500/10 text-rose-400' : 'bg-[#38bdf8]/10 text-[#38bdf8]'}`}>
                      ₹{spent.toFixed(2)} / ₹{limit.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : 'bg-[#38bdf8]'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-slate-500 mt-1 font-medium select-none text-opacity-80">
                    {percent.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Recent Transactions</h3>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 border border-slate-700 rounded-lg transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No transactions found. Add one to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-sm border-b border-slate-800">
                  <th className="pb-4 font-medium px-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">Date <ArrowUpDown size={12} className={sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? "text-[#38bdf8] rotate-180 transition-transform" : "text-[#38bdf8] transition-transform") : ""} /></div>
                  </th>
                  <th className="pb-4 font-medium px-4">Description</th>
                  <th className="pb-4 font-medium px-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('category')}>
                    <div className="flex items-center gap-1">Category <ArrowUpDown size={12} className={sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? "text-[#38bdf8] rotate-180 transition-transform" : "text-[#38bdf8] transition-transform") : ""}/></div>
                  </th>
                  <th className="pb-4 font-medium px-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-1">Amount <ArrowUpDown size={12} className={sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? "text-[#38bdf8] rotate-180 transition-transform" : "text-[#38bdf8] transition-transform") : ""}/></div>
                  </th>
                  <th className="pb-4 font-medium px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-slate-700/20 transition-colors">
                    <td className="py-4 px-4 text-slate-300">
                      {typeof tx.date === 'string' ? tx.date.substring(0, 10) : new Date(tx.date).toISOString().substring(0, 10)}
                    </td>
                    <td className="py-4 px-4 text-white font-medium">
                      {tx.description || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 py-1 px-3 rounded-md text-xs font-semibold">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`py-4 px-4 font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button 
                        onClick={() => onEditTransaction(tx)}
                        className="text-slate-500 hover:text-[#38bdf8] transition-colors p-2 opacity-0 group-hover:opacity-100 mr-2"
                        title="Edit Transaction"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
                        title="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {isBudgetModalOpen && (
        <SetBudgetModal onClose={() => setIsBudgetModalOpen(false)} onSave={saveBudget} />
      )}
    </div>
  );
}
