import { describe, it, expect } from 'vitest';
import { 
  detectLanguage, 
  extractPhone, 
  extractName, 
  classifyIntent, 
  generateSmartReply, 
  parseAndEnrichEnquiry 
} from '../aiEngine';
import { generateWeeklyAISummary } from '../aiSummary';
import { INITIAL_ENQUIRIES } from '../../data/initialEnquiries';

describe('AI Engine - Linguistic Dialect Detection', () => {
  it('correctly classifies Bengali script as Bangla', () => {
    expect(detectLanguage('ফেলোশিপ প্রোগ্রামে ভর্তি হতে চাই। কবে শুরু হবে?')).toBe('Bangla');
    expect(detectLanguage('পেমেন্ট করেছি কিন্তু কোনো কনফার্মেশন পাইনি।')).toBe('Bangla');
    expect(detectLanguage('আমার কোম্পানির ১৫ জন কর্মীর জন্য কি গ্রুপ ডিসকাউন্ট আছে?')).toBe('Bangla');
  });

  it('correctly classifies colloquial Banglish phonetic text', () => {
    expect(detectLanguage('Assalamualaikum, apnader 3 day bootcamp er price koto? Payment kibhabe korbo?')).toBe('Banglish');
    expect(detectLanguage('Vai class gula live hoy naki recorded? Recording pawa jay?')).toBe('Banglish');
    expect(detectLanguage('Ei course korle job pabo?')).toBe('Banglish');
    expect(detectLanguage('Offline class kothay hobe? Mirpur e?')).toBe('Banglish');
    expect(detectLanguage('Bootcamp er price ta bolen please')).toBe('Banglish');
    expect(detectLanguage('Add-on ta ki? Lifetime access mane ki?')).toBe('Banglish');
  });

  it('correctly classifies formal and conversational English', () => {
    expect(detectLanguage('I run a 40-person textile company in Gazipur. We want AI training for our team. Can someone call me this week?')).toBe('English');
    expect(detectLanguage('Do you offer refunds if I cannot attend after paying?')).toBe('English');
    expect(detectLanguage("Hi, I'm from a bank in Motijheel. Need a quote for training 120 employees. Online or onsite both fine.")).toBe('English');
    expect(detectLanguage('Looking for a job as an AI intern. Where do I apply?')).toBe('English');
  });
});

describe('AI Engine - Entity Extraction', () => {
  it('extracts Bangladeshi phone numbers', () => {
    expect(extractPhone('Phone 01711000001 please')).toBe('01711000001');
    expect(extractPhone('call me at +8801819200102')).toBe('01819200102');
    expect(extractPhone('Number: 01711-200101')).toBe('01711200101');
    expect(extractPhone('No phone here')).toBe('');
  });

  it('extracts sender names from common prefixes', () => {
    expect(extractName('Amar naam Rafi Ahmed, price koto?')).toBe('Rafi Ahmed');
    expect(extractName('আমার নাম ফারজানা রহমান।')).toBe('ফারজানা রহমান');
    expect(extractName('My name is Tanvir Hasan.')).toBe('Tanvir Hasan');
  });
});

