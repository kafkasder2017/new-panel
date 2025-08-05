
import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { GonderilenMesaj, GonderimTuru } from '../types';
import { getMessages } from '../services/apiService';

// --- STYLING & HELPERS ---
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#64748b'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent < 0.05) return null;
    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            {children}
        </div>
    </div>
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
     <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
    </div>
);


const MesajRaporlari: React.FC = () => {
    const [messages, setMessages] = useState<GonderilenMesaj[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await getMessages();
                setMessages(data);
            } catch (err: any) {
                setError(err.message || 'Mesaj verileri yüklenemedi.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const { stats, byTypeData, byAudienceData, monthlyTrendData } = useMemo(() => {
        const totalMessages = messages.length;
        const totalRecipients = messages.reduce((sum, msg) => sum + msg.kisiSayisi, 0);
        const smsCount = messages.filter(m => m.gonderimTuru === GonderimTuru.SMS).length;
        const emailCount = messages.filter(m => m.gonderimTuru === GonderimTuru.EPOSTA).length;

        const byType = messages.reduce((acc, m) => {
            acc[m.gonderimTuru] = (acc[m.gonderimTuru] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const byTypeData = Object.entries(byType).map(([name, value]) => ({ name, value }));
        
        const byAudience = messages.reduce((acc, m) => {
            acc[m.hedefKitle] = (acc[m.hedefKitle] || 0) + m.kisiSayisi;
            return acc;
        }, {} as Record<string, number>);
        const byAudienceData = Object.entries(byAudience).map(([name, value]) => ({ name, value }));

        const monthly = messages.reduce((acc, m) => {
            const month = new Date(m.gonderimTarihi).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const monthlyTrendData = Object.entries(monthly).map(([name, value]) => ({ name, value })).sort((a,b) => a.name.localeCompare(b.name)).slice(-12);

        return {
            stats: { totalMessages, totalRecipients, smsCount, emailCount },
            byTypeData,
            byAudienceData,
            monthlyTrendData
        };
    }, [messages]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Toplam Gönderim" value={stats.totalMessages.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>} />
                <StatCard title="Ulaşılan Kişi Sayısı" value={stats.totalRecipients.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
                <StatCard title="Gönderilen SMS" value={stats.smsCount.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>} />
                <StatCard title="Gönderilen E-posta" value={stats.emailCount.toLocaleString()} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Aylık Gönderim Trendi">
                    <ResponsiveContainer>
                        <LineChart data={monthlyTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }} />
                            <Legend />
                            <Line type="monotone" dataKey="value" name="Gönderilen Mesaj" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Gönderim Türüne Göre Dağılım">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={byTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" labelLine={false} label={renderCustomizedLabel}>
                                {byTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                 <div className="lg:col-span-2">
                    <ChartCard title="Hedef Kitleye Göre Ulaşılan Kişi Sayısı">
                        <ResponsiveContainer>
                            <BarChart data={byAudienceData} layout="vertical" margin={{ left: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={150} />
                                <Tooltip />
                                <Bar dataKey="value" name="Ulaşılan Kişi" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

export default MesajRaporlari;
