import React, { useState, useMemo, memo } from 'react';
import {
  CheckCircle2,
  DoorOpen,
  Trash2,
  CalendarClock,
  Activity,
  Ban,
  Calendar as CalendarIcon,
  Zap,
  Clock
} from 'lucide-react';
import { RoomStatus, RoomCategory, TransactionType } from '../types';
import { ReservationModal } from '../components/ReservationModal';
import { formatToDDMMYYYY } from '../utils/dateUtils';
import { useDatabase } from '../context/DatabaseContext';

const StatCard = memo(({ label, value, icon: Icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) => (
  <div className="bg-white border border-gray-300 px-3 py-1.5 rounded-2xl shadow-sm flex items-center gap-3 transition-all duration-300 hover:shadow-md min-w-0 flex-1">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
      <Icon size={14} style={{ color: color }} />
    </div>
    <div className="min-w-0 flex-1 text-left">
      <span className="text-[6.5px] font-black text-[#8C7B6E] uppercase tracking-[0.1em] block leading-none mb-0.5">{label}</span>
      <p className="text-base font-black tracking-tighter leading-none text-[#242424]">{value}</p>
    </div>
  </div>
));

export const Dashboard: React.FC = () => {
  const { rooms, transactions, reservations, guests, updateRoomStatus, addTransaction, addReservation, updateReservation, updateGuest } = useDatabase();

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedViewDate, setSelectedViewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getEffectiveStatus = (room: any, date: string) => {
    // 1. Find overlapping reservation for this date
    const activeRes = reservations.find(r =>
      r.roomIds.includes(room.roomNumber) &&
      r.status !== 'CANCELLED' &&
      r.status !== 'CHECKED_OUT' &&
      date >= r.checkIn &&
      date < r.checkOut
    );

    if (activeRes) {
      return activeRes.status === 'CHECKED_IN' ? RoomStatus.OCCUPIED : RoomStatus.RESERVED;
    }

    // 2. Fallback to physical status if no active reservation
    // If DB says RESERVED/OCCUPIED but no reservation exists for this date, it's actually AVAILABLE
    if (room.status === RoomStatus.DIRTY) return RoomStatus.DIRTY;
    if (room.status === RoomStatus.OUT_OF_ORDER) return RoomStatus.OUT_OF_ORDER;

    return RoomStatus.AVAILABLE;
  };

  const processedRooms = useMemo(() => {
    return rooms.map(room => ({
      ...room,
      status: getEffectiveStatus(room, selectedViewDate)
    }));
  }, [rooms, reservations, selectedViewDate]);

  const stats = useMemo(() => {
    return {
      available: processedRooms.filter(r => r.status === RoomStatus.AVAILABLE).length,
      occupied: processedRooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
      dirty: processedRooms.filter(r => r.status === RoomStatus.DIRTY).length,
      reserved: processedRooms.filter(r => r.status === RoomStatus.RESERVED).length,
      off: processedRooms.filter(r => r.status === RoomStatus.OUT_OF_ORDER).length,
    };
  }, [processedRooms]);

  const filteredRooms = useMemo(() => {
    return processedRooms.filter(room => {
      const matchCat = filterCategory === 'All' || room.category === filterCategory;
      const matchStatus = filterStatus === 'All' || room.status === filterStatus;
      return matchCat && matchStatus;
    });
  }, [processedRooms, filterCategory, filterStatus]);

  const handleStatusChange = async (roomNumber: string, newStatus: RoomStatus) => {
    await updateRoomStatus(roomNumber, newStatus);
  };

  const getStatusStyle = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.OCCUPIED: return { bg: '#E0F2FE', text: '#0284c7', dot: '#0284c7' };
      case RoomStatus.DIRTY: return { bg: '#FEF3C7', text: '#d97706', dot: '#d97706' };
      case RoomStatus.RESERVED: return { bg: '#ECFDF5', text: '#5E7D63', dot: '#5E7D63' };
      case RoomStatus.OUT_OF_ORDER: return { bg: '#FFE4E6', text: '#e11d48', dot: '#e11d48' };
      default: return { bg: '#FFFFFF', text: '#9CA3AF', dot: '#9CA3AF' };
    }
  };

  const activeReservationForRoom = useMemo(() => {
    if (!selectedRoomNumber) return null;
    return reservations.find(r => r.roomIds.includes(selectedRoomNumber) && (r.status === 'CHECKED_IN' || r.status === 'PENDING')) || null;
  }, [selectedRoomNumber, reservations]);

  return (

    <>
      <div className="h-full flex flex-col p-3 space-y-3 overflow-hidden animate-professional no-scrollbar bg-[#FDFBF7]">
        {/* KPI Section */}
        <div className="flex gap-2 flex-shrink-0 items-center">
          <StatCard label="AVAILABLE" value={stats.available} icon={DoorOpen} color="#9CA3AF" bg="#F3F4F6" />
          <StatCard label="OCCUPIED" value={stats.occupied} icon={CheckCircle2} color="#0284c7" bg="#E0F2FE" />
          <StatCard label="DIRTY" value={stats.dirty} icon={Trash2} color="#d97706" bg="#FEF3C7" />
          <StatCard label="RESERVED" value={stats.reserved} icon={CalendarClock} color="#5E7D63" bg="#ECFDF5" />
          <StatCard label="OFFLINE" value={stats.off} icon={Ban} color="#e11d48" bg="#FFE4E6" />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0 overflow-hidden">
          <div className="lg:col-span-3 flex flex-col min-h-0 space-y-2">
            {/* Sub Header Toolbar */}
            <div className="bg-white border border-gray-400 px-4 py-1.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between flex-shrink-0 gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-[#C5A059]" />
                <p className="text-[9px] font-black text-[#242424] uppercase tracking-tight">LIVE ROOM STATUS</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex items-center bg-[#FDFBF7] border border-gray-400 px-2 py-0.5 rounded-lg min-w-[100px]">
                  <span className="text-[8px] font-black text-[#242424]">{formatToDDMMYYYY(selectedViewDate)}</span>
                  <CalendarIcon size={10} className="ml-auto text-[#C5A059]" />
                  <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={selectedViewDate} onChange={(e) => setSelectedViewDate(e.target.value)} />
                </div>
                <select className="bg-[#FDFBF7] border border-gray-400 rounded-lg px-2 py-0.5 text-[8px] font-black outline-none uppercase" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="All">All Classes</option>
                  {Object.values(RoomCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select className="bg-[#FDFBF7] border border-gray-400 rounded-lg px-2 py-0.5 text-[8px] font-black outline-none uppercase" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  {Object.values(RoomStatus).map(stat => <option key={stat} value={stat}>{stat.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            {/* Compact Room Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-6 xl:grid-cols-6 gap-2 content-start pb-4">
              {filteredRooms.map((room) => {
                const style = getStatusStyle(room.status);
                return (
                  <div
                    key={room.roomNumber}
                    onClick={() => {
                      setSelectedRoomNumber(room.roomNumber);
                      setIsModalOpen(true);
                    }}
                    className={`relative cursor-pointer rounded-xl px-3 py-3 border border-gray-300 card-hover flex flex-col items-center shadow-sm transition-all duration-300 h-[115px]`}
                    style={{ backgroundColor: style.bg }}
                  >
                    <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }}></div>

                    <div className="text-center w-full">
                      <p className="text-xl font-black text-[#242424] tracking-tighter leading-none mb-1">{room.roomNumber}</p>
                      <p className="text-[6px] font-black text-[#8C7B6E] uppercase tracking-widest leading-none mb-1 truncate px-0.5">{room.category}</p>
                      <div className="flex flex-col items-center gap-0.5 border-t border-black/5 pt-1 mt-1">
                        <span className="text-[5px] text-gray-400 uppercase tracking-widest block">RATE</span>
                        <p className="text-[9px] font-black text-[#242424]">Tk {room.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-auto w-full">
                      <select
                        className="w-full bg-white/40 border-none rounded-md py-0.5 px-0.5 text-[10px] font-black uppercase text-center outline-none cursor-pointer appearance-none"
                        value={room.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(room.roomNumber, e.target.value as RoomStatus);
                        }}
                        style={{ color: style.text }}
                      >
                        {Object.values(RoomStatus).map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar with Logs */}
          <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-400 min-h-0">
              <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between bg-white/40">
                <h3 className="font-black text-[8px] flex items-center gap-2 text-[#242424] uppercase">
                  <Clock size={10} className="text-[#C5A059]" /> LATEST LOGS
                </h3>
                <span className="text-[6px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-black uppercase border border-emerald-100">LIVE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar bg-[#FDFBF7]">
                {transactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 p-4 text-center">
                    <Zap size={16} className="mb-1" />
                    <p className="text-[6px] font-black uppercase tracking-widest">No captured events</p>
                  </div>
                ) : (
                  transactions.slice(0, 15).map((tx) => (
                    <div key={tx.id} className="p-2 rounded-xl bg-white border border-gray-300 shadow-xs hover:border-[#C5A059]/40 transition-colors">
                      <div className="flex justify-between items-start">
                        <p className="text-[8px] font-black text-[#242424]">R-{tx.roomNumber}</p>
                        <p className="text-[8px] font-black text-[#C5A059]">Tk {tx.amount.toLocaleString()}</p>
                      </div>
                      <p className="text-[7px] font-bold text-gray-400 uppercase truncate mt-0.5">{tx.guestName}</p>
                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-gray-50">
                        <p className="text-[6px] font-black uppercase tracking-widest text-gray-300">{tx.type}</p>
                        <p className="text-[6px] font-bold text-gray-300">{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ReservationModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            const status = data.stayType === 'CHECK_IN' ? 'CHECKED_IN' : 'PENDING';
            // Optimistic update handled by Realtime, but we should await the action
            if (activeReservationForRoom) {
              await updateReservation(activeReservationForRoom.id, { ...data, status });
            } else {
              await addReservation({ ...data, status });
              // Also update room status
              for (const id of data.roomIds) {
                await updateRoomStatus(id, data.stayType === 'CHECK_IN' ? RoomStatus.OCCUPIED : RoomStatus.RESERVED);
              }
            }
            setIsModalOpen(false);
          }}
          onCheckOut={async (resId, payment, due) => {
            const res = reservations.find(r => r.id === resId);
            if (!res) return;
            const primaryGuest = guests.find(g => res.guestIds.includes(g.id));
            if (primaryGuest && payment > 0) {
              await addTransaction({
                roomNumber: res.roomIds.join(', '),
                guestName: primaryGuest.name,
                type: TransactionType.ROOM_PAYMENT,
                amount: payment
              });
            }
            if (primaryGuest && due > 0) {
              await updateGuest(primaryGuest.id, { outstandingBalance: (Number(primaryGuest.outstandingBalance) || 0) + due });
            }
            await updateReservation(resId, { status: 'CHECKED_OUT', paidAmount: (res.paidAmount || 0) + payment });
            for (const id of res.roomIds) {
              await updateRoomStatus(id, RoomStatus.DIRTY);
            }
            setIsModalOpen(false);
          }}
          initialData={activeReservationForRoom}
          preSelectedRoom={selectedRoomNumber || undefined}
          autoCheckIn={selectedRoomNumber && rooms.find(r => r.roomNumber === selectedRoomNumber)?.status === RoomStatus.RESERVED}
        />
      )}
    </>
  );
};
