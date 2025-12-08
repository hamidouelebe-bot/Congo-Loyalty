import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TRANSLATIONS } from '../constants';
import { Language, Supermarket } from '../types';
import { api } from '../services/api';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface DataExportProps {
  lang: Language;
}

type ReportType = 
  | 'transactions' | 'users' | 'campaigns' | 'stores' | 'liability' | 'rewards' 
  | 'products' | 'redemptions' | 'sales_heatmap'
  | 'premium_clv' | 'premium_churn' | 'premium_growth' | 'premium_affinity';

type ReportCategory = 'standard' | 'premium' | 'ai';

type ExportFormat = 'csv' | 'pdf' | 'doc';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: ReportCategory;
  columns: { key: string; label: string }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const REPORT_CONFIGS: ReportConfig[] = [
  // STANDARD REPORTS
  {
    id: 'transactions',
    title: 'Transactions Report',
    description: 'All receipts with user details, store info, and verification status',
    icon: '🧾',
    color: 'blue',
    category: 'standard',
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
    title: 'Users Database',
    description: 'Complete customer database with points, status, and demographics',
    icon: '👥',
    color: 'green',
    category: 'standard',
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
    title: 'Campaign Performance',
    description: 'Campaign ROI, conversions, and engagement analytics',
    icon: '📊',
    color: 'orange',
    category: 'standard',
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
    title: 'Store Performance',
    description: 'Partner store revenue, traffic, and basket analysis',
    icon: '🏪',
    color: 'teal',
    category: 'standard',
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
    id: 'products',
    title: 'Product Analytics',
    description: 'Top selling products and category performance',
    icon: '📦',
    color: 'indigo',
    category: 'standard',
    columns: [
      { key: 'productName', label: 'Product Name' },
      { key: 'category', label: 'Category' },
      { key: 'unitsSold', label: 'Units Sold' },
      { key: 'totalRevenue', label: 'Total Revenue' },
      { key: 'avgPrice', label: 'Avg Price' }
    ]
  },
  {
    id: 'redemptions',
    title: 'Redemption History',
    description: 'Detailed log of all reward redemptions and fulfillment',
    icon: '🎫',
    color: 'pink',
    category: 'standard',
    columns: [
      { key: 'rewardName', label: 'Reward' },
      { key: 'pointsCost', label: 'Points Cost' },
      { key: 'status', label: 'Status' },
      { key: 'redemptionDate', label: 'Date' },
      { key: 'userName', label: 'User' },
      { key: 'userEmail', label: 'Email' }
    ]
  },
  {
    id: 'sales_heatmap',
    title: 'Peak Sales Hours',
    description: 'Revenue analysis by day of week and hour of day',
    icon: '🔥',
    color: 'orange',
    category: 'standard',
    columns: [
      { key: 'dayOfWeek', label: 'Day' },
      { key: 'hourOfDay', label: 'Hour' },
      { key: 'transactionCount', label: 'Transactions' },
      { key: 'totalRevenue', label: 'Revenue' },
      { key: 'avgTicket', label: 'Avg Ticket' }
    ]
  },
  {
    id: 'liability',
    title: 'Financial Liability',
    description: 'Outstanding points balance and expiration tracking',
    icon: '💰',
    color: 'red',
    category: 'standard',
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
    title: 'Rewards Catalog',
    description: 'Reward inventory and popularity metrics',
    icon: '🎁',
    color: 'purple',
    category: 'standard',
    columns: [
      { key: 'rewardId', label: 'Reward ID' },
      { key: 'title', label: 'Title' },
      { key: 'cost', label: 'Cost (Points)' },
      { key: 'type', label: 'Type' },
      { key: 'brand', label: 'Brand' },
      { key: 'totalRedemptions', label: 'Redemptions' },
      { key: 'totalPointsSpent', label: 'Points Spent' }
    ]
  },
  
  // PREMIUM REPORTS
  {
    id: 'premium_clv',
    title: 'Customer Lifetime Value',
    description: 'Predictive analytics on customer value and segmentation',
    icon: '💎',
    color: 'violet',
    category: 'premium',
    columns: [
      { key: 'userId', label: 'User ID' },
      { key: 'userName', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'totalLifetimeSpend', label: 'Lifetime Spend' },
      { key: 'currentPoints', label: 'Points' },
      { key: 'projectedAnnualValue', label: 'Proj. Annual Value' },
      { key: 'customerTier', label: 'Tier' }
    ]
  },
  {
    id: 'premium_churn',
    title: 'Churn Risk Analysis',
    description: 'Identify at-risk high-value customers for re-engagement',
    icon: '📉',
    color: 'rose',
    category: 'premium',
    columns: [
      { key: 'userId', label: 'User ID' },
      { key: 'userName', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'lifetimeSpend', label: 'Lifetime Spend' },
      { key: 'lastPurchaseDate', label: 'Last Active' },
      { key: 'daysSinceLastActive', label: 'Days Inactive' }
    ]
  },
  {
    id: 'premium_growth',
    title: 'User Growth & Retention',
    description: 'Monthly user acquisition cohorts and spending',
    icon: '📈',
    color: 'emerald',
    category: 'premium',
    columns: [
      { key: 'month', label: 'Month' },
      { key: 'newUsers', label: 'New Users' },
      { key: 'totalUserBase', label: 'Total Users' },
      { key: 'cohortSpend', label: 'Cohort Spend' }
    ]
  },
  {
    id: 'premium_affinity',
    title: 'Category Affinity',
    description: 'Deep dive into product category preferences',
    icon: '❤️',
    color: 'fuchsia',
    category: 'premium',
    columns: [
      { key: 'category', label: 'Category' },
      { key: 'uniqueBuyers', label: 'Unique Buyers' },
      { key: 'unitsSold', label: 'Units Sold' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'avgPrice', label: 'Avg Price' }
    ]
  }
];

