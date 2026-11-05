import React from 'react';
import { 
  LayoutGrid, 
  Kanban, 
  Sparkles, 
  FileText 
} from 'lucide-react';
import { ActiveTab } from '../types/crm';

interface SidebarProps {
  currentTab: ActiveTab;
  setCurrentTab: (tab: ActiveTab) => void;
  overdueCount: number;
  totalLeads: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  overdueCount,
  totalLeads
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
    { id: 'kanban', label: 'Pipeline', icon: Kanban, badge: totalLeads },
    { id: 'ingest', label: 'AI Ingest', icon: Sparkles },
    { id: 'table', label: 'All Enquiries', icon: FileText, badge: overdueCount > 0 ? `${overdueCount} due` : undefined }
  ];

  return (
    <aside className="w-[240px] bg-[#F5EFE6] rounded-[24px] p-5 flex flex-col justify-between border border-[#E8E1D5] shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="h-9 w-9 rounded-xl bg-[#0D0D0D] flex items-center justify-center text-white font-black text-sm shadow-sm border border-black/10">
            <span className="text-[#C4511A] font-extrabold tracking-tight">AI</span>
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-[#0D0D0D] flex items-center gap-1">
              <span>BIAI</span>
              <span className="text-[#C4511A] font-mono text-xs font-bold">CRM</span>
            </div>
            <div className="text-[10px] text-[#737373] font-medium">Applied AI Institute</div>
          </div>
        </div>

        {/* 4 Clean Navigation Items */}
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0D0D0D] text-white shadow-sm'
                    : 'text-[#525252] hover:text-[#0D0D0D] hover:bg-white/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#C4511A]' : 'text-[#8A7E6F]'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : typeof item.badge === 'string' && item.badge.includes('due')
                      ? 'bg-[#FAF0EA] text-[#C4511A] border border-[#F4C7B0]'
                      : 'bg-[#EAE4D8] text-[#525252]'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Profile Pill at Bottom */}
      <div className="pt-4 border-t border-[#E8E1D5]">
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="h-8 w-8 rounded-full bg-[#C4511A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            SH
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#0D0D0D] truncate">Hasibur Shafin</div>
            <div className="text-[10px] text-[#737373] truncate">BIAI AI Intern</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
