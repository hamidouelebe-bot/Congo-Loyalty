
import React, { useState } from 'react';
import { AppView, Language, User } from '../types';
import { IconHome, IconGift, IconCamera, IconUserCircle } from '../components/Icons';

interface ShopperProfileProps {
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  lang: Language;
  user: User;
}

const ShopperProfile: React.FC<ShopperProfileProps> = ({ onNavigate, onLogout, lang, user }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phoneNumber
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditing(false);
    alert('Profil mis à jour avec succès');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="bg-white p-6 sticky top-0 z-10 shadow-sm border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Profil</h1>
        <button 
          onClick={onLogout}
          className="text-red-600 text-sm font-medium hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
        >
          Déconnexion
        </button>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
           <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-3 border-4 border-white shadow-sm">
             {formData.firstName[0]}{formData.lastName[0]}
           </div>
           <h2 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
           <p className="text-gray-500 text-sm">Membre depuis {user.joinedDate}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
           <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-gray-800 text-sm">Détails Personnels</h3>
              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)} className="text-blue-600 text-xs font-bold uppercase">
                  Modifier
                </button>
              )}
           </div>
           
           <div>
             <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Prénom</label>
             <input 
               type="text" 
               disabled={!isEditing}
               value={formData.firstName}
               onChange={(e) => setFormData({...formData, firstName: e.target.value})}
               className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
             />
           </div>
           <div>
             <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Nom</label>
             <input 
               type="text" 
               disabled={!isEditing}
               value={formData.lastName}
               onChange={(e) => setFormData({...formData, lastName: e.target.value})}
               className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
             />
           </div>
           <div>
             <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Email</label>
             <input 
               type="email" 
               disabled={!isEditing}
               value={formData.email}
               onChange={(e) => setFormData({...formData, email: e.target.value})}
               className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
             />
           </div>
           <div>
             <label className="block text-xs text-gray-500 uppercase font-bold mb-1">Téléphone</label>
             <input 
               type="tel" 
               disabled
               value={formData.phone}
               className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
             />
             <p className="text-[10px] text-gray-400 mt-1">Le numéro de téléphone ne peut pas être modifié.</p>
           </div>

           {isEditing && (
             <div className="pt-4 flex gap-3">
               <button 
                 type="button" 
                 onClick={() => setIsEditing(false)}
                 className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold"
               >
                 Annuler
               </button>
               <button 
                 type="submit" 
                 className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold"
               >
                 Enregistrer
               </button>
             </div>
           )}
        </form>

        <div className="mt-6 space-y-2">
           <button 
             onClick={() => onNavigate(AppView.ShopperHelp)}
             className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center text-gray-700 text-sm font-medium hover:bg-gray-50"
           >
              <span>Aide & Support</span>
              <span className="text-gray-400">→</span>
           </button>
           <button 
             onClick={() => onNavigate(AppView.ShopperPrivacy)}
             className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center text-gray-700 text-sm font-medium hover:bg-gray-50"
           >
              <span>Politique de Confidentialité</span>
              <span className="text-gray-400">→</span>
           </button>
           <button 
             onClick={() => onNavigate(AppView.ShopperTerms)}
             className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center text-gray-700 text-sm font-medium hover:bg-gray-50"
           >
              <span>Conditions d'Utilisation</span>
              <span className="text-gray-400">→</span>
           </button>
        </div>
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
        <button onClick={() => onNavigate(AppView.ShopperActivity)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
           <span className="text-[10px] font-medium">Activité</span>
        </button>
        <button onClick={() => onNavigate(AppView.ShopperProfile)} className="flex flex-col items-center gap-1 text-blue-600">
           <IconUserCircle className="w-6 h-6" />
           <span className="text-[10px] font-medium">Profil</span>
        </button>
      </div>
    </div>
  );
};

export default ShopperProfile;
