import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, ReceiptStatus, Receipt } from '../types';
import { api } from '../services/api';

interface ModerationProps {
  lang: Language;
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

const Moderation: React.FC<ModerationProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setIsLoading(true);
      const data = await api.receipts.getAll();
      setReceipts(data.filter(r => r.status === ReceiptStatus.Pending));
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
      showToast(lang === 'fr' ? 'Erreur lors du chargement des reçus' : 'Failed to load receipts', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleAction = async (id: string, status: ReceiptStatus, amount: number) => {
    setProcessingId(id);
    try {
      // Calculate points: 1 point per 100 CDF (example rate)
      const points = status === ReceiptStatus.Verified ? Math.floor(amount / 100) : 0;
      
      await api.receipts.updateStatus(id, status, points);
      
      setReceipts(receipts.filter(r => r.id !== id));
      showToast(
        status === ReceiptStatus.Verified 
          ? (lang === 'fr' ? `Reçu approuvé (+${points} pts)` : `Receipt approved (+${points} pts)`)
          : (lang === 'fr' ? 'Reçu rejeté' : 'Receipt rejected'),
        'success'
      );
    } catch (error) {
      console.error('Failed to update receipt:', error);
      showToast(lang === 'fr' ? 'Erreur lors de la mise à jour' : 'Failed to update receipt', 'error');
    } finally {
      setProcessingId(null);
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{t.moderation}</h2>
          <p className="text-sm text-gray-500 mt-1">Review receipts with low AI confidence scores.</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {receipts.length > 0 ? receipts.map((receipt) => (
            <div key={receipt.id} className="p-6 flex flex-col lg:flex-row gap-6">
              {/* Image Preview */}
              <div className="w-full lg:w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 group">
                 {receipt.imageUrl ? (
                   <img src={receipt.imageUrl} alt="Receipt" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                 ) : (
                   <span className="text-gray-400 text-sm">No Image</span>
                 )}
              </div>

              {/* Data & Controls */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                     <h3 className="font-bold text-gray-900 text-lg">{receipt.supermarketName}</h3>
                     <p className="text-sm text-gray-500">{receipt.date} • ID: {receipt.id}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    (receipt.confidenceScore || 0) > 0.8 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {t.confidence}: {Math.round((receipt.confidenceScore || 0) * 100)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase block mb-1">Total Amount</span>
                    <span className="font-mono text-lg font-medium text-gray-900">{receipt.amount.toLocaleString()} CDF</span>
                  </div>
                   <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 uppercase block mb-1">User ID</span>
                    <span className="font-mono text-lg font-medium text-gray-900">{receipt.userId}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAction(receipt.id, ReceiptStatus.Verified, receipt.amount)}
                    disabled={processingId === receipt.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center"
                  >
                    {processingId === receipt.id ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : t.approve}
                  </button>
                  <button 
                    onClick={() => handleAction(receipt.id, ReceiptStatus.Rejected, receipt.amount)}
                    disabled={processingId === receipt.id}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {t.reject}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {lang === 'fr' ? 'Tout est en ordre' : 'All Caught Up'}
              </h3>
              <p>
                {lang === 'fr' ? 'Aucun reçu en attente de validation.' : 'No pending receipts to review. Good job!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Moderation;