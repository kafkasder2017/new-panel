import React, { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Person, PersonStatus, MembershipType, Aidat, AidatDurumu } from '../types';
import { getAidatlarByUyeId, createAidat, updateAidat } from '../services/apiService';
import { useUyeYonetimi } from '../hooks/useData';
import Modal from './Modal';
import { PageHeader, Table, Input, Select, Button } from './ui';

const getStatusClass = (status: PersonStatus) => {
    switch (status) {
        case PersonStatus.AKTIF: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case PersonStatus.PASIF: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case PersonStatus.BEKLEMEDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const UyeYonetimi: React.FC = () => {
    const { data: uyeler, isLoading, error } = useUyeYonetimi();
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as PersonStatus | 'all',
        typeFilter: 'all' as MembershipType | 'all',
    });

    const [selectedUye, setSelectedUye] = useState<Person | null>(null);

    const filteredUyeler = useMemo(() => {
        return uyeler.filter(uye => {
            const fullName = `${uye.ad} ${uye.soyad}`.toLowerCase();
            const matchesSearch = fullName.includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || uye.durum === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || uye.membershipType === filters.typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [uyeler, filters]);
    
    const columns = useMemo(() => [
        { key: 'adSoyad', title: 'Ad Soyad', render: (value: any, u: Person) => `${u.ad} ${u.soyad}` },
        { key: 'membershipType', title: 'Üyelik Tipi', render: (value: any, u: Person) => u.membershipType },
        { key: 'kayitTarihi', title: 'Kayıt Tarihi', render: (value: any, u: Person) => new Date(u.kayitTarihi).toLocaleDateString('tr-TR')},
        { key: 'durum', title: 'Durum', render: (value: any, u: Person) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(u.durum)}`}>{u.durum}</span>},
        { key: 'actions', title: 'İşlemler', render: (value: any, u: Person) => (
            <div className="text-right">
                <Button variant="ghost" size="sm" onClick={() => setSelectedUye(u)}>Aidat Takibi</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Üye Yönetimi" />
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Üye adı ile ara..." value={filters.searchTerm} onChange={e => setFilters(f=>({...f, searchTerm: e.target.value}))}/>
                    <Select value={filters.typeFilter} onChange={e => setFilters(f=>({...f, typeFilter: e.target.value as any}))} options={[
                        {value: 'all', label: 'Tüm Üyelik Tipleri'},
                        {value: MembershipType.STANDART, label: 'Standart'},
                        {value: MembershipType.ONURSAL, label: 'Onursal'},
                    ]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f=>({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(PersonStatus).map(s => ({value:s, label: s}))]} />
                </div>
                <Table columns={columns} data={filteredUyeler} />
            </div>
            {selectedUye && (
                <AidatTakipModal
                    uye={selectedUye}
                    onClose={() => setSelectedUye(null)}
                />
            )}
        </>
    );
};


const AidatTakipModal: React.FC<{ uye: Person; onClose: () => void; }> = ({ uye, onClose }) => {
    const [aidatlar, setAidatlar] = useState<Aidat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [newAidat, setNewAidat] = useState<{ donem: string; tutar: string }>({ donem: `${new Date().getFullYear()}-01`, tutar: '100' });
    
    const fetchAidatlar = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getAidatlarByUyeId(uye.id);
            setAidatlar(data);
        } catch (err: any) {
            if (err.message && err.message.includes('relation "public.aidatlar" does not exist')) {
                setError("Aidat takip modülü şu anda aktif değil. Lütfen sistem yöneticinizle iletişime geçin. (Veritabanı hatası: 'aidatlar' tablosu bulunamadı)");
            } else {
                setError(err.message || 'Aidat bilgileri yüklenemedi.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [uye.id]);
    
    useEffect(() => {
        fetchAidatlar();
    }, [fetchAidatlar]);

    const handleMarkAsPaid = async (aidat: Aidat) => {
        const promise = updateAidat(aidat.id, { durum: AidatDurumu.ODENDI, odemeTarihi: new Date().toISOString().split('T')[0] });
        toast.promise(promise, {
            loading: 'İşaretleniyor...',
            success: () => {
                fetchAidatlar();
                return 'Aidat ödendi olarak işaretlendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleCreateAidat = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Omit<Aidat, 'id'> = {
            uyeId: uye.id,
            donem: new Date(newAidat.donem).toLocaleString('tr-TR', { month: 'long', year: 'numeric' }),
            tutar: parseFloat(newAidat.tutar),
            durum: AidatDurumu.BEKLEMEDE,
        };
        const promise = createAidat(payload);
        toast.promise(promise, {
            loading: 'Oluşturuluyor...',
            success: () => {
                fetchAidatlar();
                setNewAidat({ donem: `${new Date().getFullYear()}-01`, tutar: '100' });
                return 'Yeni aidat başarıyla oluşturuldu!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`${uye.ad} ${uye.soyad} - Aidat Takibi`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">Aidat Geçmişi</h4>
                    {isLoading && <p>Yükleniyor...</p>}
                    {error && <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}
                    <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                    {!isLoading && !error && aidatlar.map(aidat => (
                        <div key={aidat.id} className="p-3 bg-zinc-100 dark:bg-zinc-700/50 rounded-md">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-zinc-700 dark:text-zinc-200">{aidat.donem}</p>
                                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{aidat.tutar.toLocaleString('tr-TR', {style:'currency', currency: 'TRY'})}</p>
                                </div>
                                {aidat.durum === AidatDurumu.ODENDI ? (
                                    <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">ÖDENDİ</span>
                                ) : (
                                    <button onClick={() => handleMarkAsPaid(aidat)} className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-bold px-2 py-1 rounded-full hover:bg-yellow-200">ÖDENDİ İŞARETLE</button>
                                )}
                            </div>
                        </div>
                    ))}
                    {!isLoading && !error && aidatlar.length === 0 && <p className="text-sm text-zinc-500">Aidat kaydı bulunamadı.</p>}
                    </div>
                </div>
                <form onSubmit={handleCreateAidat} className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg self-start">
                    <fieldset disabled={!!error}>
                        <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">Yeni Aidat Oluştur</h4>
                        <Input label="Dönem" type="month" value={newAidat.donem} onChange={e => setNewAidat(p => ({...p, donem: e.target.value}))} required />
                        <Input label="Tutar (TL)" type="number" step="0.01" value={newAidat.tutar} onChange={e => setNewAidat(p => ({...p, tutar: e.target.value}))} required />
                        <Button type="submit" disabled={!!error} className="w-full mt-2">Oluştur</Button>
                    </fieldset>
                </form>
            </div>
             <div className="pt-4 mt-4 border-t flex justify-end">
                <Button type="button" variant="outline" onClick={onClose}>Kapat</Button>
            </div>
        </Modal>
    );
};

export default UyeYonetimi;