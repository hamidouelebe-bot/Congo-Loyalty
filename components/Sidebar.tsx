
import React from 'react';
import { AppView, Language } from '../types';
import { IconDashboard, IconUsers, IconStore, IconTag, IconCheckSquare, IconBrain, IconDownload } from './Icons';
import { TRANSLATIONS } from '../constants';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  lang: Language;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// Icon for Document/Content
const IconFileText = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
);

// Icon for Rewards/Gift
const IconGift = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, lang, onLogout, isOpen, onClose }) => {
  const t = TRANSLATIONS[lang];

  const menuItems = [
    { id: AppView.Dashboard, label: t.dashboard, icon: IconDashboard },
    { id: AppView.Partners, label: t.partners, icon: IconStore },
    { id: AppView.Users, label: t.users, icon: IconUsers, subViews: [AppView.UserDetails] },
    { id: AppView.Campaigns, label: t.campaigns, icon: IconTag, subViews: [AppView.CampaignAnalytics] },
    { id: AppView.Moderation, label: t.moderation, icon: IconCheckSquare },
    { id: AppView.AIAnalysis, label: t.ai_analysis, icon: IconBrain },
    { id: AppView.DataExport, label: t.data_export, icon: IconDownload },
    { id: AppView.AdminRewards, label: t.rewards_management, icon: IconGift },
    { id: AppView.AdminContent, label: t.content_management, icon: IconFileText },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 
        flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded">DRC</span> Loyalty
          </h1>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.subViews && item.subViews.includes(currentView));
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  onClose();
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                  ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <Icon className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Admin" className="w-8 h-8 rounded-full" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate w-24">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button onClick={onLogout} className="text-gray-400 hover:text-red-500" title="Logout">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
