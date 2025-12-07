
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Campaign, AppView, Supermarket } from '../types';
import { api } from '../services/api';
import Modal from '../components/Modal';

interface CampaignsProps {
  lang: Language;
  onNavigate: (view: AppView, id?: string) => void;
}

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

const Campaigns: React.FC<CampaignsProps> = ({ lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [campaignsData, supermarketsData] = await Promise.all([
        api.campaigns.getAll(),
        api.supermarkets.getAll()
      ]);
      setCampaigns(campaignsData);
      setSupermarkets(supermarketsData);
    } catch (error) {
      console.error("Failed to fetch campaigns data:", error);
      showToast(lang === 'fr' ? 'Erreur lors du chargement des données' : 'Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    brand: string;
    startDate: string;
    endDate: string;
    mechanic: string;
    minSpend: string;
    maxRedemptions: string;
    targetAudience: 'all' | 'vip' | 'new' | 'churn_risk';
    rewardType: 'points' | 'voucher' | 'giveaway';
    rewardValue: string | number;
    supermarketIds: string[];
    imageUrl: string;
  }>({ 
    name: '', 
    brand: '', 
    startDate: '', 
    endDate: '',
    mechanic: '',
    minSpend: '',
    maxRedemptions: '',
    targetAudience: 'all',
    rewardType: 'points',
    rewardValue: '',
    supermarketIds: [],
    imageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({ 
      name: '', 
      brand: '', 
      startDate: '', 
      endDate: '',
      mechanic: '',
      minSpend: '',
      maxRedemptions: '',
      targetAudience: 'all',
      rewardType: 'points',
      rewardValue: '',
      supermarketIds: [],
      imageUrl: ''
    });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Campaign) => {
    setEditingCampaign(c);
    setFormData({ 
      name: c.name, 
      brand: c.brand, 
      startDate: c.startDate, 
      endDate: c.endDate,
      mechanic: c.mechanic || '',
      minSpend: c.minSpend?.toString() || '',
      maxRedemptions: c.maxRedemptions?.toString() || '',
      targetAudience: c.targetAudience || 'all',
      rewardType: c.rewardType || 'points',
      rewardValue: c.rewardValue || '',
      supermarketIds: c.supermarketIds || [],
      imageUrl: c.imageUrl || ''
    });
    setImagePreview(c.imageUrl || null);
    setIsModalOpen(true);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
        setImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
        ...formData,
        minSpend: formData.minSpend ? Number(formData.minSpend) : undefined,
        maxRedemptions: formData.maxRedemptions ? Number(formData.maxRedemptions) : undefined
    };

    try {
      setIsSubmitting(true);
      if (editingCampaign) {
        const updated = await api.campaigns.update(editingCampaign.id, updatedData);
        setCampaigns(campaigns.map(c => c.id === editingCampaign.id ? updated : c));
        showToast(lang === 'fr' ? 'Campagne mise à jour' : 'Campaign updated', 'success');
      } else {
        const newCamp = await api.campaigns.create(updatedData);
        setCampaigns([newCamp, ...campaigns]);
        showToast(lang === 'fr' ? 'Campagne créée' : 'Campaign created', 'success');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save campaign:', error);
      showToast(lang === 'fr' ? 'Échec de l\'enregistrement' : 'Failed to save campaign', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSupermarket = (id: string) => {
    const current = formData.supermarketIds;
    if (current.includes(id)) {
      setFormData({ ...formData, supermarketIds: current.filter(sid => sid !== id) });
    } else {
      setFormData({ ...formData, supermarketIds: [...current, id] });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette campagne ?' : 'Are you sure you want to delete this campaign?')) {
      try {
        await api.campaigns.delete(id);
        setCampaigns(campaigns.filter(c => c.id !== id));
        showToast(lang === 'fr' ? 'Campagne supprimée' : 'Campaign deleted', 'success');
      } catch (error) {
        console.error('Failed to delete campaign:', error);
        showToast(lang === 'fr' ? 'Échec de la suppression' : 'Failed to delete campaign', 'error');
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    let newStatus: 'active' | 'draft' | 'ended';
    let message = '';

    if (currentStatus === 'active') {
        newStatus = 'ended';
        message = lang === 'fr' ? 'Arrêter cette campagne ? Elle sera marquée comme terminée.' : 'Deactivate this campaign? It will be marked as Ended.';
    } else {
        newStatus = 'active';
        message = lang === 'fr' ? 'Activer cette campagne ?' : 'Activate this campaign?';
    }

    if (window.confirm(message)) {
        try {
          await api.campaigns.updateStatus(id, newStatus);
          setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
          showToast(lang === 'fr' ? 'Statut mis à jour' : 'Status updated', 'success');
        } catch (error) {
          console.error('Failed to update status:', error);
          showToast(lang === 'fr' ? 'Échec de la mise à jour du statut' : 'Failed to update status', 'error');
        }
    }
  };

  const getTargetAudienceLabel = (key: string) => {
     switch(key) {
        case 'all': return lang === 'fr' ? 'Tous les utilisateurs' : 'All Users';
        case 'vip': return lang === 'fr' ? 'Clients VIP' : 'VIP Customers';
        case 'new': return lang === 'fr' ? 'Nouveaux Inscrits' : 'New Signups';
        case 'churn_risk': return lang === 'fr' ? 'Risque de départ' : 'Churn Risk';
        default: return key;
     }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{t.campaigns}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchData}
              disabled={isLoading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title={lang === 'fr' ? 'Actualiser' : 'Refresh'}
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? (lang === 'fr' ? 'Chargement...' : 'Loading...') : (lang === 'fr' ? 'Actualiser' : 'Refresh')}
            </button>
            <button 
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              + {t.create_new}
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full group hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded">
                {campaign.brand}
              </span>
              
              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleStatus(campaign.id, campaign.status)}
                    className={`px-3 py-1 text-xs rounded-full font-bold uppercase transition-colors border cursor-pointer ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 
                        'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                    }`}
                    title={lang === 'fr' ? "Changer le statut" : "Toggle status"}
                  >
                    {campaign.status}
                  </button>
                  <button 
                    onClick={() => handleDelete(campaign.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title={lang === 'fr' ? "Supprimer" : "Delete"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">{campaign.name}</h3>
            
            <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
               <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">{lang === 'fr' ? 'Mécanique' : 'Mechanic Rule'}</p>
                  <p className="text-sm text-gray-800 font-medium">{campaign.mechanic}</p>
               </div>
               {campaign.minSpend && (
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">{lang === 'fr' ? 'Dépense Min.' : 'Min. Spend'}:</span>
                      <span className="font-mono font-bold text-gray-700">{campaign.minSpend.toLocaleString()} CDF</span>
                   </div>
               )}
            </div>

            <div className="mb-4 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-xs uppercase">{lang === 'fr' ? 'Récompense' : 'Reward'}</span>
                  <span className="font-bold text-purple-600 capitalize">
                    {campaign.rewardValue} {campaign.rewardType === 'points' ? 'pts' : campaign.rewardType}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-gray-500 text-xs uppercase">{lang === 'fr' ? 'Cible' : 'Audience'}</span>
                   <span className="font-medium text-gray-800 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {getTargetAudienceLabel(campaign.targetAudience || 'all')}
                   </span>
                </div>
            </div>

            <div className="flex-1">
              <div className="text-sm text-gray-500 flex justify-between mt-1 border-t border-dashed border-gray-200 pt-2">
                <span>Start:</span>
                <span className="font-medium text-gray-700">{campaign.startDate}</span>
              </div>
              <div className="text-sm text-gray-500 flex justify-between mt-1">
                <span>End:</span>
                <span className="font-medium text-gray-700">{campaign.endDate}</span>
              </div>

              {/* Conversions Progress */}
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Conversions
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                        <span className="text-green-600">{(campaign.conversions || 0).toLocaleString()}</span>
                        {campaign.maxRedemptions ? (
                            <span className="text-gray-400 font-normal"> / {campaign.maxRedemptions.toLocaleString()}</span>
                        ) : (
                            <span className="text-gray-400 font-normal text-xs ml-1">(illimité)</span>
                        )}
                    </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    {campaign.maxRedemptions ? (
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                (campaign.conversions || 0) >= campaign.maxRedemptions 
                                    ? 'bg-red-500' 
                                    : (campaign.conversions || 0) >= campaign.maxRedemptions * 0.8 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                            }`} 
                            style={{ width: `${Math.min(((campaign.conversions || 0) / campaign.maxRedemptions) * 100, 100)}%` }}
                        ></div>
                    ) : (
                        <div 
                            className="h-full rounded-full bg-green-500 transition-all duration-500" 
                            style={{ width: `${Math.min((campaign.conversions || 0) / 100 * 10, 100)}%` }}
                        ></div>
                    )}
                </div>
                {campaign.maxRedemptions && (campaign.conversions || 0) >= campaign.maxRedemptions && (
                    <div className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Limite atteinte
                    </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => openEditModal(campaign)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {lang === 'fr' ? 'Modifier' : 'Edit Rules'}
              </button>
              <button 
                onClick={() => onNavigate(AppView.CampaignAnalytics, campaign.id)}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Analytics
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? (lang === 'fr' ? "Modifier Campagne" : "Edit Campaign Rules") : (lang === 'fr' ? "Nouvelle Campagne" : "New Campaign")}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-2 pb-4">
          
          <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Nom de la Campagne' : 'Campaign Name'}</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Summer Special"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Marque' : 'Brand Name'}</label>
                <input 
                  type="text" 
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Kellogg's"
                />
              </div>
          </div>

          {/* Campaign Image Upload */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lang === 'fr' ? '📷 Image de la Campagne' : '📷 Campaign Image'}
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Campaign preview" 
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, imageUrl: '' })); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="campaign-image-upload"
                />
                <label
                  htmlFor="campaign-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {lang === 'fr' ? 'Télécharger une image' : 'Upload Image'}
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'fr' ? 'JPG, PNG ou GIF. Max 2MB.' : 'JPG, PNG or GIF. Max 2MB.'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
             <h4 className="text-sm font-bold text-blue-900 mb-3">{lang === 'fr' ? 'Mécanique & Sécurité' : 'Mechanics & Safety'}</h4>
             <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-blue-800 uppercase mb-1">{lang === 'fr' ? 'Description de la Règle' : 'Rule Description'}</label>
                  <textarea 
                    required
                    value={formData.mechanic}
                    onChange={(e) => setFormData({...formData, mechanic: e.target.value})}
                    className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="e.g. Buy 2 items, get 500 points..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">{lang === 'fr' ? 'Dépense Minimum (CDF)' : 'Min. Spend (CDF)'}</label>
                        <input 
                            type="number" 
                            value={formData.minSpend}
                            onChange={(e) => setFormData({...formData, minSpend: e.target.value})}
                            className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">{lang === 'fr' ? 'Limite Max (Budget)' : 'Max Redemptions (Limit)'}</label>
                        <input 
                            type="number" 
                            value={formData.maxRedemptions}
                            onChange={(e) => setFormData({...formData, maxRedemptions: e.target.value})}
                            className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="e.g. 1000"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div>
                      <label className="block text-xs font-bold text-blue-800 uppercase mb-1">{lang === 'fr' ? 'Type Récompense' : 'Reward Type'}</label>
                      <select 
                        value={formData.rewardType}
                        onChange={(e) => setFormData({...formData, rewardType: e.target.value as any})}
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      >
                         <option value="points">Points</option>
                         <option value="voucher">Voucher</option>
                         <option value="giveaway">Giveaway</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-blue-800 uppercase mb-1">{lang === 'fr' ? 'Valeur' : 'Value'}</label>
                      <input 
                        type="text" 
                        required
                        value={formData.rewardValue}
                        onChange={(e) => setFormData({...formData, rewardValue: e.target.value})}
                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="e.g. 500"
                      />
                   </div>
                </div>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Cible Audience' : 'Target Audience'}</label>
             <select 
                value={formData.targetAudience}
                onChange={(e) => setFormData({...formData, targetAudience: e.target.value as any})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="all">{lang === 'fr' ? 'Tous les utilisateurs' : 'All Users'}</option>
                <option value="vip">{lang === 'fr' ? 'Clients VIP (Dépenses élevées)' : 'VIP Customers'}</option>
                <option value="new">{lang === 'fr' ? 'Nouveaux Inscrits' : 'New Signups'}</option>
                <option value="churn_risk">{lang === 'fr' ? 'Risque de départ (Inactifs)' : 'Churn Risk'}</option>
             </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'fr' ? 'Points de Vente Participants' : 'Participating Point of Sales (POS)'}</label>
            <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
               {supermarkets.map(store => (
                 <label key={store.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.supermarketIds.includes(store.id)}
                      onChange={() => toggleSupermarket(store.id)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{store.name}</span>
                 </label>
               ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{formData.supermarketIds.length} stores selected</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                required
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                required
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">{lang === 'fr' ? 'Enregistrer' : 'Save Rules'}</button>
          </div>
        </form>
      </Modal>
    </div>
    </>
  );
};

export default Campaigns;