describe('AI Engine - Intent Classification & Triage', () => {
  it('quarantines crypto scam comments as Spam', () => {
    const res = classifyIntent('Earn 5000 USD every day with our crypto signals! Click bit.ly/xxxx now!!!', 'Facebook comment');
    expect(res.isSpam).toBe(true);
    expect(res.category).toBe('General / Spam');
    expect(res.sentiment).toBe('Spam');
  });

  it('flags refund complaints and PR threats as Critical Support', () => {
    const res = classifyIntent('Caller wants to cancel his enrolment and get his money back. Very upset. Said he will post about it on Facebook if not solved today.', 'Phone call note');
    expect(res.category).toBe('Support / Refund');
    expect(res.urgency).toBe('Critical');
    expect(res.sentiment).toBe('Frustrated');
    expect(res.isSupportTriage).toBe(true);
  });

  it('flags unconfirmed bKash payments for support triage', () => {
    const res = classifyIntent('পেমেন্ট করেছি কিন্তু কোনো কনফার্মেশন পাইনি। আমার নাম ফারজানা রহমান। ২৫ তারিখে বিকাশে দিয়েছি।', 'WhatsApp');
    expect(res.category).toBe('Support / Refund');
    expect(res.isSupportTriage).toBe(true);
  });

  it('identifies high-ticket Corporate Training requests with estimated values', () => {
    const bankRes = classifyIntent("Hi, I'm from a bank in Motijheel. Need a quote for training 120 employees.", 'WhatsApp');
    expect(bankRes.category).toBe('Corporate Training');
    expect(bankRes.estimatedValueBDT).toBe(960000);

    const textileRes = classifyIntent('I run a 40-person textile company in Gazipur. We want AI training for our team.', 'Website form');
    expect(textileRes.category).toBe('Corporate Training');
    expect(textileRes.estimatedValueBDT).toBe(350000);

    const garmentRes = classifyIntent('আমার কোম্পানির ১৫ জন কর্মীর জন্য কি গ্রুপ ডিসকাউন্ট আছে?', 'WhatsApp');
    expect(garmentRes.category).toBe('Corporate Training');
    expect(garmentRes.estimatedValueBDT).toBe(120000);
  });

  it('routes job applicants to Career / Internship', () => {
    const res = classifyIntent('Looking for a job as an AI intern. Where do I apply?', 'Website form');
    expect(res.category).toBe('Career / Internship');
    expect(res.isSupportTriage).toBe(true);
  });
});

describe('AI Engine - Smart Reply Dialect Matching', () => {
  it('generates Banglish reply for Banglish message', () => {
    const reply = generateSmartReply({
      rawMessage: 'apnader 3 day bootcamp er price koto? Payment kibhabe korbo?',
      senderName: 'Rafi Ahmed',
      category: 'Bootcamp',
      detectedLanguage: 'Banglish'
    });
    expect(reply.replyLanguage).toBe('Banglish');
    expect(reply.reply.toLowerCase()).toContain('walaikum assalam');
    expect(reply.reply.toLowerCase()).toContain('bootcamp');
  });

  it('generates Bengali script reply for Bangla message', () => {
    const reply = generateSmartReply({
      rawMessage: 'ফেলোশিপ প্রোগ্রামে ভর্তি হতে চাই। কবে শুরু হবে?',
      senderName: 'Tahmina Akter',
      category: 'Fellowship',
      detectedLanguage: 'Bangla'
    });
    expect(reply.replyLanguage).toBe('Bangla');
    expect(reply.reply).toContain('আসসালামু আলাইকুম');
    expect(reply.reply).toContain('ফেলোশিপ');
  });

  it('generates polished corporate English reply for corporate inquiries', () => {
    const reply = generateSmartReply({
      rawMessage: 'We want AI training for our 40-person textile team.',
      senderName: 'Mahmud Hasan',
      category: 'Corporate Training',
      detectedLanguage: 'English'
    });
    expect(reply.replyLanguage).toBe('English');
    expect(reply.reply).toContain('Dear Mahmud Hasan');
    expect(reply.reply).toContain('enterprise AI');
  });

  it('runs complete end-to-end parse and enrichment', () => {
    const enriched = parseAndEnrichEnquiry({
      rawMessage: 'Assalamualaikum, apnader 3 day bootcamp er price koto? Phone: 01711000001',
      channel: 'WhatsApp',
      existingLeads: INITIAL_ENQUIRIES
    });
    expect(enriched.detectedLanguage).toBe('Banglish');
    expect(enriched.phone).toBe('01711000001');
    expect(enriched.category).toBe('Bootcamp');
    expect(enriched.isDuplicate).toBe(true);
    expect(enriched.suggestedReply).toContain('Bootcamp');
  });
});

describe('Weekly Executive Summary Engine', () => {
  it('correctly aggregates the 20 sample enquiries', () => {
    const summary = generateWeeklyAISummary(INITIAL_ENQUIRIES);
    expect(summary.totalEnquiries).toBe(20);
    expect(summary.totalEstimatedPipelineBDT).toBeGreaterThan(1000000);
    expect(summary.overdueCount).toBeGreaterThan(0);
    expect(summary.highValueOpportunities.length).toBeGreaterThanOrEqual(3);
    expect(summary.criticalEscalations.length).toBeGreaterThanOrEqual(1);
    expect(summary.strategicRecommendations.length).toBe(5);
  });
});
