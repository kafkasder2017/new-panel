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

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<BasvuruStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<YardimTuru | 'all'>('all');

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
            setSearchTerm(decodeURIComponent(kisiAdiFromQuery));
        }
    }, [kisiAdiFromQuery]);

    const peopleMap = useMemo(() => {
        return new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`]));
    }, [people]);

    const filteredBasvurular = useMemo(() => {
        return applications.filter(basvuru => {
            const applicantName = peopleMap.get(basvuru.basvuruSahibiId) || '';
            const matchesSearch = applicantName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || basvuru.durum === statusFilter;
            const matchesType = typeFilter === 'all' || basvuru.basvuruTuru === typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [applications, searchTerm, statusFilter, typeFilter, peopleMap]);

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

        const applicant = people.find(p => p.id === application.basvuruSahibiId);
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
                
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-6">
                    <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-4">
                        <input
                            type="text"
                            placeholder="Kişi adı ile ara..."
                            className="w-full md:w-48 px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select 
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as YardimTuru | 'all')}
                        >
                            <option value="all">Tüm Yardım Türleri</option>
                            {Object.values(YardimTuru).map(tur => <option key={tur} value={tur}>{tur}</option>)}
                        </select>
                        <select 
                            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as BasvuruStatus | 'all')}
                        >
                            <option value="all">Tüm Durumlar</option>
                            {Object.values(BasvuruStatus).map(durum => <option key={durum} value={durum}>{durum}</option>)}
                        </select>
                    </div>
                </div>

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
                                const applicantName = peopleMap.get(basvuru.basvuruSahibiId) || `Bilinmeyen ID: ${basvuru.basvuruSahibiId}`;
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
