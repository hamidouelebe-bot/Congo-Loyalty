
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Supermarket } from '../types';
import Modal from '../components/Modal';
import { api } from '../services/api';

interface PartnersProps {
  lang: Language;
  partners: Supermarket[];
  setPartners: React.Dispatch<React.SetStateAction<Supermarket[]>>;
}

const Partners: React.FC<PartnersProps> = ({ lang, partners, setPartners }) => {
  const t = TRANSLATIONS[lang];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Supermarket | null>(null);

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

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormData({ 
      name: '', 
      address: '', 
      logoUrl: 'https://picsum.photos/40/40',
      businessHours: '',
      latitude: '',
      longitude: ''
    });
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
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      name: formData.name,
      address: formData.address,
      logoUrl: formData.logoUrl,
      businessHours: formData.businessHours,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
    };

    try {
      if (editingPartner) {
        // Update existing
        const updatedPartner = await api.supermarkets.update(editingPartner.id, updatedData);
        setPartners(partners.map(p => p.id === editingPartner.id ? updatedPartner : p));
      } else {
        // Create new
        const newPartner = await api.supermarkets.create(updatedData);
        setPartners([...partners, newPartner]);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save partner:", error);
      alert("Failed to save partner");
    }
  };

  const toggleStatus = async (id: string) => {
    const partner = partners.find(p => p.id === id);
    if (!partner) return;
    try {
      const updated = await api.supermarkets.update(id, { active: !partner.active });
      setPartners(partners.map(p => p.id === id ? updated : p));
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
      try {
        await api.supermarkets.delete(id);
        setPartners(partners.filter(p => p.id !== id));
      } catch (error) {
        console.error("Failed to delete partner:", error);
        alert("Failed to delete partner");
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{t.partners}</h2>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + {t.create_new}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {partners.map((store) => (
          <div key={store.id} className="flex items-start space-x-4 p-4 border rounded-xl hover:shadow-md transition-shadow bg-gray-50/50">
            <img src={store.logoUrl} alt={store.name} className="w-16 h-16 rounded-lg object-cover bg-gray-100 border border-gray-200" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">{store.name}</h3>
                <button 
                  onClick={() => toggleStatus(store.id)}
                  title="Toggle Status"
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
                  <span className="block font-medium text-gray-700">Avg Basket</span>
                  {store.avgBasket.toLocaleString()} CDF
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => openEditModal(store)}
                    className="text-blue-600 text-sm font-medium hover:underline"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(store.id)}
                    className="text-red-500 text-sm font-medium hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingPartner ? "Edit Partner" : "New Partner"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supermarket Name</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea 
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Hours</label>
            <input 
              type="text" 
              value={formData.businessHours}
              onChange={(e) => setFormData({...formData, businessHours: e.target.value})}
              placeholder="e.g. Mon-Sun: 8:00 - 22:00"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input 
              type="text" 
              value={formData.logoUrl}
              onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-gray-600"
            />
          </div>
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100 mt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save Partner</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Partners;
