
import React, { useState } from 'react';
import { MOCK_RECEIPTS, MOCK_USERS, MOCK_SUPERMARKETS, TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { IconDownload, IconCheckSquare, IconUsers, IconTag } from '../components/Icons';

interface DataExportProps {
  lang: Language;
}

const DataExport: React.FC<DataExportProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState<'transactions' | 'users' | 'items' | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateCSV = (headers: string[], rows: (string | number)[][]): string => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const calculateAge = (birthdate?: string) => {
    if (!birthdate) return 0;
    const dob = new Date(birthdate);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms); 
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const getAgeGroup = (age: number) => {
    if (age === 0) return 'Unknown';
    if (age < 18) return 'Under 18';
    if (age <= 24) return '18-24';
    if (age <= 34) return '25-34';
    if (age <= 44) return '35-44';
    if (age <= 54) return '45-54';
    return '55+';
  };

  const handleExportTransactions = () => {
    setLoading('transactions');
    setTimeout(() => {
      // Join Data: Receipts + Users + Supermarkets
      const headers = [
        'TransactionID', 'Date', 'Amount (CDF)', 'Status', 'Confidence', 'Store Name', 'Store Address', 
        'UserID', 'User Name', 'User Email', 'User Phone', 'User Joined Date'
      ];

      const rows = MOCK_RECEIPTS.map(receipt => {
        const user = MOCK_USERS.find(u => u.id === receipt.userId);
        const store = MOCK_SUPERMARKETS.find(s => s.name === receipt.supermarketName); // Matching by name for mock, usually by ID
        
        return [
          receipt.id,
          receipt.date,
          receipt.amount,
          receipt.status,
          receipt.confidenceScore,
          receipt.supermarketName,
          store?.address || 'N/A',
          receipt.userId,
          user ? `${user.firstName} ${user.lastName}` : 'Unknown',
          user?.email || 'N/A',
          user?.phoneNumber || 'N/A',
          user?.joinedDate || 'N/A'
        ];
      });

      const csv = generateCSV(headers, rows);
      downloadCSV(csv, `DRC_Loyalty_Transactions_${new Date().toISOString().slice(0,10)}.csv`);
      
      setLoading(null);
      setSuccess('transactions');
      setTimeout(() => setSuccess(null), 3000);
    }, 1500); // Simulate processing time
  };

  const handleExportUsers = () => {
    setLoading('users');
    setTimeout(() => {
      const headers = [
        'UserID', 'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Birthdate', 'Age', 'Status', 
        'Points Balance', 'Points Expiring', 'Next Expiration', 'Total Spent', 'Joined Date'
      ];

      const rows = MOCK_USERS.map(user => [
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber,
        user.gender || 'N/A',
        user.birthdate || 'N/A',
        calculateAge(user.birthdate),
        user.status,
        user.pointsBalance,
        user.pointsExpiring,
        user.nextExpirationDate || '',
        user.totalSpent,
        user.joinedDate
      ]);

      const csv = generateCSV(headers, rows);
      downloadCSV(csv, `DRC_Loyalty_Users_${new Date().toISOString().slice(0,10)}.csv`);

      setLoading(null);
      setSuccess('users');
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleExportItems = () => {
    setLoading('items');
    setTimeout(() => {
      // Structure: UserID -> ItemName -> { Quantity, TotalSpent, Count }
      const itemAggregates: Record<string, Record<string, { quantity: number; spend: number; frequency: number }>> = {};

      MOCK_RECEIPTS.forEach(receipt => {
        if (receipt.items && receipt.items.length > 0) {
           receipt.items.forEach(item => {
             const userId = receipt.userId;
             const itemName = item.name;

             if (!itemAggregates[userId]) itemAggregates[userId] = {};
             if (!itemAggregates[userId][itemName]) {
               itemAggregates[userId][itemName] = { quantity: 0, spend: 0, frequency: 0 };
             }

             itemAggregates[userId][itemName].quantity += item.quantity;
             itemAggregates[userId][itemName].spend += item.total;
             itemAggregates[userId][itemName].frequency += 1;
           });
        }
      });

      // Enhanced headers with Demographic info for Expert System
      const headers = [
        'UserID', 'User Name', 'Gender', 'Age Group', 'Item Name', 'Total Quantity Purchased', 'Total Spend (CDF)', 'Times Shopped (Receipt Frequency)'
      ];

      const rows: (string | number)[][] = [];

      Object.keys(itemAggregates).forEach(userId => {
        const user = MOCK_USERS.find(u => u.id === userId);
        const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown';
        const userGender = user?.gender || 'Unknown';
        const userAge = calculateAge(user?.birthdate);
        const userAgeGroup = getAgeGroup(userAge);
        
        Object.keys(itemAggregates[userId]).forEach(itemName => {
           const data = itemAggregates[userId][itemName];
           rows.push([
             userId,
             userName,
             userGender,
             userAgeGroup,
             itemName,
             data.quantity,
             data.spend,
             data.frequency
           ]);
        });
      });

      const csv = generateCSV(headers, rows);
      downloadCSV(csv, `DRC_Loyalty_Item_Demographic_Analysis_${new Date().toISOString().slice(0,10)}.csv`);

      setLoading(null);
      setSuccess('items');
      setTimeout(() => setSuccess(null), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <IconDownload className="w-8 h-8" />
          {t.export_title}
        </h2>
        <p className="text-blue-100 max-w-2xl">{t.export_desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Transaction Export Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <IconCheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Transactions</h3>
          <p className="text-gray-500 text-sm mb-8 px-4 h-12 overflow-hidden">
            Comprehensive export containing every receipt, linked with user details and POS location.
          </p>
          <button
            onClick={handleExportTransactions}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'}
            `}
          >
            {loading === 'transactions' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            {t.export_transactions_btn}
          </button>
          {success === 'transactions' && (
            <p className="text-green-600 text-sm font-bold mt-4 animate-bounce">
              ✓ {t.export_success}
            </p>
          )}
        </div>

        {/* Item Level Export Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow relative overflow-hidden">
           <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-bl-lg">
             New
           </div>
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6">
            <IconTag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Item-Level Analysis</h3>
          <p className="text-gray-500 text-sm mb-8 px-4 h-12 overflow-hidden">
             {t.export_items_desc || "Analyze shopper habits with total quantity and spend per specific item."}
          </p>
          <div className="w-full mb-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded border border-yellow-100">
             Includes Gender & Age Group data
          </div>
          <button
            onClick={handleExportItems}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200'}
            `}
          >
            {loading === 'items' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            {t.export_items_btn || "Export Item Analysis"}
          </button>
          {success === 'items' && (
            <p className="text-green-600 text-sm font-bold mt-4 animate-bounce">
              ✓ {t.export_success}
            </p>
          )}
        </div>

        {/* User Export Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
            <IconUsers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">User Profiles</h3>
          <p className="text-gray-500 text-sm mb-8 px-4 h-12 overflow-hidden">
            Full list of registered users including contact info, current points balance, and status.
          </p>
          <button
            onClick={handleExportUsers}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-green-600 text-green-700 hover:bg-green-50'}
            `}
          >
            {loading === 'users' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            {t.export_users_btn}
          </button>
          {success === 'users' && (
            <p className="text-green-600 text-sm font-bold mt-4 animate-bounce">
              ✓ {t.export_success}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExport;