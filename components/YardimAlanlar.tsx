import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Person, PersonStatus, Uyruk, YardimTuruDetay, DosyaBaglantisi, KimlikTuru, SponsorlukTipi, RizaBeyaniStatus } from '../types';
import { createPerson, updatePerson, deletePerson } from '../services/apiService';
import { usePeople } from '../hooks/useData';
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

const YardimAlanlar: React.FC = () => {
    const { data: people, isLoading, error, refresh } = usePeople();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as PersonStatus | 'all',
        nationalityFilter: 'all' as Uyruk | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlan, setEditingAlan] = useState<Partial<Person> | null>(null);

    const yardimAlanlar = useMemo(() => {
        return people.filter(p => p.aldigiYardimTuru && p.aldigiYardimTuru.length > 0);
    }, [people]);

    const displayedData = useMemo(() => {
        return yardimAlanlar.filter(alan => {
            const matchesSearch = `${alan.ad} ${alan.soyad}`.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  alan.kimlikNo.includes(filters.searchTerm);
            const matchesStatus = filters.statusFilter === 'all' || alan.durum === filters.statusFilter;
            const matchesNationality = filters.nationalityFilter === 'all' || alan.uyruk.includes(filters.nationalityFilter as Uyruk);
            return matchesSearch && matchesStatus && matchesNationality;
        });
    }, [yardimAlanlar, filters]);
    
    const handleSave = async (alanToSave: Partial<Person>) => {
        const isNew = !alanToSave.id;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                if (alanToSave.id) {
                    await updatePerson(alanToSave.id, alanToSave);
                } else {
                    const payload = { 
                        ...alanToSave,
                        kayitTarihi: new Date().toISOString(),
                        kaydiAcanBirim: "Panel",
                        dosyaBaglantisi: DosyaBaglantisi.DERNEK,
                        isKaydiSil: false,
                        uyruk: alanToSave.uyruk || [Uyruk.TC],
                        kimlikTuru: alanToSave.kimlikTuru || KimlikTuru.TC,
                        dogumTarihi: alanToSave.dogumTarihi || '1900-01-01',
                        ulke: alanToSave.ulke || 'Türkiye',
                        sehir: alanToSave.sehir || '',
                        yerlesim: alanToSave.yerlesim || '',
                        mahalle: alanToSave.mahalle || '',
                        dosyaNumarasi: alanToSave.dosyaNumarasi || `DN${Date.now()}`,
                        sponsorlukTipi: alanToSave.sponsorlukTipi || SponsorlukTipi.YOK,
                        kayitDurumu: alanToSave.kayitDurumu || 'Kaydedildi',
                        rizaBeyani: alanToSave.rizaBeyani || RizaBeyaniStatus.ALINDI
                    } as Omit<Person, 'id'>;
                    await createPerson(payload);
                }
                refresh();
                setIsModalOpen(false);
                setEditingAlan(null);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: isNew ? 'Kayıt başarıyla eklendi!' : 'Kayıt başarıyla güncellendi!',
            error: 'Bir hata oluştu.'
        });
    };
    
     const columns = useMemo(() => [
        { key: 'adSoyad', title: 'Ad Soyad', render: (value: any, u: Person) => `${u.ad} ${u.soyad}` },
        { key: 'kimlikNo', title: 'Kimlik No', render: (value: any, u: Person) => u.kimlikNo },
        { key: 'uyruk', title: 'Uyruk', render: (value: any, u: Person) => u.uyruk.join(', ') },
        { key: 'sehir', title: 'Şehir', render: (value: any, u: Person) => u.sehir },
        { key: 'durum', title: 'Durum', render: (value: any, u: Person) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(u.durum)}`}>{u.durum}</span>},
        { key: 'actions', title: 'İşlemler', render: (value: any, u: Person) => (
            <div className="text-right">
                <Button variant="ghost" size="sm" onClick={() => { setEditingAlan(u); setIsModalOpen(true); }}>Düzenle</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Yardım Alanlar Listesi">
                <Button onClick={() => { setEditingAlan({}); setIsModalOpen(true); }}>Yeni Kayıt Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Ad, Soyad veya Kimlik No ile ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.nationalityFilter} onChange={e => setFilters(f => ({...f, nationalityFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Uyruklar'}, ...Object.values(Uyruk).map(u => ({value: u, label: u}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(PersonStatus).map(s => ({value: s, label: s}))]} />
                </div>
                <Table columns={columns} data={displayedData} />
            </div>
            {isModalOpen && (
                <YardimAlanFormModal
                    alan={editingAlan}
                    onClose={() => { setIsModalOpen(false); setEditingAlan(null); }}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

const YardimAlanFormModal: React.FC<{
    alan: Partial<Person> | null,
    onClose: () => void,
    onSave: (alan: Partial<Person>) => void
}> = ({ alan, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Person>>(alan || { aldigiYardimTuru: [], uyruk: [] });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleYardimTuruChange = (tur: YardimTuruDetay) => {
        setFormData(prev => {
            const currentTuru = prev.aldigiYardimTuru || [];
            const newTuru = currentTuru.includes(tur)
                ? currentTuru.filter(t => t !== tur)
                : [...currentTuru, tur];
            return { ...prev, aldigiYardimTuru: newTuru };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const isNew = !alan?.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Yardım Alan Ekle' : 'Yardım Alan Bilgilerini Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Ad" name="ad" value={formData.ad || ''} onChange={handleChange} required />
                    <Input label="Soyad" name="soyad" value={formData.soyad || ''} onChange={handleChange} required />
                    <Input label="Kimlik No" name="kimlikNo" value={formData.kimlikNo || ''} onChange={handleChange} required />
                    <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={Object.values(PersonStatus).map(s => ({value:s, label: s}))} required/>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Aldığı Yardım Türleri</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.values(YardimTuruDetay).map(tur => (
                                <label key={tur} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer text-sm ${formData.aldigiYardimTuru?.includes(tur) ? 'bg-blue-100 border-blue-300' : 'border-slate-200'}`}>
                                    <input type="checkbox" checked={formData.aldigiYardimTuru?.includes(tur)} onChange={() => handleYardimTuruChange(tur)} className="rounded"/>
                                    <span>{tur}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default YardimAlanlar;