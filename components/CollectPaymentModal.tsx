
import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  DollarSign, 
  ChevronDown,
  Tag,
  CreditCard,
  History,
  Info
} from 'lucide-react';
import { Reservation, Room, PaymentMethod } from '../types';

interface CollectPaymentModalProps {
  onClose: () => void;
  onSubmit: (resId: string, amount: number, method: PaymentMethod) => void;
  reservation: Reservation;
  rooms: Room[];
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({ 
  onClose, onSubmit, reservation, rooms 
}) => {
  const [collectionAmount, setCollectionAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);

  const selectedRoomsData = reservation.roomIds.map(rid => rooms.find(r => r.roomNumber === rid)).filter(Boolean) as Room[];
  const nights = Math.max(1, Math.ceil((new Date(reservation.checkOut).getTime() - new Date(reservation.checkIn).getTime()) / (1000 * 3600 * 24)));
  const roomStaySubtotal = selectedRoomsData.reduce((acc, r) => acc + (r?.price || 0), 0) * nights;
  
  const grandTotal = roomStaySubtotal + (reservation.extraCharges || 0) + (reservation.laundry || 0) + (reservation.miniBar || 0) - (reservation.discount || 0);
  const previouslyPaid = reservation.paidAmount || 0;
  const balanceDue = grandTotal - previouslyPaid;

  const handleCollect = () => {
    if (collectionAmount <= 0) {
      alert("Please enter a valid collection amount.");
      return;
    }
    onSubmit(reservation.id, collectionAmount, paymentMethod);
  };

  return (
    <div className="fixed inset-0 bg-[#242424]/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
      <div className="bg-[#EFEFEF] rounded-[3rem] w-full max-w-lg shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col border border-gray-400 animate-professional max-h-[90vh]">
        {/* Header - Charcoal style */}
        <div className="px-10 py-6 border-b border-gray-400 flex justify-between items-center bg-[#4B3621] text-white flex-shrink-0">
          <h3 className="text-sm font-black uppercase tracking-[0.1em] flex items-center gap-3">
            <CreditCard size={20} className="text-[#C5A059]" /> COLLECT PAYMENT
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-all p-2 bg-white/10 rounded-full">
            <X size={20}/>
          </button>
        </div>

        <div className="flex-1 p-10 space-y-8 overflow-y-auto no-scrollbar bg-[#FDFBF7]">
          {/* Detailed Summary Box - Based on Screenshot specification */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-300 shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-2 pb-4 border-b border-gray-100">
               <Calculator size={16} className="text-[#C5A059]" />
               <h4 className="text-[10px] font-black text-[#242424] uppercase tracking-[0.2em]">Full Billing Summary</h4>
            </div>

            {/* Room Breakdown */}
            <div className="space-y-2">
              {selectedRoomsData.map(room => (
                <div key={room.roomNumber} className="flex justify-between items-center text-[10px]">
                  <span className="font-black text-[#8C7B6E] uppercase flex items-center gap-2">
                    <Tag size={12} className="text-[#C5A059] opacity-50" /> R-{room.roomNumber} ({nights} Nights)
                  </span>
                  <span className="font-black text-[#242424]">Tk. {(room.price * nights).toLocaleString()}</span>
                </div>
              ))}
              
              {(reservation.laundry > 0 || reservation.miniBar > 0 || reservation.extraCharges > 0 || reservation.discount > 0) && (
                <div className="pt-2 mt-2 border-t border-gray-50 space-y-2">
                  {reservation.laundry > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase">
                      <span>Laundry Services</span>
                      <span>Tk. {reservation.laundry.toLocaleString()}</span>
                    </div>
                  )}
                  {reservation.miniBar > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 uppercase">
                      <span>Mini-Bar / F&B</span>
                      <span>Tk. {reservation.miniBar.toLocaleString()}</span>
                    </div>
                  )}
                  {reservation.discount > 0 && (
                    <div className="flex justify-between items-center text-[9px] font-black text-rose-500 uppercase">
                      <span>Corporate Discount</span>
                      <span>-Tk. {reservation.discount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Final Totals Table style */}
            <div className="bg-[#FDFBF7] rounded-3xl p-6 border border-gray-200 space-y-4 shadow-inner">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-[#242424] uppercase tracking-widest">Grand Total Bill</span>
                <span className="text-sm font-black text-[#242424]">Tk. {grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Collected</span>
                <span className="text-sm font-black text-emerald-600">Tk. {previouslyPaid.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-[11px] font-black text-rose-700 uppercase tracking-widest">Outstanding Due</span>
                <span className="text-xl font-black text-rose-700">Tk. {balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Fields */}
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="label-text ml-4">Amount to Collect</label>
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C5A059]">
                   <DollarSign size={22} strokeWidth={3} />
                </div>
                <input 
                  type="number" 
                  className="w-full bg-white border border-gray-400 rounded-2xl pl-16 pr-16 py-5 text-xl font-black text-[#242424] focus:border-[#C5A059] outline-none transition-all shadow-inner"
                  placeholder="0.00"
                  value={collectionAmount || ''}
                  onChange={(e) => setCollectionAmount(Number(e.target.value))}
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 tracking-widest uppercase">BDT</span>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="label-text ml-4">Payment Channel</label>
              <div className="relative">
                <select 
                  className="w-full bg-white border border-gray-400 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-[#242424] focus:border-[#C5A059] outline-none appearance-none cursor-pointer shadow-inner"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                >
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-10 py-8 border-t border-gray-300 flex gap-5 bg-white flex-shrink-0">
          <button 
            onClick={onClose} 
            className="flex-1 bg-white text-[#8C7B6E] px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
          >
            CANCEL
          </button>
          <button 
            onClick={handleCollect}
            className="flex-[2] btn-primary-gold px-8 py-4 rounded-2xl flex items-center justify-center shadow-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all gap-3"
          >
            <DollarSign size={18} strokeWidth={3} /> CONFIRM COLLECTION
          </button>
        </div>
      </div>
    </div>
  );
};
