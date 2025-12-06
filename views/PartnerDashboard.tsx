import React, { useState, useEffect } from 'react';
import { AppView, Language, Partner, Supermarket } from '../types';
import { TRANSLATIONS } from '../constants';
import { api } from '../services/api';

interface PartnerDashboardProps {
  partner: Partner;
  onNavigate: (view: AppView) => void;
  onLogout: () => void;
  lang: Language;
}

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ partner, onNavigate, onLogout, lang }) => {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allSupermarkets = await api.supermarkets.getAll();
        // Filter to only show assigned supermarkets
        const assigned = allSupermarkets.filter(s => 
          partner.supermarketIds.includes(s.id)
        );
        setSupermarkets(assigned);
      } catch (error) {
        console.error('Failed to fetch supermarkets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [partner.supermarketIds]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Partner Portal</h1>
            <p className="text-emerald-100 text-sm">{partner.companyName}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium">{partner.name}</p>
              <p className="text-emerald-100 text-xs">{partner.email}</p>
            </div>
            <button 
              onClick={onLogout}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome, {partner.name}!</h2>
              <p className="text-gray-500">Manage your supermarket locations and view analytics</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Assigned Stores</p>
                <p className="text-3xl font-bold text-gray-800">{supermarkets.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Account Status</p>
                <p className={`text-lg font-bold capitalize ${partner.status === 'active' ? 'text-green-600' : partner.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {partner.status}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${partner.status === 'active' ? 'bg-green-100' : partner.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${partner.status === 'active' ? 'text-green-600' : partner.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {partner.status === 'active' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Member Since</p>
                <p className="text-lg font-bold text-gray-800">{partner.createdAt}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Supermarkets List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">Your Supermarkets</h3>
            <p className="text-gray-500 text-sm">Locations assigned to your partnership</p>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <svg className="animate-spin h-8 w-8 text-emerald-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : supermarkets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-gray-600 font-medium mb-2">No Supermarkets Assigned</h4>
              <p className="text-gray-400 text-sm">Contact the administrator to get supermarkets assigned to your account.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {supermarkets.map((store) => (
                <div key={store.id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <img 
                    src={store.logoUrl} 
                    alt={store.name} 
                    className="w-14 h-14 rounded-lg object-cover bg-gray-100 border border-gray-200" 
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-800">{store.name}</h4>
                      <span className={`w-2 h-2 rounded-full ${store.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </div>
                    <p className="text-gray-500 text-sm">{store.address}</p>
                    {store.businessHours && (
                      <p className="text-gray-400 text-xs mt-1">🕒 {store.businessHours}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Avg Basket</p>
                    <p className="font-bold text-gray-800">{store.avgBasket.toLocaleString()} CDF</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PartnerDashboard;
