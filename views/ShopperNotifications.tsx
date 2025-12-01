
import React from 'react';
import { AppView, Language, Notification } from '../types';
import { TRANSLATIONS } from '../constants';
import { IconBell } from '../components/Icons';

interface ShopperNotificationsProps {
  onNavigate: (view: AppView) => void;
  lang: Language;
  notifications: Notification[];
}

const ShopperNotifications: React.FC<ShopperNotificationsProps> = ({ onNavigate, lang, notifications }) => {
  const t = TRANSLATIONS[lang].shopper;
  // Filter for logged-in user (assuming '1' for mock user if not passed explicitly, but App.tsx passes user context mostly)
  // In a real app, notifications would already be filtered by backend or context.
  // Here we just use the passed list which is already managed in App.tsx
  const userNotifications = notifications.filter(n => n.userId === '1'); 

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans animate-in fade-in duration-300">
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex items-center gap-4">
        <button 
          onClick={() => onNavigate(AppView.ShopperDashboard)}
          className="text-gray-500 hover:text-gray-900"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t.notifications}</h1>
      </div>

      <div className="p-4 space-y-3">
        {userNotifications.length > 0 ? (
          userNotifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-xl border flex gap-4 ${
                notif.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                notif.type === 'expiration' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {notif.type === 'expiration' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <IconBell className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex justify-between items-start">
                   <h4 className={`font-bold text-sm mb-1 ${notif.read ? 'text-gray-800' : 'text-blue-900'}`}>{notif.title}</h4>
                   <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{notif.date}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
             <IconBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
             <p>{t.no_notifications}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopperNotifications;
