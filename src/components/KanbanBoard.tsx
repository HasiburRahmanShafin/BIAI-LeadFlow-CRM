import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Inbox, 
  Clock 
} from 'lucide-react';
import { LeadEnquiry, PipelineStage } from '../types/crm';
import { LeadCard } from './LeadCard';

interface KanbanBoardProps {
  leads: LeadEnquiry[];
  onSelectLead: (lead: LeadEnquiry) => void;
  onAdvanceStage: (leadId: string, currentStage: PipelineStage) => void;
  onOpenWhatsApp: (phone: string, message: string) => void;
  onOpenIngest: () => void;
}

const STAGES: { id: PipelineStage; label: string; dotColor: string }[] = [
  { id: 'New', label: 'New Enquiries', dotColor: 'bg-blue-500' },
  { id: 'Contacted', label: 'Contacted', dotColor: 'bg-amber-500' },
  { id: 'Interested', label: 'Interested', dotColor: 'bg-indigo-500' },
  { id: 'Paid', label: 'Paid / Enrolled', dotColor: 'bg-emerald-500' },
  { id: 'Lost', label: 'Lost / Quarantined', dotColor: 'bg-slate-400' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onSelectLead,
  onAdvanceStage,
  onOpenWhatsApp,
  onOpenIngest
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    if (filterOverdueOnly && (!lead.isOverdue48h || (lead.stage !== 'New' && lead.stage !== 'Contacted'))) {
      return false;
    }

    if (selectedChannel !== 'all' && lead.channel !== selectedChannel) {
      return false;
    }

    if (selectedCategory !== 'all' && lead.category !== selectedCategory) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.senderName.toLowerCase().includes(q);
      const matchMsg = lead.rawMessage.toLowerCase().includes(q);
      const matchPhone = lead.phone.includes(q);
      const matchSummary = lead.summary.toLowerCase().includes(q);
      if (!matchName && !matchMsg && !matchPhone && !matchSummary) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 p-1 lg:p-2">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, message, phone, or keyword..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E8E4DA] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/60 transition-colors shadow-2xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Channel Filter */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E8E4DA] rounded-full text-xs text-slate-700 focus:outline-none focus:border-amber-500 shadow-2xs"
          >
            <option value="all">All Channels</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Facebook Messenger">Facebook Messenger</option>
            <option value="Facebook comment">Facebook Comment</option>
            <option value="Website form">Website Form</option>
            <option value="Phone call note">Phone Call Note</option>
          </select>

          {/* Program/Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-white border border-[#E8E4DA] rounded-full text-xs text-slate-700 focus:outline-none focus:border-amber-500 shadow-2xs"
          >
            <option value="all">All Programs &amp; Types</option>
            <option value="Bootcamp">Bootcamp</option>
            <option value="Fellowship">Fellowship</option>
            <option value="Corporate Training">Corporate Training</option>
            <option value="Support / Refund">Support / Refund</option>
            <option value="Career / Internship">Career / Internship</option>
            <option value="General / Spam">General / Spam</option>
          </select>

          {/* 48h Overdue Filter Toggle */}
          <button
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
              filterOverdueOnly
                ? 'bg-[#C4511A] text-white border border-[#A8400F]'
                : 'bg-white border border-[#E8E1D5] text-[#525252] hover:bg-slate-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>48h Overdue</span>
          </button>

          {/* Ingest CTA */}
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#C4511A] hover:bg-[#A8400F] text-white font-bold rounded-full text-xs shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>AI Parse Message</span>
          </button>
        </div>
      </div>

      {/* Kanban Grid Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 overflow-x-auto pb-2">
        {STAGES.map(stage => {
          const stageLeads = filteredLeads.filter(l => l.stage === stage.id);
          const stageOverdueCount = stageLeads.filter(l => l.isOverdue48h).length;

          return (
            <div
              key={stage.id}
              className="flex flex-col bg-[#F7F5F0]/70 border border-[#EBE7DF] rounded-3xl p-3 min-w-[260px] max-h-[calc(100vh-190px)] overflow-hidden shadow-2xs"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#EAE5DB]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                  <span className="font-bold text-xs text-[#18181B]">
                    {stage.label}
                  </span>
                  <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-white border border-[#E8E4DA] text-slate-700 rounded-full">
                    {stageLeads.length}
                  </span>
                  {stageOverdueCount > 0 && (stage.id === 'New' || stage.id === 'Contacted') && (
                    <span 
                      className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-100 text-rose-700 rounded-full border border-rose-200 flex items-center gap-0.5" 
                      title={`${stageOverdueCount} overdue follow-ups`}
                    >
                      <Clock className="w-2.5 h-2.5 text-rose-600" />
                      {stageOverdueCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                {stageLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs">
                    <Inbox className="w-6 h-6 mb-2 stroke-[1.5] text-slate-400" />
                    <span>No leads in this stage</span>
                  </div>
                ) : (
                  stageLeads.map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onSelect={onSelectLead}
                      onAdvanceStage={onAdvanceStage}
                      onOpenWhatsApp={onOpenWhatsApp}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
