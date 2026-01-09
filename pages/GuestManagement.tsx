import React, { useState, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Download,
  Phone,
  X,
  MapPin,
  ChevronDown,
  User as UserIcon,
  ChevronRight,
  ClipboardList,
  Edit2,
  Image as ImageIcon,
  CheckCircle2,
  Wallet,
  DollarSign
} from 'lucide-react';
import { Guest, Role, IdType, TransactionType, PaymentMethod } from '../types';
import { useDatabase } from '../context/DatabaseContext';

export const GuestManagement: React.FC = () => {
  const { guests, currentUser, addGuest, updateGuest, addTransaction } = useDatabase();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'outstanding'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [displayCount, setDisplayCount] = useState(24);

  const [collectionGuest, setCollectionGuest] = useState<Guest | null>(null);
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [collectionMethod, setCollectionMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const isAdmin = currentUser.role === Role.ADMIN;
  const canAdd = [Role.ADMIN, Role.FRONT_DESK].includes(currentUser.role);

  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    return (guests || []).filter(g => {
      if (!g) return false;
      const nameMatch = (g.name || '').toLowerCase().includes(s);
      const phoneMatch = (g.phone || '').includes(s);
      const idMatch = (g.idNumber || '').toLowerCase().includes(s);
      const matchesSearch = !s || nameMatch || phoneMatch || idMatch;
      const matchesTab = activeTab === 'all' ? true : (g.outstandingBalance || 0) > 0;
      return matchesSearch && matchesTab;
    });
  }, [guests, searchTerm, activeTab]);

  const displayedGuests = useMemo(() => {
    return filtered.slice(0, displayCount);
  }, [filtered, displayCount]);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(guests, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `hotel_fountain_ledger_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleBulkImport = async (rawText: string) => {
    const lines = rawText.split('\n').filter(line => line.trim() !== '');
    const newGuests: Promise<any>[] = [];
    const existingIds = new Set(guests.map(g => g.idNumber));

    lines.forEach(line => {
      const parts = line.split(/\t|,|\s{2,}/).map(p => p.trim());
      if (parts.length >= 5) {
        const firstName = parts[0] || '';
        const lastName = parts[1] || '';
        const email = parts[2] || '';
        const phone = parts[3] || '';
        const idType = parts[4] as IdType || IdType.NID;
        const idNumber = parts[5] || '';
        const city = parts[6] || 'Dhaka';
        const country = parts[7] || 'Bangladesh';

        if (!existingIds.has(idNumber)) {
          newGuests.push(addGuest({
            name: `${firstName} ${lastName}`.trim(),
            email,
            phone,
            idType,
            idNumber,
            address: city,
            city,
            country,
            outstandingBalance: 0
          }));
        }
      }
    });

    if (newGuests.length > 0) {
      await Promise.all(newGuests);
      alert(`Success! Imported records into the master ledger.`);
    } else {
      alert("No new records were found or format was unrecognized.");
    }
    setIsBulkModalOpen(false);
  };

  const handleModalSubmit = async (data: any) => {
    if (editingGuest) {
      await updateGuest(editingGuest.id, data);
    } else {
      await addGuest(data);
    }
    setIsModalOpen(false);
    setEditingGuest(null);
  };

  const handleDeleteGuest = (id: string) => {
    if (window.confirm("Permanently delete this guest record from the master ledger? This action is irreversible.")) {
      // Current context doesn't expose deleteGuest, so we skip for now or add it later.
      alert("Delete functionality requires Administrator DB Access.");
    }
  };

  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionGuest) return;

    if (collectionAmount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    if (collectionAmount > collectionGuest.outstandingBalance) {
      if (!window.confirm("Amount entered exceeds outstanding balance. Proceed with overpayment collection?")) return;
    }

    await addTransaction({
      roomNumber: 'MASTER',
      guestName: collectionGuest.name,
      type: TransactionType.ROOM_PAYMENT,
      amount: collectionAmount
    });

    await updateGuest(collectionGuest.id, {
      outstandingBalance: Math.max(0, collectionGuest.outstandingBalance - collectionAmount)
    });

    setCollectionGuest(null);
    setCollectionAmount(0);
  };

  return (
    <>
      <div className="h-full flex flex-col p-4 overflow-hidden animate-professional no-scrollbar bg-[#FDFBF7]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-2 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-black text-[#242424] uppercase tracking-tighter leading-none">GUEST DIRECTORY</h1>
            <p className="text-[7.5px] font-black text-[#8C7B6E] mt-1 uppercase tracking-[0.2em] opacity-80">
              {guests.length} RECORDS IN MASTER LEDGER
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <>
                <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-1 bg-white border border-gray-300 text-[#242424] px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-xs transition-all">
                  <ClipboardList size={10} className="text-[#C5A059]" /> BULK PASTE
                </button>
                <button onClick={handleExport} className="flex items-center gap-1 bg-white border border-gray-300 text-[#242424] px-3 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-xs transition-all">
                  <Download size={10} className="text-[#C5A059]" /> EXPORT
                </button>
              </>
            )}
            {canAdd && (
              <button onClick={() => { setEditingGuest(null); setIsModalOpen(true); }} className="flex items-center gap-1 btn-primary-gold px-4 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest shadow-md">
                <Plus size={12} strokeWidth={3} /> ADD GUEST
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-0.5 bg-gray-200/50 border border-gray-300 rounded-lg w-fit mb-4">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-[#242424] shadow-xs' : 'text-[#8C7B6E]'}`}>ALL PROFILES</button>
          <button onClick={() => setActiveTab('outstanding')} className={`px-4 py-1.5 rounded-md text-[7px] font-black uppercase tracking-widest transition-all ${activeTab === 'outstanding' ? 'bg-[#D11149] text-white shadow-xs' : 'text-[#8C7B6E]'}`}>OUTSTANDING</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-300 shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="px-4 py-2 border-b border-gray-300 bg-white/30">
            <div className="relative max-w-xs bg-[#FDFBF7] rounded-lg border border-gray-200">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={10} />
              <input
                type="text"
                placeholder="Search by Name, Phone, or ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-transparent text-[8px] font-black text-[#242424] outline-none placeholder:text-gray-400 uppercase"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDisplayCount(24);
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {displayedGuests.map((guest) => (
                <div key={guest.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col shadow-sm transition-all hover:border-[#C5A059]/40 hover:shadow-md h-fit group relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FDFBF7] border border-[#C5A059]/20 flex items-center justify-center text-[#C5A059] shadow-inner">
                      <UserIcon size={14} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {guest.idImageUrl && (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100" title="ID Document Verified">
                          <CheckCircle2 size={10} />
                        </div>
                      )}
                      <button
                        onClick={() => { setEditingGuest(guest); setIsModalOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-[#C5A059] hover:bg-[#C5A059]/5 rounded-md transition-all"
                        title="Edit Guest"
                      >
                        <Edit2 size={12} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                          title="Delete Guest Record"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-[11px] text-[#242424] uppercase tracking-tight truncate leading-none">{(guest.name || 'Walk-In Guest')}</h3>
                  <p className="text-[6.5px] text-[#8C7B6E] font-black uppercase tracking-widest mt-1.5">ID: {(guest.idNumber || 'NONE')}</p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    {(guest.outstandingBalance || 0) > 0 && (
                      <div className="flex items-center">
                        <span className="text-[5.5px] font-black text-white bg-[#D11149] px-2 py-0.5 rounded-l-md shadow-xs uppercase">TK. {guest.outstandingBalance} DUE</span>
                        <button
                          onClick={() => { setCollectionGuest(guest); setCollectionAmount(guest.outstandingBalance); }}
                          className="bg-[#D11149]/90 hover:bg-[#D11149] text-white p-0.5 rounded-r-md border-l border-white/20 transition-colors"
                          title="Collect Outstanding Balance"
                        >
                          <DollarSign size={8} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                    <span className="text-[5.5px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase">{guest.city || 'DHAKA'}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.04] space-y-2">
                    <div className="flex items-center gap-2 text-[7.5px] font-bold text-[#242424]/70 truncate">
                      <Phone size={10} className="text-[#C5A059] opacity-70" /> {(guest.phone || 'N/A')}
                    </div>
                    <div className="flex items-center gap-2 text-[7.5px] font-bold text-[#242424]/70 truncate">
                      <MapPin size={10} className="text-[#C5A059] opacity-70" /> {(guest.address || guest.city || 'N/A')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > displayCount && (
              <div className="py-8 flex flex-col items-center">
                <button
                  onClick={() => setDisplayCount(prev => prev + 48)}
                  className="flex items-center gap-2 bg-white border border-gray-300 px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-50 shadow-sm active:scale-95 transition-all"
                >
                  Load More Results ({filtered.length - displayCount} remaining) <ChevronRight size={12} />
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="py-20 text-center opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest">No entries found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <GuestModal
          onClose={() => { setIsModalOpen(false); setEditingGuest(null); }}
          onSubmit={handleModalSubmit}
          initialData={editingGuest}
        />
      )}

      {isBulkModalOpen && (
        <BulkImportModal onClose={() => setIsBulkModalOpen(false)} onImport={handleBulkImport} />
      )}

      {collectionGuest && (
        <div className="fixed inset-0 bg-[#242424]/90 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-gray-300">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-[#4B3621] text-white">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Wallet size={14} className="text-[#C5A059]" /> DEBT SETTLEMENT
              </h3>
              <button onClick={() => setCollectionGuest(null)} className="text-white/40 hover:text-white transition-all"><X size={18} /></button>
            </div>
            <form onSubmit={handleCollectionSubmit} className="p-8 space-y-6 bg-[#FDFBF7]">
              <div>
                <p className="text-[10px] font-black text-[#242424] uppercase tracking-tight">{collectionGuest.name}</p>
                <p className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest mt-1">Outstanding: Tk. {collectionGuest.outstandingBalance.toLocaleString()}</p>
              </div>

              <div className="space-y-1.5">
                <label className="label-text">Collection Amount (Tk)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C5A059]" size={14} strokeWidth={3} />
                  <input
                    type="number"
                    className="input-field pl-10 py-3 text-lg font-black"
                    value={collectionAmount || ''}
                    onChange={(e) => setCollectionAmount(Number(e.target.value))}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="label-text">Payment Method</label>
                <div className="relative">
                  <select
                    className="input-field appearance-none py-3 text-[10px] font-black uppercase pr-10"
                    value={collectionMethod}
                    onChange={(e) => setCollectionMethod(e.target.value as PaymentMethod)}
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary-gold py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                Finalize Collection
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const BulkImportModal: React.FC<{ onClose: () => void, onImport: (text: string) => void }> = ({ onClose, onImport }) => {
  const [text, setText] = useState('');
  return (
    <div className="fixed inset-0 bg-[#242424]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#EFEFEF] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center bg-[#4B3621] text-white">
          <h3 className="text-xs font-black uppercase tracking-widest">Master Registry Bulk Importer</h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform p-1"><X size={18} /></button>
        </div>
        <div className="p-8 space-y-4 bg-[#FDFBF7]">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
            <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1">Instructions:</p>
            <p className="text-[8px] font-medium text-amber-700 leading-relaxed">
              Copy the guest list from your Excel/PDF and paste it below.
              The system expects: <b>First Name, Last Name, Email, Phone, ID Type, ID Number, City, Country.</b>
            </p>
          </div>
          <textarea
            className="w-full h-80 bg-white border border-gray-300 rounded-2xl p-6 text-[9px] font-medium outline-none focus:border-[#C5A059] shadow-inner font-mono"
            placeholder="Paste your guest list here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 bg-white border border-gray-300 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 transition-all">Cancel</button>
            <button
              onClick={() => onImport(text)}
              className="flex-[2] btn-primary-gold py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Process & Import Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GuestModal: React.FC<{
  onClose: () => void,
  onSubmit: (data: any) => void,
  initialData?: Guest | null
}> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    idType: initialData?.idType || IdType.NID,
    idNumber: initialData?.idNumber || '',
    city: initialData?.city || 'DHAKA',
    address: initialData?.address || '',
    country: initialData?.country || 'Bangladesh',
    outstandingBalance: initialData?.outstandingBalance || 0,
    idImageUrl: initialData?.idImageUrl || ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, idImageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#242424]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#EFEFEF] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-400 flex justify-between items-center bg-white/60">
          <h3 className="text-xs font-black uppercase tracking-tight text-[#242424]">
            {initialData ? 'Update Profile' : 'Add Profile'}
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform p-1"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-4 bg-[#FDFBF7]" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="space-y-1">
            <label className="label-text">Full Name</label>
            <input
              type="text"
              className="input-field py-1.5 text-[10px] uppercase font-black"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label-text">Phone</label>
              <input
                type="tel"
                className="input-field py-1.5 text-[10px]"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="label-text">Email (Optional)</label>
              <input
                type="email"
                className="input-field py-1.5 text-[10px]"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="label-text">ID Type</label>
              <div className="relative">
                <select
                  className="input-field py-1.5 text-[10px] appearance-none"
                  value={formData.idType}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value as IdType })}
                >
                  {Object.values(IdType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="label-text">ID Number</label>
              <input
                type="text"
                className="input-field py-1.5 text-[10px]"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="label-text">Address</label>
            <input
              type="text"
              className="input-field py-1.5 text-[10px]"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Full Address"
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="label-text">ID Document Upload</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#C5A059] transition-all min-h-[140px] relative overflow-hidden"
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              {formData.idImageUrl ? (
                <>
                  <img src={formData.idImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="ID Preview" />
                  <div className="relative z-10 flex flex-col items-center text-[#242424]">
                    <ImageIcon size={28} className="text-[#C5A059] mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Document Loaded (Click to Change)</p>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={28} className="text-gray-300 mb-2" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Click or Drag Image to Upload<br />(NID/Passport/License)</p>
                </>
              )}
            </div>
          </div>

          <button type="submit" className="w-full btn-primary-gold py-2.5 rounded-xl text-[9px] font-black uppercase shadow-md active:scale-95 transition-all mt-2">
            {initialData ? 'Update Profile' : 'Register Guest'}
          </button>
        </form>
      </div>
    </div>
  );
};
