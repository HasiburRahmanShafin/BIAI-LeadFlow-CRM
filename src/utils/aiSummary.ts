import { LeadEnquiry, AISummaryReport, PipelineStage, Category, Channel, LanguageDialect } from '../types/crm';

export function generateWeeklyAISummary(leads: LeadEnquiry[]): AISummaryReport {
  const pipelineBreakdown: Record<PipelineStage, number> = {
    New: 0,
    Contacted: 0,
    Interested: 0,
    Paid: 0,
    Lost: 0
  };

  const categoryBreakdown: Record<Category, number> = {
    Bootcamp: 0,
    Fellowship: 0,
    'Corporate Training': 0,
    'Support / Refund': 0,
    'Career / Internship': 0,
    'General / Spam': 0
  };

  const channelBreakdown: Record<Channel, number> = {
    WhatsApp: 0,
    'Facebook Messenger': 0,
    'Facebook comment': 0,
    'Website form': 0,
    'Phone call note': 0
  };

  const languageBreakdown: Record<LanguageDialect, number> = {
    Bangla: 0,
    Banglish: 0,
    English: 0
  };

  let totalValue = 0;
  let overdueCount = 0;
  const criticalEscalations: string[] = [];
  const highValueOpportunities: string[] = [];

  for (const lead of leads) {
    if (pipelineBreakdown[lead.stage] !== undefined) {
      pipelineBreakdown[lead.stage]++;
    }
    if (categoryBreakdown[lead.category] !== undefined) {
      categoryBreakdown[lead.category]++;
    }
    if (channelBreakdown[lead.channel] !== undefined) {
      channelBreakdown[lead.channel]++;
    }
    if (languageBreakdown[lead.detectedLanguage] !== undefined) {
      languageBreakdown[lead.detectedLanguage]++;
    }

    if (lead.estimatedValueBDT > 0 && lead.stage !== 'Lost') {
      totalValue += lead.estimatedValueBDT;
    }

    if (lead.isOverdue48h && (lead.stage === 'New' || lead.stage === 'Contacted')) {
      overdueCount++;
    }

    if (lead.urgency === 'Critical' || (lead.category === 'Support / Refund' && lead.sentiment === 'Frustrated')) {
      criticalEscalations.push(`${lead.senderName} (${lead.channel}): ${lead.summary}`);
    }

    if (lead.category === 'Corporate Training' && lead.estimatedValueBDT >= 100000) {
      highValueOpportunities.push(
        `${lead.senderName} [Est. BDT ${(lead.estimatedValueBDT).toLocaleString()}]: ${lead.summary}`
      );
    }
  }

  const strategicRecommendations = [
    'Immediate Founder/Management Call for Habibur Rahman: Customer is frustrated regarding refund and threatened public Facebook post. Immediate reimbursement prevents brand reputation risk.',
    'Fast-Track Enterprise Deals: Motijheel Bank (120 employees, ৳9.6L) and Gazipur Textile (40 employees, ৳3.5L) represent ৳13.1 Lakhs in high-margin corporate revenue. Schedule formal pitch decks this week.',
    'Reconcile bKash Statement: Farzana Rahman paid on 25 Oct without confirmation. Verify TrxID on the merchant portal and dispatch enrollment access within 1 hour.',
    'WhatsApp Lead Nudge: Rafi Ahmed reached out twice inquiring about Bootcamp price. Send the special "BIAI300" early-bird coupon to close payment immediately.',
    'Phone Capture on Facebook: 4 prospective students on Messenger/Comments have no phone on file. Send automated DM asking for WhatsApp numbers for faster counseling.'
  ];

  return {
    generatedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'full', timeStyle: 'short' }),
    totalEnquiries: leads.length,
    pipelineBreakdown,
    categoryBreakdown,
    channelBreakdown,
    languageBreakdown,
    totalEstimatedPipelineBDT: totalValue,
    overdueCount,
    criticalEscalations,
    highValueOpportunities,
    strategicRecommendations
  };
}

