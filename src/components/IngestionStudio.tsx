import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  RefreshCw, 
  Zap, 
  Globe 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Channel, LeadEnquiry } from '../types/crm';
import { parseAndEnrichEnquiryWithGemini } from '../utils/aiEngine';

interface IngestionStudioProps {
  existingLeads: LeadEnquiry[];
  onAddNewLead: (newLead: LeadEnquiry) => void;
  onGoToPipeline: () => void;
}

const PRESET_SAMPLES = [
  {
    label: '#1 Banglish Bootcamp',
    channel: 'WhatsApp' as Channel,
    text: 'Assalamualaikum, apnader 3 day bootcamp er price koto? Payment kibhabe korbo?',
    name: 'Rafi Ahmed',
    phone: '01711000001'
  },
  {
    label: '#2 Bangla Fellowship',
    channel: 'Facebook Messenger' as Channel,
    text: 'ফেলোশিপ প্রোগ্রামে ভর্তি হতে চাই। কবে শুরু হবে?',
    name: 'Tahmina Akter',
    phone: ''
  },
  {
    label: '#3 English Corporate B2B',
    channel: 'Website form' as Channel,
    text: 'I run a 40-person textile company in Gazipur. We want AI training for our team. Can someone call me this week?',
    name: 'Mahmud Hasan (MD)',
    phone: '01711000003'
  },
  {
    label: '#7 Bangla Payment Issue',
    channel: 'WhatsApp' as Channel,
    text: 'পেমেন্ট করেছি কিন্তু কোনো কনফার্মেশন পাইনি। আমার নাম ফারজানা রহমান। ২৫ তারিখে বিকাশে দিয়েছি।',
    name: 'Farzana Rahman',
    phone: '01711000007'
  },
  {
    label: '#10 Bank Corporate 120 Pax',
    channel: 'WhatsApp' as Channel,
    text: "Hi, I'm from a bank in Motijheel. Need a quote for training 120 employees. Online or onsite both fine.",
    name: 'Kamrul Islam (HR Bank)',
    phone: '01711000010'
  },
  {
    label: '#16 PR Risk Escalation',
    channel: 'Phone call note' as Channel,
    text: 'Caller wants to cancel his enrolment and get his money back. Very upset. Said he will post about it on Facebook if not solved today.',
    name: 'Habibur Rahman',
    phone: '01711000015'
  },
  {
    label: '#20 Career / Intern Seeker',
    channel: 'Website form' as Channel,
    text: 'Looking for a job as an AI intern. Where do I apply?',
    name: 'Arif Hossain',
    phone: '01711000019'
  }
];

