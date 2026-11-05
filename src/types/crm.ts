export type Channel = 
  | 'WhatsApp' 
  | 'Facebook Messenger' 
  | 'Facebook comment' 
  | 'Website form' 
  | 'Phone call note';

export type Category = 
  | 'Bootcamp' 
  | 'Fellowship' 
  | 'Corporate Training' 
  | 'Support / Refund' 
  | 'Career / Internship' 
  | 'General / Spam';

export type PipelineStage = 'New' | 'Contacted' | 'Interested' | 'Paid' | 'Lost';

export type ActiveTab = 'overview' | 'kanban' | 'ingest' | 'table';

export type LanguageDialect = 'Banglish' | 'Bangla' | 'English';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type SentimentType = 'Positive' | 'Neutral' | 'Inquisitive' | 'Frustrated' | 'Spam';

export interface LeadEnquiry {
  id: string; // e.g. "ENQ-001"
  rawId: number;
  channel: Channel;
  receivedAt: string; // e.g. "2026-10-26 09:12"
  senderName: string;
  phone: string;
  rawMessage: string;
  
  // AI Extracted & Inferred attributes
  category: Category;
  stage: PipelineStage;
  detectedLanguage: LanguageDialect;
  summary: string;
  suggestedReply: string;
  suggestedReplyLanguage: LanguageDialect;
  urgency: UrgencyLevel;
  sentiment: SentimentType;
  
  // Business metrics & operational flags
  estimatedValueBDT: number;
  isOverdue48h: boolean;
  isSpam: boolean;
  isSupportTriage: boolean;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  lastContactedAt?: string;
  assignedTo?: string;
  tags: string[];
  internalNotes: string[];
}

export interface AISummaryReport {
  generatedAt: string;
  totalEnquiries: number;
  pipelineBreakdown: Record<PipelineStage, number>;
  categoryBreakdown: Record<Category, number>;
  channelBreakdown: Record<Channel, number>;
  languageBreakdown: Record<LanguageDialect, number>;
  totalEstimatedPipelineBDT: number;
  overdueCount: number;
  criticalEscalations: string[];
  highValueOpportunities: string[];
  strategicRecommendations: string[];
}

