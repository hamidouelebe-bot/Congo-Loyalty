import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import StatCard from '../components/StatCard';
import { IconUsers, IconStore, IconCheckSquare } from '../components/Icons';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface DashboardProps {
  lang: Language;
}

const SALES_DATA = [
  { name: 'Mon', sales: 4000, receipts: 240 },
  { name: 'Tue', sales: 3000, receipts: 139 },
  { name: 'Wed', sales: 2000, receipts: 980 },
  { name: 'Thu', sales: 2780, receipts: 390 },
  { name: 'Fri', sales: 1890, receipts: 480 },
  { name: 'Sat', sales: 2390, receipts: 380 },
  { name: 'Sun', sales: 3490, receipts: 430 },
];

const BRAND_DATA = [
  { name: 'Kelloggs', value: 4000 },
  { name: 'Heineken', value: 3000 },
  { name: 'Nido', value: 2000 },
  { name: 'Coca-Cola', value: 2780 },
];

const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.active_users} value="12,450" trend="+12% from last month" isPositive icon={<IconUsers />} />
        <StatCard title={t.total_sales} value="$482,000" trend="+4.3% from last month" isPositive icon={<IconStore />} />
        <StatCard title={t.receipts_processed} value="8,932" trend="-2% from last month" isPositive={false} icon={<IconCheckSquare />} />
        <StatCard title={t.avg_basket} value="$54.20" trend="+8% from last month" isPositive icon={<IconStore />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t.recent_activity}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SALES_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t.top_brands}</h3>
           <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BRAND_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;