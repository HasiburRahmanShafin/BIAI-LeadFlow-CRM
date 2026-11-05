import React, { useState } from 'react';
import { 
  Phone, 
  Clock, 
  ChevronRight, 
  AlertCircle, 
  Copy, 
  Check, 
  MessageCircle 
} from 'lucide-react';
import { LeadEnquiry, PipelineStage } from '../types/crm';

interface LeadCardProps {
  lead: LeadEnquiry;
  onSelect: (lead: LeadEnquiry) => void;
  onAdvanceStage?: (leadId: string, currentStage: PipelineStage) => void;
  onOpenWhatsApp?: (phone: string, message: string) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onSelect,
  onAdvanceStage,
  onOpenWhatsApp
}) => {
  const [copied, setCopied] = useState(false);

  // Avatar initials
  const initials = lead.senderName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'L';

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'WhatsApp':
        return 'text-emerald-800 bg-emerald-50 border-emerald-200';
      case 'Facebook Messenger':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'Facebook comment':
        return 'text-indigo-800 bg-indigo-50 border-indigo-200';
      case 'Website form':
        return 'text-purple-800 bg-purple-50 border-purple-200';
      case 'Phone call note':
        return 'text-amber-800 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Corporate Training':
        return 'text-amber-900 bg-amber-100/80 border-amber-300';
      case 'Fellowship':
        return 'text-purple-900 bg-purple-100 border-purple-200';
      case 'Bootcamp':
        return 'text-emerald-900 bg-emerald-100 border-emerald-200';
      case 'Support / Refund':
        return 'text-rose-900 bg-rose-100 border-rose-200';
      case 'Career / Internship':
        return 'text-amber-900 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const handleCopyReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lead.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(lead)}
      className="group bg-white hover:bg-[#FAF7F2] border border-[#E8E1D5] hover:border-[#C4511A]/80 rounded-2xl p-3.5 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs"
    >
      {/* Top row: Avatar + Name + Overdue Alert */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center font-bold text-[10px] shrink-0 font-mono shadow-2xs">
            {initials}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#0D0D0D] group-hover:text-[#C4511A] transition-colors truncate">
              {lead.senderName}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-[#737373] font-mono">
              <span>{lead.id}</span>
              <span>•</span>
              <span className="truncate">{lead.receivedAt.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {lead.isOverdue48h && (lead.stage === 'New' || lead.stage === 'Contacted') && (
          <span className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[#FAF0EA] text-[#C4511A] border border-[#F4C7B0]">
            <Clock className="w-2.5 h-2.5 text-[#C4511A]" />
            <span>&gt;48h Overdue</span>
          </span>
        )}
      </div>

      {/* Raw message preview */}
      <div className="p-2.5 bg-[#FAF7F2] border border-[#E8E1D5] rounded-xl text-xs text-[#525252] line-clamp-2 leading-relaxed mb-2.5">
        &ldquo;{lead.rawMessage}&rdquo;
      </div>

      {/* Tags row: Program + Channel + Language */}
      <div className="flex items-center gap-1.5 flex-wrap mb-2.5 text-[10px]">
        <span className={`px-2 py-0.5 rounded-md font-semibold border ${getCategoryColor(lead.category)}`}>
          {lead.category}
        </span>
        <span className={`px-1.5 py-0.5 rounded-md font-medium border ${getChannelColor(lead.channel)}`}>
          {lead.channel}
        </span>
        <span className="px-1.5 py-0.5 rounded-md bg-white border border-[#E8E4DA] text-slate-600 font-mono">
          {lead.detectedLanguage}
        </span>
      </div>

      {/* Contact phone & Source */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#EAE5DB] mb-2">
        <div className="text-[11px] text-slate-500 font-mono">
          {lead.phone ? (
            <span className="text-slate-700 flex items-center gap-1 font-medium">
              <Phone className="w-3 h-3 text-slate-400" />
              {lead.phone}
            </span>
          ) : (
            <span className="text-amber-700 italic flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> No phone
            </span>
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {lead.receivedAt.split(' ')[0]}
        </span>
      </div>

      {/* Quick Action Bar */}
      <div className="flex items-center justify-between text-[11px]">
        <button
          onClick={handleCopyReply}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
          title="Copy AI reply"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{copied ? 'Copied' : 'Reply'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          {lead.phone && onOpenWhatsApp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenWhatsApp(lead.phone, lead.suggestedReply);
              }}
              className="p-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Send via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {lead.stage !== 'Lost' && lead.stage !== 'Paid' && onAdvanceStage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdvanceStage(lead.id, lead.stage);
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1C1C1E] text-white hover:bg-black text-[10px] font-semibold transition-colors shadow-2xs"
              title="Advance to next pipeline stage"
            >
              <span>Advance</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
