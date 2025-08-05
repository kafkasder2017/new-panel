import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { getPeople, getBagislar, getProjeler, getYardimBasvurulari, getFinansalKayitlar } from '../services/apiService';
import { generateAnalyticsSummary } from '../services/geminiService';
import { Person, Bagis, Proje, YardimBasvurusu, FinansalKayit, Uyruk, BasvuruStatus, FinansalIslemTuru, AnalyticsSummary } from '../types';
import { ICONS } from '../constants';

// Chart & Card components
const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>{children}</div>
    </div>
);

const AiSummaryCard: React.FC<{ onGenerate: () => void; summary: AnalyticsSummary | null; isLoading: boolean; error: string }> = ({ onGenerate, summary, isLoading, error }) => (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">AI Destekli Rapor Özeti</h3>
            <button onClick={onGenerate} disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm disabled:bg-purple-300">
                {isLoading ? (
                    <div className="w-4 h-4 border-2 border-purple-200 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <span className="w-5 h-5">{ICONS.LIGHTBULB}</span>
                )}
                <span>Özet Oluştur</span>
            </button>
        </div>
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>}
        {summary ? (
            <div className="space-y-4 text-sm">
                <p className="text-zinc-700 dark:text-zinc-300 italic">{summary.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold text-green-600 dark:text-green-400">Olumlu Gelişmeler</h4>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-600 dark:text-zinc-400">
                            {summary.positiveTrends.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-yellow-600 dark:text-yellow-400">Dikkat Edilmesi Gerekenler</h4>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-600 dark:text-zinc-400">
                            {summary.areasForAttention.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400">Aksiyon Önerileri</h4>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-zinc-600 dark:text-zinc-400">
                            {summary.actionableInsights.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        ) : !isLoading && !error && (
            <div className="text-center text-zinc-500 py-10">Raporun genel bir özetini ve içgörüleri almak için "Özet Oluştur" butonuna tıklayın.</div>
        )}
    </div>
);


const RaporlamaAnalitik: React.FC = () => {
    const [people, setPeople] = useState<Person[]>([]);
    const [applications, setApplications] = useState<YardimBasvurusu[]>([]);
    const [financials, setFinancials] = useState<FinansalKayit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [aiSummary, setAiSummary] = useState<AnalyticsSummary | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState('');

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
        const aidRecipients = people.filter(p => p.aldigiYardimTuru && p.aldigiYardimTuru.length > 0);
        
        // Nationality Data
        const nationalityCounts = aidRecipients.reduce((acc, person) => {
            person.uyruk.forEach(u => {
                acc[u] = (acc[u] || 0) + 1;
            });
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

    const handleGenerateSummary = async () => {
        setIsAiLoading(true);
        setAiError('');
        setAiSummary(null);
        try {
            const summary = await generateAnalyticsSummary({
                totalPeople: people.length,
                aidRecipientsByNationality: chartData.nationalityData,
                applicationsByStatus: chartData.applicationStatusData,
                monthlyFinancials: chartData.monthlyFinancialData,
            });
            setAiSummary(summary);
        } catch(err: any) {
            setAiError(err.message || "Özet oluşturulamadı.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
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
                <AiSummaryCard onGenerate={handleGenerateSummary} summary={aiSummary} isLoading={isAiLoading} error={aiError} />
            </div>
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
                                <Tooltip formatter={(value: number) => value.toLocaleString('tr-TR', {style:'currency', currency:'TRY'})}/>
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
