import React, { useState } from 'react';
import { MOCK_RECEIPTS, TRANSLATIONS } from '../constants';
import { Language, ReceiptStatus } from '../types';

interface ModerationProps {
  lang: Language;
}

const Moderation: React.FC<ModerationProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [receipts, setReceipts] = useState(MOCK_RECEIPTS);

  const handleAction = (id: string, status: ReceiptStatus) => {
    // Optimistically update UI by removing or updating the receipt
    setReceipts(receipts.map(r => r.id === id ? { ...r, status } : r));
  };

  const pendingReceipts = receipts.filter(r => r.status === ReceiptStatus.Pending);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">{t.moderation}</h2>
        <p className="text-sm text-gray-500 mt-1">Review receipts with low AI confidence scores.</p>
      </div>
      
      <div className="divide-y divide-gray-100">
        {pendingReceipts.length > 0 ? pendingReceipts.map((receipt) => (
          <div key={receipt.id} className="p-6 flex flex-col lg:flex-row gap-6">
            {/* Image Preview */}
            <div className="w-full lg:w-48 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 group">
               <img src={receipt.imageUrl} alt="Receipt" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Data & Controls */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className="font-bold text-gray-900 text-lg">{receipt.supermarketName}</h3>
                   <p className="text-sm text-gray-500">{receipt.date} • ID: {receipt.id}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  receipt.confidenceScore > 0.8 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {t.confidence}: {Math.round(receipt.confidenceScore * 100)}%
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
                  onClick={() => handleAction(receipt.id, ReceiptStatus.Verified)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  {t.approve}
                </button>
                <button 
                  onClick={() => handleAction(receipt.id, ReceiptStatus.Rejected)}
                  className="bg-red-50 hover:bg-red-100 text-red-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t.reject}
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-gray-500">
            <p>No pending receipts to review. Good job!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Moderation;