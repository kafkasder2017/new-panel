import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getPeople, getYardimBasvurulari, getFinansalKayitlar } from '../services/apiService.ts';
import { Person, YardimBasvurusu, FinansalKayit, FinansalIslemTuru } from '../types.ts';
import { ICONS } from '../constants.tsx';

// Chart & Card components
const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>{children}</div>
    </div>
);

const RaporlamaAnalitik: React.FC = () => {
    const [people, setPeople] = useState<Person[]>([]);
    const [applications, setApplications] = useState<YardimBasvurusu[]>([]);
    const [financials, setFinancials] = useState<FinansalKayit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [peopleData, appsData, financialsData] = await Promise.all([
                    getPeople(),
                    getYardimBasvurulari(),
                    getFinansalKayitlar(),
                ]);
                setPeople(peopleData);
                setApplications(appsData);
                setFinancials(financialsData);
            } catch (err: any) {
                setError(err.message || 'Rapor verileri yüklenemedi.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartData = useMemo(() => {
        const aidRecipients = people.filter(p => p.aid_type_received && p.aid_type_received.length > 0);
        
        // Nationality Data
        const nationalityCounts = aidRecipients.reduce((acc, person) => {
            if (person.nationality) {
                acc[person.nationality] = (acc[person.nationality] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);
        const nationalityData = Object.entries(nationalityCounts).map(([name, value]) => ({ name, value }));

        // Application Status Data
        const statusCounts = applications.reduce((acc, app) => {
            acc[app.durum] = (acc[app.durum] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const applicationStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
        
        // Monthly Financials
        const monthly = financials.reduce((acc, record) => {
            const month = new Date(record.tarih).toISOString().slice(0, 7);
            if (!acc[month]) acc[month] = { name: month, income: 0, expense: 0 };
            if (record.tur === FinansalIslemTuru.GELIR) {
                acc[month].income += record.tutar;
            } else {
                acc[month].expense += record.tutar;
            }
            return acc;
        }, {} as Record<string, {name: string, income: number, expense: number}>);
        const monthlyFinancialData = Object.values(monthly).sort((a,b) => a.name.localeCompare(b.name)).slice(-12);

        return {
            nationalityData,
            applicationStatusData,
            monthlyFinancialData,
        };
    }, [people, applications, financials]);
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Yardım Başvurularının Durumu">
                    <ResponsiveContainer>
                        <BarChart data={chartData.applicationStatusData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" name="Başvuru Sayısı" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Yardım Alanların Uyruk Dağılımı">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={chartData.nationalityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {chartData.nationalityData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <div className="lg:col-span-2">
                    <ChartCard title="Aylık Finansal Akış (Son 12 Ay)">
                         <ResponsiveContainer>
                            <LineChart data={chartData.monthlyFinancialData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `${Number(value) / 1000}k`} />
                                <Tooltip formatter={(value: number) => (value ?? 0).toLocaleString('tr-TR', {style:'currency', currency:'TRY'})}/>
                                <Legend />
                                <Line type="monotone" dataKey="income" name="Gelir" stroke="#10b981" strokeWidth={2} />
                                <Line type="monotone" dataKey="expense" name="Gider" stroke="#ef4444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
};

export default RaporlamaAnalitik;