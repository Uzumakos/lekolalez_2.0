import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, BookOpen, Award, TrendingUp } from 'lucide-react';
import { StatCardProps } from '../types';

const data = [
  { name: 'Mon', students: 400, courses: 240 },
  { name: 'Tue', students: 300, courses: 139 },
  { name: 'Wed', students: 200, courses: 980 },
  { name: 'Thu', students: 278, courses: 390 },
  { name: 'Fri', students: 189, courses: 480 },
  { name: 'Sat', students: 239, courses: 380 },
  { name: 'Sun', students: 349, courses: 430 },
];

const StatCard: React.FC<StatCardProps> = ({ title, value, change, isPositive, icon }) => (
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
    {change && (
      <div className={`mt-4 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} flex items-center`}>
        <span>{isPositive ? '+' : ''}{change}</span>
        <span className="text-gray-400 ml-1">from last month</span>
      </div>
    )}
  </div>
);

export const DashboardStats: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value="2,543" change="12.5%" isPositive={true} icon={<Users size={20} />} />
        <StatCard title="Active Courses" value="45" change="4.2%" isPositive={true} icon={<BookOpen size={20} />} />
        <StatCard title="Course Completion" value="84%" change="-2.1%" isPositive={false} icon={<Award size={20} />} />
        <StatCard title="Revenue" value="$12,450" change="8.4%" isPositive={true} icon={<TrendingUp size={20} />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Bar dataKey="students" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Enrollment Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="courses" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
