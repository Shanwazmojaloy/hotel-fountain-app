import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Receipt,
  ShieldCheck,
  LogOut,
  Wallet,
  ChevronRight,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { User, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentUser,
  activeTab,
  setActiveTab,
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.FRONT_DESK, Role.ACCOUNTANT] },
    { id: 'reservations', label: 'Reservations', icon: CalendarDays, roles: [Role.ADMIN, Role.FRONT_DESK] },
    { id: 'guests', label: 'Guest Ledger', icon: Users, roles: [Role.ADMIN, Role.FRONT_DESK] },
    { id: 'billing', label: 'Invoices', icon: Receipt, roles: [Role.ADMIN, Role.FRONT_DESK, Role.ACCOUNTANT] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: [Role.ADMIN, Role.ACCOUNTANT, Role.FRONT_DESK] },
    { id: 'salaries', label: 'Payroll', icon: Wallet, roles: [Role.ADMIN] },
    { id: 'settings', label: 'Security', icon: ShieldCheck, roles: [Role.ADMIN] },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FDFBF7]">
      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 bg-[#242424]/60 z-[60] md:hidden backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
      />

      {/* Primary Sidebar */}
      <aside className={`
        fixed md:relative z-[70] w-[200px] bg-[#242424] text-white flex flex-col h-full transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        shadow-[10px_0_30px_rgba(0,0,0,0.2)] flex-shrink-0
      `}>
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/5 flex flex-col relative">
          <button
            onClick={closeSidebar}
            className="md:hidden absolute right-4 top-5 p-2 text-white/40 hover:text-[#C5A059] transition-colors"
          >
            <X size={18} />
          </button>
          <span className="text-lg font-black tracking-tighter uppercase text-[#C5A059] leading-tight">Hotel Fountain</span>
          <span className="text-[7.5px] font-black text-white/40 tracking-[0.4em] uppercase mt-1">Luxury in Comfort</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-4 px-2.5 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.filter(item => item.roles.includes(currentUser.role)).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between group px-3.5 py-3 rounded-xl transition-all duration-300 ${isActive
                    ? 'active-nav-item scale-[1.02]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon size={16} className={`flex-shrink-0 ${isActive ? 'text-[#242424]' : 'group-hover:text-[#C5A059] transition-colors'}`} />
                  <span className="font-bold text-[9.5px] uppercase tracking-wider leading-none whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={12} className="opacity-80 text-[#242424] flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer / Profile */}
        <div className="mt-auto p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-8 h-8 rounded-xl bg-[#C5A059] flex items-center justify-center text-[#242424] font-black text-xs shadow-lg shadow-[#C5A059]/20 flex-shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[9px] font-black truncate text-white uppercase tracking-tight leading-tight">{currentUser.name}</p>
              <p className="text-[6.5px] text-white/40 font-black uppercase tracking-[0.2em] mt-1">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-white/60 hover:text-white transition-all group rounded-xl hover:bg-white/5"
          >
            <LogOut size={14} className="flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Exit Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 relative flex flex-col min-w-0 h-full overflow-x-hidden bg-[#FDFBF7]">
        {/* Header */}
        <header className="h-12 border-b border-[#C5A059]/10 flex items-center justify-between px-4 md:px-6 bg-white flex-shrink-0 z-20">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button
              className="md:hidden p-2 -ml-2 text-[#242424] hover:bg-black/5 rounded-xl transition-colors flex-shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 md:gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-left truncate">
              <span className="text-[#C5A059] hidden sm:inline whitespace-nowrap">Hotel Fountain</span>
              <ChevronRight size={10} className="text-[#C5A059]/40 hidden sm:inline flex-shrink-0" />
              <span className="text-[#242424] truncate">{activeTab.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
            <div className="hidden lg:flex items-center gap-2 text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest">
              <div className="flex items-center gap-1.5 bg-[#E1F5E6] px-2.5 py-1 rounded-full border border-[#5E7D63]/10">
                <span className="w-1 h-1 rounded-full bg-[#5E7D63] animate-pulse"></span>
                <span className="text-[#5E7D63] text-[7.5px]">System Live</span>
              </div>
            </div>

            <p className="text-[9px] font-black text-[#242424] uppercase tracking-widest whitespace-nowrap">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
            </p>
          </div>
        </header>

        {/* Page Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto no-scrollbar">
            <div className="min-h-full">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};