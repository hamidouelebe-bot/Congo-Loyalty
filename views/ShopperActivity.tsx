
import React from 'react';
import { AppView, Language } from '../types';
import { MOCK_RECEIPTS } from '../constants';
import { IconHome, IconGift, IconCamera, IconUserCircle } from '../components/Icons';

interface ShopperActivityProps {
  onNavigate: (view: AppView) => void;
  lang: Language;
}

const ShopperActivity: React.FC<ShopperActivityProps> = ({ onNavigate, lang }) => {
  // Assuming logged in user ID is '1'
  const receipts = MOCK_RECEIPTS.filter(r => r.userId === '1');

  // Mock some point history mixed with receipts
  const activities = [
    ...receipts.map(r => ({ ...r, type: 'receipt' })),
    { id: 'TX-99', type: 'redemption', date: '2024-05-18', desc: 'Échange Crédit', amount: -500, status: 'completed' }
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Mon Activité</h1>
      </div>

      <div className="p-6 space-y-4">
        {activities.map((item: any) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
               item.type === 'receipt' ? 'bg-blue-50' : 'bg-orange-50'
             }`}>
               {item.type === 'receipt' ? '🧾' : '🎁'}
             </div>
             <div className="flex-1">
               <div className="flex justify-between items-start">
                 <div>
                   <h4 className="font-bold text-gray-900 text-sm">
                     {item.type === 'receipt' ? item.supermarketName : item.desc}
                   </h4>
                   <p className="text-xs text-gray-500">{item.date}</p>
                 </div>
                 <div className="text-right">
                   {item.type === 'receipt' ? (
                     <>
                        <p className="font-bold text-gray-900 text-sm">{item.amount.toLocaleString()} FC</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === 'verified' ? 'bg-green-100 text-green-700' : 
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status === 'verified' ? 'validé' : item.status === 'pending' ? 'en attente' : 'rejeté'}
                        </span>
                     </>
                   ) : (
                     <p className="font-bold text-red-600 text-sm">{item.amount} Pts</p>
                   )}
                 </div>
               </div>
               {item.type === 'receipt' && item.status === 'verified' && (
                 <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 inline-block px-2 py-1 rounded">
                   +50 Points Gagnés
                 </div>
               )}
             </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-12 text-gray-400">
             <p>Aucune activité pour le moment.</p>
             <button onClick={() => onNavigate(AppView.ShopperScan)} className="mt-4 text-blue-600 font-bold text-sm">Scannez votre premier reçu</button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-20">
        <button onClick={() => onNavigate(AppView.ShopperDashboard)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <IconHome className="w-6 h-6" />
          <span className="text-[10px] font-medium">Accueil</span>
        </button>
        <button onClick={() => onNavigate(AppView.ShopperRewards)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
           <IconGift className="w-6 h-6" />
           <span className="text-[10px] font-medium">Cadeaux</span>
        </button>
        <div className="relative -top-6">
           <button 
             onClick={() => onNavigate(AppView.ShopperScan)}
             className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-300 hover:bg-blue-700 transition-colors"
           >
             <IconCamera className="w-6 h-6" />
           </button>
        </div>
        <button onClick={() => onNavigate(AppView.ShopperActivity)} className="flex flex-col items-center gap-1 text-blue-600">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
           <span className="text-[10px] font-medium">Activité</span>
        </button>
        <button onClick={() => onNavigate(AppView.ShopperProfile)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
           <IconUserCircle className="w-6 h-6" />
           <span className="text-[10px] font-medium">Profil</span>
        </button>
      </div>
    </div>
  );
};

export default ShopperActivity;
