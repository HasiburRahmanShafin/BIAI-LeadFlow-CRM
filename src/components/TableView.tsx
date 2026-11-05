import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  ArrowUpDown,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { LeadEnquiry, PipelineStage } from '../types/crm';

interface TableViewProps {
  leads: LeadEnquiry[];
  onSelectLead: (lead: LeadEnquiry) => void;
  onAdvanceStage: (leadId: string, currentStage: PipelineStage) => void;
  onOpenWhatsApp: (phone: string, message: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  leads,
  onSelectLead,
  onOpenWhatsApp
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof LeadEnquiry>('rawId');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: keyof LeadEnquiry) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = leads.filter(l => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.senderName.toLowerCase().includes(q) ||
      l.rawMessage.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.channel.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (valA === undefined) return sortAsc ? -1 : 1;
    if (valB === undefined) return sortAsc ? 1 : -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  return (
    <div className="flex-1 p-1 lg:p-2 flex flex-col min-h-0">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-3.5 gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads across all 20 sample rows..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8E4DA] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-[#18181B] font-mono">{sorted.length}</span> of {leads.length} enquiries
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto border border-[#E8E1D5] rounded-3xl bg-white/90 custom-scrollbar shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E8E1D5] bg-[#FAF7F2] sticky top-0 z-10 text-[10px] font-bold text-[#8A7E6F] tracking-wider">
              <th className="py-3 px-3 cursor-pointer hover:text-[#0D0D0D]" onClick={() => handleSort('rawId')}>
                <div className="flex items-center gap-1">
                  <span>ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">SENDER NAME</th>
              <th className="py-3 px-3">CHANNEL</th>
              <th className="py-3 px-3">PHONE</th>
              <th className="py-3 px-3">PROGRAM / INTENT</th>
              <th className="py-3 px-3">LANGUAGE</th>
              <th className="py-3 px-3">STATUS</th>
              <th className="py-3 px-3">RECEIVED AT</th>
              <th className="py-3 px-3 text-center">48H SLA</th>
              <th className="py-3 px-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE3D6] text-[#525252]">
            {sorted.map(lead => {
              const isOverdue = lead.isOverdue48h && (lead.stage === 'New' || lead.stage === 'Contacted');
              const initials = lead.senderName.slice(0, 2).toUpperCase();

              return (
                <tr 
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="hover:bg-[#FAF0EA]/60 cursor-pointer transition-colors group"
                >
                  <td className="py-3 px-3 font-mono font-medium text-[#737373]">
                    {lead.id}
                  </td>
                  <td className="py-3 px-3 font-bold text-[#0D0D0D] group-hover:text-[#C4511A] transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center font-bold text-[9px]">
                        {initials}
                      </div>
                      <span>{lead.senderName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-[#E8E1D5] text-[#525252]">
                      {lead.channel}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-[#525252]">
                    {lead.phone || <span className="text-[#C4511A] italic">No phone</span>}
                  </td>
                  <td className="py-3 px-3 text-[#0D0D0D] font-medium max-w-[180px] truncate">
                    {lead.category}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E8E1D5] text-[#737373]">
                      {lead.detectedLanguage}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lead.stage === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lead.stage === 'Interested'
                        ? 'bg-[#FAF0EA] text-[#C4511A] border border-[#F4C7B0]'
                        : lead.stage === 'Contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-[#F4EFE6] text-[#525252]'
                    }`}>
                      {lead.stage}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#737373] text-[11px] whitespace-nowrap">
                    {lead.receivedAt}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#FAF0EA] text-[#C4511A] border border-[#F4C7B0]">
                        <Clock className="w-2.5 h-2.5 text-[#C4511A]" />
                        <span>Overdue</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 text-[10px] font-medium">On Track</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {lead.phone && (
                        <button
                          onClick={() => onOpenWhatsApp(lead.phone, lead.suggestedReply)}
                          className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-colors shadow-2xs"
                          title="Instant WhatsApp reply"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="w-7 h-7 rounded-full bg-white border border-[#E8E4DA] text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors shadow-2xs"
                        title="View details"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
