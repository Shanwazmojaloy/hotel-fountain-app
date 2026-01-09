import React, { useState, useMemo, useEffect } from 'react';
// ... imports
import {
  Calendar,
  Search,
  TrendingUp,
  Activity,
  Calculator,
  Save,
  CheckCircle2,
  PieChart,
  ArrowRight,
  FileDown // Added import
} from 'lucide-react';
import { formatToDDMMYYYY } from '../utils/dateUtils';
import { useDatabase } from '../context/DatabaseContext';

export const Reports: React.FC = () => {
  const { transactions, reservations, rooms, guests } = useDatabase();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tokenAmount, setTokenAmount] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sync token amount with selected date
  useEffect(() => {
    const savedToken = localStorage.getItem(`token_adj_${selectedDate}`);
    if (savedToken) setTokenAmount(Number(savedToken));
    else setTokenAmount(0);
  }, [selectedDate]);

  const handleSaveToken = () => {
    localStorage.setItem(`token_adj_${selectedDate}`, tokenAmount.toString());
    alert(`Token adjustment of Tk. ${tokenAmount} saved for ${formatToDDMMYYYY(selectedDate)}`);
  };

  const handleClosingComplete = () => {
    const confirmation = window.confirm(`FINAL CLOSING PROTOCOL:\nAre you sure you want to finalize accounts for ${formatToDDMMYYYY(selectedDate)}?\n\nThis will move the system to the next fiscal day.`);

    if (confirmation) {
      // Logic to advance the date
      const currentDate = new Date(selectedDate);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextDateStr = currentDate.toISOString().split('T')[0];

      // Persist the closing state (could be expanded to save a snapshot)
      localStorage.setItem(`closed_${selectedDate}`, 'true');

      setSelectedDate(nextDateStr);
      setTokenAmount(0); // Reset token for new day
      alert('FISCAL DAY CLOSED. System advanced to ' + formatToDDMMYYYY(nextDateStr));
    }
  };

  const calculateDays = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
  };

  const ledgerData = useMemo(() => {
    return (reservations || []).filter(res => {
      if (!res || res.status === 'CANCELLED') return false;
      // Show if the selected date falls within the stay period
      return selectedDate >= (res.checkIn || '') && selectedDate <= (res.checkOut || '');
    }).map(res => {
      const roomTotal = (res.roomIds || []).reduce((acc, rid) => {
        const rm = rooms.find(r => r.roomNumber === rid);
        return acc + (rm?.price || 0);
      }, 0);
      const nights = calculateDays(res.checkIn, res.checkOut);
      const totalRate = (roomTotal * nights) + (res.extraCharges || 0) + (res.laundry || 0) + (res.miniBar || 0) - (res.discount || 0);
      const collected = res.paidAmount || 0;
      const primaryGuest = guests.find(g => (res.guestIds || []).includes(g.id));

      return {
        id: res.id || '',
        timestamp: "06:00:00", // Simplified for daily report view
        residentName: primaryGuest?.name || "Walk-in Guest",
        roomNo: (res.roomIds || []).join(', '),
        totalRate,
        collected,
        due: totalRate - collected
      };
    }).filter(item => {
      const s = searchTerm.toLowerCase();
      return (item.roomNo || '').includes(searchTerm) ||
        (item.residentName || '').toLowerCase().includes(s);
    });
  }, [reservations, rooms, guests, selectedDate, searchTerm]);

  const stats = useMemo(() => {
    const sumAmount = ledgerData.reduce((acc, item) => acc + item.collected, 0);
    const sumDue = ledgerData.reduce((acc, item) => acc + item.due, 0);
    const sumBill = ledgerData.reduce((acc, item) => acc + item.totalRate, 0);
    return {
      sumAmount,
      sumDue,
      sumBill,
      closingBalance: sumAmount - tokenAmount
    };
  }, [ledgerData, tokenAmount]);

  // PDF DOWNLOAD HANDLER
  const handleDownloadReport = async () => {
    if (isDownloading) return;
    const h2p = (window as any).html2pdf;
    if (!h2p) {
      alert("PDF generator not ready. Please refresh.");
      return;
    }

    setIsDownloading(true);
    const container = document.createElement('div');
    container.style.padding = '40px';
    container.style.fontFamily = 'Inter, sans-serif';
    container.style.color = '#242424';

    // Generate Table Rows
    const rowsHtml = ledgerData.map(item => `
        <tr style="border-bottom: 1px solid #d1d5db;">
            <td style="padding: 10px; font-size: 10px;">${item.timestamp}</td>
            <td style="padding: 10px; font-size: 10px; font-weight: bold;">${item.residentName}</td>
            <td style="padding: 10px; font-size: 10px;">${item.roomNo}</td>
            <td style="padding: 10px; font-size: 10px;">Tk. ${item.totalRate.toLocaleString()}</td>
            <td style="padding: 10px; font-size: 10px; color: #047857; font-weight: bold;">Tk. ${item.collected.toLocaleString()}</td>
            <td style="padding: 10px; font-size: 10px; text-align: right; color: #be123c;">Tk. ${item.due.toLocaleString()}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <div style="border-bottom: 2px solid #242424; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
                <h1 style="font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 1;">Daily Fiscal Report</h1>
                <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; color: #6b7280;">Hotel Fountain HMS</p>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 14px; font-weight: bold;">DATE: ${formatToDDMMYYYY(selectedDate)}</p>
            </div>
        </div>

        <div style="display: flex; gap: 15px; margin-bottom: 30px;">
             <div style="flex: 1; padding: 15px; background: #f3f4f6; border-radius: 8px;">
                <p style="font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: bold;">Total Collected</p>
                <p style="font-size: 16px; font-weight: 900; color: #047857;">Tk. ${stats.sumAmount.toLocaleString()}</p>
             </div>
             <div style="flex: 1; padding: 15px; background: #fff1f2; border-radius: 8px;">
                <p style="font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: bold;">Pending Dues</p>
                <p style="font-size: 16px; font-weight: 900; color: #be123c;">Tk. ${stats.sumDue.toLocaleString()}</p>
             </div>
             <div style="flex: 1; padding: 15px; background: #fffbeb; border-radius: 8px;">
                <p style="font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: bold;">Closing Balance</p>
                <p style="font-size: 16px; font-weight: 900; color: #242424;">Tk. ${stats.closingBalance.toLocaleString()}</p>
             </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
                <tr style="background: #242424; color: white;">
                    <th style="padding: 10px; font-size: 10px; text-align: left; text-transform: uppercase;">Time</th>
                    <th style="padding: 10px; font-size: 10px; text-align: left; text-transform: uppercase;">Resident</th>
                    <th style="padding: 10px; font-size: 10px; text-align: left; text-transform: uppercase;">Room</th>
                    <th style="padding: 10px; font-size: 10px; text-align: left; text-transform: uppercase;">Total Bill</th>
                    <th style="padding: 10px; font-size: 10px; text-align: left; text-transform: uppercase;">Collected</th>
                    <th style="padding: 10px; font-size: 10px; text-align: right; text-transform: uppercase;">Due</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div style="position: fixed; bottom: 30px; left: 40px; right: 40px; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; text-transform: uppercase;">
            <div style="border-top: 1px solid #d1d5db; width: 150px; text-align: center; padding-top: 10px;">Manager Signature</div>
            <div style="border-top: 1px solid #d1d5db; width: 150px; text-align: center; padding-top: 10px;">Accountant Signature</div>
        </div>
    `;

    document.body.appendChild(container);
    const options = {
      margin: 0,
      filename: `Fiscal_Report_${selectedDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await h2p().from(container).set(options).save();
    } catch (e) {
      console.error(e);
    } finally {
      document.body.removeChild(container);
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden animate-professional no-scrollbar bg-[#FDFBF7]">
      {/* Header & KPI Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-[#242424] tracking-tighter uppercase leading-none">REPORTS & ANALYTICS</h1>
          <p className="text-[7.5px] font-black text-[#8C7B6E] mt-1 uppercase tracking-[0.2em] opacity-80">DAILY FISCAL PERFORMANCE</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        <ReportStatCard label="TOTAL COLLECTED" value={`Tk. ${stats.sumAmount.toLocaleString()}`} icon={TrendingUp} color="#2D5A27" bg="#E8F5E9" />
        <ReportStatCard label="PENDING DUES" value={`Tk. ${stats.sumDue.toLocaleString()}`} icon={Activity} color="#B71C1C" bg="#FFEBEE" />
        <ReportStatCard label="ROOM COLLECTIONS" value={`Tk. ${stats.sumBill.toLocaleString()}`} icon={Calculator} color="#C5A059" bg="#FFF9C4" />
        <ReportStatCard label="CLOSING BALANCE" value={`Tk. ${stats.closingBalance.toLocaleString()}`} icon={PieChart} color="#1565C0" bg="#E3F2FD" />
      </div>

      {/* Main Table Container */}
      <div className="flex-1 bg-white rounded-[2rem] border border-gray-400 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-6 py-3 border-b border-gray-400 bg-white/50 flex flex-col lg:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 w-full lg:w-auto flex-1">
            <div className="relative flex-1 lg:max-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              <input type="text" placeholder="Search entries..." className="w-full pl-10 pr-4 py-2 bg-[#FDFBF7] border border-gray-300 rounded-xl text-[9px] font-black text-[#242424] outline-none shadow-inner uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative flex items-center bg-white border border-gray-300 px-4 py-1.5 rounded-xl min-w-[140px] shadow-sm">
              <Calendar size={12} className="text-[#C5A059] mr-2" />
              <span className="text-[9px] font-black text-[#242424]">{formatToDDMMYYYY(selectedDate)}</span>
              <input type="date" className="absolute inset-0 opacity-0 cursor-pointer" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>
          <div className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-[0.2em] bg-[#FDFBF7] px-4 py-2 rounded-xl border border-gray-300">FISCAL DAY • {formatToDDMMYYYY(selectedDate)}</div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#FDFBF7] text-[#8C7B6E] text-[8px] font-black uppercase tracking-[0.15em] border-b border-gray-400 sticky top-0 z-10">
                <th className="px-6 py-4">TIMESTAMP</th>
                <th className="px-6 py-4">RESIDENT</th>
                <th className="px-6 py-4">UNIT</th>
                <th className="px-6 py-4">RATE (TOTAL)</th>
                <th className="px-6 py-4">COLLECTED</th>
                <th className="px-6 py-4 text-right">DUE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ledgerData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center opacity-20"><p className="text-[10px] font-black uppercase tracking-widest">NO FISCAL DATA FOR THIS DATE</p></td></tr>
              ) : (
                ledgerData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FDFBF7]/40 transition-colors">
                    <td className="px-6 py-3 text-[9px] font-bold text-gray-400 uppercase">{item.timestamp}</td>
                    <td className="px-6 py-3 text-[10px] font-black text-[#242424] uppercase truncate max-w-[180px]">{item.residentName}</td>
                    <td className="px-6 py-3"><span className="text-[8px] font-black bg-[#F3F4F6] text-gray-500 px-2 py-0.5 rounded-lg border border-gray-200 uppercase">{item.roomNo}</span></td>
                    <td className="px-6 py-3 text-[10px] font-black text-[#242424]">Tk. {item.totalRate.toLocaleString()}</td>
                    <td className="px-6 py-3 text-[10px] font-black text-emerald-700">Tk. {item.collected.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right text-[10px] font-black text-rose-700">Tk. {item.due.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Closing Protocol */}
        <div className="p-6 border-t border-gray-400 bg-white flex flex-col md:flex-row items-center justify-between gap-8 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-8">
            {/* Token Input Box */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest ml-1">Token Adj. (Tk)</label>
              <div className="flex gap-2">
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C5A059]" size={14} />
                  <input
                    type="number"
                    className="bg-[#FDFBF7] border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-[11px] font-black w-32 outline-none focus:border-[#C5A059] shadow-inner"
                    placeholder="0.00"
                    value={tokenAmount || ''}
                    onChange={(e) => setTokenAmount(Number(e.target.value))}
                  />
                </div>
                <button
                  onClick={handleSaveToken}
                  className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all shadow-sm active:scale-95"
                  title="Save Adjustment"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>

            <div className="h-12 w-[1.5px] bg-gray-200 hidden md:block"></div>

            {/* Summation Display */}
            <div className="flex gap-12">
              <div className="text-left">
                <p className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest">Sum Collected</p>
                <p className="text-base font-black text-emerald-700">Tk. {stats.sumAmount.toLocaleString()}</p>
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest">Sum Dues</p>
                <p className="text-base font-black text-rose-700">Tk. {stats.sumDue.toLocaleString()}</p>
              </div>
              <div className="text-left">
                <p className="text-[8px] font-black text-[#8C7B6E] uppercase tracking-widest">Closing Total</p>
                <p className="text-base font-black text-[#242424]">Tk. {stats.closingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex items-center justify-center gap-2 bg-gray-100 text-[#242424] px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.1em] shadow-sm hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              <FileDown size={14} /> DOWNLOAD PDF
            </button>

            {/* Closing Action */}
            <button
              onClick={handleClosingComplete}
              className="flex items-center justify-center gap-3 bg-[#242424] text-white px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl hover:bg-black active:scale-[0.98] transition-all group"
            >
              <CheckCircle2 size={18} className="text-[#C5A059] group-hover:scale-110 transition-transform" />
              Closing Complete
              <ArrowRight size={14} className="opacity-40" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportStatCard: React.FC<{ label: string; value: string | number; icon: any; color: string; bg: string }> = ({ label, value, icon: Icon, color, bg }) => (
  <div className="bg-white border border-gray-300 p-4 rounded-2xl shadow-sm flex items-center gap-4 transition-all duration-300 hover:shadow-md min-w-0 flex-1">
    <div className="p-2.5 rounded-xl flex-shrink-0" style={{ backgroundColor: bg }}>
      <Icon size={18} style={{ color: color }} strokeWidth={2.5} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[7.5px] font-black text-[#8C7B6E] uppercase tracking-widest truncate mb-1 opacity-60">{label}</p>
      <p className="text-lg font-black tracking-tighter leading-none text-[#242424] truncate">{value}</p>
    </div>
  </div>
);
