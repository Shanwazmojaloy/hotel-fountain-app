import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  FileDown
} from 'lucide-react';
import { Reservation } from '../types';
import { formatToDDMMYYYY } from '../utils/dateUtils';
import { useDatabase } from '../context/DatabaseContext';

export const Billing: React.FC = () => {
  const { reservations, rooms, guests } = useDatabase();
  const [searchTerm, setSearchTerm] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const calculateTotal = (res: Reservation) => {
    const roomTotal = (res.roomIds || []).reduce((acc, roomId) => {
      const room = rooms.find(r => r.roomNumber === roomId);
      return acc + (room?.price || 0);
    }, 0);

    const checkIn = new Date(res.checkIn);
    const checkOut = new Date(res.checkOut);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));
    const baseRate = roomTotal * nights;
    return baseRate + (res.laundry || 0) + (res.miniBar || 0) + (res.extraCharges || 0) - (res.discount || 0);
  };

  const getSinglePageHtml = (res: Reservation, label: string, isLast: boolean = false) => {
    const guest = guests.find(g => (res.guestIds || []).includes(g.id));
    const total = calculateTotal(res);
    const invoiceId = res.id.substring(0, 8).toUpperCase();

    const checkIn = new Date(res.checkIn);
    const checkOut = new Date(res.checkOut);
    const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24)));

    const roomRateSubtotal = (res.roomIds || []).reduce((acc, roomId) => {
      const room = rooms.find(r => r.roomNumber === roomId);
      return acc + (room?.price || 0);
    }, 0) * nights;
    const fbCharges = (res.miniBar || 0) + (res.laundry || 0);

    return `
      <div style="width: 210mm; height: 296.8mm; padding: 20mm; box-sizing: border-box; background: white; color: #242424; font-family: 'Inter', sans-serif; position: relative; ${!isLast ? 'page-break-after: always;' : ''}">
        <div style="position: absolute; top: 10mm; right: 20mm; font-size: 8px; font-weight: 900; color: #9CA3AF; letter-spacing: 2px; text-transform: uppercase;">${label}</div>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <div>
            <h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #4B3621; text-transform: uppercase; letter-spacing: -1px;">HOTEL FOUNTAIN</h1>
            <p style="margin: 4px 0; font-size: 11px; font-weight: 800; color: #C5A059; text-transform: uppercase; letter-spacing: 4px;">LUXURY IN COMFORT</p>
          </div>
          <div style="text-align: right; font-size: 10px; line-height: 1.6; color: #242424; font-weight: 500;">
            <strong style="text-transform: uppercase; font-weight: 900;">Address:</strong><br/>
            House 02, Road 02, Nikunja 2, Dhaka - 1229, Bangladesh.<br/>
            <strong>Contact:</strong> +88 01322-840799<br/>
            <strong>Email:</strong> hotelfountainbd@gmail.com
          </div>
        </div>

        <div style="height: 2px; background: #C5A059; margin-bottom: 30px; width: 100%;"></div>

        <div style="display: flex; gap: 20px; margin-bottom: 40px; background: #FDFBF7; padding: 25px; border-radius: 15px; border: 1px solid #E5E7EB;">
          <div style="flex: 1; border-right: 1px solid #E5E7EB; padding-right: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 10px; font-weight: 900; color: #8C7B6E; text-transform: uppercase; letter-spacing: 1px;">Guest Profile</h3>
            <table style="font-size: 12px; font-weight: 700; border-spacing: 0 6px; border-collapse: separate; width: 100%;">
              <tr><td style="color: #9CA3AF; font-size: 9px; width: 80px; text-transform: uppercase;">NAME:</td><td>${guest?.name || 'Walk-in Guest'}</td></tr>
              <tr><td style="color: #9CA3AF; font-size: 9px; text-transform: uppercase;">PHONE:</td><td>${guest?.phone || 'N/A'}</td></tr>
              <tr><td style="color: #9CA3AF; font-size: 9px; text-transform: uppercase;">ADDRESS:</td><td>${guest?.address || 'N/A'}</td></tr>
            </table>
          </div>
          <div style="flex: 1; padding-left: 20px;">
            <h3 style="margin: 0 0 12px 0; font-size: 10px; font-weight: 900; color: #8C7B6E; text-transform: uppercase; letter-spacing: 1px;">Stay Info</h3>
            <table style="font-size: 12px; font-weight: 700; border-spacing: 0 6px; border-collapse: separate; width: 100%;">
              <tr><td style="color: #9CA3AF; font-size: 9px; width: 100px; text-transform: uppercase;">INVOICE NO:</td><td>#${invoiceId}</td></tr>
              <tr><td style="color: #9CA3AF; font-size: 9px; text-transform: uppercase;">ROOM(S):</td><td>${(res.roomIds || []).join(', ')}</td></tr>
              <tr><td style="color: #9CA3AF; font-size: 9px; text-transform: uppercase;">PERIOD:</td><td>${formatToDDMMYYYY(res.checkIn)} — ${formatToDDMMYYYY(res.checkOut)}</td></tr>
            </table>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="border-bottom: 2px solid #C5A059; border-top: 1px solid #E5E7EB;">
              <th style="text-align: left; padding: 12px 10px; font-size: 10px; color: #8C7B6E; text-transform: uppercase; font-weight: 900;">Date</th>
              <th style="text-align: left; padding: 12px 10px; font-size: 10px; color: #8C7B6E; text-transform: uppercase; font-weight: 900;">Item Description</th>
              <th style="text-align: right; padding: 12px 10px; font-size: 10px; color: #8C7B6E; text-transform: uppercase; font-weight: 900;">Amount (Tk.)</th>
            </tr>
          </thead>
          <tbody style="font-size: 12px; font-weight: 700;">
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 15px 10px;">${formatToDDMMYYYY(res.checkIn)}</td>
              <td style="padding: 15px 10px;">Room Charge (Rate x ${nights} Nights)</td>
              <td style="padding: 15px 10px; text-align: right;">${roomRateSubtotal.toLocaleString()}</td>
            </tr>
            ${fbCharges > 0 ? `
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 15px 10px;">-</td>
              <td style="padding: 15px 10px;">F&B and Mini-Bar Charges</td>
              <td style="padding: 15px 10px; text-align: right;">${fbCharges.toLocaleString()}</td>
            </tr>` : ''}
            ${res.extraCharges > 0 ? `
            <tr style="border-bottom: 1px solid #F3F4F6;">
              <td style="padding: 15px 10px;">-</td>
              <td style="padding: 15px 10px;">Additional Service Charges</td>
              <td style="padding: 15px 10px; text-align: right;">${res.extraCharges.toLocaleString()}</td>
            </tr>` : ''}
            ${res.discount > 0 ? `
            <tr style="border-bottom: 1px solid #F3F4F6; color: #dc2626;">
              <td style="padding: 15px 10px;">-</td>
              <td style="padding: 15px 10px;">Discount Applied</td>
              <td style="padding: 15px 10px; text-align: right;">-${res.discount.toLocaleString()}</td>
            </tr>` : ''}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-top: 50px;">
          <div style="width: 320px; background: #242424; color: white; padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 12px; font-weight: 600; text-transform: uppercase;">
              <span style="opacity: 0.6;">Bill Subtotal</span>
              <span>Tk. ${total.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 15px; font-weight: 600; text-transform: uppercase;">
              <span style="opacity: 0.6;">Amount Collected</span>
              <span>Tk. ${(res.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div style="height: 1px; background: rgba(255,255,255,0.1); margin-bottom: 15px;"></div>
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-size: 14px; font-weight: 900; color: #C5A059; text-transform: uppercase; letter-spacing: 1px;">TOTAL DUE</span>
              <span style="font-size: 22px; font-weight: 900; color: #C5A059;">Tk. ${(total - (res.paidAmount || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div style="position: absolute; bottom: 40mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between;">
          <div style="width: 220px; border-top: 1px solid #D1D5DB; text-align: center; padding-top: 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #8C7B6E; letter-spacing: 1px;">Guest Signature</div>
          <div style="width: 220px; border-top: 1px solid #D1D5DB; text-align: center; padding-top: 15px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #8C7B6E; letter-spacing: 1px;">Management Seal</div>
        </div>

        <div style="position: absolute; bottom: 20mm; left: 0; right: 0; text-align: center; font-size: 10px; font-weight: 900; color: #9CA3AF; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8;">
          LUXURY IN COMFORT • HOTEL FOUNTAIN
        </div>
      </div>
    `;
  };

  const handleDownloadInvoice = async (res: Reservation) => {
    if (isDownloading) return;
    const h2p = (window as any).html2pdf;
    if (!h2p) return;

    setIsDownloading(true);
    const container = document.createElement('div');

    // Generate two pages directly in the container without extra wrapper spacing
    const customerPage = getSinglePageHtml(res, "Customer Copy", false);
    const hotelPage = getSinglePageHtml(res, "Front Desk Copy", true);

    container.innerHTML = `
      ${customerPage}
      ${hotelPage}
    `;

    document.body.appendChild(container);

    const options = {
      margin: 0,
      filename: `Hotel_Fountain_INV_${res.id.substring(0, 8)}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    try {
      await h2p().from(container).set(options).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      document.body.removeChild(container);
      setIsDownloading(false);
    }
  };

  const filtered = useMemo(() => {
    return (reservations || []).filter(res => {
      const guest = guests.find(g => (res.guestIds || []).includes(g.id));
      return (
        (res.roomIds || []).some(id => id.includes(searchTerm)) ||
        guest?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [reservations, searchTerm, guests]);

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-6 animate-professional bg-[#FDFBF7]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-[#242424] uppercase tracking-tighter leading-none">Billing & Invoices</h1>
          <p className="text-[10px] font-black text-[#8C7B6E] mt-1.5 uppercase tracking-widest opacity-80">SETTLEMENT REPORTS</p>
        </div>
        <button
          onClick={() => setIsManualModalOpen(true)}
          className="flex items-center gap-2 btn-primary-gold px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all"
        >
          <Plus size={16} strokeWidth={3} /> CREATE INVOICE
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-400 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-400 bg-white/30">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7B6E]" size={14} />
            <input type="text" placeholder="Filter Ledger..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-[10px] font-black text-[#242424] outline-none shadow-inner uppercase" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[#FDFBF7]/50 text-[#8C7B6E] text-[9px] font-black uppercase tracking-[0.2em] border-b border-gray-400">
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Guest Identity</th>
                <th className="px-6 py-4">Stay Tenure</th>
                <th className="px-6 py-4">Grand Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400 text-[10px] font-black uppercase tracking-widest opacity-30">No Records Found</td></tr>
              ) : (
                filtered.map((res) => {
                  const guest = guests.find(g => (res.guestIds || []).includes(g.id));
                  const total = calculateTotal(res);
                  return (
                    <tr key={res.id} className="hover:bg-[#FDFBF7]/50 transition-all group">
                      <td className="px-6 py-4"><span className="text-[10px] font-black text-[#8C7B6E]">#{res.id.substring(0, 6).toUpperCase()}</span></td>
                      <td className="px-6 py-4">
                        <p className="text-[11px] font-black text-[#242424] uppercase truncate max-w-[180px]">{guest?.name || 'Walk-in'}</p>
                        <p className="text-[8px] font-black text-[#C5A059] mt-0.5">Room {(res.roomIds || []).join(', ')}</p>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-[#242424]">{formatToDDMMYYYY(res.checkIn)} — {formatToDDMMYYYY(res.checkOut)}</td>
                      <td className="px-6 py-4 text-[11px] font-black text-[#242424]">Tk. {total.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-xs ${res.status === 'CHECKED_OUT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {res.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button disabled={isDownloading} onClick={() => handleDownloadInvoice(res)} className={`p-2 text-[#242424] hover:text-[#C5A059] transition-all ${isDownloading ? 'opacity-50' : ''}`} title="Download PDF"><FileDown size={18} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
