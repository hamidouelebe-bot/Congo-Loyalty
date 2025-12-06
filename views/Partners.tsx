import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Supermarket } from '../types';
import { api } from '../services/api';

interface PartnersProps {
  lang: Language;
  partners: Supermarket[];
  setPartners: React.Dispatch<React.SetStateAction<Supermarket[]>>;
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

const Partners: React.FC<PartnersProps> = ({ lang, partners, setPartners }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Supermarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Image upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    address: string;
    logoUrl: string;
    businessHours: string;
    latitude: string;
    longitude: string;
  }>({ 
    name: '', 
    address: '', 
    logoUrl: '',
    businessHours: '',
    latitude: '',
    longitude: ''
  });

  // Fetch partners on mount
  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      const data = await api.supermarkets.getAll();
      setPartners(data);
    } catch (err) {
      console.error('Failed to fetch partners:', err);
      showToast(lang === 'fr' ? 'Échec du chargement des partenaires' : 'Failed to load partners', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormData({ 
      name: '', 
      address: '', 
      logoUrl: '',
      businessHours: '',
      latitude: '',
      longitude: ''
    });
    setLogoFile(null);
    setLogoPreview('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (partner: Supermarket) => {
    setEditingPartner(partner);
    setFormData({ 
      name: partner.name, 
      address: partner.address, 
      logoUrl: partner.logoUrl,
      businessHours: partner.businessHours || '',
      latitude: partner.latitude?.toString() || '',
      longitude: partner.longitude?.toString() || ''
    });
    setLogoFile(null);
    setLogoPreview(partner.logoUrl || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(lang === 'fr' ? 'Veuillez sélectionner une image' : 'Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(lang === 'fr' ? 'L\'image ne doit pas dépasser 5MB' : 'Image must be less than 5MB');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError(lang === 'fr' ? 'Le nom est requis' : 'Name is required');
      return;
    }
    if (!formData.address.trim()) {
      setError(lang === 'fr' ? 'L\'adresse est requise' : 'Address is required');
      return;
    }

    try {
      setIsSubmitting(true);
      let logoUrl = formData.logoUrl;

      // Upload logo if a new file was selected
      if (logoFile) {
        try {
          const uploadResult = await api.upload.image(logoFile);
          logoUrl = uploadResult.url;
        } catch (uploadErr: any) {
          setError(lang === 'fr' ? `Échec du téléchargement: ${uploadErr.message}` : `Upload failed: ${uploadErr.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      const updatedData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        logoUrl: logoUrl || '',
        businessHours: formData.businessHours.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      if (editingPartner) {
        // Update existing
        const updatedPartner = await api.supermarkets.update(editingPartner.id, updatedData);
        setPartners(partners.map(p => p.id === editingPartner.id ? updatedPartner : p));
        showToast(lang === 'fr' ? 'Partenaire mis à jour avec succès' : 'Partner updated successfully', 'success');
      } else {
        // Create new
        const newPartner = await api.supermarkets.create(updatedData);
        setPartners([...partners, newPartner]);
        showToast(lang === 'fr' ? 'Partenaire créé avec succès' : 'Partner created successfully', 'success');
      }
      
      setIsModalOpen(false);
      setLogoFile(null);
      setLogoPreview('');
    } catch (error: any) {
      console.error("Failed to save partner:", error);
      setError(error.message || (lang === 'fr' ? 'Échec de l\'enregistrement' : 'Failed to save partner'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const partner = partners.find(p => p.id === id);
    if (!partner) return;
    try {
      const updated = await api.supermarkets.update(id, { active: !partner.active });
      setPartners(partners.map(p => p.id === id ? updated : p));
      showToast(
        partner.active 
          ? (lang === 'fr' ? 'Partenaire désactivé' : 'Partner deactivated')
          : (lang === 'fr' ? 'Partenaire activé' : 'Partner activated'),
        'success'
      );
    } catch (error) {
      console.error("Failed to toggle status:", error);
      showToast(lang === 'fr' ? 'Échec de la mise à jour du statut' : 'Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce partenaire?' : 'Are you sure you want to delete this partner?')) {
      try {
        await api.supermarkets.delete(id);
        setPartners(partners.filter(p => p.id !== id));
        showToast(lang === 'fr' ? 'Partenaire supprimé' : 'Partner deleted', 'success');
      } catch (error) {
        console.error("Failed to delete partner:", error);
        showToast(lang === 'fr' ? 'Échec de la suppression' : 'Failed to delete partner', 'error');
      }
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
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{t.partners}</h2>
          <button 
            onClick={openCreateModal}
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.create_new}
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {lang === 'fr' ? 'Aucun partenaire' : 'No partners yet'}
            </h3>
            <p className="text-gray-400 mb-4">
              {lang === 'fr' ? 'Ajoutez votre premier partenaire' : 'Add your first partner to get started'}
            </p>
            <button 
              onClick={openCreateModal}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {lang === 'fr' ? 'Ajouter un partenaire' : 'Add Partner'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {partners.map((store) => (
              <div key={store.id} className="flex items-start space-x-4 p-4 border rounded-xl hover:shadow-md transition-shadow bg-gray-50/50">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 border border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-200">
                    {store.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{store.name}</h3>
                    <button 
                      onClick={() => toggleStatus(store.id)}
                      title={store.active ? (lang === 'fr' ? 'Désactiver' : 'Deactivate') : (lang === 'fr' ? 'Activer' : 'Activate')}
                      className={`w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125 ${store.active ? 'bg-green-500' : 'bg-red-500'}`}
                    ></button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{store.address}</p>
                  {store.businessHours && (
                    <p className="text-xs text-gray-400 mt-1">🕒 {store.businessHours}</p>
                  )}
                  {store.latitude && store.longitude && (
                    <p className="text-xs text-gray-400">📍 {store.latitude}, {store.longitude}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      <span className="block font-medium text-gray-700">{lang === 'fr' ? 'Panier moyen' : 'Avg Basket'}</span>
                      {(store.avgBasket || 0).toLocaleString()} CDF
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => openEditModal(store)}
                        className="text-blue-600 text-sm font-medium hover:underline"
                      >
                        {lang === 'fr' ? 'Modifier' : 'Edit'}
                      </button>
                      <button 
                        onClick={() => handleDelete(store.id)}
                        className="text-red-500 text-sm font-medium hover:underline"
                      >
                        {lang === 'fr' ? 'Supprimer' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPartner 
                    ? (lang === 'fr' ? 'Modifier le partenaire' : 'Edit Partner')
                    : (lang === 'fr' ? 'Nouveau partenaire' : 'New Partner')
                  }
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'fr' ? 'Nom du supermarché' : 'Supermarket Name'} *
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={lang === 'fr' ? 'Ex: Shoprite Kinshasa' : 'Ex: Shoprite Kinshasa'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'fr' ? 'Adresse' : 'Address'} *
                </label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                  placeholder={lang === 'fr' ? 'Adresse complète...' : 'Full address...'}
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <div className="space-y-3">
                  {/* Logo Preview */}
                  {logoPreview && (
                    <div className="relative w-20 h-20">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview('');
                          setFormData({ ...formData, logoUrl: '' });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {lang === 'fr' ? 'Choisir un logo' : 'Choose Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    {logoFile && (
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {logoFile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? 'PNG, JPG, GIF jusqu\'à 5MB' : 'PNG, JPG, GIF up to 5MB'}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'fr' ? 'Heures d\'ouverture' : 'Business Hours'}
                </label>
                <input 
                  type="text" 
                  value={formData.businessHours}
                  onChange={(e) => setFormData({...formData, businessHours: e.target.value})}
                  placeholder={lang === 'fr' ? 'Ex: Lun-Dim: 8:00 - 22:00' : 'Ex: Mon-Sun: 8:00 - 22:00'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input 
                    type="number"
                    step="any" 
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    placeholder="-4.325"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input 
                    type="number"
                    step="any" 
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    placeholder="15.322"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {lang === 'fr' ? 'Enregistrement...' : 'Saving...'}
                    </>
                  ) : (
                    editingPartner 
                      ? (lang === 'fr' ? 'Mettre à jour' : 'Update')
                      : (lang === 'fr' ? 'Créer' : 'Create')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Partners;
