
import React, { useEffect, useState } from 'react';
import { AppView, Language, User, Notification, Receipt } from '../types';
import { TRANSLATIONS } from '../constants';
import { IconCamera, IconGift, IconHome, IconUserCircle, IconBell } from '../components/Icons';
import { api } from '../services/api';

// Type for active promotions
interface ActivePromotion {
  id: string;
  name: string;
  brand: string;
  mechanic: string;
  minSpend: number | null;
  rewardType: string;
  rewardValue: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  supermarkets: { id: string; name: string; logoUrl: string }[];
}

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
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [isLoadingPromos, setIsLoadingPromos] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch receipts and promotions in parallel
        const [receiptsData, promosData] = await Promise.all([
          api.receipts.getByUserId(user.id),
          api.promotions.getActive()
        ]);
        setRecentReceipts(receiptsData.slice(0, 3));
        setPromotions(promosData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingPromos(false);
      }
    };
    fetchData();
  }, [user.id]);
  
  // Check for unread notifications
  const unreadCount = notifications.filter(n => !n.read && n.userId === user.id).length;
  
  // Sharing state
  const [sharingPromo, setSharingPromo] = useState<ActivePromotion | null>(null);

  // Share functions
  const getShareUrl = (promo: ActivePromotion) => {
    return `${window.location.origin}?promo=${promo.id}`;
  };

  const shareToFacebook = (promo: ActivePromotion) => {
    const url = encodeURIComponent(getShareUrl(promo));
    const text = encodeURIComponent(`🎉 ${promo.name} - ${promo.mechanic}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = (promo: ActivePromotion) => {
    const url = encodeURIComponent(getShareUrl(promo));
    const text = encodeURIComponent(`🎉 Check out this promotion: ${promo.name} - ${promo.mechanic}`);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=600,height=400');
  };

  const shareToTikTok = (promo: ActivePromotion) => {
    // TikTok doesn't have a direct share URL, copy text for user to paste
    const text = `🎉 ${promo.name}\n${promo.mechanic}\n${getShareUrl(promo)}`;
    navigator.clipboard.writeText(text);
    alert(lang === 'fr' ? 'Texte copié ! Collez-le sur TikTok.' : 'Text copied! Paste it on TikTok.');
  };

  const shareByEmail = (promo: ActivePromotion) => {
    const subject = encodeURIComponent(`🎉 ${promo.name} - ${promo.brand}`);
    const body = encodeURIComponent(`Hey!\n\nCheck out this amazing promotion:\n\n${promo.name}\n${promo.mechanic}\n\n${promo.rewardType === 'points' ? `Earn ${promo.rewardValue} points!` : ''}\n\nLink: ${getShareUrl(promo)}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyUrl = (promo: ActivePromotion) => {
    navigator.clipboard.writeText(getShareUrl(promo));
    alert(lang === 'fr' ? 'Lien copié !' : 'Link copied!');
  };

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

        {/* Active Promotions - Pour Vous */}
        <div className="mt-8 mb-4">
           <h3 className="font-bold text-gray-800 mb-4">{t.for_you}</h3>
           
           {isLoadingPromos ? (
             <div className="flex justify-center py-6">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
             </div>
           ) : promotions.length === 0 ? (
             <div className="bg-gray-100 rounded-xl p-6 text-center">
               <div className="text-3xl mb-2">📢</div>
               <p className="text-gray-500 text-sm">
                 {lang === 'fr' ? 'Aucune promotion active pour le moment' : 'No active promotions right now'}
               </p>
             </div>
           ) : (
             <div className="space-y-4">
               {promotions.slice(0, 3).map((promo) => (
                 <div 
                   key={promo.id}
                   className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                 >
                   {/* Campaign Image */}
                   {promo.imageUrl ? (
                     <img 
                       src={promo.imageUrl} 
                       alt={promo.name}
                       className="w-full h-32 object-cover"
                     />
                   ) : (
                     <div className="w-full h-32 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                       <span className="text-5xl">🎁</span>
                     </div>
                   )}
                   
                   <div className="p-4">
                     {/* Brand & Points Badge */}
                     <div className="flex justify-between items-start mb-2">
                       <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">
                         {promo.brand}
                       </span>
                       {promo.rewardType === 'points' && (
                         <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                           ⭐ +{promo.rewardValue} pts
                         </span>
                       )}
                     </div>
                     
                     {/* Title & Description */}
                     <h4 className="font-bold text-gray-900 text-lg mb-1">{promo.name}</h4>
                     <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promo.mechanic}</p>
                     
                     {/* Min Spend */}
                     {promo.minSpend && (
                       <p className="text-xs text-gray-500 mb-3">
                         {lang === 'fr' ? 'Achat min:' : 'Min spend:'} <span className="font-bold">{promo.minSpend.toLocaleString()} CDF</span>
                       </p>
                     )}
                     
                     {/* Participating stores */}
                     {promo.supermarkets.length > 0 && (
                       <div className="mb-3 pb-3 border-b border-gray-100">
                         <p className="text-xs text-gray-500 mb-1">{lang === 'fr' ? 'Magasins:' : 'Stores:'}</p>
                         <div className="flex flex-wrap gap-1">
                           {promo.supermarkets.slice(0, 2).map(s => (
                             <span key={s.id} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                               {s.name}
                             </span>
                           ))}
                           {promo.supermarkets.length > 2 && (
                             <span className="text-gray-400 text-xs">+{promo.supermarkets.length - 2}</span>
                           )}
                         </div>
                       </div>
                     )}
                     
                     {/* Action Buttons */}
                     <div className="flex gap-2">
                       <button 
                         onClick={() => onNavigate(AppView.ShopperScan)}
                         className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                       >
                         {lang === 'fr' ? '📸 Scanner' : '📸 Scan'}
                       </button>
                       <button 
                         onClick={() => setSharingPromo(promo)}
                         className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors"
                         title={lang === 'fr' ? 'Partager' : 'Share'}
                       >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                         </svg>
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
               {promotions.length > 3 && (
                 <p className="text-center text-sm text-gray-500">
                   +{promotions.length - 3} {lang === 'fr' ? 'autres promotions' : 'more promotions'}
                 </p>
               )}
             </div>
           )}
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

      {/* Share Modal */}
      {sharingPromo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'fr' ? 'Partager cette promotion' : 'Share this promotion'}
              </h3>
              <button 
                onClick={() => setSharingPromo(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-bold text-gray-900">{sharingPromo.name}</p>
              <p className="text-sm text-gray-600">{sharingPromo.brand}</p>
            </div>
            
            {/* Share Buttons */}
            <div className="grid grid-cols-5 gap-3 mb-4">
              {/* Facebook */}
              <button 
                onClick={() => { shareToFacebook(sharingPromo); setSharingPromo(null); }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-blue-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600">Facebook</span>
              </button>
              
              {/* X/Twitter */}
              <button 
                onClick={() => { shareToTwitter(sharingPromo); setSharingPromo(null); }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600">X</span>
              </button>
              
              {/* TikTok */}
              <button 
                onClick={() => { shareToTikTok(sharingPromo); setSharingPromo(null); }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                <span className="text-xs text-gray-600">TikTok</span>
              </button>
              
              {/* Email */}
              <button 
                onClick={() => { shareByEmail(sharingPromo); setSharingPromo(null); }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-red-50 transition-colors"
              >
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">Email</span>
              </button>
              
              {/* Copy Link */}
              <button 
                onClick={() => { copyUrl(sharingPromo); setSharingPromo(null); }}
                className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-green-50 transition-colors"
              >
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <span className="text-xs text-gray-600">{lang === 'fr' ? 'Copier' : 'Copy'}</span>
              </button>
            </div>
            
            {/* Cancel */}
            <button 
              onClick={() => setSharingPromo(null)}
              className="w-full py-3 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopperDashboard;
