import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Sidebar from './components/Sidebar';
import AddTransactionModal from './components/AddTransactionModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const DashboardLayout = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);
  const [refresh, setRefresh] = useState(0);
  const { token } = useAuth();

  const handleAddTransaction = async (data: any) => {
    try {
      const url = data.id ? `/api/transactions/${data.id}` : '/api/transactions';
      const method = data.id ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      setRefresh(prev => prev + 1);
      setModalOpen(false);
      setEditingTx(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar onAddClicked={openAddModal} />
      <main className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-[#1e293b] p-4 flex justify-between items-center border-b border-slate-800">
           <span className="text-white font-bold tracking-tight text-xl">Expensify</span>
           <button 
             onClick={openAddModal}
             className="bg-[#38bdf8] text-[#0f172a] px-4 py-2 rounded-lg text-sm font-bold transition-colors"
           >
             Add +
           </button>
        </div>
        <Dashboard refreshTrigger={refresh} onEditTransaction={handleEdit} />
      </main>
      <AddTransactionModal 
        isOpen={modalOpen} 
        onClose={() => { setModalOpen(false); setEditingTx(null); }} 
        onAdd={handleAddTransaction} 
        initialData={editingTx}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

