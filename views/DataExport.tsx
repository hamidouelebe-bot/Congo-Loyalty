
import React, { useState } from 'react';
import { MOCK_RECEIPTS, MOCK_USERS, MOCK_SUPERMARKETS, MOCK_CAMPAIGNS, TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { IconDownload, IconCheckSquare, IconUsers, IconTag, IconStore, IconWallet, IconPieChart } from '../components/Icons';

interface DataExportProps {
  lang: Language;
}

const DataExport: React.FC<DataExportProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [loading, setLoading] = useState<'transactions' | 'users' | 'items' | 'campaigns' | 'stores' | 'liability' | null>(null);
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

  // --- EXISTING EXPORTS ---

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
        'Points Balance', 'Points Expiring', 'Next Expiration', 'Total Spent', 'Joined Date', 'Segment'
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
        user.joinedDate,
        user.segment || 'Regular'
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

  // --- NEW EXPORTS ---

  const handleExportCampaigns = () => {
    setLoading('campaigns');
    setTimeout(() => {
      const headers = [
        'CampaignID', 'Name', 'Brand', 'Status', 'Start Date', 'End Date', 'Conversions', 'Max Redemptions', 'Target Audience', 'Mechanic', 'Reward Type', 'Reward Value', 'Participating Stores (Count)'
      ];

      const rows = MOCK_CAMPAIGNS.map(c => [
        c.id,
        c.name,
        c.brand,
        c.status,
        c.startDate,
        c.endDate,
        c.conversions,
        c.maxRedemptions || 'Unlimited',
        c.targetAudience || 'All',
        c.mechanic,
        c.rewardType,
        c.rewardValue,
        c.supermarketIds.length
      ]);

      const csv = generateCSV(headers, rows);
      downloadCSV(csv, `DRC_Loyalty_Campaign_Performance_${new Date().toISOString().slice(0,10)}.csv`);

      setLoading(null);
      setSuccess('campaigns');
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleExportStores = () => {
    setLoading('stores');
    setTimeout(() => {
      const headers = [
        'StoreID', 'Name', 'Address', 'Status', 'Business Hours', 'GPS Lat', 'GPS Long', 'Total Receipts Scanned', 'Total Verified Revenue (CDF)', 'Avg Basket (System Calc)'
      ];

      const rows = MOCK_SUPERMARKETS.map(store => {
         // Calculate aggregated metrics from receipts
         const storeReceipts = MOCK_RECEIPTS.filter(r => r.supermarketName === store.name);
         const verifiedReceipts = storeReceipts.filter(r => r.status === 'verified');
         const totalRevenue = verifiedReceipts.reduce((sum, r) => sum + r.amount, 0);
         const receiptCount = storeReceipts.length;
         const avgBasket = verifiedReceipts.length > 0 ? Math.round(totalRevenue / verifiedReceipts.length) : 0;

         return [
            store.id,
            store.name,
            store.address,
            store.active ? 'Active' : 'Inactive',
            store.businessHours || 'N/A',
            store.latitude || '',
            store.longitude || '',
            receiptCount,
            totalRevenue,
            avgBasket
         ];
      });

      const csv = generateCSV(headers, rows);
      downloadCSV(csv, `DRC_Loyalty_Store_Performance_${new Date().toISOString().slice(0,10)}.csv`);

      setLoading(null);
      setSuccess('stores');
      setTimeout(() => setSuccess(null), 3000);
    }, 1200);
  };

  const handleExportLiability = () => {
    setLoading('liability');
    setTimeout(() => {
      const headers = [
        'UserID', 'User Name', 'Status', 'Points Balance', 'Points Expiring Soon', 'Next Expiration Date', 'Last Active (Joined)', 'Segment'
      ];

      const rows = MOCK_USERS.map(user => [
        user.id,
        `${user.firstName} ${user.lastName}`,
        user.status,
        user.pointsBalance,
        user.pointsExpiring,
        user.nextExpirationDate || 'N/A',
        user.joinedDate,
        user.segment || 'Regular'
      ]);

      const csv = generateCSV(headers, rows);
      downloadCSV(csv, `DRC_Loyalty_Financial_Liability_${new Date().toISOString().slice(0,10)}.csv`);

      setLoading(null);
      setSuccess('liability');
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
          <IconDownload className="w-8 h-8" />
          {t.export_title}
        </h2>
        <p className="text-blue-100 max-w-2xl">{t.export_desc}</p>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4 border-l-4 border-blue-600 pl-3">Standard Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Transaction Export Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <IconCheckSquare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Transactions</h3>
          <p className="text-gray-500 text-sm mb-6 px-2 h-10 overflow-hidden line-clamp-2">
            Comprehensive export containing every receipt, linked with user details and POS location.
          </p>
          <button
            onClick={handleExportTransactions}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-auto
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
          {success === 'transactions' && <p className="text-green-600 text-xs font-bold mt-2 animate-bounce">✓ {t.export_success}</p>}
        </div>

        {/* 2. User Export Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
            <IconUsers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">User Profiles</h3>
          <p className="text-gray-500 text-sm mb-6 px-2 h-10 overflow-hidden line-clamp-2">
            Full list of registered users including contact info, current points balance, status, and segment.
          </p>
          <button
            onClick={handleExportUsers}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-auto
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
          {success === 'users' && <p className="text-green-600 text-xs font-bold mt-2 animate-bounce">✓ {t.export_success}</p>}
        </div>

        {/* 3. Item Level Export Card */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow relative overflow-hidden">
           <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
             ADVANCED
           </div>
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6">
            <IconTag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Item Analysis</h3>
          <p className="text-gray-500 text-sm mb-6 px-2 h-10 overflow-hidden line-clamp-2">
             Analyze shopper habits with total quantity and spend per specific item, segmented by age/gender.
          </p>
          <button
            onClick={handleExportItems}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-auto
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200'}
            `}
          >
            {loading === 'items' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            Export Analysis
          </button>
          {success === 'items' && <p className="text-green-600 text-xs font-bold mt-2 animate-bounce">✓ {t.export_success}</p>}
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4 border-l-4 border-orange-500 pl-3">Strategic Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         
         {/* 4. Campaign Performance */}
         <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-6">
            <IconPieChart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Campaign Performance</h3>
          <p className="text-gray-500 text-sm mb-6 px-2 h-10 overflow-hidden line-clamp-2">
            ROI analysis including conversions, audience targeting efficiency, and mechanic usage.
          </p>
          <button
            onClick={handleExportCampaigns}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-auto
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50'}
            `}
          >
            {loading === 'campaigns' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            Export Campaign Data
          </button>
          {success === 'campaigns' && <p className="text-green-600 text-xs font-bold mt-2 animate-bounce">✓ {t.export_success}</p>}
        </div>

        {/* 5. Store Performance */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-6">
            <IconStore className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Partner Performance</h3>
          <p className="text-gray-500 text-sm mb-6 px-2 h-10 overflow-hidden line-clamp-2">
            Store-level metrics: Total Revenue generated, Receipt volume, and Average Basket size.
          </p>
          <button
            onClick={handleExportStores}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-auto
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-teal-500 text-teal-600 hover:bg-teal-50'}
            `}
          >
            {loading === 'stores' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            Export Store Data
          </button>
          {success === 'stores' && <p className="text-green-600 text-xs font-bold mt-2 animate-bounce">✓ {t.export_success}</p>}
        </div>

        {/* 6. Liability Report */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
            <IconWallet className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Financial Liability</h3>
          <p className="text-gray-500 text-sm mb-6 px-2 h-10 overflow-hidden line-clamp-2">
            Track outstanding points balance and upcoming expirations to estimate program debt.
          </p>
          <button
            onClick={handleExportLiability}
            disabled={loading !== null}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mt-auto
              ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-red-500 text-red-600 hover:bg-red-50'}
            `}
          >
            {loading === 'liability' ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <IconDownload className="w-5 h-5" />
            )}
            Export Liability Report
          </button>
          {success === 'liability' && <p className="text-green-600 text-xs font-bold mt-2 animate-bounce">✓ {t.export_success}</p>}
        </div>

      </div>
    </div>
  );
};

export default DataExport;
