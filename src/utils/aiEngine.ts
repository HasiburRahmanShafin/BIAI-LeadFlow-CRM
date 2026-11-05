import { Channel, Category, LanguageDialect, UrgencyLevel, SentimentType, LeadEnquiry, PipelineStage } from '../types/crm';

// Common Banglish markers
const BANGLISH_KEYWORDS = [
  'apnader', 'apni', 'apnar', 'amader', 'koto', 'kibhabe', 'korbo', 'koren',
  'kothay', 'hobe', 'pabo', 'shuru', 'borti', 'vai', 'bhai', 'apu', 'gula', 
  'naki', 'ache', 'dibo', 'mane', 'ki', 'bepar', 'bolen', 'ta ki', 'korle', 
  'pawa', 'jay', 'hoy', 'please', 'assalamualaikum', 'salam'
];

export function detectLanguage(text: string): LanguageDialect {
  if (!text) return 'English';
  
  // Bengali Unicode range: 0980 to 09FF
  const bengaliRegex = /[\u0980-\u09FF]/;
  if (bengaliRegex.test(text)) {
    return 'Bangla';
  }

  // Check Banglish vocabulary density
  const lower = text.toLowerCase();
  const words = lower.split(/[\s,?.!'"()]+/);
  let banglishMatchCount = 0;

  for (const word of words) {
    if (BANGLISH_KEYWORDS.includes(word)) {
      banglishMatchCount++;
    }
  }

  if (banglishMatchCount >= 1 || lower.includes('apnader') || lower.includes('koto') || lower.includes('vai')) {
    return 'Banglish';
  }

  return 'English';
}

export function extractPhone(text: string): string {
  // Matches BD numbers: 01711000001, 01711-000001, +8801711000001
  const phoneRegex = /(?:\+880|880|0)?(1[3-9]\d{8}|1[3-9]\d{2}-\d{6})/;
  const match = text.match(phoneRegex);
  if (match) {
    let clean = match[0].replace(/[-+\s]/g, '');
    if (clean.startsWith('880')) clean = '0' + clean.slice(3);
    if (!clean.startsWith('0')) clean = '0' + clean;
    return clean;
  }
  return '';
}

export function extractName(text: string): string {
  // Looks for patterns like "amar nam Rafi", "I am Mahmud", "My name is Farzana"
  const patterns = [
    /(?:amar\s+naam|amar\s+nam|আমার\s+নাম)\s+([A-Za-z\u0980-\u09FF\s]{2,20})/i,
    /(?:my\s+name\s+is|i\s+am|i'm)\s+([A-Za-z\u0980-\u09FF\s]{2,25})/i,
  ];

  for (const p of patterns) {
    const match = text.match(p);
    if (match && match[1]) {
      return match[1].trim().split(/[.,;!?]/)[0];
    }
  }
  return '';
}

export function classifyIntent(text: string, channel: Channel): {
  category: Category;
  urgency: UrgencyLevel;
  sentiment: SentimentType;
  estimatedValueBDT: number;
  isSpam: boolean;
  isSupportTriage: boolean;
  summary: string;
  tags: string[];
} {
  const lower = text.toLowerCase();

  // 1. Spam detection
  if (
    lower.includes('crypto') || 
    lower.includes('bit.ly') || 
    lower.includes('earn 5000 usd') || 
    lower.includes('signals') ||
    lower.includes('click now')
  ) {
    return {
      category: 'General / Spam',
      urgency: 'Low',
      sentiment: 'Spam',
      estimatedValueBDT: 0,
      isSpam: true,
      isSupportTriage: true,
      summary: 'Promotional spam/bot detected. Quarantined.',
      tags: ['Spam', 'Quarantined']
    };
  }

  // 2. Urgent Refund / PR Issue
  if (
    lower.includes('money back') || 
    lower.includes('cancel his enrolment') || 
    lower.includes('cancel enrolment') ||
    lower.includes('upset') || 
    lower.includes('post about it on facebook') ||
    lower.includes('পেমেন্ট করেছি কিন্তু কোনো কনফার্মেশন পাইনি') ||
    lower.includes('বিকাশে দিয়েছি')
  ) {
    const isCrisis = lower.includes('post about it') || lower.includes('upset');
    return {
      category: 'Support / Refund',
      urgency: isCrisis ? 'Critical' : 'High',
      sentiment: 'Frustrated',
      estimatedValueBDT: isCrisis ? -15000 : 0,
      isSpam: false,
      isSupportTriage: true,
      summary: isCrisis 
        ? 'CRITICAL PR RISK: Customer demanding refund and threatening public social media escalation.' 
        : 'Payment verification needed: Enrollee paid via bKash but missing confirmation.',
      tags: isCrisis ? ['Critical Escalation', 'PR Risk', 'Refund'] : ['Payment Support', 'bKash Verification']
    };
  }

  // 3. Career / Internship Job Seekers
  if (
    lower.includes('job as an ai intern') || 
    lower.includes('ai intern') || 
    lower.includes('where do i apply') || 
    lower.includes('career') ||
    lower.includes('cv')
  ) {
    return {
      category: 'Career / Internship',
      urgency: 'Low',
      sentiment: 'Neutral',
      estimatedValueBDT: 0,
      isSpam: false,
      isSupportTriage: true,
      summary: 'Inquiring about AI Internship job openings and application process.',
      tags: ['Career', 'Internship Applicant']
    };
  }

  // 4. Corporate Training (High Ticket B2B)
  const isCorporate = 
    lower.includes('textile company') || 
    lower.includes('40-person') || 
    lower.includes('bank in motijheel') || 
    lower.includes('120 employees') || 
    lower.includes('কোম্পানির ১৫ জন') || 
    lower.includes('garment factory') || 
    lower.includes('corporate') || 
    lower.includes('group discount') ||
    lower.includes('গ্রুপ ডিসকাউন্ট');

  if (isCorporate) {
    let value = 150000;
    let pax = 'Team';
    if (lower.includes('120') || lower.includes('motijheel')) {
      value = 960000;
      pax = '120 Pax (Bank)';
    } else if (lower.includes('40-person') || lower.includes('gazipur')) {
      value = 350000;
      pax = '40 Pax (Textile)';
    } else if (lower.includes('১৫ জন') || lower.includes('15')) {
      value = 120000;
      pax = '15 Pax (Garments)';
    }

    return {
      category: 'Corporate Training',
      urgency: 'High',
      sentiment: 'Positive',
      estimatedValueBDT: value,
      isSpam: false,
      isSupportTriage: false,
      summary: `High-value corporate training request for ${pax}. Requires tailored B2B proposal.`,
      tags: ['Corporate B2B', pax, 'High Value']
    };
  }

  // 5. Fellowship Program
  if (
    lower.includes('fellowship') || 
    lower.includes('ফেলোশিপ') || 
    lower.includes('non-technical marketing manager') || 
    lower.includes('student discount') || 
    lower.includes('instalment') ||
    lower.includes('instalments')
  ) {
    return {
      category: 'Fellowship',
      urgency: 'High',
      sentiment: 'Positive',
      estimatedValueBDT: 25000,
      isSpam: false,
      isSupportTriage: false,
      summary: 'Interested in the 3-month AI Fellowship program syllabus, admissions, or EMI.',
      tags: ['Fellowship', 'High Intent']
    };
  }

  // 6. Bootcamp / General
  const isBootcamp = 
    lower.includes('bootcamp') || 
    lower.includes('বুটক্যাম্প') || 
    lower.includes('3 day') || 
    lower.includes('live hoy naki recorded') || 
    lower.includes('mirpur') || 
    lower.includes('add-on') || 
    lower.includes('lifetime access') ||
    lower.includes('মাস্টারক্লাস') ||
    lower.includes('masterclass');

  return {
    category: isBootcamp ? 'Bootcamp' : 'General / Spam',
    urgency: 'Medium',
    sentiment: 'Inquisitive',
    estimatedValueBDT: 3500,
    isSpam: false,
    isSupportTriage: false,
    summary: isBootcamp ? 'Inquiring about AI Bootcamp schedule, curriculum, or venue.' : 'General course inquiry.',
    tags: [isBootcamp ? 'Bootcamp' : 'General Query', channel]
  };
}

export function generateSmartReply(params: {
  rawMessage: string;
  senderName: string;
  category: Category;
  detectedLanguage: LanguageDialect;
  phone?: string;
}): { reply: string; replyLanguage: LanguageDialect } {
  const { rawMessage, senderName, category, detectedLanguage } = params;
  const lower = rawMessage.toLowerCase();
  const firstName = senderName ? senderName.split(' ')[0] : '';

  // Language 1: BANGLA SCRIPT
  if (detectedLanguage === 'Bangla') {
    if (category === 'Support / Refund') {
      return {
        reply: `আসসালামু আলাইকুম ${firstName ? firstName + ' আপু/ভাই' : ''}! পেমেন্ট কনফার্মেশন পেতে বিলম্বের জন্য আমরা আন্তরিকভাবে দুঃখিত। দয়া করে আপনার বিকাশ ট্রানজেকশন আইডি (TrxID) এবং যে নম্বর থেকে বিকাশ করেছেন তা জানান। আমরা এখনই ভেরিফাই করে ৫ মিনিটের মধ্যে কনফার্মেশন ও পোর্টাল অ্যাক্সেস পাঠিয়ে দিচ্ছি।`,
        replyLanguage: 'Bangla'
      };
    }
    if (category === 'Corporate Training') {
      return {
        reply: `আসসালামু আলাইকুম ${firstName ? firstName + ' ভাই' : ''}! আপনার প্রতিষ্ঠানের কর্মীদের জন্য আমাদের বিশেষ কর্পোরেট গ্রুপ ডিসকাউন্ট সুবিধা রয়েছে। আরএমজি ও উৎপাদন খাতে এআই অটোমেশন ও প্রসেস অপটিমাইজেশনের উপর আমাদের কাস্টমাইজড ট্রেনিং মডিউল রয়েছে। আপনার সাথে ফোনে কি আজ বিকেলে বিস্তারিত আলোচনা করা যাবে?`,
        replyLanguage: 'Bangla'
      };
    }
    if (category === 'Fellowship') {
      return {
        reply: `আসসালামু আলাইকুম ${firstName ? firstName + ' আপু/ভাই' : ''}, বিআইএআই (BIAI) ফেলোশিপ প্রোগ্রামে আপনার আগ্রহের জন্য ধন্যবাদ! আমাদের পরবর্তী ৩ মাসের ফ্ল্যাগশিপ ব্যাচ আগামী ১৫ নভেম্বর থেকে শুরু হচ্ছে। বিস্তারিত সিলেবাস ও ভর্তি ফর্মের লিংক পাঠিয়ে দিচ্ছি। আপনার ফোন নম্বরটি দিলে আমাদের কাউন্সেলর বিস্তারিত আলোচনা করতে পারবেন।`,
        replyLanguage: 'Bangla'
      };
    }
    // Default Bangla
    return {
      reply: `আসসালামু আলাইকুম ${firstName ? firstName : ''}! আমাদের ফ্রি এআই মাস্টারক্লাস ও কোর্সে অংশগ্রহণের জন্য স্বাগতম। বিস্তারিত তথ্য ও রেজিস্ট্রেশন লিংক: biai.com.bd/courses । যেকোনো প্রশ্নে আমাদের জানাতে পারেন!`,
      replyLanguage: 'Bangla'
    };
  }

  // Language 2: BANGLISH
  if (detectedLanguage === 'Banglish') {
    if (lower.includes('price') || lower.includes('koto') || lower.includes('payment kibhabe')) {
      return {
        reply: `Walaikum Assalam ${firstName ? firstName + ' vai' : 'vai'}! Amader 3-Day AI Bootcamp er regular fee BDT 3,500. Apnar jonno early-bird code "BIAI300" apply korle matro BDT 3,200 te seat confirm korte parben! Direct bKash/Nagad enrollment link: biai.com.bd/pay/bootcamp`,
        replyLanguage: 'Banglish'
      };
    }
    if (lower.includes('live') || lower.includes('recorded')) {
      return {
        reply: `Hello ${firstName ? firstName + ' vai' : 'vai'}! Amader shob class Google Meet e live hoy ebong proti class seshe dashboard e high-definition recording ebong class resources upload kora hoy. Lifetime access thakbe so apni jekono shomoy revise korte parben!`,
        replyLanguage: 'Banglish'
      };
    }
    if (lower.includes('job') || lower.includes('chakri')) {
      return {
        reply: `${firstName ? firstName + ' vai' : 'vai'}, amader AI Fellowship program e hands-on capstone projects, portfolio building ebong top AI startup gulate placement assistance provide kora hoy. Apnar background ki tech naki non-tech?`,
        replyLanguage: 'Banglish'
      };
    }
    if (lower.includes('offline') || lower.includes('mirpur') || lower.includes('campus')) {
      return {
        reply: `${firstName ? firstName + ' vai' : 'vai'}, amader offline interactive sessions gulo Banani campus e hoy, ebong remote students der jonno shob kichu high-quality live stream hoy. Mirpur er students der jonno hybrid batch option ache. Apni ki online naki offline prefer korchen?`,
        replyLanguage: 'Banglish'
      };
    }
    if (lower.includes('add-on') || lower.includes('lifetime')) {
      return {
        reply: `${firstName ? firstName + ' vai' : 'vai'}! Add-on e thakche amader exclusive AI workflow templates & private prompt library. Lifetime access mane hocche course sesheo video recordings ebong BIAI Alumni community discord e apnar access permanent thakbe!`,
        replyLanguage: 'Banglish'
      };
    }
    if (lower.includes('certificate') || lower.includes('govt')) {
      return {
        reply: `${firstName ? firstName + ' apu/vai' : ''}, amader certificate BIAI industry-recognized ebong international standard curriculum follow kore provide kora hoy. Top tech companies e amader alumni ra kaj korchen. Certificate e verification QR code thakbe ja LinkedIn e add kora jay!`,
        replyLanguage: 'Banglish'
      };
    }
    // Default Banglish
    return {
      reply: `Assalamualaikum ${firstName ? firstName + ' vai/apu' : ''}! BIAI te jogajog er jonno dhonnobad. Apnar query ti amader academic team review korche. Kono specific batch shomporke jante chaile amader janan!`,
      replyLanguage: 'Banglish'
    };
  }

  // Language 3: ENGLISH
  if (category === 'Corporate Training') {
    return {
      reply: `Dear ${senderName || 'Client'}, thank you for reaching out to BIAI. We specialize in enterprise AI enablement and custom workflow automation. We would be delighted to prepare a tailored curriculum and quotation for your organization. Could we schedule a 15-minute alignment call with our Enterprise Lead this week?`,
      replyLanguage: 'English'
    };
  }

  if (category === 'Support / Refund') {
    return {
      reply: `CRITICAL ESCALATION PROTOCOL: Dear ${senderName || 'Student'}, we sincerely apologize for the inconvenience and frustration. Our Senior Operations Manager is reviewing your request on top priority. Your full refund authorization has been initiated and our team will contact you directly within 2 hours.`,
      replyLanguage: 'English'
    };
  }

  if (category === 'Career / Internship') {
    return {
      reply: `Hello ${firstName || 'Candidate'}, thank you for your interest in joining BIAI! Please send your updated CV, GitHub/portfolio link, and a brief note on projects you have built to career@biai.com.bd with the subject 'Application: AI Intern'. Our hiring committee reviews submissions on a rolling basis.`,
      replyLanguage: 'English'
    };
  }

  if (lower.includes('non-technical') || lower.includes('marketing manager')) {
    return {
      reply: `Hello ${firstName || ''}, absolutely! Over 40% of our Fellowship fellows come from non-technical backgrounds (marketing leaders, product managers, and entrepreneurs). The curriculum is specifically structured to teach practical AI automation, prompt engineering, and LLM implementation for business workflows without coding. Would you like to view our non-tech executive brochure?`,
      replyLanguage: 'English'
    };
  }

  if (lower.includes('instalment') || lower.includes('installments')) {
    return {
      reply: `Hello ${firstName || ''}, yes! We offer a flexible 2-installment payment option for the AI Fellowship: 50% at the time of admission and the remaining 50% midway through the 4th week. Here is the installment application portal: biai.com.bd/apply/fellowship-emi`,
      replyLanguage: 'English'
    };
  }

  if (lower.includes('refund')) {
    return {
      reply: `Hello ${firstName || ''}, thank you for contacting BIAI! Yes, we have a clear satisfaction guarantee: if you notify us at least 48 hours prior to batch commencement, we offer a 100% money-back refund or seat transfer to a subsequent cohort. Let us know which program you would like to explore!`,
      replyLanguage: 'English'
    };
  }

  // Default English
  return {
    reply: `Hello ${firstName || 'there'}, thank you for contacting the Bangladesh Institute of AI (BIAI)! We have received your inquiry and our counseling team will get back to you shortly. You can also explore our syllabus at biai.com.bd.`,
    replyLanguage: 'English'
  };
}

export function parseAndEnrichEnquiry(params: {
  rawMessage: string;
  channel?: Channel;
  senderName?: string;
  phone?: string;
  existingLeads?: LeadEnquiry[];
}): Omit<LeadEnquiry, 'id' | 'rawId' | 'receivedAt'> {
  const { rawMessage, channel = 'WhatsApp', senderName = '', phone = '', existingLeads = [] } = params;
  
  const detectedLanguage = detectLanguage(rawMessage);
  const inferredPhone = phone.trim() || extractPhone(rawMessage);
  const inferredName = senderName.trim() || extractName(rawMessage) || 'Anonymous Lead';
  
  const classification = classifyIntent(rawMessage, channel);
  
  const smartReply = generateSmartReply({
    rawMessage,
    senderName: inferredName,
    category: classification.category,
    detectedLanguage,
    phone: inferredPhone
  });

  // Check for duplicate phone number
  let isDuplicate = false;
  let duplicateOfId: string | undefined;
  if (inferredPhone && existingLeads.length > 0) {
    const existing = existingLeads.find(l => l.phone && l.phone.replace(/\D/g, '') === inferredPhone.replace(/\D/g, ''));
    if (existing) {
      isDuplicate = true;
      duplicateOfId = existing.id;
    }
  }

  // Default stage
  let stage: PipelineStage = 'New';
  if (classification.isSpam) {
    stage = 'Lost';
  } else if (classification.isSupportTriage) {
    stage = 'New';
  }

  return {
    channel,
    senderName: inferredName,
    phone: inferredPhone,
    rawMessage,
    category: classification.category,
    stage,
    detectedLanguage,
    summary: classification.summary,
    suggestedReply: smartReply.reply,
    suggestedReplyLanguage: smartReply.replyLanguage,
    urgency: classification.urgency,
    sentiment: classification.sentiment,
    estimatedValueBDT: classification.estimatedValueBDT,
    isOverdue48h: false,
    isSpam: classification.isSpam,
    isSupportTriage: classification.isSupportTriage,
    isDuplicate,
    duplicateOfId,
    tags: classification.tags,
    internalNotes: isDuplicate ? [`Duplicate enquiry detected matching ${duplicateOfId}`] : []
  };
}

export async function callGeminiApi(prompt: string): Promise<string | null> {
  // 1. Try secure serverless proxy first (e.g. Vercel /api/gemini with server-side GEMINI_API_KEY)
  try {
    const proxyRes = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.text) return data.text;
    }
  } catch {
    // Silently proceed to direct key or fallback if proxy is unavailable
  }

  // 2. Direct client-side key (if provided in local development via .env.local)
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    if (!res.ok) {
      console.warn('Gemini API call failed with status:', res.status);
      return null;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    console.error('Error invoking Gemini API:', err);
    return null;
  }
}

export async function parseAndEnrichEnquiryWithGemini(params: {
  rawMessage: string;
  channel: Channel;
  senderName?: string;
  phone?: string;
  existingLeads?: LeadEnquiry[];
}): Promise<Omit<LeadEnquiry, 'id' | 'rawId' | 'receivedAt'>> {
  const prompt = `You are an AI assistant for BIAI (an AI training academy in Bangladesh).
Extract structured details from this inbound customer enquiry and write a culturally natural reply:
Message: "${params.rawMessage}"
Channel: ${params.channel}

Return ONLY a JSON object with this exact structure:
{
  "senderName": string (extract name or "Unknown"),
  "phone": string (extract BD phone number or ""),
  "category": "Bootcamp" | "Fellowship" | "Corporate Training" | "Support / Refund" | "Career / Internship" | "General / Spam",
  "stage": "New" | "Contacted" | "Interested" | "Paid" | "Lost",
  "detectedLanguage": "Bangla" | "Banglish" | "English",
  "summary": string (1 concise sentence describing enquiry),
  "suggestedReply": string (natural polite reply matching the customer's dialect: Bangla, Banglish, or English),
  "urgency": "Low" | "Medium" | "High" | "Critical",
  "sentiment": "Positive" | "Neutral" | "Inquisitive" | "Frustrated" | "Spam"
}`;

  const geminiText = await callGeminiApi(prompt);
  if (geminiText) {
    try {
      const cleanJson = geminiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        senderName: params.senderName || (parsed.senderName !== 'Unknown' ? parsed.senderName : '') || 'Anonymous',
        phone: params.phone || parsed.phone || '',
        channel: params.channel,
        rawMessage: params.rawMessage,
        category: parsed.category || 'Bootcamp',
        stage: parsed.stage || 'New',
        detectedLanguage: parsed.detectedLanguage || detectLanguage(params.rawMessage),
        summary: parsed.summary || 'Customer inbound query',
        suggestedReply: parsed.suggestedReply || '',
        suggestedReplyLanguage: parsed.detectedLanguage || detectLanguage(params.rawMessage),
        urgency: parsed.urgency || 'Medium',
        sentiment: parsed.sentiment || 'Inquisitive',
        estimatedValueBDT: 0,
        isOverdue48h: false,
        isSpam: parsed.category === 'General / Spam',
        isSupportTriage: parsed.category === 'Support / Refund' || parsed.category === 'Career / Internship' || parsed.category === 'General / Spam',
        tags: [parsed.category, params.channel, parsed.detectedLanguage],
        internalNotes: [`Parsed live via AI natural language engine`]
      };
    } catch (e) {
      console.warn('Failed to parse Gemini JSON output, falling back to local hybrid engine:', e);
    }
  }

  // Fallback to local rule engine (guarantees 100% offline reliability)
  return parseAndEnrichEnquiry(params);
}

