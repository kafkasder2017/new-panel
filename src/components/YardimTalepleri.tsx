import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { YardimTalebi, YardimDurumu, YardimTuruDetay, OncelikSeviyesi } from '../../types';
import { createYardimTalebi, updateYardimTalebi, deleteYardimTalebi } from '../../services/apiService';
import { useYardimTalepleri } from '../../hooks/useData';
import Modal from '../../components/Modal';
import { PageHeader, Table, Input, Select, Button, Textarea } from '../../components/ui';

const getStatusClass = (durum: YardimDurumu) => {
    switch (durum) {
        case YardimDurumu.BEKLEMEDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case YardimDurumu.INCELEMEDE: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case YardimDurumu.ONAYLANDI: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case YardimDurumu.REDDEDILDI: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case YardimDurumu.TAMAMLANDI: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const getPriorityClass = (oncelik: OncelikSeviyesi) => {
    switch (oncelik) {
        case OncelikSeviyesi.ACIL: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case OncelikSeviyesi.YUKSEK: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
        case OncelikSeviyesi.ORTA: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case OncelikSeviyesi.DUSUK: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const YardimTalepleri: React.FC = () => {
    const { data: talepler, isLoading, error, refresh } = useYardimTalepleri();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as YardimDurumu | 'all',
        typeFilter: 'all' as YardimTuruDetay | 'all',
        priorityFilter: 'all' as OncelikSeviyesi | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTalep, setEditingTalep] = useState<Partial<YardimTalebi> | null>(null);

    const displayedData = useMemo(() => {
        return talepler.filter(talep => {
            const matchesSearch = talep.baslik.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  talep.aciklama.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || talep.durum === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || talep.yardimTuru === filters.typeFilter;
            const matchesPriority = filters.priorityFilter === 'all' || talep.oncelikSeviyesi === filters.priorityFilter;
            return matchesSearch && matchesStatus && matchesType && matchesPriority;
        });
    }, [talepler, filters]);
    
    const handleSave = async (talepToSave: Partial<YardimTalebi>) => {
        const isNew = !talepToSave.id;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                if (talepToSave.id) {
                    await updateYardimTalebi(talepToSave.id, talepToSave);
                } else {
                    const payload = { 
                        ...talepToSave,
                        olusturmaTarihi: new Date().toISOString(),
                        durum: talepToSave.durum || YardimDurumu.BEKLEMEDE
                    } as Omit<YardimTalebi, 'id'>;
                    await createYardimTalebi(payload);
                }
                refresh();
                setIsModalOpen(false);
                setEditingTalep(null);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: isNew ? 'Yardım talebi başarıyla eklendi!' : 'Yardım talebi başarıyla güncellendi!',
            error: 'Bir hata oluştu.'
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu yardım talebini silmek istediğinizden emin misiniz?')) return;
        
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                await deleteYardimTalebi(id);
                refresh();
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        
        toast.promise(promise, {
            loading: 'Siliniyor...',
            success: 'Yardım talebi başarıyla silindi!',
            error: 'Bir hata oluştu.'
        });
    };
    
     const columns = useMemo(() => [
        { key: 'baslik', title: 'Başlık', render: (value: any, t: YardimTalebi) => t.baslik },
        { key: 'yardimTuru', title: 'Yardım Türü', render: (value: any, t: YardimTalebi) => t.yardimTuru },
        { key: 'oncelikSeviyesi', title: 'Öncelik', render: (value: any, t: YardimTalebi) => (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getPriorityClass(t.oncelikSeviyesi)}`}>
                {t.oncelikSeviyesi}
            </span>
        )},
        { key: 'durum', title: 'Durum', render: (value: any, t: YardimTalebi) => (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(t.durum)}`}>
                {t.durum}
            </span>
        )},
        { key: 'olusturmaTarihi', title: 'Oluşturma Tarihi', render: (value: any, t: YardimTalebi) => 
            new Date(t.olusturmaTarihi).toLocaleDateString('tr-TR')
        },
        { key: 'actions', title: 'İşlemler', render: (value: any, t: YardimTalebi) => (
            <div className="text-right space-x-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingTalep(t); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-700">Sil</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Yardım Talepleri">
                <Button onClick={() => { setEditingTalep({}); setIsModalOpen(true); }}>Yeni Talep Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Input type="text" placeholder="Başlık veya açıklama ile ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Türler'}, ...Object.values(YardimTuruDetay).map(t => ({value: t, label: t}))]} />
                    <Select value={filters.priorityFilter} onChange={e => setFilters(f => ({...f, priorityFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Öncelikler'}, ...Object.values(OncelikSeviyesi).map(p => ({value: p, label: p}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(YardimDurumu).map(s => ({value: s, label: s}))]} />
                </div>
                <Table columns={columns} data={displayedData} />
            </div>
            {isModalOpen && (
                <YardimTalebiFormModal
                    talep={editingTalep}
                    onClose={() => { setIsModalOpen(false); setEditingTalep(null); }}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

const YardimTalebiFormModal: React.FC<{
    talep: Partial<YardimTalebi> | null,
    onClose: () => void,
    onSave: (talep: Partial<YardimTalebi>) => void
}> = ({ talep, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<YardimTalebi>>(talep || { durum: YardimDurumu.BEKLEMEDE });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const isNew = !talep?.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Yardım Talebi Ekle' : 'Yardım Talebi Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Başlık" name="baslik" value={formData.baslik || ''} onChange={handleChange} required />
                    <Select label="Yardım Türü" name="yardimTuru" value={formData.yardimTuru || ''} onChange={handleChange} options={Object.values(YardimTuruDetay).map(t => ({value: t, label: t}))} required />
                    <Select label="Öncelik Seviyesi" name="oncelikSeviyesi" value={formData.oncelikSeviyesi || ''} onChange={handleChange} options={Object.values(OncelikSeviyesi).map(p => ({value: p, label: p}))} required />
                    <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={Object.values(YardimDurumu).map(d => ({value: d, label: d}))} required />
                    <Input label="Talep Eden Kişi ID" name="talepEdenKisiId" value={formData.talepEdenKisiId || ''} onChange={handleChange} />
                    <Input label="Hedef Miktar" name="hedefMiktar" type="number" value={formData.hedefMiktar || ''} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                    <Textarea label="Açıklama" name="aciklama" value={formData.aciklama || ''} onChange={handleChange} rows={4} required />
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default YardimTalepleri;