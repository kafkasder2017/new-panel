import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dava, DavaStatus, DavaTuru } from '../types.ts';
import { createDava, updateDava, deleteDava } from '../services/apiService.ts';
import { useCases } from '../hooks/useData.ts';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: DavaStatus) => {
    switch (status) {
        case DavaStatus.DEVAM_EDEN: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case DavaStatus.SONUCLANAN: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case DavaStatus.TEMYIZDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const HukukiYardim: React.FC = () => {
    const { data: davalar, isLoading, error, refresh } = useCases();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as DavaStatus | 'all',
        typeFilter: 'all' as DavaTuru | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDava, setEditingDava] = useState<Partial<Dava> | null>(null);

    const filteredDavalar = useMemo(() => {
        return davalar.filter(dava => {
            const lowerSearch = filters.searchTerm.toLowerCase();
            const matchesSearch = (dava.muvekkil || '').toLowerCase().includes(lowerSearch) ||
                                  (dava.caseNumber || '').toLowerCase().includes(lowerSearch) ||
                                  (dava.sorumluAvukat || '').toLowerCase().includes(lowerSearch);
            const matchesStatus = filters.statusFilter === 'all' || dava.davaDurumu === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || dava.davaTuru === filters.typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [davalar, filters]);

    const handleSaveDava = async (davaToSave: Partial<Dava>) => {
        const isNew = !davaToSave.id;
        const promise = isNew 
            ? createDava(davaToSave as Omit<Dava, 'id'>)
            : updateDava(davaToSave.id!, davaToSave);
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingDava(null);
                return isNew ? 'Dava başarıyla eklendi!' : 'Dava başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };
    
    const handleDeleteClick = (id: number) => {
         if (window.confirm('Bu dava kaydını silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteDava(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Dava başarıyla silindi!';
                },
                error: 'Silme işlemi sırasında bir hata oluştu.',
            });
        }
    }

    const columns = useMemo(() => [
        { key: 'caseNumber', title: 'Dava No / Konusu', render: (dava: Dava) => <div><div className="font-medium text-zinc-900 dark:text-zinc-100">{dava.caseNumber}</div><div className="text-xs text-zinc-500">{dava.davaKonusu}</div></div> },
        { key: 'muvekkil', title: 'Müvekkil / Karşı Taraf', render: (dava: Dava) => <div><div className="font-medium text-zinc-900 dark:text-zinc-100">{dava.muvekkil}</div><div className="text-xs text-zinc-500">vs. {dava.karsiTaraf}</div></div> },
        { key: 'davaTuru', title: 'Dava Türü', render: (dava: Dava) => dava.davaTuru },
        { key: 'sorumluAvukat', title: 'Avukat', render: (dava: Dava) => dava.sorumluAvukat },
        { key: 'davaDurumu', title: 'Durum', render: (dava: Dava) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(dava.davaDurumu)}`}>{dava.davaDurumu}</span> },
        { key: 'actions', title: 'İşlemler', render: (dava: Dava) => (
             <div className="flex items-center justify-end space-x-1">
                <ReactRouterDOM.Link to={`/hukuki-yardim/${dava.id}`}><Button variant="ghost" size="sm">Detay</Button></ReactRouterDOM.Link>
                <Button variant="ghost" size="sm" onClick={() => { setEditingDava(dava); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => handleDeleteClick(dava.id)}>Sil</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Hukuk Yönetimi">
                <Button onClick={() => { setEditingDava({}); setIsModalOpen(true); }}>Yeni Dava Ekle</Button>
            </PageHeader>
             <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Müvekkil, Dava No, Avukat..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Dava Türleri'}, ...Object.values(DavaTuru).map(v => ({value: v, label: v}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(DavaStatus).map(v => ({value: v, label: v}))]} />
                </div>
                <Table columns={columns} data={filteredDavalar} />
            </div>

            {isModalOpen && editingDava && (
                <DavaFormModal
                    dava={editingDava}
                    onClose={() => { setIsModalOpen(false); setEditingDava(null); }}
                    onSave={handleSaveDava}
                />
            )}
        </>
    );
};

const DavaFormModal: React.FC<{ dava: Partial<Dava>, onClose: () => void, onSave: (dava: Partial<Dava>) => void }> = ({ dava, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Dava>>(dava);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as Dava); };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={dava.id ? "Dava Bilgilerini Düzenle" : "Yeni Dava Ekle"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Dava Numarası" name="caseNumber" value={formData.caseNumber || ''} onChange={handleChange} required />
                    <Input label="Açılış Tarihi" type="date" name="acilisTarihi" value={formData.acilisTarihi || ''} onChange={handleChange} required />
                    <Input label="Müvekkil" name="muvekkil" value={formData.muvekkil || ''} onChange={handleChange} required />
                    <Input label="Karşı Taraf" name="karsiTaraf" value={formData.karsiTaraf || ''} onChange={handleChange} required />
                    <Input label="Sorumlu Avukat" name="sorumluAvukat" value={formData.sorumluAvukat || ''} onChange={handleChange} required />
                    <Input label="Mahkeme" name="mahkeme" value={formData.mahkeme || ''} onChange={handleChange} required />
                    <Select label="Dava Türü" name="davaTuru" value={formData.davaTuru || ''} onChange={handleChange} options={Object.values(DavaTuru).map(v=>({value:v, label:v}))} required />
                    <Select label="Dava Durumu" name="davaDurumu" value={formData.davaDurumu || ''} onChange={handleChange} options={Object.values(DavaStatus).map(v=>({value:v, label:v}))} required />
                    <div className="md:col-span-2"><Textarea label="Dava Konusu" name="davaKonusu" value={formData.davaKonusu || ''} onChange={handleChange} rows={3} required /></div>
                    <div className="md:col-span-2"><Textarea label="Karar (Sonuçlandıysa)" name="karar" value={formData.karar || ''} onChange={handleChange} rows={3} /></div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default HukukiYardim;