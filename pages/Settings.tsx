import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Settings as SettingsIcon,
  Trash2,
  Key,
  X,
  ChevronDown
} from 'lucide-react';
import { User, Role } from '../types';
import { useDatabase } from '../context/DatabaseContext';

export const Settings: React.FC = () => {
  const { currentUser, users, addUser, updateUser, deleteUser } = useDatabase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (currentUser.role !== Role.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 text-center animate-professional">
        <ShieldCheck size={48} className="mb-4 opacity-20" />
        <p className="font-black uppercase tracking-widest text-[10px]">Restricted Domain. Administrative Credentials Required.</p>
      </div>
    );
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      alert("Self-removal restricted. Cannot delete your own active session.");
      return;
    }
    if (window.confirm("Confirm permanent removal of this user? Revoking all access privileges.")) {
      await deleteUser(userId);
    }
  };

  const handleSaveUser = async (data: any) => {
    if (editingUser) {
      await updateUser(editingUser.id, data);
    } else {
      await addUser(data);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleResetSystem = () => {
    if (window.confirm("CRITICAL WARNING: This will purge all guest ledgers, reservations, and transactions. System state will return to zero. Proceed?")) {
      const confirmation = prompt("Type 'PURGE' to confirm hard reset:");
      if (confirmation === 'PURGE') {
        localStorage.clear();
        // Ideally this would also clear the DB via an admin API, but for now we only support 'users' in this view.
        // To really purge via Supabase, we'd need a backend function or RLS policy allowing massive delete.
        // For this demo step, we'll just reload.
        window.location.reload();
      }
    }
  };

  return (
    <>
      <div className="p-4 md:p-8 max-w-[1100px] mx-auto space-y-10 animate-professional bg-[#FDFBF7]">
        <div className="min-w-0">
          <h1 className="text-3xl font-black text-[#242424] uppercase tracking-tighter">System Security</h1>
          <p className="text-[11px] font-black text-[#8C7B6E] mt-1.5 uppercase tracking-widest">Manage administrative access and operational protocols</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-gray-400 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-400 flex justify-between items-center bg-white/40">
                <h2 className="text-base font-black text-[#242424] flex items-center gap-3 uppercase tracking-tighter">
                  <ShieldCheck className="text-[#C5A059]" size={20} />
                  User Access Control
                </h2>
                <button
                  onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 text-[#C5A059] text-[10px] font-black hover:text-[#242424] uppercase tracking-widest transition-all"
                >
                  <UserPlus size={16} />
                  NEW USER ENTRY
                </button>
              </div>

              <div className="divide-y divide-gray-100">
                {users.map((user) => (
                  <div key={user.id} className="p-8 flex items-center justify-between hover:bg-[#FDFBF7] transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-[#242424]/5 border border-gray-400 flex items-center justify-center font-black text-[#242424] text-sm shadow-inner">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#242424] uppercase tracking-tight">{user.name}</p>
                        <p className="text-[10px] font-black text-[#8C7B6E] uppercase tracking-widest mt-1 opacity-70">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border shadow-xs ${user.role === Role.ADMIN ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        user.role === Role.FRONT_DESK ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {user.role}
                      </span>
                      <div className="flex gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                          className="p-3 text-[#242424] hover:text-[#C5A059] bg-white border border-gray-300 rounded-xl transition-all shadow-sm"
                          title="Edit Permissions"
                        >
                          <Key size={16} />
                        </button>
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-3 text-[#242424] hover:text-rose-600 bg-white border border-gray-300 rounded-xl transition-all shadow-sm"
                            title="Revoke Access"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-400 shadow-sm flex flex-col gap-8 h-fit">
              <h3 className="text-[11px] font-black text-[#242424] uppercase tracking-widest flex items-center gap-3">
                <SettingsIcon size={18} className="text-[#C5A059]" />
                Property Protocol
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="label-text">Proprietary Name</label>
                  <input
                    type="text"
                    defaultValue="Hotel Fountain"
                    className="input-field h-12 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label-text">System Administrator</label>
                  <input
                    type="email"
                    defaultValue="admin@hotelfountain.com"
                    className="input-field h-12 text-sm"
                  />
                </div>
                <button className="w-full mt-4 btn-primary-gold py-4 rounded-2xl shadow-xl transition-all text-[11px] font-black uppercase tracking-widest active:scale-95">
                  Apply Global Protcols
                </button>
              </div>
            </div>

            <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-200 shadow-sm">
              <h4 className="text-rose-800 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Master Purge Protocol</h4>
              <p className="text-[9px] text-rose-600/70 font-bold uppercase leading-relaxed mb-6">Execution will result in complete data erasure across all local partitions.</p>
              <button
                onClick={handleResetSystem}
                className="w-full py-4 bg-white border border-rose-200 text-rose-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 hover:text-white transition-all shadow-sm active:scale-95"
              >
                PURGE SYSTEM DATA
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <UserModal
          onClose={() => { setIsModalOpen(false); setEditingUser(null); }}
          onSubmit={handleSaveUser}
          initialData={editingUser}
        />
      )}
    </>
  );
};

const UserModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: User | null;
}> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    role: initialData?.role || Role.FRONT_DESK,
  });

  return (
    <div className="fixed inset-0 bg-[#242424]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#EFEFEF] rounded-[3rem] w-full max-w-lg shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] overflow-hidden distinct-border animate-in zoom-in duration-300">
        <div className="px-10 py-6 border-b border-gray-400 flex justify-between items-center bg-white/60">
          <h3 className="text-xl font-black text-[#242424] uppercase tracking-tighter">
            {initialData ? 'RECONFIG CREDENTIALS' : 'GRANT SYSTEM ACCESS'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-rose-600 transition-all p-2 bg-gray-200/50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-10 bg-[#FDFBF7]">
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
            <div className="space-y-2">
              <label className="label-text">Official Identity</label>
              <input type="text" className="input-field h-12 text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Staff Full Name" />
            </div>

            <div className="space-y-2">
              <label className="label-text">Login Email</label>
              <input type="email" className="input-field h-12 text-sm" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="staff@hotelfountain.com" />
            </div>

            <div className="space-y-2">
              <label className="label-text">Administrative Pass-Key</label>
              <input type="text" className="input-field h-12 text-sm" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required placeholder="Min. 8 Chars Required" />
            </div>

            <div className="space-y-2">
              <label className="label-text">Operational Assignment (Role)</label>
              <div className="relative">
                <select
                  className="input-field h-12 text-sm appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                >
                  {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="flex gap-5 pt-8 mt-6 border-t border-gray-300">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white text-[#242424] px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-gray-100 transition-colors border border-gray-400 shadow-sm"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="flex-[1.5] btn-primary-gold px-6 py-4 rounded-2xl shadow-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
              >
                {initialData ? 'Commit Changes' : 'Execute Grant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};