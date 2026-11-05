import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { IngestionStudio } from './components/IngestionStudio';
import { LeadDetailModal } from './components/LeadDetailModal';
import { INITIAL_ENQUIRIES } from './data/initialEnquiries';
import { LeadEnquiry, PipelineStage, ActiveTab } from './types/crm';
import { ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'BIAI_CRM_LEADS_V1';

export function App() {
  const [leads, setLeads] = useState<LeadEnquiry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved leads:', e);
      }
    }
    return INITIAL_ENQUIRIES;
  });

  const [currentTab, setCurrentTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'kanban' || tab === 'ingest' || tab === 'table' || tab === 'overview') {
        return tab;
      }
    }
    return 'overview';
  });

  const [selectedLead, setSelectedLead] = useState<LeadEnquiry | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const leadId = params.get('lead');
      if (leadId) {
        return INITIAL_ENQUIRIES.find(l => l.id === leadId) || null;
      }
    }
    return null;
  });

  const changeTab = (tab: ActiveTab) => {
    setCurrentTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      url.searchParams.delete('lead');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads]);

  // Derived 48h SLA overdue count
  const overdueCount = leads.filter(l => l.isOverdue48h && (l.stage === 'New' || l.stage === 'Contacted')).length;

  // Handlers
  const handleUpdateLead = (updated: LeadEnquiry) => {
    setLeads(prev => prev.map(l => (l.id === updated.id ? updated : l)));
    setSelectedLead(updated);
  };

  const handleAdvanceStage = (leadId: string, currentStage: PipelineStage) => {
    const stageOrder: PipelineStage[] = ['New', 'Contacted', 'Interested', 'Paid', 'Lost'];
    const currentIndex = stageOrder.indexOf(currentStage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      setLeads(prev =>
        prev.map(l => {
          if (l.id === leadId) {
            return {
              ...l,
              stage: nextStage,
              lastContactedAt: new Date().toISOString()
            };
          }
          return l;
        })
      );
    }
  };

  const handleAddNewLead = (newLead: LeadEnquiry) => {
    setLeads(prev => [newLead, ...prev]);
  };

  const handleOpenWhatsApp = (phone: string, message: string) => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '880' + cleanPhone.slice(1);
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'overview': return 'Dashboard';
      case 'kanban': return 'Pipeline';
      case 'table': return 'All Enquiries';
      case 'ingest': return 'AI Ingest Studio';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-[#ECE6DB] p-2 sm:p-4 lg:p-6 flex items-center justify-center font-sans antialiased text-[#0D0D0D] selection:bg-[#C4511A] selection:text-white">
      {/* Floating Rounded CRM Container */}
      <div 
        className="w-full max-w-[1560px] h-[95vh] min-h-[760px] bg-[#FAF7F2] rounded-[32px] sm:rounded-[36px] border border-[#E5DFD3] shadow-2xl p-4 sm:p-5 relative overflow-hidden flex gap-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 90% 8%, rgba(196, 81, 26, 0.09) 0%, rgba(224, 122, 58, 0.04) 35%, transparent 68%)'
        }}
      >
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={changeTab}
          overdueCount={overdueCount}
          totalLeads={leads.length}
        />

        {/* Right Main Application Stage */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top navigation bar when not on overview dashboard */}
          {currentTab !== 'overview' && (
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#EAE5DB]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => changeTab('overview')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E8E4DA] rounded-full text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Dashboard</span>
                </button>
                <div className="text-xs text-slate-500 font-medium">
                  Home <span className="mx-1 text-slate-400">/</span> <span className="text-slate-800 font-semibold">{getTabTitle(currentTab)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 bg-white border border-[#E8E4DA] px-3 py-1 rounded-full shadow-2xs">
                  {leads.length} Enquiries Loaded
                </span>
              </div>
            </div>
          )}

          {/* Tab Views */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {currentTab === 'overview' && (
              <Dashboard
                leads={leads}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onOpenWhatsApp={handleOpenWhatsApp}
                onNavigateToTab={(tab) => changeTab(tab)}
                overdueCount={overdueCount}
              />
            )}

            {currentTab === 'kanban' && (
              <KanbanBoard
                leads={leads}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onAdvanceStage={handleAdvanceStage}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenIngest={() => changeTab('ingest')}
              />
            )}

            {currentTab === 'table' && (
              <TableView
                leads={leads}
                onSelectLead={(lead) => setSelectedLead(lead)}
                onAdvanceStage={handleAdvanceStage}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )}

            {currentTab === 'ingest' && (
              <IngestionStudio
                existingLeads={leads}
                onAddNewLead={handleAddNewLead}
                onGoToPipeline={() => changeTab('kanban')}
              />
            )}
          </main>
        </div>

        {/* Lead Detail & Reply Modal */}
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateLead={handleUpdateLead}
          onOpenWhatsApp={handleOpenWhatsApp}
        />
      </div>
    </div>
  );
}

export default App;
