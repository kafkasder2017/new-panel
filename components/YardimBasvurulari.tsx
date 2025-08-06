import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { YardimBasvurusu, BasvuruStatus, YardimTuru, BasvuruOncelik, Person } from '../types.ts';
import Modal from './Modal.tsx';
import { getPeople, getYardimBasvurulari, createYardimBasvurusu, updateYardimBasvurusu, deleteYardimBasvurusu, createOdeme } from '../services/apiService.ts';
import { OdemeTuru, OdemeYontemi, OdemeDurumu } from '../types.ts';
import { usePDFGenerator } from '../src/hooks/usePDFGenerator';
import { useExcelUtils } from '../src/hooks/useExcelUtils';
import SearchableSelect from './SearchableSelect.tsx';
import AdvancedFilter from '../src/components/AdvancedFilter';
import SmartSearch from '../src/components/SmartSearch';


const getStatusClass = (status: BasvuruStatus) => {
    switch (status) {
        case BasvuruStatus.BEKLEYEN: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case BasvuruStatus.INCELENEN: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case BasvuruStatus.ONAYLANAN: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        case BasvuruStatus.REDDEDILEN: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case BasvuruStatus.BASKAN_REDDETTI: return 'bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-200';
        case BasvuruStatus.TAMAMLANAN: return 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const getPriorityClass = (priority: BasvuruOncelik) => {
    switch(priority) {
        case BasvuruOncelik.YUKSEK: return 'text-red-600 dark:text-red-400 font-semibold';
        case BasvuruOncelik.ORTA: return 'text-yellow-600 dark:text-yellow-400 font-semibold';
        case BasvuruOncelik.DUSUK: return 'text-green-600 dark:text-green-400 font-semibold';
        default: return 'text-zinc-600 dark:text-zinc-400';
    }
};

const YardimBasvurulari: React.FC = () => {
    const [applications, setApplications] = useState<YardimBasvurusu[]>([]);
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { generateAidApplicationReport, isGenerating } = usePDFGenerator();
    const { 
        exportAidApplications, 
        isExporting 
    } = useExcelUtils();

    const [searchParams] = ReactRouterDOM.useSearchParams();
    const kisiAdiFromQuery = searchParams.get('kisiAdi');

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as BasvuruStatus | 'all',
        typeFilter: 'all' as YardimTuru | 'all',
        priorityFilter: 'all' as BasvuruOncelik | 'all',
        amountMin: '',
        amountMax: '',
        applicationDateFrom: '',
        applicationDateTo: '',
        multipleStatusFilter: [] as BasvuruStatus[],
        multipleTypeFilter: [] as YardimTuru[],
        hasPresidentApproval: 'all' as 'all' | 'yes' | 'no',
        hasPayment: 'all' as 'all' | 'yes' | 'no',
    });
    
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [currentViewName, setCurrentViewName] = useState('');
    const [showSaveViewModal, setShowSaveViewModal] = useState(false);
    
    interface SavedView {
        id: string;
        name: string;
        filters: any;
        createdAt: string;
    }

    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingBasvuru, setEditingBasvuru] = useState<Partial<YardimBasvurusu> | null>(null);
    const [evaluatingBasvuru, setEvaluatingBasvuru] = useState<YardimBasvurusu | null>(null);
    
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [appsData, peopleData] = await Promise.all([getYardimBasvurulari(), getPeople()]);
            setApplications(appsData);
            setPeople(peopleData);
            setError('');
        } catch (err: any) {
            setError(err.message || 'Veri yüklenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    useEffect(() => {
        if (kisiAdiFromQuery) {
            setFilters(prev => ({ ...prev, searchTerm: decodeURIComponent(kisiAdiFromQuery) }));
        }
    }, [kisiAdiFromQuery]);

    const peopleMap = useMemo(() => {
        return new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`]));
    }, [people]);

    const filteredBasvurular = useMemo(() => {
        return applications.filter(basvuru => {
            const applicantName = peopleMap.get(basvuru.basvuruSahibiId.toString()) || '';
            
            // Temel arama
            const matchesSearch = filters.searchTerm === '' || 
                applicantName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                basvuru.talepDetayi?.toLowerCase().includes(filters.searchTerm.toLowerCase());
            
            // Durum filtreleri
            const matchesStatus = filters.statusFilter === 'all' || basvuru.durum === filters.statusFilter;
            const matchesMultipleStatus = filters.multipleStatusFilter.length === 0 || 
                filters.multipleStatusFilter.includes(basvuru.durum);
            
            // Tür filtreleri
            const matchesType = filters.typeFilter === 'all' || basvuru.basvuruTuru === filters.typeFilter;
            const matchesMultipleType = filters.multipleTypeFilter.length === 0 || 
                filters.multipleTypeFilter.includes(basvuru.basvuruTuru);
            
            // Öncelik filtresi
            const matchesPriority = filters.priorityFilter === 'all' || basvuru.oncelik === filters.priorityFilter;
            
            // Tutar aralığı filtresi
            let matchesAmountRange = true;
            if (filters.amountMin && basvuru.talepTutari < parseFloat(filters.amountMin)) {
                matchesAmountRange = false;
            }
            if (filters.amountMax && basvuru.talepTutari > parseFloat(filters.amountMax)) {
                matchesAmountRange = false;
            }
            
            // Başvuru tarihi aralığı filtresi
            let matchesApplicationDate = true;
            if (filters.applicationDateFrom || filters.applicationDateTo) {
                const applicationDate = new Date(basvuru.basvuruTarihi);
                
                if (filters.applicationDateFrom) {
                    const fromDate = new Date(filters.applicationDateFrom);
                    if (applicationDate < fromDate) {
                        matchesApplicationDate = false;
                    }
                }
                if (filters.applicationDateTo) {
                    const toDate = new Date(filters.applicationDateTo);
                    toDate.setHours(23, 59, 59, 999);
                    if (applicationDate > toDate) {
                        matchesApplicationDate = false;
                    }
                }
            }
            
            // Başkan onayı filtresi
            let matchesPresidentApproval = true;
            if (filters.hasPresidentApproval === 'yes') {
                matchesPresidentApproval = basvuru.baskanOnayi === true;
            } else if (filters.hasPresidentApproval === 'no') {
                matchesPresidentApproval = basvuru.baskanOnayi !== true;
            }
            
            // Ödeme filtresi
            let matchesPayment = true;
            if (filters.hasPayment === 'yes') {
                matchesPayment = !!basvuru.odemeId;
            } else if (filters.hasPayment === 'no') {
                matchesPayment = !basvuru.odemeId;
            }
            
            return matchesSearch && matchesStatus && matchesMultipleStatus && 
                   matchesType && matchesMultipleType && matchesPriority && 
                   matchesAmountRange && matchesApplicationDate && 
                   matchesPresidentApproval && matchesPayment;
        });
    }, [applications, filters, peopleMap]);

    const handleSaveEvaluation = async (updatedBasvuru: YardimBasvurusu) => {
        try {
            const saved = await updateYardimBasvurusu(updatedBasvuru.id, updatedBasvuru);
            setApplications(applications.map(b => b.id === saved.id ? saved : b));
            setIsEvalModalOpen(false);
            setEvaluatingBasvuru(null);
            toast.success('Değerlendirme başarıyla kaydedildi.');
        } catch (err) {
            toast.error('Değerlendirme kaydedilirken bir hata oluştu.');
        }
    };

    const handleSaveBasvuru = async (basvuruData: Partial<YardimBasvurusu>) => {
        const isNew = !basvuruData.id;
        try {
            if (basvuruData.id) {
                const updated = await updateYardimBasvurusu(basvuruData.id, basvuruData);
                setApplications(applications.map(b => b.id === updated.id ? updated : b));
            } else {
                const newBasvuruData = { 
                    ...basvuruData,
                    basvuruTarihi: new Date().toISOString().split('T')[0],
                    durum: BasvuruStatus.BEKLEYEN,
                }
                const created = await createYardimBasvurusu(newBasvuruData as Omit<YardimBasvurusu, 'id'>);
                setApplications([created, ...applications]);
            }
            setIsFormModalOpen(false);
            setEditingBasvuru(null);
            toast.success(isNew ? 'Başvuru başarıyla oluşturuldu.' : 'Başvuru başarıyla güncellendi.');
        } catch(err) {
            toast.error('Başvuru kaydedilirken bir hata oluştu.');
        }
    };
    
    const handleCreatePayment = async (application: YardimBasvurusu) => {
        if (application.durum !== BasvuruStatus.ONAYLANAN || !application.baskanOnayi || application.odemeId) {
            toast.error("Bu başvuru için ödeme oluşturulamaz. Durum 'Onaylanan' olmalı, başkan onayı alınmış olmalı ve daha önce ödeme oluşturulmamış olmalıdır.");
            return;
        }

        const applicant = people.find(p => p.id === application.basvuruSahibiId.toString());
        if (!applicant) {
            toast.error("Başvuru sahibi sistemde bulunamadı. Lütfen kontrol edin.");
            return;
        }
        
        try {
            const newPayment = await createOdeme({
                odemeTuru: OdemeTuru.YARDIM_ODEMESI,
                kisi: `${applicant.ad} ${applicant.soyad}`,
                tutar: application.talepTutari,
                paraBirimi: 'TRY',
                aciklama: `Yardım Başvurusu #${application.id} - ${application.basvuruTuru}`,
                odemeYontemi: OdemeYontemi.BANKA_TRANSFERI,
                odemeTarihi: new Date().toISOString().split('T')[0],
                durum: OdemeDurumu.TAMAMLANAN,
            });

            const updatedApp = await updateYardimBasvurusu(application.id, { durum: BasvuruStatus.TAMAMLANAN, odemeId: newPayment.id });
            setApplications(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app));
            toast.success(`Ödeme kaydı oluşturuldu ve başvuru durumu "Tamamlandı" olarak güncellendi.`);
        } catch(err) {
             toast.error('Ödeme oluşturulurken bir hata oluştu.');
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMultipleFilterChange = (filterName: 'multipleStatusFilter' | 'multipleTypeFilter', value: BasvuruStatus | YardimTuru) => {
        setFilters(prev => {
            const currentValues = prev[filterName] as any[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterName]: newValues };
        });
    };
    
    const clearAllFilters = () => {
        setFilters({
            searchTerm: '',
            statusFilter: 'all',
            typeFilter: 'all',
            priorityFilter: 'all',
            amountMin: '',
            amountMax: '',
            applicationDateFrom: '',
            applicationDateTo: '',
            multipleStatusFilter: [],
            multipleTypeFilter: [],
            hasPresidentApproval: 'all',
            hasPayment: 'all',
        });
    };
    
    const saveCurrentView = () => {
        if (!currentViewName.trim()) {
            toast.error('Lütfen görünüm adı girin');
            return;
        }
        
        const newView: SavedView = {
            id: Date.now().toString(),
            name: currentViewName,
            filters: { ...filters },
            createdAt: new Date().toISOString()
        };
        
        setSavedViews(prev => [...prev, newView]);
        setCurrentViewName('');
        setShowSaveViewModal(false);
        toast.success('Görünüm kaydedildi!');
    };
    
    const loadSavedView = (view: SavedView) => {
        setFilters(view.filters);
        toast.success(`"${view.name}" görünümü yüklendi`);
    };
    
    const deleteSavedView = (viewId: string) => {
        setSavedViews(prev => prev.filter(v => v.id !== viewId));
        toast.success('Görünüm silindi');
    };
    
    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.searchTerm) count++;
        if (filters.statusFilter !== 'all') count++;
        if (filters.typeFilter !== 'all') count++;
        if (filters.priorityFilter !== 'all') count++;
        if (filters.amountMin || filters.amountMax) count++;
        if (filters.applicationDateFrom || filters.applicationDateTo) count++;
        if (filters.multipleStatusFilter.length > 0) count++;
        if (filters.multipleTypeFilter.length > 0) count++;
        if (filters.hasPresidentApproval !== 'all') count++;
        if (filters.hasPayment !== 'all') count++;
        return count;
    };

    const handleExportExcel = () => {
        exportAidApplications(filteredBasvurular);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    return (
        <>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-4">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Yardım Başvuruları</h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleExportExcel} 
                            disabled={isExporting || filteredBasvurular.length === 0}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span>{isExporting ? 'Dışa Aktarılıyor...' : 'Excel\'e Aktar'}</span>
                        </button>
                        <button 
                            onClick={() => generateAidApplicationReport(filteredBasvurular)} 
                            disabled={isGenerating || filteredBasvurular.length === 0}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <span>{isGenerating ? 'PDF Oluşturuluyor...' : 'PDF Rapor'}</span>
                        </button>
                        <button onClick={() => setIsFormModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                            <span>Yeni Başvuru Ekle</span>
                        </button>
                    </div>
                </div>
                
                {/* Akıllı Arama */}
                <div className="mb-4">
                    <SmartSearch
                        placeholder="Başvuru ara..."
                        onSearch={(searchTerm) => setFilters(prev => ({ ...prev, searchTerm }))}
                    />
                </div>

                {/* Temel Filtreler */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            name="searchTerm"
                            placeholder="Kişi adı, talep detayı..."
                            className="w-full px-3 py-2 pl-10 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
                            value={filters.searchTerm}
                            onChange={handleFilterChange}
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <select 
                        name="statusFilter"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
                        value={filters.statusFilter}
                        onChange={handleFilterChange}
                    >
                        <option value="all">Tüm Durumlar</option>
                        {Object.values(BasvuruStatus).map(durum => <option key={durum} value={durum}>{durum}</option>)}
                    </select>
                    <select 
                        name="typeFilter"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
                        value={filters.typeFilter}
                        onChange={handleFilterChange}
                    >
                        <option value="all">Tüm Yardım Türleri</option>
                        {Object.values(YardimTuru).map(tur => <option key={tur} value={tur}>{tur}</option>)}
                    </select>
                    <select 
                        name="priorityFilter"
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
                        value={filters.priorityFilter}
                        onChange={handleFilterChange}
                    >
                        <option value="all">Tüm Öncelikler</option>
                        {Object.values(BasvuruOncelik).map(priority => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                </div>
                
                {/* Filtre Kontrolleri */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                            </svg>
                            Gelişmiş Filtreler
                            {showAdvancedFilters ? 
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg> :
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            }
                        </button>
                        
                        {getActiveFilterCount() > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                    {getActiveFilterCount()} filtre aktif
                                </span>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                                >
                                    Temizle
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {savedViews.length > 0 && (
                            <div className="flex items-center gap-2">
                                <select 
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const view = savedViews.find(v => v.id === e.target.value);
                                            if (view) loadSavedView(view);
                                        }
                                    }}
                                    className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
                                    value=""
                                >
                                    <option value="">Kayıtlı Görünümler</option>
                                    {savedViews.map(view => (
                                        <option key={view.id} value={view.id}>{view.name}</option>
                                    ))}
                                </select>
                                <div className="relative group">
                                    <button
                                        onClick={() => {
                                            const viewId = prompt('Silinecek görünümün ID\'sini girin:');
                                            if (viewId) deleteSavedView(viewId);
                                        }}
                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                        title="Görünüm Sil"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setShowSaveViewModal(true)}
                            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
                        >
                            Görünümü Kaydet
                        </button>
                    </div>
                </div>
                
                {/* Gelişmiş Filtreler */}
                {showAdvancedFilters && (
                    <AdvancedFilter
                        filters={filters}
                        onFiltersChange={setFilters}
                        filterOptions={[
                            { key: 'status', label: 'Durum', type: 'select', options: [
                                { value: 'beklemede', label: 'Beklemede' },
                                { value: 'onaylandi', label: 'Onaylandı' },
                                { value: 'reddedildi', label: 'Reddedildi' }
                            ]},
                            { key: 'yardimTuru', label: 'Yardım Türü', type: 'select', options: [
                                { value: 'gida', label: 'Gıda' },
                                { value: 'giyim', label: 'Giyim' },
                                { value: 'nakit', label: 'Nakit' },
                                { value: 'egitim', label: 'Eğitim' }
                            ]},
                            { key: 'basvuruTarihi', label: 'Başvuru Tarihi', type: 'dateRange' }
                        ]}
                    />
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                        <thead className="text-xs text-zinc-700 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-semibold">Kişi</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Talep Tutarı</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Öncelik</th>
                                <th scope="col" className="px-6 py-4 font-semibold">İşlem Durumu</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {filteredBasvurular.map((basvuru) => {
                                const applicantName = peopleMap.get(basvuru.basvuruSahibiId.toString()) || `Bilinmeyen ID: ${basvuru.basvuruSahibiId}`;
                                return (
                                <tr key={basvuru.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{applicantName}</div>
                                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{basvuru.basvuruTuru}</div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300">{basvuru.talepTutari.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
                                    <td className="px-6 py-4">
                                        <span className={getPriorityClass(basvuru.oncelik)}>{basvuru.oncelik}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(basvuru.durum)}`}>
                                                {basvuru.durum}
                                            </span>
                                            {basvuru.durum === BasvuruStatus.ONAYLANAN && !basvuru.baskanOnayi && (
                                                <span className="text-xs text-purple-700 dark:text-purple-400 mt-1">Başkan Onayı Bekliyor</span>
                                            )}
                                            {basvuru.durum === BasvuruStatus.ONAYLANAN && basvuru.baskanOnayi && !basvuru.odemeId && (
                                                <span className="text-xs text-green-700 dark:text-green-400 mt-1">Ödeme Bekliyor</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-4">
                                            <ReactRouterDOM.Link to={`/yardimlar/${basvuru.id}`} className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 font-semibold">Detay</ReactRouterDOM.Link>
                                            
                                            {basvuru.durum === BasvuruStatus.ONAYLANAN && basvuru.baskanOnayi && !basvuru.odemeId ? (
                                                <button 
                                                    onClick={() => handleCreatePayment(basvuru)} 
                                                    className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold hover:bg-green-200 dark:hover:bg-green-900"
                                                >
                                                    Ödeme Oluştur
                                                </button>
                                            ) : basvuru.odemeId ? (
                                                <span className="text-xs text-green-700 dark:text-green-400 font-medium flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                                    Ödeme Yapıldı
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => {setEvaluatingBasvuru(basvuru); setIsEvalModalOpen(true);}} 
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold disabled:text-zinc-400 disabled:cursor-not-allowed"
                                                    disabled={basvuru.durum === BasvuruStatus.TAMAMLANAN || basvuru.durum === BasvuruStatus.BASKAN_REDDETTI}
                                                >
                                                    Değerlendir
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
                 {filteredBasvurular.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                        <p>Arama kriterlerine uygun başvuru bulunamadı.</p>
                    </div>
                )}
            </div>
            {isEvalModalOpen && evaluatingBasvuru && (
                <EvaluationModal
                    basvuru={evaluatingBasvuru}
                    onClose={() => { setIsEvalModalOpen(false); setEvaluatingBasvuru(null); }}
                    onSave={handleSaveEvaluation}
                />
            )}
            {isFormModalOpen && (
                <BasvuruFormModal
                    basvuru={editingBasvuru!}
                    people={people}
                    onClose={() => { setIsFormModalOpen(false); setEditingBasvuru(null); }}
                    onSave={handleSaveBasvuru}
                />
            )}

            {/* Görünüm Kaydetme Modalı */}
            {showSaveViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Görünümü Kaydet</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Görünüm Adı
                                </label>
                                <input
                                     type="text"
                                     value={currentViewName}
                                     onChange={(e) => setCurrentViewName(e.target.value)}
                                     placeholder="Örn: Acil Başvurular"
                                     className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
                                 />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowSaveViewModal(false);
                                        setCurrentViewName('');
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={saveCurrentView}
                                    disabled={!currentViewName.trim()}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};


const BasvuruFormModal: React.FC<{ basvuru: Partial<YardimBasvurusu>, people: Person[], onClose: () => void, onSave: (basvuru: Partial<YardimBasvurusu>) => void }> = ({ basvuru, people, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<YardimBasvurusu>>(basvuru);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'talepTutari' ? parseFloat(value) : value }));
    };

    const handlePersonSelect = (personId: number | string) => {
        setFormData(prev => ({ ...prev, basvuruSahibiId: personId as number }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNew = !basvuru.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Yardım Başvurusu Ekle' : 'Başvuru Bilgilerini Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Kişi</label>
                        <SearchableSelect<Person>
                            options={people}
                            value={formData.basvuruSahibiId || null}
                            onChange={handlePersonSelect}
                            getOptionValue={(p) => p.id}
                            getOptionLabel={(p) => `${p.ad} ${p.soyad} (${p.kimlikNo})`}
                            placeholder="Kişi arayın veya seçin..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Yardım Türü</label>
                        <select name="basvuruTuru" value={formData.basvuruTuru || ''} onChange={handleChange} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm p-2 bg-white dark:bg-zinc-700" required>
                            <option value="" disabled>Seçiniz...</option>
                            {Object.values(YardimTuru).map(tur => <option key={tur} value={tur}>{tur}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Talep Tutarı (TL)</label>
                        <input type="number" step="0.01" name="talepTutari" value={formData.talepTutari || ''} onChange={handleChange} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm p-2 bg-zinc-50 dark:bg-zinc-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Öncelik</label>
                        <select name="oncelik" value={formData.oncelik || ''} onChange={handleChange} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm p-2 bg-white dark:bg-zinc-700" required>
                             <option value="" disabled>Seçiniz...</option>
                            {Object.values(BasvuruOncelik).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Talep Detayı</label>
                        <textarea name="talepDetayi" value={formData.talepDetayi || ''} onChange={handleChange} rows={4} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-sm p-2 bg-zinc-50 dark:bg-zinc-700" placeholder="Başvuranın talebiyle ilgili detayları buraya yazın..." required />
                    </div>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                </div>
            </form>
        </Modal>
    );
};

const EvaluationModal: React.FC<{ basvuru: YardimBasvurusu, onClose: () => void, onSave: (basvuru: YardimBasvurusu) => void }> = ({ basvuru, onClose, onSave }) => {
    const [formData, setFormData] = useState<YardimBasvurusu>(basvuru);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Başvuruyu Değerlendir">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-x-4">
                       <p><strong>Kişi ID:</strong> {basvuru.basvuruSahibiId}</p>
                       <p><strong>Başvuru Türü:</strong> {basvuru.basvuruTuru}</p>
                       <p><strong>Talep Tutarı:</strong> <span className="font-semibold">{basvuru.talepTutari.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></p>
                       <p><strong>Öncelik:</strong> <span className={getPriorityClass(basvuru.oncelik)}>{basvuru.oncelik}</span></p>
                    </div>
                     <div className="border-t border-zinc-200 dark:border-zinc-600 pt-2 mt-2">
                         <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Talep Detayı:</p>
                         <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">{basvuru.talepDetayi}</p>
                     </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Başvuru Durumu</label>
                    <select name="durum" value={formData.durum} onChange={handleChange} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm p-2 bg-white dark:bg-zinc-700" required>
                        {[BasvuruStatus.BEKLEYEN, BasvuruStatus.INCELENEN, BasvuruStatus.ONAYLANAN, BasvuruStatus.REDDEDILEN].map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Değerlendirme Notu</label>
                    <textarea name="degerlendirmeNotu" value={formData.degerlendirmeNotu || ''} onChange={handleChange} rows={4} className="mt-1 block w-full border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm p-2 bg-zinc-50 dark:bg-zinc-700" placeholder="Değerlendirme ile ilgili notlarınızı buraya yazın..."></textarea>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">İptal</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                </div>
            </form>
        </Modal>
    );
};


export default YardimBasvurulari;
