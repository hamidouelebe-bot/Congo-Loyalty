
import React, { useEffect, useState } from 'react';
import { AppView, Language, User, Notification, Receipt } from '../types';
import { TRANSLATIONS } from '../constants';
import { IconCamera, IconGift, IconHome, IconUserCircle, IconBell } from '../components/Icons';
import { api } from '../services/api';

interface ShopperDashboardProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  lang: Language;
  user: User;
  notifications: Notification[];
}

const ShopperDashboard: React.FC<ShopperDashboardProps> = ({ onNavigate, onLogout, lang, user, notifications }) => {
  const t = TRANSLATIONS[lang].shopper;
  const [recentReceipts, setRecentReceipts] = useState<Receipt[]>([]);
  
  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const data = await api.receipts.getByUserId(user.id);
        // Take top 3
        setRecentReceipts(data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch receipts:", error);
      }
    };
    fetchReceipts();
  }, [user.id]);
  
  // Check for unread notifications
  const unreadCount = notifications.filter(n => !n.read && n.userId === user.id).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-12 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div onClick={() => onNavigate(AppView.ShopperProfile)} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center font-bold border border-white/30 cursor-pointer">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <p className="text-blue-100 text-xs">{t.welcome}</p>
              <h3 className="font-bold text-lg">{user.firstName} {user.lastName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => onNavigate(AppView.ShopperNotifications)} className="relative text-blue-200 hover:text-white">
                <IconBell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center border border-white font-bold">
                    {unreadCount}
                  </span>
                )}
             </button>
             <button onClick={onLogout} className="text-blue-200 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             </button>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium mb-1">{t.points_balance}</p>
            <h1 className="text-4xl font-extrabold tracking-tight">{user.pointsBalance.toLocaleString()}</h1>
          </div>
          <div className="h-12 w-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-pulse relative z-10">
            <span className="text-2xl">💎</span>
          </div>
        </div>

        {/* Expiration Warning */}
        {user.pointsExpiring > 0 && (
          <div className="mt-4 bg-orange-500/20 backdrop-blur-sm border border-orange-200/30 rounded-lg p-3 flex items-center gap-3 text-orange-50 animate-in fade-in slide-in-from-top-2">
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <p className="text-xs font-medium">
               {t.expiring_message.replace('{{amount}}', user.pointsExpiring.toString()).replace('{{date}}', user.pointsExpiresAt || '')}
             </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-6">
        {/* Quick Action - Scan */}
        <button 
          onClick={() => onNavigate(AppView.ShopperScan)}
          className="w-full bg-white rounded-xl p-4 shadow-md flex items-center justify-between group hover:bg-blue-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <IconCamera className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-gray-900">{t.scan_receipt}</h4>
              <p className="text-xs text-gray-500">{t.earn_now}</p>
            </div>
          </div>
          <div className="text-gray-300">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </button>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">{t.recent_activity}</h3>
            <button 
              onClick={() => onNavigate(AppView.ShopperActivity)}
              className="text-sm text-blue-600 font-medium"
            >
              {t.view_all}
            </button>
          </div>
          
          <div className="space-y-4">
            {recentReceipts.map(receipt => (
              <div key={receipt.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                       🛒
                    </div>
                    <div>
                       <h4 className="font-bold text-gray-900 text-sm">{receipt.supermarketName}</h4>
                       <p className="text-xs text-gray-500">{receipt.date}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{receipt.amount.toLocaleString()} FC</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      receipt.status === 'verified' ? 'bg-green-100 text-green-700' : 
                      receipt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {receipt.status === 'verified' ? t.verified : receipt.status === 'pending' ? t.pending : t.rejected}
                    </span>
                 </div>
              </div>
            ))}
            {recentReceipts.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">{t.no_transactions}</div>
            )}
          </div>
        </div>

        {/* Offers Banner */}
        <div className="mt-8 mb-4">
           <h3 className="font-bold text-gray-800 mb-4">{t.for_you}</h3>
           <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-bold text-purple-200 uppercase tracking-wider mb-1">{t.exclusive}</p>
                <h4 className="font-bold text-lg mb-2">{t.offer_title}</h4>
                <p className="text-xs text-purple-100 opacity-90 mb-3">{t.offer_desc}</p>
                <button className="bg-white text-purple-600 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">{t.view_offer}</button>
              </div>
              <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-2 translate-y-2">
                 <svg width="100" height="100" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-20">
        <button onClick={() => onNavigate(AppView.ShopperDashboard)} className="flex flex-col items-center gap-1 text-blue-600">
          <IconHome className="w-6 h-6" />
          <span className="text-[10px] font-medium">{t.nav_home}</span>
        </button>
        <button onClick={() => onNavigate(AppView.ShopperRewards)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
           <IconGift className="w-6 h-6" />
           <span className="text-[10px] font-medium">{t.nav_rewards}</span>
        </button>
        <div className="relative -top-6">
           <button 
             onClick={() => onNavigate(AppView.ShopperScan)}
             className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-300 hover:bg-blue-700 transition-colors"
           >
             <IconCamera className="w-6 h-6" />
           </button>
        </div>
        <button onClick={() => onNavigate(AppView.ShopperActivity)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
           <span className="text-[10px] font-medium">{t.nav_activity}</span>
        </button>
        <button onClick={() => onNavigate(AppView.ShopperProfile)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
           <IconUserCircle className="w-6 h-6" />
           <span className="text-[10px] font-medium">{t.nav_profile}</span>
        </button>
      </div>
    </div>
  );
};

export default ShopperDashboard;
