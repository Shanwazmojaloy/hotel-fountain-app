
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  ChevronDown,
  Calculator,
  Plus,
  Bookmark,
  CircleCheck,
  User as UserIcon,
  Search,
  Tag,
  AlertCircle,
  CheckCircle2,
  Upload,
  UserPlus,
  Trash2,
  LogOut,
  Info,
  Image as ImageIcon,
  DollarSign,
  Sparkles,
  Loader2,
  XCircle,
  FileWarning
} from 'lucide-react';
import { Reservation, Room, Guest, RoomStatus, PaymentMethod } from '../types';
import { formatToDDMMYYYY } from '../utils/dateUtils';
import { fastQuery } from '../lib/gemini';

import { useDatabase } from '../context/DatabaseContext';

interface ReservationModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  onCheckOut?: (resId: string, finalPayment: number, dueAmount: number) => void;
  initialData: Reservation | null;
  preSelectedRoom?: string;
  autoCheckIn?: boolean;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  onClose, onSubmit: parentSubmit, onCheckOut, initialData, preSelectedRoom, autoCheckIn
}) => {
  const { rooms, guests, setGuests, addGuest } = useDatabase(); // Note: setGuests might not be in context update? I need to check context logic.
  // Wait, the Context exposes addGuest/updateGuest, not setGuests directly usually. 
  // Let me re-read the Context definition I just wrote. 
  // Context has: addGuest, updateGuest. It does not expose setGuests directly.
  // So I need to adapt the logic. The modal logic handles "setGuests" for local image preview? 
  // Ah, the original code used setGuests for local image update. I should use a local state for optimistic UI or just rely on real-time?
  // Use local state for "guests" is not right if we want real time. 
  // But wait, the specific file-upload logic updated the guest array locally. 
  // I should change "handleFileChange" to call updateGuest immediately.

  const [customRates, setCustomRates] = useState<Record<string, number>>(() => {
    const rates: Record<string, number> = {};
    if (initialData?.roomIds) {
      initialData.roomIds.forEach(rid => {
        const room = rooms.find(r => r.roomNumber === rid);
        rates[rid] = room?.price || 0;
      });
    } else if (preSelectedRoom) {
      const room = rooms.find(r => r.roomNumber === preSelectedRoom);
      rates[preSelectedRoom] = room?.price || 0;
    }
    return rates;
  });

  const [formData, setFormData] = useState({
    stayType: initialData?.stayType || (initialData?.status === 'CHECKED_IN' ? 'CHECK_IN' : (autoCheckIn ? 'CHECK_IN' : 'RESERVATION')),
    roomIds: initialData?.roomIds || (preSelectedRoom ? [preSelectedRoom] : []),
    guestIds: initialData?.guestIds || [],
    checkIn: initialData?.checkIn || new Date().toISOString().split('T')[0],
    checkOut: initialData?.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    laundry: initialData?.laundry || 0,
    miniBar: initialData?.miniBar || 0,
    discount: initialData?.discount || 0,
    extraCharges: initialData?.extraCharges || 0,
    newCollection: 0,
    paymentMethod: initialData?.paymentMethod || PaymentMethod.CASH,
    onDutyOfficer: initialData?.onDutyOfficer || '',
    specialRequests: initialData?.specialRequests || '',
    notes: initialData?.notes || '',
  });

  const [showCheckOutConfirm, setShowCheckOutConfirm] = useState(false);
  const previouslyPaid = initialData?.paidAmount || 0;
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploadingForGuestId, setUploadingForGuestId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { updateGuest: updateGuestInDb } = useDatabase();

  const addRoom = () => {
    if (selectedRoomId && !formData.roomIds.includes(selectedRoomId)) {
      const room = rooms.find(r => r.roomNumber === selectedRoomId);
      setFormData({ ...formData, roomIds: [...formData.roomIds, selectedRoomId] });
      setCustomRates(prev => ({ ...prev, [selectedRoomId]: room?.price || 0 }));
      setSelectedRoomId('');
    }
  };

  const removeRoom = (id: string) => {
    setFormData({ ...formData, roomIds: formData.roomIds.filter(rid => rid !== id) });
    const newRates = { ...customRates };
    delete newRates[id];
    setCustomRates(newRates);
  };

  const toggleGuest = (guestId: string) => {
    setFormData(prev => ({
      ...prev,
      guestIds: prev.guestIds.includes(guestId)
        ? prev.guestIds.filter(id => id !== guestId)
        : [...prev.guestIds, guestId]
    }));
    setGuestSearch('');
    setIsGuestDropdownOpen(false);
  };

  const handleIdUploadTrigger = (guestId: string) => {
    setUploadingForGuestId(guestId);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingForGuestId) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageData = reader.result as string;
        // Directly update DB instead of local state
        await updateGuestInDb(uploadingForGuestId, { idImageUrl: imageData });
        setUploadingForGuestId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiRefine = async () => {
    if (!formData.notes && !formData.specialRequests) return;
    setAiLoading(true);
    const content = `Requests: ${formData.specialRequests}\nNotes: ${formData.notes}`;
    const result = await fastQuery(`Professionalize and summarize these internal guest notes for a 5-star hotel front desk log:\n"${content}"`, "You are a hospitality documentation expert.");
    setFormData({ ...formData, notes: result });
    setAiLoading(false);
  };

  const handleRateChange = (roomId: string, rate: number) => {
    setCustomRates(prev => ({ ...prev, [roomId]: rate }));
  };

  const nights = Math.max(1, Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 3600 * 24)));
  const roomStayTotal = formData.roomIds.reduce((acc, rid) => acc + (customRates[rid] || 0), 0) * nights;
  const grandTotal = roomStayTotal + formData.extraCharges + formData.laundry + formData.miniBar - formData.discount;
  const currentTotalPaid = previouslyPaid + formData.newCollection;
  const dueAmount = grandTotal - currentTotalPaid;

  const searchedGuests = useMemo(() => {
    const s = guestSearch.toLowerCase().trim();
    if (!s) return [];
    return guests.filter(g =>
      !formData.guestIds.includes(g.id) &&
      (g.name.toLowerCase().includes(s) || g.phone.includes(s) || g.idNumber.toLowerCase().includes(s))
    ).slice(0, 5);
  }, [guests, guestSearch, formData.guestIds]);

  // Validation: Check if any selected guests are missing their ID image
  const guestsMissingId = useMemo(() => {
    return formData.guestIds.map(gid => guests.find(g => g.id === gid)).filter(g => !g?.idImageUrl);
  }, [formData.guestIds, guests]);

  const canSubmit = useMemo(() => {
    const hasGuests = formData.guestIds.length > 0;
    const hasRooms = formData.roomIds.length > 0;
    const isCheckIn = formData.stayType === 'CHECK_IN';
    // Strict enforcement: If it's a check-in, all guests MUST have an ID image
    if (isCheckIn && guestsMissingId.length > 0) return false;
    return hasGuests && hasRooms;
  }, [formData.guestIds, formData.roomIds, formData.stayType, guestsMissingId]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-professional h-auto max-h-[90vh] relative">

        {/* Hidden File Input for direct ID upload */}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        {showCheckOutConfirm && (
          <div className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl space-y-8 border border-gray-300">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 border border-rose-100"><LogOut size={24} /></div>
              <div>
                <h3 className="text-xl font-black uppercase text-[#242424] tracking-tighter">Final Settlement</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Check-out for rooms {formData.roomIds.join(', ')}</p>
              </div>
              <div className="bg-[#FDFBF7] p-6 rounded-2xl space-y-3 text-left border border-gray-200">
                <div className="flex justify-between text-[11px] font-black uppercase text-[#8C7B6E]"><span>Room Bill</span><span>Tk. {grandTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-[11px] font-black uppercase text-emerald-600"><span>Paid So Far</span><span>Tk. {currentTotalPaid.toLocaleString()}</span></div>
                <div className="pt-3 border-t border-gray-200 flex justify-between text-base font-black uppercase text-rose-700"><span>Remaining Due</span><span>Tk. {dueAmount.toLocaleString()}</span></div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowCheckOutConfirm(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                <button onClick={() => onCheckOut?.(initialData!.id, formData.newCollection, dueAmount)} className="flex-[2] py-4 bg-[#D11149] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Settle & Close Stay</button>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-white text-[#242424] flex-shrink-0">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#8C7B6E]">{initialData ? 'Edit Stay' : 'New Booking'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-rose-500 transition-all p-1.5 hover:bg-rose-50 rounded-full"><X size={18} /></button>
        </div>

        <div className="p-5 bg-gray-50/50 flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

            <div className="lg:col-span-7 space-y-4 overflow-y-auto custom-scrollbar pr-2">
              <div className="flex gap-2 p-1.5 bg-gray-200/50 border border-gray-300 rounded-2xl w-fit">
                <button
                  onClick={() => setFormData({ ...formData, stayType: 'RESERVATION' })}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.stayType === 'RESERVATION' ? 'bg-white text-[#242424] shadow-sm' : 'text-gray-400'}`}
                >
                  <Bookmark size={12} /> RESERVATION
                </button>
                <button
                  onClick={() => setFormData({ ...formData, stayType: 'CHECK_IN' })}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.stayType === 'CHECK_IN' ? 'bg-[#5E7D63] text-white shadow-sm' : 'text-gray-400'}`}
                >
                  <CircleCheck size={14} /> CHECK-IN
                </button>
              </div>

              {/* ID Warning Banner */}
              {formData.stayType === 'CHECK_IN' && guestsMissingId.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-4 animate-professional">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 border border-rose-200 flex-shrink-0">
                    <FileWarning size={20} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Identification Protocol Error</h5>
                    <p className="text-[9px] font-bold text-rose-600 mt-1 uppercase leading-tight">
                      Guests: {guestsMissingId.map(g => g?.name).join(', ')} are missing ID images.
                      Check-in is blocked until documents are uploaded via the Guest Ledger or directly below.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="label-text">ROOM ALLOCATION</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        className="input-field appearance-none py-3 text-[11px] font-black bg-white"
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        disabled={initialData?.status === 'CHECKED_IN'}
                      >
                        <option value="">Select Room #</option>
                        {rooms.map(r => (
                          <option key={r.roomNumber} value={r.roomNumber} disabled={r.status === 'OCCUPIED' && !formData.roomIds.includes(r.roomNumber)}>
                            {r.roomNumber} - {r.category}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                    </div>
                    <button type="button" onClick={addRoom} className="bg-[#C5A059] text-white px-3 rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition-all"><Plus size={18} /></button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.roomIds.map(rid => (
                      <div key={rid} className="bg-white border border-gray-300 pl-3 pr-1.5 py-1 rounded-lg flex items-center gap-2 shadow-xs group">
                        <span className="text-[10px] font-black text-[#242424]">{rid}</span>
                        <button onClick={() => removeRoom(rid)} className="text-gray-300 hover:text-rose-500 transition-colors p-1"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className="label-text">GUEST ASSOCIATION</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input
                      type="text"
                      className="input-field pl-11 py-3 text-[11px] font-black bg-white"
                      placeholder="Search Ledger by Name/Phone/ID..."
                      value={guestSearch}
                      onChange={(e) => { setGuestSearch(e.target.value); setIsGuestDropdownOpen(true); }}
                      onFocus={() => setIsGuestDropdownOpen(true)}
                    />
                    {isGuestDropdownOpen && searchedGuests.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-2xl shadow-xl z-[200] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        {searchedGuests.map(g => (
                          <button
                            key={g.id}
                            onClick={() => toggleGuest(g.id)}
                            className="w-full px-5 py-3 text-left hover:bg-[#FDFBF7] flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-[#242424] uppercase truncate">{g.name}</p>
                              <p className="text-[8px] font-bold text-gray-400 mt-0.5">{g.phone} • {g.idNumber}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {!g.idImageUrl && <span title="No ID Image Uploaded"><FileWarning size={14} className="text-rose-400" /></span>}
                              <Plus size={14} className="text-[#C5A059] flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.guestIds.map(gid => {
                      const guest = guests.find(g => g.id === gid);
                      const missingId = !guest?.idImageUrl;
                      return (
                        <div key={gid} className={`pl-3 pr-1.5 py-1 rounded-lg flex items-center gap-2 shadow-xs transition-colors border ${missingId ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-[#C5A059]/10 border-[#C5A059]/30 text-[#242424]'}`}>
                          <span className="text-[9px] font-black uppercase">{guest?.name}</span>
                          {missingId ? (
                            <button
                              onClick={() => handleIdUploadTrigger(gid)}
                              className="text-rose-500 hover:text-rose-700 transition-all p-1 bg-white rounded-md shadow-xs border border-rose-100"
                              title="Upload ID Document Directly"
                            >
                              <Upload size={10} />
                            </button>
                          ) : (
                            <CheckCircle2 size={10} className="text-emerald-500" />
                          )}
                          <button onClick={() => toggleGuest(gid)} className="text-gray-300 hover:text-rose-500 transition-colors p-1"><X size={10} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="label-text">ARRIVAL</label><input type="date" className="input-field py-2 font-black bg-white" value={formData.checkIn} onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} disabled={initialData?.status === 'CHECKED_IN'} /></div>
                <div className="space-y-1"><label className="label-text">DEPARTURE</label><input type="date" className="input-field py-2 font-black bg-white" value={formData.checkOut} onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} /></div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="label-text">NOTES</label>
                  <button
                    onClick={handleAiRefine}
                    disabled={aiLoading || (!formData.notes && !formData.specialRequests)}
                    className="flex items-center gap-1.5 text-[8px] font-black text-[#C5A059] hover:text-[#242424] transition-all bg-[#C5A059]/10 px-2 py-0.5 rounded-full uppercase tracking-widest disabled:opacity-30"
                  >
                    {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Refine
                  </button>
                </div>
                <textarea
                  className="input-field h-16 py-2 bg-white text-[11px] font-medium resize-none shadow-inner"
                  placeholder="Requests & notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="lg:col-span-5 h-full overflow-hidden">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-300 flex flex-col h-full">
                <h4 className="text-[10px] font-black text-[#242424] uppercase tracking-[0.2em] flex items-center gap-2 pb-3 border-b border-gray-200 flex-shrink-0">
                  <Calculator size={14} className="text-[#C5A059]" /> BILLING
                </h4>

                <div className="space-y-4 mt-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-3">
                    {formData.roomIds.map(rid => (
                      <div key={rid} className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black text-[#8C7B6E] uppercase whitespace-nowrap">ROOM {rid} (Per Night)</span>
                        <input type="number" className="bg-[#FDFBF7] border border-gray-400 rounded-lg px-3 py-1.5 text-[11px] font-black text-right w-24 outline-none focus:border-[#C5A059]" value={customRates[rid] || 0} onChange={(e) => handleRateChange(rid, Number(e.target.value))} />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                    <div className="space-y-0.5">
                      <label className="text-[7px] font-black text-[#8C7B6E] uppercase tracking-widest ml-1">Laundry</label>
                      <input type="number" className="input-field py-1 text-[10px] font-black bg-[#FDFBF7] border-gray-300" value={formData.laundry || ''} onChange={(e) => setFormData({ ...formData, laundry: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] font-black text-[#8C7B6E] uppercase tracking-widest ml-1">F&B</label>
                      <input type="number" className="input-field py-1 text-[10px] font-black bg-[#FDFBF7] border-gray-300" value={formData.miniBar || ''} onChange={(e) => setFormData({ ...formData, miniBar: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] font-black text-rose-600 uppercase tracking-widest ml-1">Discount</label>
                      <input type="number" className="input-field py-1 text-[10px] font-black bg-[#FDFBF7] border-rose-100 text-rose-600" value={formData.discount || ''} onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] font-black text-[#8C7B6E] uppercase tracking-widest ml-1">Extra</label>
                      <input type="number" className="input-field py-1 text-[10px] font-black bg-[#FDFBF7] border-gray-300" value={formData.extraCharges || ''} onChange={(e) => setFormData({ ...formData, extraCharges: Number(e.target.value) })} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-gray-300 flex-shrink-0">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GRAND TOTAL</span>
                    <span className="text-lg font-black text-[#242424] tracking-tight">Tk. {grandTotal.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">PAID</span>
                    <span className="text-base font-black text-emerald-700 tracking-tight">Tk. {previouslyPaid.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">DUE</span>
                    <span className="text-2xl font-black text-rose-700 tracking-tighter">Tk. {dueAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <div className="relative group flex-[2]">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C5A059]"><DollarSign size={14} strokeWidth={3} /></div>
                      <input type="number" placeholder="Collect..." className="w-full bg-[#FDFBF7] border border-gray-400 rounded-xl pl-9 pr-3 py-2 text-xs font-black text-[#242424] focus:border-[#C5A059] outline-none shadow-inner" value={formData.newCollection || ''} onChange={(e) => setFormData({ ...formData, newCollection: Number(e.target.value) })} />
                    </div>
                    <div className="relative flex-1">
                      <select className="appearance-none w-full bg-white border border-gray-400 rounded-xl py-2 pl-3 pr-6 text-[9px] uppercase font-black tracking-widest shadow-inner outline-none focus:border-[#C5A059]" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}>
                        {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-400 flex gap-3 bg-white flex-shrink-0 z-20">
          <button onClick={onClose} className="flex-1 bg-white text-gray-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] border border-gray-400 hover:bg-gray-50 transition-colors tracking-widest shadow-sm">DISCARD</button>
          <div className="flex-[2.5] flex gap-4">
            {initialData?.status === 'CHECKED_IN' && (
              <button onClick={() => setShowCheckOutConfirm(true)} className="flex-1 bg-[#D11149] text-white px-8 py-4 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase gap-3 tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"><LogOut size={16} /> VACATE ROOM</button>
            )}
            <button
              onClick={() => parentSubmit({ ...formData, paidAmount: currentTotalPaid, totalAmount: grandTotal })}
              disabled={!canSubmit}
              className={`flex-[1.5] px-8 py-3 rounded-xl flex items-center justify-center shadow-xl text-[10px] font-black transition-all uppercase tracking-[0.2em] ${canSubmit ? 'bg-[#C5A059] text-[#242424] hover:brightness-105 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'}`}
              title={!canSubmit ? "Verification Required: IDs must be uploaded for all guests before Check-in." : ""}
            >
              {formData.stayType === 'CHECK_IN' && guestsMissingId.length > 0 ? 'ID REQUIRED' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
