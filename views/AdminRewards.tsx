import React, { useState, useEffect } from 'react';
import { Language, Partner } from '../types';
import { api } from '../services/api';
import { TRANSLATIONS } from '../constants';

interface Reward {
  id: string;
  title: string;
  cost: number;
  type: 'voucher' | 'airtime' | 'product';
  brand: string;
  imageUrl: string;
  partnerId?: number;
}

interface AdminRewardsProps {
  lang: Language;
}

const AdminRewards: React.FC<AdminRewardsProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    cost: 0,
    type: 'voucher' as 'voucher' | 'airtime' | 'product',
    brand: '',
    imageUrl: '',
    partnerId: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rewardsData, partnersData] = await Promise.all([
        api.rewards.getAll(),
        api.partners.getAll()
      ]);
      setRewards(rewardsData);
      setPartners(partnersData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingReward(null);
    setFormData({
      title: '',
      cost: 0,
      type: 'voucher',
      brand: '',
      imageUrl: '',
      partnerId: ''
    });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
    setError('');
  };

  const openEditModal = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      cost: reward.cost,
      type: reward.type,
      brand: reward.brand,
      imageUrl: reward.imageUrl,
      partnerId: reward.partnerId?.toString() || ''
    });
    setImageFile(null);
    setImagePreview(reward.imageUrl || '');
    setIsModalOpen(true);
    setError('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(lang === 'fr' ? 'Veuillez sélectionner une image' : 'Please select an image file');
        return;
      }
      // Validate file size (max 2MB for reliable upload)
      if (file.size > 2 * 1024 * 1024) {
        setError(lang === 'fr' ? 'L\'image ne doit pas dépasser 2MB' : 'Image must be less than 2MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.cost || !formData.type || !formData.brand) {
      setError(lang === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = formData.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        try {
          const uploadResult = await api.upload.image(imageFile);
          imageUrl = uploadResult.url;
        } catch (uploadErr: any) {
          setError(lang === 'fr' ? `Échec du téléchargement: ${uploadErr.message}` : `Upload failed: ${uploadErr.message}`);
          setIsUploading(false);
          return;
        }
      }

      const payload = {
        title: formData.title,
        cost: Number(formData.cost),
        type: formData.type,
        brand: formData.brand,
        imageUrl: imageUrl || '',
        partnerId: formData.partnerId ? parseInt(formData.partnerId) : undefined
      };

      if (editingReward) {
        const updated = await api.rewards.update(editingReward.id, payload);
        setRewards(rewards.map(r => r.id === editingReward.id ? updated : r));
        setSuccessMessage(lang === 'fr' ? 'Récompense mise à jour' : 'Reward updated successfully');
      } else {
        const created = await api.rewards.create(payload);
        setRewards([...rewards, created]);
        setSuccessMessage(lang === 'fr' ? 'Récompense créée' : 'Reward created successfully');
      }
      setIsModalOpen(false);
      setImageFile(null);
      setImagePreview('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save reward:', err);
      setError(lang === 'fr' ? 'Échec de l\'enregistrement' : 'Failed to save reward');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;
    
    try {
      await api.rewards.delete(id);
      setRewards(rewards.filter(r => r.id !== id));
      setSuccessMessage('Reward deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to delete reward:', err);
      setError('Failed to delete reward');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'voucher': return 'bg-purple-100 text-purple-800';
      case 'airtime': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPartnerName = (partnerId?: number) => {
    if (!partnerId) return '-';
    const partner = partners.find(p => p.id === partnerId.toString());
    return partner?.companyName || partner?.name || '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'fr' ? 'Gestion des Récompenses' : 'Rewards Management'}
          </h1>
          <p className="text-gray-500 mt-1">
            {lang === 'fr' 
              ? 'Gérez les récompenses disponibles pour les partenaires et les clients'
              : 'Manage rewards available for partners and customers'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {lang === 'fr' ? 'Nouvelle Récompense' : 'New Reward'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && !isModalOpen && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Total Récompenses' : 'Total Rewards'}</p>
              <p className="text-2xl font-bold text-gray-900">{rewards.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Bons d\'achat' : 'Vouchers'}</p>
              <p className="text-2xl font-bold text-gray-900">{rewards.filter(r => r.type === 'voucher').length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'Produits' : 'Products'}</p>
              <p className="text-2xl font-bold text-gray-900">{rewards.filter(r => r.type === 'product').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === 'fr' ? 'Récompense' : 'Reward'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === 'fr' ? 'Type' : 'Type'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === 'fr' ? 'Marque' : 'Brand'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === 'fr' ? 'Coût (Points)' : 'Cost (Points)'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {lang === 'fr' ? 'Partenaire' : 'Partner'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rewards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {lang === 'fr' ? 'Aucune récompense trouvée' : 'No rewards found'}
                  </td>
                </tr>
              ) : (
                rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={reward.imageUrl || 'https://picsum.photos/40/40'}
                          alt={reward.title}
                          className="w-10 h-10 rounded-lg object-cover mr-3"
                        />
                        <span className="font-medium text-gray-900">{reward.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(reward.type)}`}>
                        {reward.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {reward.brand}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{reward.cost.toLocaleString()}</span>
                      <span className="text-gray-500 ml-1">pts</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {getPartnerName(reward.partnerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openEditModal(reward)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title={lang === 'fr' ? 'Modifier' : 'Edit'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(reward.id)}
                        className="text-red-600 hover:text-red-800"
                        title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingReward 
                    ? (lang === 'fr' ? 'Modifier la Récompense' : 'Edit Reward')
                    : (lang === 'fr' ? 'Nouvelle Récompense' : 'New Reward')}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
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
                  {lang === 'fr' ? 'Titre' : 'Title'} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={lang === 'fr' ? 'Ex: Bon de 10% chez Kin Marché' : 'Ex: 10% off at Kin Marché'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {lang === 'fr' ? 'Coût (Points)' : 'Cost (Points)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'voucher' | 'airtime' | 'product' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="voucher">{lang === 'fr' ? 'Bon d\'achat' : 'Voucher'}</option>
                    <option value="airtime">{lang === 'fr' ? 'Crédit téléphone' : 'Airtime'}</option>
                    <option value="product">{lang === 'fr' ? 'Produit' : 'Product'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'fr' ? 'Marque' : 'Brand'} *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={lang === 'fr' ? 'Ex: Nestlé, Vodacom...' : 'Ex: Nestlé, Vodacom...'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === 'fr' ? 'Image' : 'Image'}
                </label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-32">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData({ ...formData, imageUrl: '' });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      {lang === 'fr' ? 'Choisir une image' : 'Choose Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {imageFile && (
                      <span className="text-sm text-gray-500 truncate max-w-[150px]">
                        {imageFile.name}
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
                  {lang === 'fr' ? 'Partenaire (optionnel)' : 'Partner (optional)'}
                </label>
                <select
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{lang === 'fr' ? 'Aucun (Récompense globale)' : 'None (Global Reward)'}</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.companyName || partner.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {lang === 'fr' ? 'Envoi...' : 'Uploading...'}
                    </>
                  ) : (
                    editingReward 
                      ? (lang === 'fr' ? 'Mettre à jour' : 'Update')
                      : (lang === 'fr' ? 'Créer' : 'Create')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRewards;
