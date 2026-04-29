import React from 'react';
import { LayoutDashboard, LogOut, Wallet, PlusCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function Sidebar({ onAddClicked }: { onAddClicked: () => void }) {
  const { logout, user } = useAuth();

  return (
    <aside className="w-64 bg-[#1e293b] border-r border-slate-800 h-screen sticky top-0 hidden md:flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 text-white mb-8">
          <div className="w-8 h-8 bg-[#38bdf8] rounded-lg flex items-center justify-center">
            <Wallet size={20} className="text-[#0f172a]" />
          </div>
          <span className="text-xl font-bold tracking-tight">Expensify</span>
        </div>
        
        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 bg-[#38bdf8]/10 text-[#38bdf8] px-4 py-3 rounded-lg font-medium transition-colors">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <button 
            onClick={onAddClicked}
            className="w-full flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800/50 px-4 py-3 rounded-lg transition-colors cursor-pointer font-medium"
          >
            <PlusCircle size={20} />
            Add Transaction
          </button>
        </nav>
      </div>
      
      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#38bdf8] to-cyan-200 flex items-center justify-center text-[#0f172a] font-bold shadow-lg">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest truncate">{user?.email?.split('@')[0]}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center justify-center gap-2 mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-md transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