export const IngestionStudio: React.FC<IngestionStudioProps> = ({
  existingLeads,
  onAddNewLead,
  onGoToPipeline
}) => {
  const [rawText, setRawText] = useState('');
  const [channel, setChannel] = useState<Channel>('WhatsApp');
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  
  // Parsed result
  const [parsedLead, setParsedLead] = useState<LeadEnquiry | null>(null);

  const handleRunAI = async (textToAnalyze = rawText, customChannel = channel, customName = manualName, customPhone = manualPhone) => {
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    setAnalysisStep('Analyzing dialect & extracting fields...');

    try {
      const result = await parseAndEnrichEnquiryWithGemini({
        rawMessage: textToAnalyze,
        channel: customChannel,
        senderName: customName,
        phone: customPhone,
        existingLeads
      });

      const newLead: LeadEnquiry = {
        ...result,
        id: `ENQ-${String(existingLeads.length + 1).padStart(3, '0')}`,
        rawId: existingLeads.length + 1,
        receivedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setParsedLead(newLead);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleSelectSample = (sample: typeof PRESET_SAMPLES[0]) => {
    setRawText(sample.text);
    setChannel(sample.channel);
    setManualName(sample.name);
    setManualPhone(sample.phone);
    handleRunAI(sample.text, sample.channel, sample.name, sample.phone);
  };

  const handleSaveToPipeline = () => {
    if (!parsedLead) return;
    onAddNewLead(parsedLead);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
    setParsedLead(null);
    setRawText('');
    setManualName('');
    setManualPhone('');
    onGoToPipeline();
  };

  return (
    <div className="flex-1 p-2 sm:p-4 max-w-6xl mx-auto w-full custom-scrollbar overflow-y-auto">
      {/* Title */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#FAF0EA] border border-[#F4C7B0] text-[#C4511A] shadow-2xs">
            <Sparkles className="w-5 h-5 text-[#C4511A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0D0D0D] tracking-tight">AI Message Ingestion &amp; Auto-Fill Studio</h2>
            <p className="text-xs text-[#525252]">
              Paste an unstructured inbound enquiry from WhatsApp, Messenger, or forms. The AI detects Bangla/Banglish, extracts fields, and drafts matching responses instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Test Carousel */}
      <div className="mb-5 bg-white/80 border border-[#E8E1D5] rounded-3xl p-4 shadow-2xs">
        <label className="text-xs font-bold text-[#0D0D0D] mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#C4511A]" />
          <span>1-Click Test Enquiries (From BIAI Sample Pack)</span>
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {PRESET_SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(sample)}
              className="px-3.5 py-1.5 bg-white hover:bg-[#FAF0EA] border border-[#E8E1D5] hover:border-[#C4511A] rounded-full text-xs font-semibold text-[#525252] hover:text-[#C4511A] shrink-0 transition-colors shadow-2xs"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white/80 border border-[#E8E1D5] rounded-3xl p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-[#0D0D0D] mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C4511A]" />
              <span>Paste Raw Inbound Message</span>
            </h3>

            {/* Message Area */}
            <div className="mb-4">
              <textarea
                rows={4}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste customer message here (Bangla, Banglish, or English)...
Example: Assalamualaikum, apnader 3 day bootcamp er price koto? Payment kibhabe korbo?"
                className="w-full p-3.5 bg-white border border-[#E8E1D5] rounded-2xl text-xs sm:text-sm text-[#0D0D0D] placeholder-[#8A7E6F] focus:outline-none focus:border-[#C4511A] transition-colors shadow-2xs"
              />
            </div>

            {/* Channel, Name, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#525252] mb-1">Source Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E1D5] rounded-full text-xs text-[#0D0D0D] focus:outline-none focus:border-[#C4511A] shadow-2xs"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Facebook Messenger">Facebook Messenger</option>
                  <option value="Facebook comment">Facebook comment</option>
                  <option value="Website form">Website form</option>
                  <option value="Phone call note">Phone call note</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#525252] mb-1">Sender Name (Optional)</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Auto-extracted if blank"
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E1D5] rounded-full text-xs text-[#0D0D0D] placeholder-[#8A7E6F] focus:outline-none focus:border-[#C4511A] shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#525252] mb-1">Phone (Optional)</label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E1D5] rounded-full text-xs text-[#0D0D0D] placeholder-[#8A7E6F] focus:outline-none focus:border-[#C4511A] shadow-2xs"
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => handleRunAI()}
              disabled={isAnalyzing || !rawText.trim()}
              className="w-full py-2.5 px-4 bg-[#C4511A] hover:bg-[#A8400F] text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>{analysisStep || 'Analyzing message...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Parse &amp; Auto-Fill Details</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Extraction Output */}
        <div className="lg:col-span-6">
          {parsedLead ? (
            <div className="bg-white/80 border border-[#F4C7B0] rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-[#0D0D0D]">Extraction Complete</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0EA] text-[#C4511A] border border-[#F4C7B0]">
                  Ready to Ingest
                </span>
              </div>

              {/* Extraction Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-2xl bg-white border border-[#E8E1D5]">
                  <span className="text-[10px] text-[#737373] block">Sender Name</span>
                  <span className="font-bold text-[#0D0D0D] truncate block">{parsedLead.senderName}</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-[#E8E1D5]">
                  <span className="text-[10px] text-[#737373] block">Identified Language</span>
                  <span className="font-bold text-[#C4511A] flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {parsedLead.detectedLanguage}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-[#E8E1D5]">
                  <span className="text-[10px] text-[#737373] block">Program Category</span>
                  <span className="font-bold text-[#0D0D0D] truncate block">{parsedLead.category}</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-[#E8E1D5]">
                  <span className="text-[10px] text-[#737373] block">Contact Phone</span>
                  <span className="font-mono font-medium text-[#525252]">
                    {parsedLead.phone || 'Not provided'}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-[#E8E1D5]">
                  <span className="text-[10px] text-[#737373] block">Source Channel</span>
                  <span className="font-bold text-[#0D0D0D]">
                    {parsedLead.channel}
                  </span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-[#E8E1D5]">
                  <span className="text-[10px] text-[#737373] block">Initial Stage</span>
                  <span className="font-bold text-blue-700">{parsedLead.stage}</span>
                </div>
              </div>

              {/* Generated Reply */}
              <div>
                <label className="block text-xs font-bold text-[#0D0D0D] mb-1.5 flex items-center justify-between">
                  <span>Culturally Tuned Smart Response (Auto-Drafted)</span>
                  <span className="text-[10px] text-[#737373] font-normal">Matches customer dialect</span>
                </label>
                <div className="p-3 bg-[#FAF7F2] border border-[#E8E1D5] rounded-2xl text-xs text-[#0D0D0D] whitespace-pre-wrap leading-relaxed font-sans">
                  {parsedLead.suggestedReply}
                </div>
              </div>

              {/* Ingest Action CTA */}
              <button
                onClick={handleSaveToPipeline}
                className="w-full py-2.5 px-4 bg-[#0D0D0D] hover:bg-[#262626] text-white font-bold rounded-full text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Add to Pipeline &amp; WhatsApp Outbox</span>
                <ArrowRight className="w-4 h-4 text-[#C4511A]" />
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white/40 border border-dashed border-[#E0DBD0] rounded-3xl text-center">
              <Sparkles className="w-8 h-8 text-[#C4511A] mb-2" />
              <h4 className="text-sm font-bold text-[#0D0D0D] mb-1">Awaiting Inbound Message</h4>
              <p className="text-xs text-[#737373] max-w-xs">
                Select a test sample above or paste an unstructured enquiry to see immediate field extraction and contextual reply drafting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
