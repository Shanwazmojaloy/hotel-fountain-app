import React, { useState } from 'react';
import {
  Users,
  Plus,
  Wallet,
  Clock,
  Search,
  XCircle,
  Briefcase,
  Edit3,
  Trash2,
  CalendarDays,
  CheckCircle2,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Staff, SalaryPayment, Role } from '../types';
import { useDatabase } from '../context/DatabaseContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Salaries: React.FC = () => {
  const { staff, payments, currentUser, addStaff, updateStaff, deleteStaff, addSalaryPayment } = useDatabase();
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'grid'>('directory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [gridYear, setGridYear] = useState(new Date().getFullYear());

  if (currentUser.role !== Role.ADMIN) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#FDFBF7] min-h-[400px] animate-professional">
        <div className="bg-rose-100 text-rose-600 p-5 rounded-full mb-4">
          <Briefcase size={48} />
        </div>
        <h2 className="text-xl font-black text-[#242424] uppercase tracking-tight">Access Denied</h2>
        <p className="text-[#8C7B6E] font-bold mt-2 text-xs max-w-xs mx-auto uppercase tracking-widest opacity-60">Payroll information is restricted to Administrative users only.</p>
      </div>
    );
  }

  const totalMonthlyPayroll = staff.reduce((acc, s) => acc + s.baseSalary + s.bonus - s.deductions, 0);
  const filteredStaff = staff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.designation.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDeleteStaff = async (id: string) => {
    if (confirm('Permanently delete employee record and their payout history?')) {
      await deleteStaff(id);
    }
  };

  const generateMonthlyLog = async () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const existing = payments.some(p => p.month === currentMonth && p.year === currentYear);
    if (existing && !confirm('Payment logs for this month already exist. Create duplicates?')) return;

    for (const s of staff) {
      await addSalaryPayment({
        staffId: s.id,
        month: currentMonth,
        year: currentYear,
        amount: s.baseSalary + s.bonus - s.deductions,
        status: 'PENDING'
      });
    }
    setActiveSubTab('grid');
    alert(`Cycle generated for ${currentMonth} ${currentYear}.`);
  };

  const getPaymentStatus = (staffId: string, month: string, year: number) => {
    return payments.find(p => p.staffId === staffId && p.month === month && p.year === year);
  };

  return (
    <>
      <div className="h-full flex flex-col p-4 md:p-6 lg:px-8 lg:py-6 space-y-4 overflow-hidden animate-professional no-scrollbar">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-black text-[#242424] tracking-tight uppercase leading-none">Staff Salaries</h1>
            <p className="text-[10px] md:text-xs font-black text-[#8C7B6E] mt-1 uppercase tracking-widest whitespace-nowrap">CONFIDENTIAL PAYROLL DIRECTORY</p>
          </div>

          <div className="flex bg-[#242424]/5 p-1 rounded-xl flex-shrink-0 border border-gray-300 shadow-sm">
            <button
              onClick={() => setActiveSubTab('directory')}
              className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeSubTab === 'directory' ? 'bg-[#C5A059] text-[#242424] shadow-sm' : 'text-[#8C7B6E] hover:text-[#242424]'}`}
            >
              Directory
            </button>
            <button
              onClick={() => setActiveSubTab('grid')}
              className={`px-6 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${activeSubTab === 'grid' ? 'bg-[#C5A059] text-[#242424] shadow-sm' : 'text-[#8C7B6E] hover:text-[#242424]'}`}
            >
              Payroll Matrix
            </button>
          </div>
        </div>

        {/* KPI Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 flex-shrink-0">
          <KpiCard label="Monthly Payroll" value={`Tk. ${totalMonthlyPayroll.toLocaleString()}`} icon={Wallet} color="#C5A059" bg="#FDFBF7" />
          <KpiCard label="Active Employees" value={staff.length} icon={Users} color="#0284c7" bg="#FDFBF7" />
          <KpiCard label="Pending Payments" value={payments.filter(p => p.status === 'PENDING').length} icon={Clock} color="#d97706" bg="#FDFBF7" />
        </div>

        {/* Table Container */}
        <div className="flex-1 glass-surface rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col shadow-sm min-h-0 bg-white/40">
          <div className="px-4 py-3 border-b border-gray-400 bg-white/30 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:max-w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7B6E]" size={12} />
                <input
                  type="text"
                  placeholder="Find staff..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white/80 border border-gray-400 rounded-lg text-[10px] font-black text-[#242424] focus:ring-2 focus:ring-[#C5A059] outline-none transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {activeSubTab === 'grid' && (
                <div className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-inner gap-2">
                  <button onClick={() => setGridYear(prev => prev - 1)} className="p-1 hover:text-[#C5A059] transition-colors"><ChevronLeft size={14} /></button>
                  <span className="text-[10px] font-black text-[#242424] min-w-[36px] text-center">{gridYear}</span>
                  <button onClick={() => setGridYear(prev => prev + 1)} className="p-1 hover:text-[#C5A059] transition-colors"><ChevronRight size={14} /></button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeSubTab === 'directory' ? (
                <button
                  onClick={() => { setEditingStaff(null); setIsStaffModalOpen(true); }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 btn-primary-gold px-8 py-2 rounded-xl shadow-md active:scale-95 transition-all text-[10px] font-black whitespace-nowrap"
                >
                  <Plus size={14} strokeWidth={3} /> NEW EMPLOYEE
                </button>
              ) : (
                <button
                  onClick={generateMonthlyLog}
                  className="w-full sm:w-auto btn-primary-gold px-8 py-2 rounded-xl shadow-md active:scale-95 transition-all text-[10px] font-black whitespace-nowrap"
                >
                  GENERATE CYCLE
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar">
            {activeSubTab === 'directory' ? (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#FDFBF7]/50 text-[#8C7B6E] text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-400 sticky top-0 z-10">
                    <th className="px-6 py-3">Employee Details</th>
                    <th className="px-6 py-3">Joining Date</th>
                    <th className="px-6 py-3">Structure (Tk.)</th>
                    <th className="px-6 py-3">Net Payout</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <Users size={40} />
                          <p className="text-[10px] font-black uppercase tracking-widest">No staff records found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(s => (
                      <tr key={s.id} className="hover:bg-white/50 transition-colors group">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] font-black text-[11px] border border-[#C5A059]/20 shadow-xs">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-[#242424] uppercase truncate tracking-tight">{s.name}</p>
                              <p className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest mt-0.5 truncate">{s.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[10px] font-black text-[#242424] whitespace-nowrap">{s.joiningDate}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col gap-0.5 whitespace-nowrap">
                            <p className="text-[9px] font-black text-[#242424]">BASE: {s.baseSalary.toLocaleString()}</p>
                            <div className="flex gap-2">
                              <span className="text-[7px] font-black text-emerald-700">+{s.bonus} BONUS</span>
                              <span className="text-[7px] font-black text-rose-700">-{s.deductions} DED.</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-[11px] font-black text-[#C5A059] whitespace-nowrap">Tk. {(s.baseSalary + s.bonus - s.deductions).toLocaleString()}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingStaff(s); setIsStaffModalOpen(true); }} className="p-1.5 text-[#8C7B6E] hover:text-[#C5A059] transition-all bg-white rounded-md border border-gray-300 shadow-xs"><Edit3 size={12} /></button>
                            <button onClick={() => handleDeleteStaff(s.id)} className="p-1.5 text-[#8C7B6E] hover:text-rose-600 transition-all bg-white rounded-md border border-gray-300 shadow-xs"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* Payroll Grid View */
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead>
                  <tr className="bg-[#FDFBF7]/50 text-[#8C7B6E] text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-400 sticky top-0 z-10">
                    <th className="px-6 py-4 min-w-[200px] sticky left-0 bg-[#FDFBF7] z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Employee Name</th>
                    <th className="px-6 py-4 text-center border-l border-gray-300/30">Base Salary (Tk.)</th>
                    {MONTHS.map(m => (
                      <th key={m} className="px-2 py-4 text-center text-[8px] border-l border-gray-300/30">{m.substring(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <CalendarDays size={40} />
                          <p className="text-[10px] font-black uppercase tracking-widest">No matching records</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(s => (
                      <tr key={s.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-6 py-3 sticky left-0 bg-white/95 backdrop-blur-sm z-10 border-r border-gray-300/30 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <p className="text-[10px] font-black text-[#242424] uppercase tracking-tight truncate">{s.name}</p>
                          <p className="text-[7px] font-bold text-[#8C7B6E] uppercase truncate">{s.designation}</p>
                        </td>
                        <td className="px-6 py-3 text-center border-l border-gray-300/10">
                          <p className="text-[10px] font-black text-[#242424]">{s.baseSalary.toLocaleString()}</p>
                        </td>
                        {MONTHS.map(m => {
                          const status = getPaymentStatus(s.id, m, gridYear);
                          return (
                            <td key={m} className="px-2 py-3 text-center border-l border-gray-300/10">
                              {status ? (
                                <div className="flex flex-col items-center gap-1 group/status">
                                  {status.status === 'PAID' ? (
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                  ) : (
                                    <Clock size={14} className="text-amber-500 animate-pulse" />
                                  )}
                                  <span className="text-[6px] font-black text-gray-400 opacity-0 group-hover/status:opacity-100 transition-opacity">
                                    {status.amount.toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-200">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {isStaffModalOpen && (
        <StaffModal
          onClose={() => setIsStaffModalOpen(false)}
          onSubmit={async (data) => {
            if (editingStaff) {
              await updateStaff(editingStaff.id, data);
            } else {
              await addStaff(data);
            }
            setIsStaffModalOpen(false);
          }}
          initialData={editingStaff}
        />
      )}
    </>
  );
};

const KpiCard: React.FC<{ label: string; value: string | number; icon: any; color: string; bg: string }> = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white distinct-border p-3 rounded-2xl shadow-xs flex items-center gap-4 transition-all duration-300 hover:shadow-md min-w-0 flex-1">
    <div className="p-3 rounded-xl flex-shrink-0" style={{ backgroundColor: `${color}10` }}>
      <Icon size={18} style={{ color: color }} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-black text-[#8C7B6E] uppercase tracking-widest truncate leading-tight whitespace-nowrap">{label}</p>
      <p className="text-xl font-black tracking-tighter leading-none mt-1 text-[#242424] whitespace-nowrap">{value}</p>
    </div>
  </div>
);

const StaffModal: React.FC<{ onClose: () => void, onSubmit: (data: any) => void, initialData: Staff | null }> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    designation: initialData?.designation || '',
    joiningDate: initialData?.joiningDate || new Date().toISOString().split('T')[0],
    baseSalary: initialData?.baseSalary || 20000,
    bonus: initialData?.bonus || 0,
    deductions: initialData?.deductions || 0,
  });

  return (
    <div className="fixed inset-0 bg-[#242424]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#EFEFEF] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden distinct-border animate-in zoom-in duration-300">
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center bg-white/40">
          <h3 className="text-base font-black text-[#242424] uppercase tracking-tighter flex items-center gap-3 truncate pr-4">
            <UserPlus className="text-[#C5A059] flex-shrink-0" size={20} /> <span>{initialData ? 'Update Staff Member' : 'New Employee Enrollment'}</span>
          </h3>
          <button onClick={onClose} className="text-[#8C7B6E] hover:text-rose-600 transition-colors p-1 bg-gray-200/50 rounded-full"><XCircle size={20} /></button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="space-y-1">
            <label className="label-text">Full Legal Name</label>
            <input type="text" className="input-field py-2 bg-[#FDFBF7]/50" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label-text">Designation</label>
              <input type="text" className="input-field py-2 bg-[#FDFBF7]/50" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required placeholder="Position" />
            </div>
            <div className="space-y-1">
              <label className="label-text">Joining Date</label>
              <input type="date" className="input-field py-2 bg-[#FDFBF7]/50" value={formData.joiningDate} onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })} required />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-400 shadow-inner">
            <label className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-[0.2em] block mb-3 text-center">Remuneration Structure</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1 text-center">
                <label className="text-[7px] font-black text-[#242424] uppercase">Base (Tk)</label>
                <input type="number" className="w-full bg-[#FDFBF7] border border-gray-300 rounded-lg px-2 py-1.5 text-[10px] font-black text-center outline-none focus:ring-1 focus:ring-[#C5A059]" value={formData.baseSalary} onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })} />
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[7px] font-black text-emerald-700 uppercase">Bonus</label>
                <input type="number" className="w-full bg-[#FDFBF7] border border-gray-300 rounded-lg px-2 py-1.5 text-[10px] font-black text-center text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-500" value={formData.bonus} onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })} />
              </div>
              <div className="space-y-1 text-center">
                <label className="text-[7px] font-black text-rose-700 uppercase">Deduc.</label>
                <input type="number" className="w-full bg-[#FDFBF7] border border-gray-300 rounded-lg px-2 py-1.5 text-[10px] font-black text-center text-rose-700 outline-none focus:ring-1 focus:ring-rose-500" value={formData.deductions} onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-400 mt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white text-[#8C7B6E] px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-gray-100 transition-colors border border-gray-400 shadow-sm">Cancel</button>
            <button type="submit" className="flex-[1.5] btn-primary-gold px-4 py-2.5 rounded-xl shadow-md text-[10px] font-black tracking-widest active:scale-95 transition-all">Save Records</button>
          </div>
        </form>
      </div>
    </div>
  );
};
