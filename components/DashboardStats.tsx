import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, BookOpen, Award, TrendingUp, Loader2 } from 'lucide-react';
import { StatCardProps, Language } from '../types';
import { adminAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const StatCard: React.FC<StatCardProps & { subtitle?: string }> = ({ title, value, change, isPositive, icon, subtitle }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
      </div>
      <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
        {icon}
      </div>
    </div>
    {change !== undefined && (
      <div className={`mt-4 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
        <span>{isPositive ? '+' : ''}{change}</span>
        <span className="text-gray-400 ml-1">{subtitle || 'from last month'}</span>
      </div>
    )}
  </div>
);

export const DashboardStats: React.FC = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const data = await adminAPI.getDashboardAnalytics();
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard analytics:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const stats = analytics?.stats || {
    totalStudents: 0,
    studentGrowth: 0,
    isStudentGrowthPositive: true,
    activeCourses: 0,
    coursesGrowth: 0,
    isCoursesGrowthPositive: true,
    completionRate: 0,
    enrollmentsGrowth: 0,
    isEnrollmentsGrowthPositive: true,
    totalRevenue: 0,
    revenueGrowth: 0,
    isRevenueGrowthPositive: true,
  };

  // Day localization mapping
  const dayLabels: Record<string, { [key in Language]?: string }> = {
    Sun: { [Language.FRENCH]: 'Dim', [Language.ENGLISH]: 'Sun', [Language.CREOLE]: 'Dim' },
    Mon: { [Language.FRENCH]: 'Lun', [Language.ENGLISH]: 'Mon', [Language.CREOLE]: 'Len' },
    Tue: { [Language.FRENCH]: 'Mar', [Language.ENGLISH]: 'Tue', [Language.CREOLE]: 'Ma' },
    Wed: { [Language.FRENCH]: 'Mer', [Language.ENGLISH]: 'Wed', [Language.CREOLE]: 'Mèk' },
    Thu: { [Language.FRENCH]: 'Jeu', [Language.ENGLISH]: 'Thu', [Language.CREOLE]: 'Je' },
    Fri: { [Language.FRENCH]: 'Ven', [Language.ENGLISH]: 'Fri', [Language.CREOLE]: 'Fan' },
    Sat: { [Language.FRENCH]: 'Sam', [Language.ENGLISH]: 'Sat', [Language.CREOLE]: 'Sam' },
  };

  const chartData = (analytics?.activityChart || []).map((item: any) => ({
    ...item,
    displayName: dayLabels[item.name]?.[language] || item.name,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-7 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-9 w-9 bg-slate-100 rounded-lg"></div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-32"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map(n => (
            <div key={n} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-[360px] flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={32} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('adminDashboard.totalStudents')}
          value={stats.totalStudents.toLocaleString()}
          change={`${stats.studentGrowth}%`}
          isPositive={stats.isStudentGrowthPositive}
          subtitle={t('adminDashboard.fromLastMonth')}
          icon={<Users size={20} />}
        />
        <StatCard
          title={t('adminDashboard.activeCourses')}
          value={stats.activeCourses.toLocaleString()}
          change={`${stats.coursesGrowth}%`}
          isPositive={stats.isCoursesGrowthPositive}
          subtitle={t('adminDashboard.fromLastMonth')}
          icon={<BookOpen size={20} />}
        />
        <StatCard
          title={t('adminDashboard.courseCompletion')}
          value={`${stats.completionRate}%`}
          change={`${stats.enrollmentsGrowth}%`}
          isPositive={stats.isEnrollmentsGrowthPositive}
          subtitle={t('adminDashboard.fromLastMonth')}
          icon={<Award size={20} />}
        />
        <StatCard
          title={t('adminDashboard.revenue')}
          value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={`${stats.revenueGrowth}%`}
          isPositive={stats.isRevenueGrowthPositive}
          subtitle={t('adminDashboard.fromLastMonth')}
          icon={<TrendingUp size={20} />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">{t('adminDashboard.activityOverview')}</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-brand-blue rounded-full">
              {t('adminDashboard.students')}
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [val, t('adminDashboard.students')]}
                />
                <Bar dataKey="students" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">{t('adminDashboard.enrollmentTrends')}</h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full">
              {t('adminDashboard.courses')}
            </span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="displayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [val, t('adminDashboard.courses')]}
                />
                <Line
                  type="monotone"
                  dataKey="courses"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
