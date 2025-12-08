import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import StatCard from '../components/StatCard';
import { IconUsers, IconStore, IconCheckSquare } from '../components/Icons';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  lang: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
       try {
         const [statsData, chartsData] = await Promise.all([
            api.dashboard.getStats(),
            api.dashboard.getCharts()
         ]);
         setStats(statsData);
         setCharts(chartsData);
       } catch (error) {
         console.error("Failed to fetch dashboard data:", error);
       } finally {
         setIsLoading(false);
       }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center">Loading Dashboard...</div>;
  }

  // Fallback if stats fail (or are empty)
  const safeStats = stats || {
      activeUsers: { value: "0", trend: "-", isPositive: true },
      totalSales: { value: "$0", trend: "-", isPositive: true },
      receiptsProcessed: { value: "0", trend: "-", isPositive: false },
      avgBasket: { value: "$0", trend: "-", isPositive: true }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.active_users} value={safeStats.activeUsers.value} trend={safeStats.activeUsers.trend} isPositive={safeStats.activeUsers.isPositive} icon={<IconUsers />} />
        <StatCard title={t.total_sales} value={safeStats.totalSales.value} trend={safeStats.totalSales.trend} isPositive={safeStats.totalSales.isPositive} icon={<IconStore />} />
        <StatCard title={t.receipts_processed} value={safeStats.receiptsProcessed.value} trend={safeStats.receiptsProcessed.trend} isPositive={safeStats.receiptsProcessed.isPositive} icon={<IconCheckSquare />} />
        <StatCard title={t.avg_basket} value={safeStats.avgBasket.value} trend={safeStats.avgBasket.trend} isPositive={safeStats.avgBasket.isPositive} icon={<IconStore />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t.recent_activity}</h3>
          <div className="h-64 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.salesData || []}>
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
           <div className="h-64 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.brandData || []}>
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