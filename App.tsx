import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Reservations } from './pages/Reservations';
import { GuestManagement } from './pages/GuestManagement';
import { Billing } from './pages/Billing';
import { Reports } from './pages/Reports';
import { Salaries } from './pages/Salaries';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';

const AppContent: React.FC = () => {
  const { currentUser, logout, loading } = useDatabase();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FDFBF7] space-y-4">
        <div className="text-[#C5A059] font-black uppercase text-xl animate-pulse tracking-widest">Hotel Fountain</div>
        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest">Connecting to Database...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout
      currentUser={currentUser}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={() => setIsAuthenticated(false)}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'reservations' && <Reservations />}
      {activeTab === 'guests' && <GuestManagement />}
      {activeTab === 'billing' && <Billing />}
      {activeTab === 'reports' && <Reports />}
      {activeTab === 'salaries' && <Salaries />}
      {activeTab === 'settings' && <Settings />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
};

export default App;
