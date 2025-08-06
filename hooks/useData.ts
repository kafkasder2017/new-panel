

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import {
    DashboardStats, RecentActivity, Person, Proje, YardimBasvurusu, Bagis, ProjeStatus, BasvuruStatus, MembershipType, FinansalKayit, Kumbara, DepoUrunu, VefaDestek, OgrenciBursu, Yetim, Dava, Kullanici, Kurum, Gonullu, Odeme, AyniYardimIslemi, Hizmet, HastaneSevk, DenetimKaydi
} from '../types';
import {
    getPeople, getProjeler, getYardimBasvurulari, getBagislar,
} from '../services/apiService';

// This is the generic hook factory that should have been created in the previous steps.
export function useSupabaseQuery<T extends { id: any }>(tableName: string, options: { realtime?: boolean } = {}) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        // This is for manual refresh, so we can show loading state.
        setIsLoading(true); 
        setError(null);
        
        const { data: fetchedData, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .order('id', { ascending: false });

        if (fetchError) {
            console.error(`Error fetching ${tableName}:`, fetchError);
            setError(`Veri yüklenemedi: ${fetchError.message}`);
        } else {
            setData(fetchedData as T[]);
        }
        setIsLoading(false);
    }, [tableName]);

    useEffect(() => {
        // Initial fetch
        supabase
            .from(tableName)
            .select('*')
            .order('id', { ascending: false })
            .then(({ data: initialData, error: initialError }) => {
                if (initialError) {
                    console.error(`Error fetching initial ${tableName}:`, initialError);
                    setError(`Veri yüklenemedi: ${initialError.message}`);
                } else {
                    setData(initialData as T[]);
                }
                setIsLoading(false);
            });

        if (!options.realtime) {
            return;
        }
        
        const channel = supabase.channel(`public:${tableName}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
                const { eventType, new: newRecord, old: oldRecord } = payload;
                
                if (eventType === 'INSERT') {
                    setData(currentData => [newRecord as T, ...currentData.filter(item => item.id !== newRecord.id)]);
                }
                if (eventType === 'UPDATE') {
                    setData(currentData => currentData.map(item => item.id === newRecord.id ? newRecord as T : item));
                }
                if (eventType === 'DELETE') {
                    const oldId = (oldRecord as any).id;
                    setData(currentData => currentData.filter(item => item.id !== oldId));
                }
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                  console.log(`Subscribed to ${tableName}!`);
                }
                if (status === 'CHANNEL_ERROR') {
                   console.error(`Failed to subscribe to ${tableName}:`, err);
                   setError(`Gerçek zamanlı bağlantı hatası: ${err?.message}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, options.realtime]);

    return { data, isLoading, error, refresh: fetchData };
}

// Exported hooks for each module
export const usePeople = () => useSupabaseQuery<Person>('people', { realtime: true });
export const useProjects = () => useSupabaseQuery<Proje>('projects');
export const useApplications = () => {
    const { data: applications, isLoading: isLoadingApps, error: errorApps, refresh: refreshApps } = useSupabaseQuery<YardimBasvurusu>('aid_applications');
    const { data: people, isLoading: isLoadingPeople, error: errorPeople, refresh: refreshPeople } = useSupabaseQuery<Person>('people');
    
    return {
        data: { applications, people },
        isLoading: isLoadingApps || isLoadingPeople,
        error: errorApps || errorPeople,
        refresh: () => { refreshApps(); refreshPeople(); }
    };
};
export const useCases = () => useSupabaseQuery<Dava>('davalar');
export const useScholarships = () => useSupabaseQuery<OgrenciBursu>('ogrenci_burslari');
export const useOrphans = () => useSupabaseQuery<Yetim>('yetimler');
export const useFinancialRecords = () => {
    const { data: records, isLoading: isLoadingRecords, error: errorRecords, refresh: refreshRecords } = useSupabaseQuery<FinansalKayit>('finansal_kayitlar');
    const { data: projects, isLoading: isLoadingProjects, error: errorProjects, refresh: refreshProjects } = useSupabaseQuery<Proje>('projects');
    return {
        data: { records, projects },
        isLoading: isLoadingRecords || isLoadingProjects,
        error: errorRecords || errorProjects,
        refresh: () => { refreshRecords(); refreshProjects(); }
    };
};
export const usePayments = () => useSupabaseQuery<Odeme>('odemeler');
export const usePiggyBanks = () => useSupabaseQuery<Kumbara>('kumbaralar');
export const useStockItems = () => useSupabaseQuery<DepoUrunu>('depo_urunleri');
export const useVefaSupport = () => useSupabaseQuery<VefaDestek>('vefa_destek');
export const useKurumYonetimi = () => {
    const { data: kurumlar, ...rest } = useSupabaseQuery<Kurum>('kurumlar');
    const { data: people } = useSupabaseQuery<Person>('people');
    return { data: { kurumlar, people }, ...rest };
};
export const useUyeYonetimi = () => {
    const { data: people, ...rest } = useSupabaseQuery<Person>('people');
    const uyeler = people.filter(p => p.membershipType && p.membershipType !== MembershipType.GONULLU);
    return { data: uyeler, ...rest };
};
export const useGonulluYonetimi = () => {
    const { data: gonulluler, ...rest } = useSupabaseQuery<Gonullu>('gonulluler');
    const { data: people } = useSupabaseQuery<Person>('people');
    return { data: { gonulluler, people }, ...rest };
};
export const useKullaniciYonetimi = () => useSupabaseQuery<Kullanici>('kullanicilar');
export const useAyniYardimIslemleri = () => {
    const { data: islemler, ...rest } = useSupabaseQuery<AyniYardimIslemi>('ayni_yardim_islemleri');
    const { data: people } = useSupabaseQuery<Person>('people');
    const { data: products } = useSupabaseQuery<DepoUrunu>('depo_urunleri');
    return { data: { islemler, people, products }, ...rest };
};
export const useBagisYonetimi = () => {
    const { data: donations, ...rest } = useSupabaseQuery<Bagis>('donations');
    const { data: people } = useSupabaseQuery<Person>('people');
    const { data: projects } = useSupabaseQuery<Proje>('projects');
    return { data: { donations, people, projects }, ...rest };
};
export const useDenetimKayitlari = () => useSupabaseQuery<DenetimKaydi>('denetim_kayitlari');
export const useHizmetTakip = () => {
    const { data: hizmetler, ...rest } = useSupabaseQuery<Hizmet>('hizmetler');
    const { data: people } = useSupabaseQuery<Person>('people');
    return { data: { hizmetler, people }, ...rest };
};
export const useHastaneSevk = () => {
    const { data: sevkler, ...rest } = useSupabaseQuery<HastaneSevk>('hastane_sevkler');
    const { data: people } = useSupabaseQuery<Person>('people');
    return { data: { sevkler, people }, ...rest };
};