const DataExport: React.FC<DataExportProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  
  // State
  const [activeTab, setActiveTab] = useState<ReportCategory>('standard');
  const [selectedReport, setSelectedReport] = useState<ReportType>('transactions');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState<{role: 'user'|'ai', content: string, data?: any[], sql?: string}[]>([
    { role: 'ai', content: 'Hello! I am your AI Data Analyst. Ask me anything about your loyalty data, like "Who are my top spending customers?"' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<Supermarket[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalReceipts: 0, totalRevenue: 0, activeCampaigns: 0, activeStores: 0 });
  const [dynamicColumns, setDynamicColumns] = useState<{key: string, label: string}[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Load stores & stats
  useEffect(() => {
    api.supermarkets.getAll().then(setStores).catch(console.error);
    api.reports.getStats().then(setStats).catch(console.error);
  }, []);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiOpen]);

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
    } catch (err: any) {
      setError(err.message || 'Failed to load report data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle AI Chat
  const handleAiSubmit = async () => {
    if (!aiPrompt.trim()) return;
    
    const userMsg = aiPrompt;
    setAiPrompt('');
    setAiMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const result = await api.reports.aiQuery(userMsg);
      setAiMessages(prev => [...prev, { 
        role: 'ai', 
        content: `I found ${result.data?.length || 0} records for your query.`,
        data: result.data,
        sql: result.sql
      }]);
    } catch (err: any) {
      setAiMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch standard/premium on selection change
  useEffect(() => {
    if (activeTab !== 'ai') {
      fetchReportData();
    }
  }, [selectedReport, activeTab]);

  // Determine which columns to use
  const activeColumns = currentConfig.columns;
  const activeTitle = currentConfig.title;

  // Chart Rendering Logic
  const renderChart = () => {
    if (reportData.length === 0) return null;

    // Helper to format large numbers
    const formatValue = (val: number) => {
      if (val >= 1000000) return `${(val/1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val/1000).toFixed(1)}k`;
      return val.toString();
    };

    switch (selectedReport) {
      case 'transactions':
      case 'sales_heatmap':
        // Sort by date/hour if possible, otherwise use index
        const chartData = reportData.slice(0, 50).map((d, i) => ({
          name: d.date || d.hourOfDay || i,
          amount: parseFloat(d.amount || d.totalRevenue || 0)
        }));
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis tickFormatter={formatValue} />
              <Tooltip formatter={(val: any) => formatValue(val as number)} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'users':
      case 'liability':
        // Pie chart of Status
        const statusData = reportData.reduce((acc: any, curr) => {
          const status = curr.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        const pieData = Object.keys(statusData).map(key => ({ name: key, value: statusData[key] }));
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'premium_growth':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="totalUserBase" stroke="#10b981" fill="#d1fae5" />
              <Area type="monotone" dataKey="newUsers" stroke="#3b82f6" fill="#bfdbfe" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'products':
      case 'premium_affinity':
        const prodData = reportData.slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={prodData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatValue} />
              <YAxis dataKey="productName" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="totalRevenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        // Generic Line Chart for others
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData.slice(0, 50)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey={Object.keys(reportData[0]).find(k => typeof reportData[0][k] === 'number') || ''} stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

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

  // Generate DOC content
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
    // Sanitize filename
    const safeTitle = activeTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 50);

    try {
      switch (format) {
        case 'csv': {
          const csv = generateCSV(reportData, activeColumns);
          downloadFile(csv, `DRC_Loyalty_${safeTitle}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
          break;
        }
        case 'pdf': {
          const html = generatePDFContent(reportData, activeColumns, activeTitle);
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
          const doc = generateDOCContent(reportData, activeColumns, activeTitle);
          downloadFile(doc, `DRC_Loyalty_${safeTitle}_${timestamp}.doc`, 'application/msword');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-800 to-blue-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              📊 Enterprise Analytics
            </h1>
            <p className="text-blue-200 text-lg">Advanced reporting, AI insights, and data export</p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/10">
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-xs text-blue-200">Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/10">
              <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-blue-200">Rev (CDF)</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 border-b border-white/10 pb-1">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
              activeTab === 'standard' ? 'bg-white text-blue-900' : 'text-blue-200 hover:bg-white/10'
            }`}
          >
            Standard Reports
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-6 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'premium' ? 'bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900' : 'text-amber-200 hover:bg-white/10'
            }`}
          >
            <span className="text-lg">💎</span> Premium Reports
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
        
        {/* REPORT SELECTION */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Select Report</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {REPORT_CONFIGS.filter(c => c.category === activeTab).map(config => (
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
                  {config.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-8 bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Report Filters</h2>
            <button
              onClick={() => setFilters({ startDate: '', endDate: '', status: '', storeId: '', limit: 500 })}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            
            {statusOptions.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedReport === 'transactions' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Store</label>
                <select
                  value={filters.storeId}
                  onChange={(e) => setFilters({ ...filters, storeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">All Stores</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max Records</label>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value={100}>100 records</option>
                <option value={500}>500 records</option>
                <option value={1000}>1,000 records</option>
                <option value={5000}>5,000 records</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchReportData}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isLoading ? 'Loading...' : 'Run Report'}
            </button>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* VISUALIZATION + TABLE */}
        <div className="space-y-6">
          {reportData.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span> Visual Insights
              </h3>
              {renderChart()}
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentConfig.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{currentConfig.title}</h3>
                  <p className="text-sm text-gray-500">{reportData.length.toLocaleString()} records found</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 mr-2 uppercase tracking-wide font-bold">Export</span>
                <button onClick={() => handleExport('csv')} disabled={reportData.length === 0} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-gray-200 hover:border-green-200 disabled:opacity-50" title="CSV">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button onClick={() => handleExport('pdf')} disabled={reportData.length === 0} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 disabled:opacity-50" title="PDF">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                </button>
                <button onClick={() => handleExport('doc')} disabled={reportData.length === 0} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-200 disabled:opacity-50" title="DOC">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-gray-500 font-medium">Processing Request...</p>
                </div>
              ) : reportData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="text-6xl mb-4 opacity-20">📊</div>
                  <p className="font-medium">No data available</p>
                  <p className="text-sm">Run a report to see results</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      {activeColumns.map(col => (
                        <th key={col.key} className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reportData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        {activeColumns.map(col => (
                          <td key={col.key} className="px-6 py-3 text-sm text-gray-700 whitespace-nowrap">
                            {row[col.key] === 'active' || row[col.key] === 'verified' ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                {row[col.key]}
                              </span>
                            ) : typeof row[col.key] === 'number' && (col.key.toLowerCase().includes('amount') || col.key.toLowerCase().includes('revenue')) ? (
                              <span className="font-mono font-medium text-gray-900">
                                {row[col.key].toLocaleString()}
                              </span>
                            ) : (
                              row[col.key] ?? <span className="text-gray-300">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING AI CHAT BOT */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isAiOpen && (
          <button
            onClick={() => setIsAiOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <span className="text-2xl">🤖</span>
            <span className="font-bold pr-2">Ask AI Analyst</span>
          </button>
        )}

        {isAiOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-96 h-[500px] flex flex-col animate-in slide-in-from-bottom-5">
            {/* Chat Header */}
            <div className="bg-purple-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2">
                <span>🤖</span> AI Data Analyst
              </h3>
              <button onClick={() => setIsAiOpen(false)} className="hover:bg-purple-700 p-1 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.sql && (
                      <div className="mt-2 text-xs font-mono bg-gray-900 text-gray-200 p-2 rounded">
                        SQL: {msg.sql}
                      </div>
                    )}
                    {msg.data && msg.data.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {msg.data.length} records found
                        </span>
                        <button 
                          onClick={() => {
                            setReportData(msg.data!);
                            setDynamicColumns(Object.keys(msg.data![0]).map(key => ({
                              key, label: key.charAt(0).toUpperCase() + key.slice(1)
                            })));
                            setActiveTab('ai'); // Switch to a generic AI view logic if needed, or just overlay
                            // Actually, let's just dump it into the main table view
                            setSelectedReport('transactions'); // Reset or set to something
                            // Ideally we need an 'ai_result' report type or just override reportData
                            // The state setReportData(msg.data!) does this.
                            setIsAiOpen(false);
                          }}
                          className="mt-2 block w-full text-center text-xs bg-purple-100 text-purple-700 py-1 rounded hover:bg-purple-200"
                        >
                          View in Table
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSubmit()}
                  placeholder="Ask a question..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleAiSubmit}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataExport;
