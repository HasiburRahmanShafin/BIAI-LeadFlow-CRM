# BIAI LeadFlow CRM
### Smart AI Inbound Pipeline & Bangla/Banglish Auto-Responder

A specialized, AI-first Customer Relationship Management platform engineered for **BIAI (Bangladesh Institute of Artificial Intelligence)** to streamline multi-channel inbound enquiries across Bangladesh.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-biai--lead--flow--crm.vercel.app-success?style=for-the-badge&logo=vercel)](https://biai-lead-flow-crm.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/HasiburRahmanShafin/BIAI-LeadFlow-CRM)

**Live Demo URL:** [https://biai-lead-flow-crm.vercel.app/](https://biai-lead-flow-crm.vercel.app/)  
**GitHub Repository:** [https://github.com/HasiburRahmanShafin/BIAI-LeadFlow-CRM](https://github.com/HasiburRahmanShafin/BIAI-LeadFlow-CRM)  

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-15%20Passing-brightgreen.svg)](https://vitest.dev/)

---

## Overview

In Bangladesh, AI training institutes and EdTech platforms receive inbound leads across WhatsApp, Facebook Messenger, Facebook comments, website inquiry forms, and phone call notes. Generic global CRMs fail at colloquial Bangladeshi communication because leads arrive in **three distinct linguistic modes: Bangla script, phonetic Banglish, and English**.

**BIAI LeadFlow CRM** solves this operational bottleneck with intelligent dialect detection, real-time automated field extraction, culturally natural response generation, a visual 5-stage sales pipeline, and proactive SLA monitoring.

---

## Key Features

1. **Structured Inbound Directory**
   - Saves each enquiry with complete context: Sender Name, Phone Number, Channel Source, Program Category (*Bootcamp*, *Fellowship*, or *Corporate Training*), Pipeline Status, and Inbound Timestamp.
   - Pre-loaded with the 20 official benchmark enquiries from multi-channel sources.

2. **AI Raw Ingestion & Auto-Extraction**
   - Powered by natural language AI (with an instant local rule-engine fallback for zero downtime).
   - Pasting any raw, unformatted message instantly extracts sender details, phone number, channel, category, and dialect.

3. **Culturally Natural Dialect-Matched Auto-Replies**
   - Automatically detects whether an inquiry is written in **Bangla**, **Banglish**, or **English**.
   - Generates contextual, natural responses matching the user's dialect (e.g. Banglish responses with bKash/Nagad details and pricing, formal Bangla for academic inquiries).
   - **1-Click WhatsApp Direct Send (`wa.me`)** to open WhatsApp with the generated reply pre-filled.

4. **5-Stage Sales Pipeline**
   - Visual pipeline board strictly adhering to the requested stages: `New` $\to$ `Contacted` $\to$ `Interested` $\to$ `Paid` $\to$ `Lost`.
   - Rapid stage advancement and direct lead detail inspection.

5. **48-Hour Overdue SLA Alerts (Extra Feature)**
   - Automatically identifies any enquiry that has not received outreach within 48 hours.
   - Surfaces priority overdue leads in an aligned dashboard widget and pipeline filter with 1-click quick WhatsApp outreach.

6. **Weekly AI Executive Summary (Extra Feature)**
   - One-click synthesized executive digest powered by AI.
   - Summarizes total lead volume, dialect distribution, program demand breakdown, and high-priority corporate opportunities (e.g. 120-seat corporate training inquiries).

---

## Brand Identity

Designed to seamlessly align with BIAI's official website aesthetics ([biai.com.bd](https://biai.com.bd)):
- **Typography:** **Inter** for clean UI sans-serif copy, and **Hind Siliguri** for authentic Bengali script rendering.
- **Brand Colors:**
  - **BIAI Terracotta Orange (`#C4511A`):** Primary action buttons, active meters, accent badges, and trend indicators.
  - **BIAI Warm Cream Canvas (`#FAF7F2`):** App background canvas and elevated cards.
  - **BIAI Ink Black (`#0D0D0D`):** Primary typography and active navigation pills.
  - **BIAI Warm Frame (`#ECE6DB`, `#E8E1D5`):** Subtle dividers and card borders.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React icons
- **AI Engine:** Google Gemini API + Custom Offline Rule-Based Fallback Engine
- **Serverless Backend:** Vercel Node.js Functions (`api/gemini.js`)
- **Testing:** Vitest (15/15 passing unit tests)
- **Code Quality:** Oxlint (0 errors, 0 warnings)

---

## Project Structure

```
biai_task/
├── api/
│   └── gemini.js                   # Secure serverless AI proxy
├── sample-data/
│   └── intern/
│       └── task1-crm/              # Provided BIAI sample dataset (20 enquiries)
│           ├── README.md
│           └── sample-enquiries.csv
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx           # Dashboard with AI dialect gauge, flow chart, 48h SLA & AI digest
│   │   ├── Sidebar.tsx             # Streamlined 4-item navigation matching BIAI branding
│   │   ├── KanbanBoard.tsx         # 5-stage visual pipeline with 48h overdue filter
│   │   ├── LeadCard.tsx            # Compact lead card with stage progression and quick actions
│   │   ├── LeadDetailModal.tsx     # Full enquiry drawer with WhatsApp dispatch & AI tone switcher
│   │   ├── IngestionStudio.tsx     # Live AI parsing studio with 1-click sample presets
│   │   └── TableView.tsx           # Sortable, searchable directory of all 20 enquiries
│   ├── data/
│   │   └── initialEnquiries.ts     # Benchmark dataset of all 20 sample enquiries
│   ├── types/
│   │   └── crm.ts                  # TypeScript data models and interfaces
│   ├── utils/
│   │   ├── aiEngine.ts             # AI engine & local rule-based fallback NLP engine
│   │   ├── aiSummary.ts            # Weekly AI executive summary synthesis
│   │   └── __tests__/
│   │       └── aiEngine.test.ts    # 15 automated unit tests (100% passing)
│   ├── App.tsx                     # Main application layout and state coordinator
│   ├── index.css                   # Tailwind CSS styling with BIAI color tokens and fonts
│   └── main.tsx                    # React root entry point
├── public/
│   └── logo.svg                    # Official BIAI vector logo
├── .env.example                    # Template for optional Gemini API key
├── package.json
├── tsconfig.json
├── vercel.json                     # Vercel deployment and routing configuration
└── vite.config.ts
```
