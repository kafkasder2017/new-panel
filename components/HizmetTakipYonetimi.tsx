import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Hizmet, Person, HizmetTuru, HizmetDurumu } from '../types';
import { createHizmet, updateHizmet, deleteHizmet } from '../services/apiService';
import { useHizmetTakip } from '../hooks/useData';
import Modal from './Modal';
import { PageHeader, Table, Input, Select, Button, Textarea } from './ui';

const getStatusClass = (status: HizmetDurumu) => {
    switch (status) {
        case HizmetDurumu.TAMAMLANDI: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case HizmetDurumu.PLANLANDI: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case HizmetDurumu.IPTAL_EDILDI: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const HizmetTakipYonetimi: React.FC = () => {
    const { data, isLoading, error, refresh } = useHizmetTakip();
    const { hizmetler, people } = data;

    const [filters, setFilters] = useState({ searchTerm: '', statusFilter: 'all' as HizmetDurumu | 'all', typeFilter: 'all' as HizmetTuru | 'all' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHizmet, setEditingHizmet] = useState<Partial<Hizmet> | null>(null);

    const peopleMap = useMemo(() => new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`])), [people]);
    
    const filteredHizmetler = useMemo(() => {
        return hizmetler.filter(hizmet => {
            const kisiAdi = peopleMap.get(String(hizmet.kisiId))?.toLowerCase() || '';
            const matchesSearch = kisiAdi.includes(filters.searchTerm.toLowerCase()) || 
                                  (hizmet.hizmetVeren || '').toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || hizmet.durum === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || hizmet.hizmetTuru === filters.typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [hizmetler, peopleMap, filters]);
    
    const handleSaveHizmet = async (hizmetToSave: Partial<Hizmet>) => {
        const isNew = !hizmetToSave.id;
        const promise = isNew 
            ? createHizmet(hizmetToSave as Omit<Hizmet, 'id'>)
            : updateHizmet(hizmetToSave.id!, hizmetToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingHizmet(null);
                return isNew ? 'Hizmet başarıyla eklendi!' : 'Hizmet başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleDeleteClick = (id: number) => {
        if(window.confirm('Bu hizmet kaydını silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteHizmet(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Hizmet kaydı başarıyla silindi!';
                },
                error: 'Bir hata oluştu.',
            });
        }
    };
    
    const columns = useMemo(() => [
        { key: 'kisiId', title: 'Hizmet Alan Kişi', render: (h: Hizmet) => peopleMap.get(String(h.kisiId)) || 'Bilinmeyen Kişi' },
        { key: 'hizmetTuru', title: 'Hizmet Türü / Veren', render: (h: Hizmet) => <div><div>{h.hizmetTuru}</div><div className="text-xs text-zinc-500">{h.hizmetVeren}</div></div> },
        { key: 'tarih', title: 'Tarih', render: (h: Hizmet) => new Date(h.tarih).toLocaleDateString('tr-TR')},
        { key: 'durum', title: 'Durum', render: (h: Hizmet) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(h.durum)}`}>{h.durum}</span> },
        { key: 'actions', title: 'İşlemler', render: (h: Hizmet) => (
            <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingHizmet(h); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(h.id)}>Sil</Button>
            </div>
        )}
    ], [peopleMap]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Hizmet Takip İşlemleri">
                <Button onClick={() => { setEditingHizmet({ durum: HizmetDurumu.PLANLANDI, tarih: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}>Yeni Hizmet Kaydı</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Kişi veya hizmet veren ara..." value={filters.searchTerm} onChange={e => setFilters(f=>({...f, searchTerm: e.target.value}))}/>
                    <Select value={filters.typeFilter} onChange={e => setFilters(f=>({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Hizmet Türleri'}, ...Object.values(HizmetTuru).map(tur => ({value: tur, label: tur}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f=>({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(HizmetDurumu).map(durum => ({value: durum, label: durum}))]} />
                </div>
                <Table columns={columns} data={filteredHizmetler} />
            </div>
            {isModalOpen && editingHizmet && (
                <HizmetFormModal 
                    hizmet={editingHizmet} 
                    people={people}
                    onClose={() => { setIsModalOpen(false); setEditingHizmet(null); }}
                    onSave={handleSaveHizmet}
                />
            )}
        </>
    );
};


const HizmetFormModal: React.FC<{ 
    hizmet: Partial<Hizmet>;
    people: Person[];
    onClose: () => void; 
    onSave: (hizmet: Partial<Hizmet>) => void; 
}> = ({ hizmet, people, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Hizmet>>(hizmet);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNew = !hizmet.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? "Yeni Hizmet Kaydı" : "Hizmet Kaydını Düzenle"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Select label="Hizmet Alan Kişi" name="kisiId" value={formData.kisiId || ''} onChange={handleChange} options={[{value: '', label: 'Kişi Seçin...'}, ...people.map(p => ({value: p.id, label: `${p.ad} ${p.soyad}`}))]} required/></div>
                    <Select label="Hizmet Türü" name="hizmetTuru" value={formData.hizmetTuru || ''} onChange={handleChange} options={[{value: '', label: 'Seçiniz...'}, ...Object.values(HizmetTuru).map(tur => ({value: tur, label: tur}))]} required />
                    <Input label="Hizmeti Veren" name="hizmetVeren" value={formData.hizmetVeren || ''} onChange={handleChange} placeholder="örn. Gönüllü Avukat Ahmet Y." required />
                    <Input label="Tarih" type="date" name="tarih" value={formData.tarih || ''} onChange={handleChange} required />
                    <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={[{value: '', label: 'Seçiniz...'}, ...Object.values(HizmetDurumu).map(durum => ({value: durum, label: durum}))]} required />
                    <div className="md:col-span-2"><Textarea label="Açıklama" name="aciklama" value={formData.aciklama || ''} onChange={handleChange} rows={3} placeholder="Verilen hizmetin detayı..." /></div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default HizmetTakipYonetimi;