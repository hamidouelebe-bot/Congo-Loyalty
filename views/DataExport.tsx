import React, { useState, useEffect, useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Supermarket } from '../types';
import { api } from '../services/api';

interface DataExportProps {
  lang: Language;
}

type ReportType = 'transactions' | 'users' | 'campaigns' | 'stores' | 'liability' | 'rewards';
type ExportFormat = 'csv' | 'pdf' | 'doc';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  color: string;
  columns: { key: string; label: string }[];
}

const REPORT_CONFIGS: ReportConfig[] = [
  {
    id: 'transactions',
    title: 'Transactions Report',
    description: 'All receipts with user details, store info, and verification status',
    icon: '🧾',
    color: 'blue',
    columns: [
      { key: 'transactionId', label: 'Transaction ID' },
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Amount (CDF)' },
      { key: 'status', label: 'Status' },
      { key: 'confidence', label: 'Confidence' },
      { key: 'storeName', label: 'Store' },
      { key: 'userName', label: 'Customer' },
      { key: 'userPhone', label: 'Phone' }
    ]
  },
  {
    id: 'users',
    title: 'Users Report',
    description: 'Complete customer database with points, status, and demographics',
    icon: '👥',
    color: 'green',
    columns: [
      { key: 'userId', label: 'User ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'pointsBalance', label: 'Points' },
      { key: 'status', label: 'Status' },
      { key: 'joinedDate', label: 'Joined' }
    ]
  },
  {
    id: 'campaigns',
    title: 'Campaigns Report',
    description: 'Campaign performance, conversions, and ROI analytics',
    icon: '📊',
    color: 'orange',
    columns: [
      { key: 'campaignId', label: 'ID' },
      { key: 'name', label: 'Campaign Name' },
      { key: 'brand', label: 'Brand' },
      { key: 'status', label: 'Status' },
      { key: 'startDate', label: 'Start' },
      { key: 'endDate', label: 'End' },
      { key: 'conversions', label: 'Conversions' },
      { key: 'storeCount', label: 'Stores' }
    ]
  },
  {
    id: 'stores',
    title: 'Stores Report',
    description: 'Partner store performance, revenue, and receipt volume',
    icon: '🏪',
    color: 'teal',
    columns: [
      { key: 'storeId', label: 'Store ID' },
      { key: 'name', label: 'Store Name' },
      { key: 'address', label: 'Address' },
      { key: 'status', label: 'Status' },
      { key: 'totalReceipts', label: 'Receipts' },
      { key: 'totalRevenue', label: 'Revenue (CDF)' },
      { key: 'avgBasket', label: 'Avg Basket' }
    ]
  },
  {
    id: 'liability',
    title: 'Financial Liability',
    description: 'Outstanding points balance and expiration tracking',
    icon: '💰',
    color: 'red',
    columns: [
      { key: 'userId', label: 'User ID' },
      { key: 'userName', label: 'Customer' },
      { key: 'pointsBalance', label: 'Points Balance' },
      { key: 'pointsExpiring', label: 'Expiring Soon' },
      { key: 'nextExpiration', label: 'Next Expiry' },
      { key: 'status', label: 'Status' },
      { key: 'segment', label: 'Segment' }
    ]
  },
  {
    id: 'rewards',
    title: 'Rewards Report',
    description: 'Reward catalog performance and redemption statistics',
    icon: '🎁',
    color: 'purple',
    columns: [
      { key: 'rewardId', label: 'Reward ID' },
      { key: 'title', label: 'Title' },
      { key: 'cost', label: 'Cost (Points)' },
      { key: 'type', label: 'Type' },
      { key: 'brand', label: 'Brand' },
      { key: 'totalRedemptions', label: 'Redemptions' },
      { key: 'totalPointsSpent', label: 'Points Spent' }
    ]
  }
];

const DataExport: React.FC<DataExportProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  
  // State
  const [selectedReport, setSelectedReport] = useState<ReportType>('transactions');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalReceipts: 0, totalRevenue: 0, activeCampaigns: 0, activeStores: 0 });
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    storeId: '',
    limit: 500
  });

  // Current report config
  const currentConfig = useMemo(() => 
    REPORT_CONFIGS.find(r => r.id === selectedReport) || REPORT_CONFIGS[0],
    [selectedReport]
  );

  // Load stores for filter dropdown
  useEffect(() => {
    api.supermarkets.getAll().then(setStores).catch(console.error);
    api.reports.getStats().then(setStats).catch(console.error);
  }, []);

  // Fetch report data
  const fetchReportData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.reports.getData(selectedReport, {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
        storeId: filters.storeId || undefined,
        limit: filters.limit
      });
      setReportData(result.data || []);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on report type change
  useEffect(() => {
    fetchReportData();
  }, [selectedReport]);

  // Generate CSV content
  const generateCSV = (data: any[], columns: { key: string; label: string }[]): string => {
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(c => {
        const val = row[c.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headers, ...rows].join('\n');
  };

  // Generate PDF content (HTML-based for printing)
  const generatePDFContent = (data: any[], columns: { key: string; label: string }[], title: string): string => {
    const now = new Date().toLocaleString();
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - DRC Loyalty</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
          h1 { color: #1e40af; font-size: 24px; margin-bottom: 5px; }
          .subtitle { color: #6b7280; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1e40af; color: white; padding: 10px 8px; text-align: left; font-size: 11px; }
          td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
          tr:nth-child(even) { background: #f9fafb; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat { background: #f3f4f6; padding: 10px 15px; border-radius: 8px; }
          .stat-value { font-size: 18px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 10px; color: #6b7280; }
          .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>📊 ${title}</h1>
        <p class="subtitle">Generated: ${now} | Records: ${data.length}</p>
        <table>
          <thead>
            <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.slice(0, 1000).map(row => `
              <tr>${columns.map(c => `<td>${row[c.key] ?? '-'}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">DRC Loyalty Program - Confidential Report</div>
      </body>
      </html>
    `;
  };

  // Generate DOC content (HTML with MS Word MIME type)
  const generateDOCContent = (data: any[], columns: { key: string; label: string }[], title: string): string => {
    const now = new Date().toLocaleString();
    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Calibri, sans-serif; }
          h1 { color: #1e40af; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #1e40af; color: white; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p><strong>Generated:</strong> ${now}</p>
        <p><strong>Total Records:</strong> ${data.length}</p>
        <table>
          <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
          ${data.slice(0, 500).map(row => `
            <tr>${columns.map(c => `<td>${row[c.key] ?? ''}</td>`).join('')}</tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
  };

  // Download file
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export handler
  const handleExport = async (format: ExportFormat) => {
    if (reportData.length === 0) {
      setError('No data to export. Please fetch data first.');
      return;
    }

    setIsExporting(true);
    const timestamp = new Date().toISOString().slice(0, 10);
    const title = currentConfig.title;

    try {
      switch (format) {
        case 'csv': {
          const csv = generateCSV(reportData, currentConfig.columns);
          downloadFile(csv, `DRC_Loyalty_${selectedReport}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
          break;
        }
        case 'pdf': {
          const html = generatePDFContent(reportData, currentConfig.columns, title);
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
          }
          break;
        }
        case 'doc': {
          const doc = generateDOCContent(reportData, currentConfig.columns, title);
          downloadFile(doc, `DRC_Loyalty_${selectedReport}_${timestamp}.doc`, 'application/msword');
          break;
        }
      }
    } catch (err) {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Status options based on report type
  const statusOptions = useMemo(() => {
    switch (selectedReport) {
      case 'transactions': return ['verified', 'pending', 'rejected'];
      case 'users': return ['active', 'suspended', 'banned'];
      case 'campaigns': return ['active', 'paused', 'ended'];
      case 'stores': return ['active', 'inactive'];
      default: return [];
    }
  }, [selectedReport]);

  // Color classes
  const getColorClasses = (color: string) => ({
    bg: `bg-${color}-50`,
    text: `text-${color}-600`,
    border: `border-${color}-200`,
    button: `bg-${color}-600 hover:bg-${color}-700`,
    light: `bg-${color}-100`
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              📊 Reports & Data Export
            </h1>
            <p className="text-blue-100 text-lg">Generate, filter, and export comprehensive business reports</p>
          </div>
          <div className="hidden md:flex gap-4 text-center">
            <div className="bg-white/20 backdrop-blur rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-blue-100">Users</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">{stats.totalReceipts.toLocaleString()}</div>
              <div className="text-xs text-blue-100">Receipts</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">{stats.activeStores}</div>
              <div className="text-xs text-blue-100">Stores</div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Select Report Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {REPORT_CONFIGS.map(config => (
            <button
              key={config.id}
              onClick={() => setSelectedReport(config.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedReport === config.id
                  ? `border-${config.color}-500 bg-${config.color}-50 shadow-md`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{config.icon}</div>
              <div className={`font-semibold text-sm ${selectedReport === config.id ? `text-${config.color}-700` : 'text-gray-700'}`}>
                {config.title.replace(' Report', '')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
            🔍 Filters
          </h2>
          <button
            onClick={() => setFilters({ startDate: '', endDate: '', status: '', storeId: '', limit: 500 })}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          
          {/* Status */}
          {statusOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Store Filter (for transactions) */}
          {selectedReport === 'transactions' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Store</label>
              <select
                value={filters.storeId}
                onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">All Stores</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Limit */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Records</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value={100}>100 records</option>
              <option value={500}>500 records</option>
              <option value={1000}>1,000 records</option>
              <option value={5000}>5,000 records</option>
              <option value={10000}>10,000 records</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={fetchReportData}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isLoading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Data Preview & Export */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentConfig.icon}</span>
            <div>
              <h3 className="font-bold text-gray-900">{currentConfig.title}</h3>
              <p className="text-sm text-gray-500">{reportData.length.toLocaleString()} records loaded</p>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">Export as:</span>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting || reportData.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting || reportData.length === 0}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              PDF
            </button>
            <button
              onClick={() => handleExport('doc')}
              disabled={isExporting || reportData.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              DOC
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-500">Loading report data...</p>
              </div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">No Data Found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your filters or select a different report type</p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {currentConfig.columns.map((col, idx) => (
                    <th key={col.key} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {currentConfig.columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {col.key === 'status' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row[col.key] === 'verified' || row[col.key] === 'active' || row[col.key] === 'Active' 
                              ? 'bg-green-100 text-green-700'
                              : row[col.key] === 'pending' 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {row[col.key]}
                          </span>
                        ) : col.key.includes('amount') || col.key.includes('Revenue') || col.key.includes('Spent') || col.key.includes('Basket') ? (
                          <span className="font-mono">
                            {typeof row[col.key] === 'number' ? row[col.key].toLocaleString() : row[col.key]}
                          </span>
                        ) : (
                          row[col.key] ?? '-'
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer */}
        {reportData.length > 100 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              Showing first 100 of {reportData.length.toLocaleString()} records. Export to view all data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExport;
