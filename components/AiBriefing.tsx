
import React, { useState } from 'react';
import { Sparkles, Loader2, Info } from 'lucide-react';
import { fastQuery } from '../lib/gemini';
import { Room, RoomStatus } from '../types';

interface AiBriefingProps {
  rooms: Room[];
}

export const AiBriefing: React.FC<AiBriefingProps> = ({ rooms }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateBriefing = async () => {
    setLoading(true);
    const available = rooms.filter(r => r.status === RoomStatus.AVAILABLE).length;
    const occupied = rooms.filter(r => r.status === RoomStatus.OCCUPIED).length;
    const dirty = rooms.filter(r => r.status === RoomStatus.DIRTY).length;
    const reserved = rooms.filter(r => r.status === RoomStatus.RESERVED).length;

    const prompt = `
      Current Hotel Status:
      - Available Rooms: ${available}
      - Occupied Rooms: ${occupied}
      - Dirty Rooms (Pending Housekeeping): ${dirty}
      - Reserved (Awaiting Arrival): ${reserved}
      
      Provide 3 short, actionable bullet points for the front desk manager to optimize operations for today. 
      Focus on housekeeping priority, check-in preparation, and potential upsell opportunities.
      Tone: Professional, high-end hotel management style.
    `;

    const result = await fastQuery(prompt, "You are the AI Operations Manager for Hotel Fountain.");
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-white border border-[#C5A059]/30 rounded-2xl p-4 shadow-sm group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#C5A059]/10 rounded-lg">
            <Sparkles size={14} className="text-[#C5A059]" />
          </div>
          <span className="text-[10px] font-black text-[#242424] uppercase tracking-widest">AI Operational Briefing</span>
        </div>
        <button 
          onClick={generateBriefing}
          disabled={loading}
          className="text-[8px] font-black text-[#C5A059] hover:text-[#242424] transition-colors uppercase tracking-widest bg-[#FDFBF7] px-3 py-1 rounded-full border border-[#C5A059]/20"
        >
          {loading ? 'Analyzing...' : (insight ? 'Refresh Analysis' : 'Generate Brief')}
        </button>
      </div>

      {!insight && !loading && (
        <div className="flex items-center gap-3 py-2 px-1 text-[#8C7B6E]/60">
          <Info size={14} />
          <p className="text-[9px] font-bold italic">Click to analyze room inventory and optimize desk operations.</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={24} className="text-[#C5A059] animate-spin" />
        </div>
      )}

      {insight && !loading && (
        <div className="text-[10px] text-[#242424] leading-relaxed animate-professional font-medium">
          <div className="bg-[#FDFBF7] p-3 rounded-xl border border-gray-100 whitespace-pre-line">
            {insight}
          </div>
        </div>
      )}
    </div>
  );
};
