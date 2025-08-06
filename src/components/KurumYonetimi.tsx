import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Kurum, KurumTuru, PersonStatus } from '../../types';
import { createKurum, updateKurum, deleteKurum } from '../../services/apiService';
import { useKurumlar } from '../../hooks/useData';
import Modal from '../../components/Modal';
import { PageHeader, Table, Input, Select, Button } from '../../components/ui';

const KurumYonetimi: React.FC = () => {
    const { data: kurumlar, isLoading, error, refresh } = useKurumlar();

    const [filters, setFilters] = useState({
        searchTerm: '',
        typeFilter: 'all' as KurumTuru | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKurum, setEditingKurum] = useState<Partial<Kurum> | null>(null);

    const displayedData = useMemo(() => {
        return kurumlar.filter(kurum => {
            const matchesSearch = kurum.resmiUnvan.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  (kurum.vergiNumarasi && kurum.vergiNumarasi.includes(filters.searchTerm));
            const matchesType = filters.typeFilter === 'all' || kurum.kurumTuru === filters.typeFilter;
            return matchesSearch && matchesType;
        });
    }, [kurumlar, filters]);
    
    const handleSave = async (kurumToSave: Partial<Kurum>) => {
        const isNew = !kurumToSave.id;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                if (kurumToSave.id) {
                    await updateKurum(kurumToSave.id, kurumToSave);
                } else {
                    const payload = { 
                        ...kurumToSave,
                        kayitTarihi: new Date().toISOString(),
                        aktif: true
                    } as Omit<Kurum, 'id'>;
                    await createKurum(payload);
                }
                refresh();
                setIsModalOpen(false);
                setEditingKurum(null);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: isNew ? 'Kurum başarıyla eklendi!' : 'Kurum başarıyla güncellendi!',
            error: 'Bir hata oluştu.'
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bu kurumu silmek istediğinizden emin misiniz?')) {
            const promise = deleteKurum(parseInt(id)).then(() => refresh());
            toast.promise(promise, {
                loading: 'Siliniyor...',
                success: 'Kurum başarıyla silindi!',
                error: 'Silme işlemi başarısız.'
            });
        }
    };
    
     const columns = useMemo(() => [
        { key: 'resmiUnvan', title: 'Resmi Ünvan', render: (value: any, k: Kurum) => k.resmiUnvan },
        { key: 'kisaAd', title: 'Kısa Ad', render: (value: any, k: Kurum) => k.kisaAd || '-' },
        { key: 'kurumTuru', title: 'Tür', render: (value: any, k: Kurum) => k.kurumTuru },
        { key: 'vergiNumarasi', title: 'Vergi No', render: (value: any, k: Kurum) => k.vergiNumarasi || '-' },
        { key: 'telefon', title: 'Telefon', render: (value: any, k: Kurum) => k.telefon || '-' },
        { key: 'email', title: 'E-posta', render: (value: any, k: Kurum) => k.email || '-' },
        { key: 'durum', title: 'Durum', render: (value: any, k: Kurum) => (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                k.status === PersonStatus.AKTIF ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
                {k.status}
            </span>
        )},
        { key: 'actions', title: 'İşlemler', render: (value: any, k: Kurum) => (
            <div className="text-right space-x-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingKurum(k); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(k.id.toString())} className="text-red-600 hover:text-red-700">Sil</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Kurum Yönetimi">
                <Button onClick={() => { setEditingKurum({}); setIsModalOpen(true); }}>Yeni Kurum Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input type="text" placeholder="Kurum adı veya vergi no ile ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Türler'}, ...Object.values(KurumTuru).map(t => ({value: t, label: t}))]} />
                </div>
                <Table columns={columns} data={displayedData} />
            </div>
            {isModalOpen && (
                <KurumFormModal
                    kurum={editingKurum}
                    onClose={() => { setIsModalOpen(false); setEditingKurum(null); }}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

const KurumFormModal: React.FC<{
    kurum: Partial<Kurum> | null,
    onClose: () => void,
    onSave: (kurum: Partial<Kurum>) => void
}> = ({ kurum, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Kurum>>(kurum || { status: PersonStatus.AKTIF });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                    <Input label="Resmi Ünvan" name="resmiUnvan" value={formData.resmiUnvan || ''} onChange={handleChange} required />
                     <Input label="Kısa Ad" name="kisaAd" value={formData.kisaAd || ''} onChange={handleChange} />
                     <Select label="Kurum Türü" name="kurumTuru" value={formData.kurumTuru || ''} onChange={handleChange} options={Object.values(KurumTuru).map(t => ({value: t, label: t}))} required />
                     <Input label="Vergi Numarası" name="vergiNumarasi" value={formData.vergiNumarasi || ''} onChange={handleChange} />
                     <Input label="Telefon" name="telefon" value={formData.telefon || ''} onChange={handleChange} required />
                     <Input label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                     <Input label="Adres" name="adres" value={formData.adres || ''} onChange={handleChange} required />
                    <Select 
                        label="Durum" 
                        name="status" 
                        value={formData.status || PersonStatus.AKTIF} 
                        onChange={handleChange} 
                        options={Object.values(PersonStatus).map(s => ({value: s, label: s}))} 
                        required 
                    />
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