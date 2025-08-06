import React, { useState, useMemo } from 'react';
import { Kurum, Person, KurumTuru, PersonStatus } from '../types';
import { createKurum, updateKurum, deleteKurum } from '../services/apiService';
import { useKurumYonetimi } from '../hooks/useData';
import toast from 'react-hot-toast';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: PersonStatus) => {
    switch (status) {
        case PersonStatus.AKTIF: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case PersonStatus.PASIF: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case PersonStatus.BEKLEMEDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const KurumYonetimi: React.FC = () => {
    const { data, isLoading, error, refresh } = useKurumYonetimi();
    const { kurumlar, people } = data;

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as PersonStatus | 'all',
        typeFilter: 'all' as KurumTuru | 'all',
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKurum, setEditingKurum] = useState<Partial<Kurum> | null>(null);

    const peopleMap = useMemo(() => new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`])), [people]);

    const filteredKurumlar = useMemo(() => {
        return kurumlar.filter(kurum => {
            const lowerSearch = filters.searchTerm.toLowerCase();
            const matchesSearch = (kurum.resmiUnvan || '').toLowerCase().includes(lowerSearch) ||
                (kurum.kisaAd && kurum.kisaAd.toLowerCase().includes(lowerSearch)) ||
                (kurum.vergiNumarasi && kurum.vergiNumarasi.includes(lowerSearch));
            const matchesStatus = filters.statusFilter === 'all' || kurum.status === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || kurum.kurumTuru === filters.typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [kurumlar, filters]);

    const handleSave = async (kurumToSave: Partial<Kurum>) => {
        const isNew = !kurumToSave.id;
        const promise = isNew 
            ? createKurum({ ...kurumToSave, kayitTarihi: new Date().toISOString().split('T')[0] } as Omit<Kurum, 'id'>)
            : updateKurum(kurumToSave.id!, kurumToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingKurum(null);
                return isNew ? 'Kurum başarıyla eklendi!' : 'Kurum başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm('Bu kurumu silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteKurum(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Kurum başarıyla silindi!';
                },
                error: 'Silme işlemi sırasında bir hata oluştu.',
            });
        }
    };
    
    const columns = useMemo(() => [
        { key: 'name', title: 'Kurum Ünvanı', render: (k: Kurum) => k.resmiUnvan },
        { key: 'type', title: 'Kurum Türü', render: (k: Kurum) => k.kurumTuru },
        { key: 'contact', title: 'Yetkili Kişi', render: (k: Kurum) => k.yetkiliKisiId ? peopleMap.get(k.yetkiliKisiId.toString()) : '-' },
        { key: 'phone', title: 'Telefon', render: (k: Kurum) => k.telefon },
        { key: 'status', title: 'Durum', render: (k: Kurum) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(k.status)}`}>{k.status}</span> },
        { key: 'actions', title: 'İşlemler', render: (k: Kurum) => (
             <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingKurum(k); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => handleDeleteClick(k.id)}>Sil</Button>
            </div>
        )}
    ], [peopleMap]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Kurum Yönetimi">
                <Button onClick={() => { setEditingKurum({}); setIsModalOpen(true); }}>Yeni Kurum Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Kurum adı veya vergi no ile ara..." value={filters.searchTerm} onChange={e => setFilters(f=>({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f=>({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Kurum Türleri'}, ...Object.values(KurumTuru).map(t => ({value:t, label: t}))]}/>
                    <Select value={filters.statusFilter} onChange={e => setFilters(f=>({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(PersonStatus).map(s => ({value:s, label: s}))]}/>
                </div>

                <Table columns={columns} data={filteredKurumlar} />
            </div>

            {isModalOpen && (
                <KurumFormModal
                    kurum={editingKurum}
                    people={people}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

interface KurumFormModalProps {
    kurum: Partial<Kurum> | null;
    people: Person[];
    onClose: () => void;
    onSave: (kurum: Partial<Kurum>) => void;
}

const KurumFormModal: React.FC<KurumFormModalProps> = ({ kurum, people, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Kurum>>(kurum || {});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNew = !kurum?.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Kurum Ekle' : 'Kurum Bilgilerini Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Input label="Resmi Ünvan" name="resmiUnvan" value={formData.resmiUnvan || ''} onChange={handleChange} required />
                    </div>
                    <div className="md:col-span-2">
                        <Input label="Kısa Ad" name="kisaAd" value={formData.kisaAd || ''} onChange={handleChange} />
                    </div>
                    <Select label="Kurum Türü" name="kurumTuru" value={formData.kurumTuru || ''} onChange={handleChange} options={Object.values(KurumTuru).map(t => ({value: t, label: t}))} required />
                    <Select label="Durum" name="status" value={formData.status || ''} onChange={handleChange} options={Object.values(PersonStatus).map(s => ({value: s, label: s}))} required />
                    <Input label="Vergi Dairesi" name="vergiDairesi" value={formData.vergiDairesi || ''} onChange={handleChange} />
                    <Input label="Vergi Numarası" name="vergiNumarasi" value={formData.vergiNumarasi || ''} onChange={handleChange} />
                    <Input label="Telefon" type="tel" name="telefon" value={formData.telefon || ''} onChange={handleChange} required />
                    <Input label="E-posta" type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                    <div className="md:col-span-2">
                        <Textarea label="Adres" name="adres" value={formData.adres || ''} onChange={handleChange} rows={2} required />
                    </div>
                    <div className="md:col-span-2">
                        <Select label="Yetkili Kişi" name="yetkiliKisiId" value={formData.yetkiliKisiId || ''} onChange={e => setFormData(p => ({...p, yetkiliKisiId: Number(e.target.value) || undefined}))} options={[{value: '', label: 'Yok'}, ...people.map(p => ({value: p.id, label: `${p.ad} ${p.soyad}`}))]} />
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

export default KurumYonetimi;