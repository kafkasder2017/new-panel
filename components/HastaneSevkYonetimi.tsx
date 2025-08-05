import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { HastaneSevk, Person, SevkDurumu } from '../types';
import { createHastaneSevk, updateHastaneSevk, deleteHastaneSevk } from '../services/apiService';
import { useHastaneSevk } from '../hooks/useData';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal';

const getStatusClass = (status: SevkDurumu) => {
    switch (status) {
        case SevkDurumu.GIDILDI: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case SevkDurumu.PLANLANDI: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case SevkDurumu.RANDEVU_ALINDI: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case SevkDurumu.IPTAL_EDILDI: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const HastaneSevkYonetimi: React.FC = () => {
    const { data, isLoading, error, refresh } = useHastaneSevk();
    const { sevkler, people } = data;

    const [filters, setFilters] = useState({ searchTerm: '', statusFilter: 'all' as SevkDurumu | 'all' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSevk, setEditingSevk] = useState<Partial<HastaneSevk> | null>(null);

    const peopleMap = useMemo(() => new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`])), [people]);
    
    const filteredSevkler = useMemo(() => {
        return sevkler.filter(sevk => {
            const kisiAdi = peopleMap.get(sevk.kisiId)?.toLowerCase() || '';
            const matchesSearch = kisiAdi.includes(filters.searchTerm.toLowerCase()) || 
                                  sevk.hastaneAdi.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  sevk.bolum.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || sevk.durum === filters.statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [sevkler, peopleMap, filters]);
    
    const handleSaveSevk = async (sevkToSave: Partial<HastaneSevk>) => {
        const isNew = !sevkToSave.id;
        const promise = isNew 
            ? createHastaneSevk(sevkToSave as Omit<HastaneSevk, 'id'>)
            : updateHastaneSevk(sevkToSave.id!, sevkToSave);
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingSevk(null);
                return isNew ? 'Sevk başarıyla eklendi!' : 'Sevk başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleDeleteClick = (id: number) => {
        if(window.confirm('Bu sevk kaydını silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteHastaneSevk(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Sevk kaydı başarıyla silindi!';
                },
                error: 'Bir hata oluştu.',
            });
        }
    };
    
    const columns = useMemo(() => [
        { key: 'kisiId', title: 'Sevk Edilen Kişi', render: (s: HastaneSevk) => peopleMap.get(s.kisiId) || 'Bilinmeyen Kişi' },
        { key: 'hastaneAdi', title: 'Hastane / Bölüm', render: (s: HastaneSevk) => <div><div>{s.hastaneAdi}</div><div className="text-xs text-zinc-500">{s.bolum}</div></div> },
        { key: 'randevuTarihi', title: 'Randevu Tarihi', render: (s: HastaneSevk) => s.randevuTarihi ? new Date(s.randevuTarihi).toLocaleDateString('tr-TR') : 'Belirtilmemiş' },
        { key: 'durum', title: 'Durum', render: (s: HastaneSevk) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(s.durum)}`}>{s.durum}</span> },
        { key: 'actions', title: 'İşlemler', render: (s: HastaneSevk) => (
            <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingSevk(s); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(s.id)}>Sil</Button>
            </div>
        )}
    ], [peopleMap]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Hastane Sevk İşlemleri">
                <Button onClick={() => { setEditingSevk({ durum: SevkDurumu.PLANLANDI, sevkTarihi: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}>Yeni Sevk Kaydı</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input type="text" placeholder="Kişi, hastane veya bölüm ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(SevkDurumu).map(d => ({value:d, label:d}))]}/>
                </div>
                <Table columns={columns} data={filteredSevkler} />
            </div>
            {isModalOpen && editingSevk && (
                <SevkFormModal 
                    sevk={editingSevk} 
                    people={people}
                    onClose={() => { setIsModalOpen(false); setEditingSevk(null); }}
                    onSave={handleSaveSevk}
                />
            )}
        </>
    );
};


const SevkFormModal: React.FC<{ 
    sevk: Partial<HastaneSevk>;
    people: Person[];
    onClose: () => void; 
    onSave: (sevk: Partial<HastaneSevk>) => void; 
}> = ({ sevk, people, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<HastaneSevk>>(sevk);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'maliyet' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNew = !sevk.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? "Yeni Hastane Sevk Kaydı" : "Sevk Kaydını Düzenle"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Select label="Sevk Edilen Kişi" name="kisiId" value={formData.kisiId || ''} onChange={handleChange} options={[{value: '', label: 'Kişi Seçin...'}, ...people.map(p => ({value: p.id, label: `${p.ad} ${p.soyad}`}))]} required/></div>
                    <Input label="Hastane Adı" name="hastaneAdi" value={formData.hastaneAdi || ''} onChange={handleChange} required />
                    <Input label="Bölüm" name="bolum" value={formData.bolum || ''} onChange={handleChange} placeholder="örn. Kardiyoloji" required />
                    <Input label="Doktor Adı (İsteğe bağlı)" name="doktorAdi" value={formData.doktorAdi || ''} onChange={handleChange} />
                    <Input label="Randevu Tarihi (İsteğe bağlı)" type="date" name="randevuTarihi" value={formData.randevuTarihi || ''} onChange={handleChange} />
                    <div className="md:col-span-2"><Textarea label="Sevk Nedeni" name="sevkNedeni" value={formData.sevkNedeni || ''} onChange={handleChange} rows={2} placeholder="Sevk nedenini kısaca açıklayın..." required /></div>
                    <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={[{value: '', label: 'Seçiniz...'}, ...Object.values(SevkDurumu).map(durum => ({value: durum, label: durum}))]} required />
                    <Input label="Maliyet (TL, İsteğe bağlı)" type="number" step="0.01" name="maliyet" value={formData.maliyet || ''} onChange={handleChange} />
                    <div className="md:col-span-2"><Textarea label="Sonuç Notları (İsteğe bağlı)" name="sonuc" value={formData.sonuc || ''} onChange={handleChange} rows={3} placeholder="Randevu sonrası doktorun notları, sonuçlar vb." /></div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default HastaneSevkYonetimi;