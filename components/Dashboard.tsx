
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import * as ReactRouterDOM from 'react-router-dom';
import { DashboardStats, RecentActivity } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { useDashboardData } from '../hooks/useData.ts';
import { StatCard, StatCardSkeleton, ChartSkeleton, ActivityListSkeleton } from './ui';

const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dakika önce";
    return "az önce";
};

const SafeActivityDescription: React.FC<{ description: string }> = ({ description }) => {
    // This regex looks for <strong> tags and captures their content.
    const strongTagRegex = /<strong>(.*?)<\/strong>/;
    const match = description.match(strongTagRegex);

    if (match && match.index !== undefined) {
        const actionText = match[1]; // The text inside the <strong> tag
        const prefixText = description.substring(0, match.index); // The text before it (the name)
        const suffixText = description.substring(match.index + match[0].length); // Any text after it

        return (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-white">
                {prefixText}
                <strong>{actionText}</strong>
                {suffixText}
            </p>
        );
    }
    
    // Fallback for any descriptions that don't match the pattern. Render safely.
    return (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-white">
            {description}
        </p>
    );
};

const RecentActivityList: React.FC<{ activities: RecentActivity[] }> = ({ activities }) => {
    const activityIcons = {
        donation: <div className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 p-2 rounded-full">{React.cloneElement(ICONS.DONATION, { strokeWidth: 2 })}</div>,
        person: <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 p-2 rounded-full">{React.cloneElement(ICONS.PEOPLE, { strokeWidth: 2 })}</div>,
        application: <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 p-2 rounded-full">{React.cloneElement(ICONS.AID_RECIPIENT, { strokeWidth: 2 })}</div>,
    };
    
    if (activities.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 h-full flex items-center justify-center">
                <p className="text-zinc-500 dark:text-zinc-400">Son aktivite bulunmuyor.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Son Aktiviteler</h3>
            <ul className="space-y-4">
                {activities.map(activity => (
                    <li key={activity.id}>
                        <ReactRouterDOM.Link to={activity.link} className="flex items-center space-x-4 group">
                            <div className="flex-shrink-0">
                                {activityIcons[activity.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <SafeActivityDescription description={activity.description} />
                                {activity.amount && <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{activity.amount}</p>}
                            </div>
                            <time className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">{timeSince(activity.timestamp)}</time>
                        </ReactRouterDOM.Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const MonthlyDonationsChart: React.FC<{ data: any[] }> = ({ data }) => {
    return (
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Aylık Bağış Grafiği</h3>
            <div className="h-72">
                {data.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="text-zinc-400 dark:text-zinc-500 mb-2">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-zinc-500 dark:text-zinc-400">Henüz bağış verisi bulunmuyor.</p>
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
                            <XAxis dataKey="name" stroke="currentColor" className="text-xs" />
                            <YAxis stroke="currentColor" className="text-xs" tickFormatter={(value) => `${Number(value) / 1000}k`} />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '0.5rem',
                                }}
                                formatter={(value: number) => [value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }), 'Toplam Bağış']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="value" name="Bağış" stroke="#0A84FF" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};


const Dashboard = () => {
    const { data, isLoading, error, refresh } = useDashboardData();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ChartSkeleton height={288} />
                    </div>
                    <div>
                        <ActivityListSkeleton items={5} />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="text-red-600 dark:text-red-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Veri Yüklenemedi</h3>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button 
                        onClick={refresh}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    const { stats } = data;

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Toplam Üye Sayısı" 
                    value={stats.totalMembers} 
                    icon={ICONS.PEOPLE} 
                    color="primary"
                />
                <StatCard 
                    title="Bu Ayki Bağışlar" 
                    value={stats.monthlyDonations.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} 
                    icon={ICONS.DONATION} 
                    color="success"
                />
                <StatCard 
                    title="Aktif Projeler" 
                    value={stats.activeProjects} 
                    icon={ICONS.CLIPBOARD_DOCUMENT_LIST} 
                    color="primary"
                />
                <StatCard 
                    title="Bekleyen Başvurular" 
                    value={stats.pendingApplications} 
                    icon={ICONS.AID_RECIPIENT} 
                    color="warning"
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <MonthlyDonationsChart data={data.monthlyDonationData} />
                </div>
                <div className="space-y-6">
                    <RecentActivityList activities={data.recentActivities} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;