
import React, { useState, useEffect } from 'react';
import { AppView, Language, User } from '../types';
import { IconHome, IconGift, IconCamera, IconUserCircle } from '../components/Icons';
import { api } from '../services/api';

interface ShopperRewardsProps {
  onNavigate: (view: AppView) => void;
  lang: Language;
  user: User;
}

interface Reward {
  id: string;
  title: string;
  cost: number;
  type: 'voucher' | 'airtime' | 'product';
  imageUrl: string;
  brand: string;
}

const ShopperRewards: React.FC<ShopperRewardsProps> = ({ onNavigate, lang, user }) => {
  const [userPoints, setUserPoints] = useState(user.pointsBalance);
  const [filter, setFilter] = useState<'all' | 'voucher' | 'airtime' | 'product'>('all');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const data = await api.rewards.getAll();
        setRewards(data);
      } catch (error) {
        console.error("Failed to fetch rewards:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRewards();
  }, []);

  const filteredRewards = filter === 'all' ? rewards : rewards.filter(r => r.type === filter);

  const handleRedeem = (reward: Reward) => {
    if (userPoints >= reward.cost) {
      if(confirm(`Échanger ${reward.title} pour ${reward.cost} points ?`)) {
        // In a real app, call API to redeem
        setUserPoints(prev => prev - reward.cost);
        alert('Récompense échangée ! Vérifiez vos SMS.');
      }
    } else {
      alert('Points insuffisants !');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Boutique Cadeaux</h1>
        <div className="flex justify-between items-center mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
           <span className="text-sm text-blue-800 font-medium">Votre Solde</span>
           <span className="text-lg font-bold text-blue-600">{userPoints.toLocaleString()} Pts</span>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'voucher', label: 'Bons' },
            { id: 'airtime', label: 'Crédit' },
            { id: 'product', label: 'Produits' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors ${
                filter === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="p-6 grid grid-cols-2 gap-4">
        {isLoading ? (
           <div className="col-span-2 text-center py-8 text-gray-500">Chargement des récompenses...</div>
        ) : filteredRewards.length === 0 ? (
           <div className="col-span-2 text-center py-8 text-gray-500">Aucune récompense trouvée.</div>
        ) : (
          filteredRewards.map(reward => (
            <div key={reward.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
              <div className="h-32 bg-gray-200 relative">
                 <img src={reward.imageUrl} alt={reward.title} className="w-full h-full object-cover" />
                 <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                   {reward.brand}
                 </span>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">{reward.title}</h3>
                <p className="text-xs text-gray-500 capitalize mb-3">
                  {reward.type === 'airtime' ? 'Crédit' : reward.type === 'product' ? 'Produit' : 'Bon'}
                </p>
                
                <div className="mt-auto">
                   <button 
                    onClick={() => handleRedeem(reward)}
                    disabled={userPoints < reward.cost}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                      userPoints >= reward.cost 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                   >
                     {reward.cost} Pts
                   </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 py-3 px-6 flex justify-between items-center z-20">
        <button onClick={() => onNavigate(AppView.ShopperDashboard)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
          <IconHome className="w-6 h-6" />
          <span className="text-[10px] font-medium">Accueil</span>
        </button>
        <button onClick={() => onNavigate(AppView.ShopperRewards)} className="flex flex-col items-center gap-1 text-blue-600">
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
        <button onClick={() => onNavigate(AppView.ShopperActivity)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
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

export default ShopperRewards;
