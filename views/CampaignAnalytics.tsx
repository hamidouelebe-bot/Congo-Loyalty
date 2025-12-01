import React from 'react';
import { MOCK_CAMPAIGNS, TRANSLATIONS } from '../constants';
import { Language, AppView } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface CampaignAnalyticsProps {
  campaignId: string | null;
  lang: Language;
  onNavigate: (view: AppView) => void;
}

const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ campaignId, lang, onNavigate }) => {
  const t = TRANSLATIONS[lang];
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === campaignId) || MOCK_CAMPAIGNS[0];

  // Mock time-series data
  const data = [
    { day: 'Day 1', conversions: 120 },
    { day: 'Day 2', conversions: 132 },
    { day: 'Day 3', conversions: 101 },
    { day: 'Day 4', conversions: 134 },
    { day: 'Day 5', conversions: 190 },
    { day: 'Day 6', conversions: 230 },
    { day: 'Day 7', conversions: 210 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <button 
        onClick={() => onNavigate(AppView.Campaigns)}
        className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
      >
        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Campaigns
      </button>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics: {campaign.name}</h1>
            <p className="text-gray-500">{campaign.brand} • {campaign.startDate} to {campaign.endDate}</p>
         </div>
         <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
           Export Report
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="text-sm text-gray-500 font-medium uppercase">Total Conversions</div>
           <div className="text-3xl font-bold text-gray-900 mt-2">{campaign.conversions.toLocaleString()}</div>
           <div className="text-green-600 text-sm mt-1">↑ 12% vs target</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="text-sm text-gray-500 font-medium uppercase">ROI Estimate</div>
           <div className="text-3xl font-bold text-gray-900 mt-2">340%</div>
           <div className="text-green-600 text-sm mt-1">Based on avg basket</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="text-sm text-gray-500 font-medium uppercase">Participating Stores</div>
           <div className="text-3xl font-bold text-gray-900 mt-2">14</div>
           <div className="text-gray-400 text-sm mt-1">All verified</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Daily Conversions Trend</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} />
            <CartesianGrid vertical={false} stroke="#f3f4f6" />
            <Tooltip />
            <Area type="monotone" dataKey="conversions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConv)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CampaignAnalytics;