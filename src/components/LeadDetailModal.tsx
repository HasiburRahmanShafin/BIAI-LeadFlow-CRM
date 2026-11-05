import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  CheckCircle2, 
  ShieldAlert,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LeadEnquiry, PipelineStage } from '../types/crm';
import { generateSmartReply, callGeminiApi } from '../utils/aiEngine';

interface LeadDetailModalProps {
  lead: LeadEnquiry | null;
  onClose: () => void;
  onUpdateLead: (updated: LeadEnquiry) => void;
  onOpenWhatsApp: (phone: string, message: string) => void;
}

interface LeadDetailModalContentProps {
  lead: LeadEnquiry;
  onClose: () => void;
  onUpdateLead: (updated: LeadEnquiry) => void;
  onOpenWhatsApp: (phone: string, message: string) => void;
}

const LeadDetailModalContent: React.FC<LeadDetailModalContentProps> = ({
  lead,
  onClose,
  onUpdateLead,
  onOpenWhatsApp
}) => {
  const [copied, setCopied] = useState(false);
  const [editedReply, setEditedReply] = useState(lead.suggestedReply);
  const [newNote, setNewNote] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleStageChange = (newStage: PipelineStage) => {
    if (newStage === 'Paid') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    const updated: LeadEnquiry = {
      ...lead,
      stage: newStage,
      lastContactedAt: newStage !== 'New' ? new Date().toISOString() : lead.lastContactedAt
    };
    onUpdateLead(updated);
  };

  const handleCopyReply = () => {
    navigator.clipboard.writeText(editedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!lead.phone) return;
    onOpenWhatsApp(lead.phone, editedReply);
    
    // Automatically advance from New to Contacted if not already beyond
    if (lead.stage === 'New') {
      handleStageChange('Contacted');
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const timestamp = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    const noteEntry = `[${timestamp}] ${newNote.trim()}`;
    const updated: LeadEnquiry = {
      ...lead,
      internalNotes: [...(lead.internalNotes || []), noteEntry]
    };
    onUpdateLead(updated);
    setNewNote('');
  };

  const handleRegenerateReply = async (tone: 'professional' | 'banglish_warm' | 'bangla_formal' | 'urgent_support') => {
    setIsRegenerating(true);
    let langOverride: 'Bangla' | 'Banglish' | 'English' = lead.detectedLanguage;
    if (tone === 'banglish_warm') langOverride = 'Banglish';
    if (tone === 'bangla_formal') langOverride = 'Bangla';
    if (tone === 'professional') langOverride = 'English';

    try {
      const prompt = `Write a short, polite customer support reply for BIAI (an AI training academy in Bangladesh).
Customer: ${lead.senderName}
Message: "${lead.rawMessage}"
Category: ${lead.category}
Language required: ${langOverride} (Tone: ${tone})
Write only the message text with no quotes or explanations.`;

      const geminiReply = await callGeminiApi(prompt);
      if (geminiReply && geminiReply.trim()) {
        setEditedReply(geminiReply.trim().replace(/^["']|["']$/g, ''));
        setIsRegenerating(false);
        return;
      }
    } catch (e) {
      console.warn('Gemini reply generation error, falling back to local template:', e);
    }

    const res = generateSmartReply({
      rawMessage: lead.rawMessage,
      senderName: lead.senderName,
      category: lead.category,
      detectedLanguage: langOverride,
      phone: lead.phone
    });
    setEditedReply(res.reply);
    setIsRegenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#FAF8F5] border border-[#E7E2D6] rounded-3xl sm:rounded-[32px] shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE5DB] flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-[#E8E4DA] px-2.5 py-1 rounded-full shadow-2xs">
              {lead.id}
            </span>
            <div>
              <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                <span>{lead.senderName}</span>
                {lead.isDuplicate && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">
                    Repeat Lead
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Received via <span className="text-slate-800 font-semibold">{lead.channel}</span> at {lead.receivedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stage Selector */}
            <select
              value={lead.stage}
              onChange={(e) => handleStageChange(e.target.value as PipelineStage)}
              className="px-3 py-1.5 bg-white border border-[#E8E4DA] text-xs text-[#18181B] font-bold rounded-full focus:outline-none focus:border-amber-500 shadow-2xs"
            >
              <option value="New">Stage: New</option>
              <option value="Contacted">Stage: Contacted</option>
              <option value="Interested">Stage: Interested</option>
              <option value="Paid">Stage: Paid</option>
              <option value="Lost">Stage: Lost</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Overdue Warning Alert */}
          {lead.isOverdue48h && (lead.stage === 'New' || lead.stage === 'Contacted') && (
            <div className="flex items-center gap-3 p-3 bg-[#FAF0EA] border border-[#F4C7B0] rounded-2xl text-xs text-[#C4511A] shadow-2xs">
              <Clock className="w-4 h-4 text-[#C4511A] shrink-0" />
              <div>
                <span className="font-bold">Overdue Follow-Up Alert:</span> No reply or resolution has been recorded in over 48 hours. BIAI team policy requires first contact within 2-4 hours.
              </div>
            </div>
          )}

          {/* Critical PR Escalation Alert */}
          {lead.urgency === 'Critical' && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 shadow-2xs">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider text-red-700">Escalation Notice:</span> This contact involves an urgent refund dispute or public escalation threat. Dispatch leadership outreach immediately.
              </div>
            </div>
          )}

          {/* AI Intelligence Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-white p-3.5 rounded-2xl border border-[#E8E1D5] shadow-2xs">
            <div>
              <span className="text-[10px] text-[#737373] block">Detected Language</span>
              <span className="text-xs font-bold text-[#C4511A]">
                {lead.detectedLanguage}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#737373] block">Identified Program</span>
              <span className="text-xs font-bold text-[#0D0D0D]">
                {lead.category}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#737373] block">Urgency / Sentiment</span>
              <span className="text-xs font-bold text-[#C4511A]">
                {lead.urgency} ({lead.sentiment})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#737373] block">Contact Phone</span>
              <span className="text-xs font-bold text-[#0D0D0D] font-mono">
                {lead.phone || 'None provided'}
              </span>
            </div>
          </div>

          {/* Original Customer Raw Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Original Customer Message</span>
              </label>
              <span className="text-[10px] text-slate-500">{lead.rawMessage.length} characters</span>
            </div>
            <div className="p-3.5 bg-white border border-[#E8E4DA] rounded-2xl text-xs sm:text-sm text-slate-800 font-medium leading-relaxed shadow-2xs">
              &ldquo;{lead.rawMessage}&rdquo;
            </div>
          </div>

          {/* AI Suggested Response Box */}
          <div className="border border-[#F4C7B0] bg-white rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C4511A]" />
                <span className="text-xs font-bold text-[#0D0D0D]">
                  Culturally Tuned Smart Response (Auto-Drafted)
                </span>
              </div>

              {/* Tone Switchers */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => handleRegenerateReply('banglish_warm')}
                  className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E1D5] hover:bg-[#FAF0EA] hover:text-[#C4511A] text-[#525252] transition-colors"
                >
                  Banglish
                </button>
                <button
                  onClick={() => handleRegenerateReply('bangla_formal')}
                  className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E1D5] hover:bg-[#FAF0EA] hover:text-[#C4511A] text-[#525252] transition-colors"
                >
                  Bangla
                </button>
                <button
                  onClick={() => handleRegenerateReply('professional')}
                  className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8E1D5] hover:bg-[#FAF0EA] hover:text-[#C4511A] text-[#525252] transition-colors"
                >
                  English
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={editedReply}
              onChange={(e) => setEditedReply(e.target.value)}
              disabled={isRegenerating}
              className="w-full p-3 bg-[#FAF8F5] border border-[#E8E4DA] rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-500 font-sans leading-relaxed"
            />

            <div className="flex items-center justify-between mt-3">
              <span className="text-[10px] text-slate-500">
                You can edit the draft directly before copying or sending via WhatsApp.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReply}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E8E4DA] hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold transition-colors shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Reply'}</span>
                </button>

                {lead.phone && (
                  <button
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow-2xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline & Internal Notes */}
          <div className="border-t border-[#EAE5DB] pt-3">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Internal Team Notes &amp; Activity Log</h4>
            
            <div className="space-y-1.5 max-h-24 overflow-y-auto mb-2 custom-scrollbar text-xs">
              {(lead.internalNotes || []).map((n: string, i: number) => (
                <div key={i} className="p-2 rounded-xl bg-white border border-[#E8E4DA] text-slate-700 font-mono text-[11px]">
                  {n}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                placeholder="Log a call, payment verification, or next step..."
                className="flex-1 px-3 py-1.5 bg-white border border-[#E8E4DA] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
              <button
                onClick={handleAddNote}
                className="px-3.5 py-1.5 bg-[#0D0D0D] hover:bg-[#262626] text-white text-xs font-bold rounded-full transition-colors shadow-2xs"
              >
                Add Note
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#EAE5DB] bg-white/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Changes persist immediately to local storage</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E8E4DA] hover:bg-slate-50 text-slate-800 font-bold rounded-full shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  onClose,
  onUpdateLead,
  onOpenWhatsApp
}) => {
  if (!lead) return null;

  return (
    <LeadDetailModalContent
      key={lead.id}
      lead={lead}
      onClose={onClose}
      onUpdateLead={onUpdateLead}
      onOpenWhatsApp={onOpenWhatsApp}
    />
  );
};