// Custom hook for Dashboard data
export const useDashboardData = () => {
    const [data, setData] = useState({
        stats: { totalMembers: 0, monthlyDonations: 0, activeProjects: 0, pendingApplications: 0 } as DashboardStats,
        recentActivities: [] as RecentActivity[],
        monthlyDonationData: [] as any[],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const [people, projects, applications, donations] = await Promise.all([
                getPeople(),
                getProjeler(),
                getYardimBasvurulari(),
                getBagislar(),
            ]);

            // Calculate Stats
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const totalMembers = people.filter(p => p.membershipType && p.membershipType !== MembershipType.GONULLU).length;
            const monthlyDonations = donations
                .filter(d => new Date(d.tarih) >= startOfMonth)
                .reduce((sum, d) => sum + d.tutar, 0);
            const activeProjects = projects.filter(p => p.status === ProjeStatus.DEVAM_EDIYOR).length;
            const pendingApplications = applications.filter(a => a.durum === BasvuruStatus.BEKLEYEN || a.durum === BasvuruStatus.INCELENEN).length;
            
            const newStats = { totalMembers, monthlyDonations, activeProjects, pendingApplications };

            // Recent Activities
            const sortedDonations = [...donations].sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).slice(0, 2);
            const sortedPeople = [...people].sort((a, b) => new Date(b.kayitTarihi).getTime() - new Date(a.kayitTarihi).getTime()).slice(0, 2);
            const sortedApplications = [...applications].sort((a, b) => new Date(b.basvuruTarihi).getTime() - new Date(a.basvuruTarihi).getTime()).slice(0, 2);
            
            const peopleMap = new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`]));

            const activities: RecentActivity[] = [
                ...sortedDonations.map(d => ({
                    id: `donation-${d.id}`, type: 'donation' as 'donation', timestamp: d.tarih,
                    description: `${peopleMap.get(d.bagisciId) || 'Bilinmeyen kişi'} <strong>bağış yaptı.</strong>`,
                    amount: d.tutar.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }),
                    link: '/bagis-yonetimi/tum-bagislar',
                })),
                ...sortedPeople.map(p => ({
                    id: `person-${p.id}`, type: 'person' as 'person', timestamp: p.kayitTarihi,
                    description: `${p.ad} ${p.soyad} için <strong>Yeni kişi kaydı:</strong>`,
                    link: `/kisiler/${p.id}`,
                })),
                ...sortedApplications.map(a => ({
                    id: `application-${a.id}`, type: 'application' as 'application', timestamp: a.basvuruTarihi,
                    description: `${peopleMap.get(a.basvuruSahibiId) || 'Bilinmeyen kişi'} <strong>yeni bir başvuru yaptı.</strong>`,
                    link: `/yardimlar/${a.id}`,
                })),
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
            
            // Monthly Donation Chart Data
            const monthlyDonationsAgg = donations.reduce((acc, d) => {
                const month = d.tarih.slice(0, 7); // YYYY-MM
                acc[month] = (acc[month] || 0) + d.tutar;
                return acc;
            }, {} as Record<string, number>);

            const chartData = Object.entries(monthlyDonationsAgg)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(-6); // Last 6 months
            
            setData({ stats: newStats, recentActivities: activities, monthlyDonationData: chartData });
            
        } catch (err: any) {
            setError(err.message || 'Dashboard verileri yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refresh: fetchData };
};