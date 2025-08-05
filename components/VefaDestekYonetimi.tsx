import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { VefaDestek, VefaDestekTuru, VefaDestekDurumu } from '../types';
import { createVefaDestek, updateVefaDestek, deleteVefaDestek } from '../services/apiService';
import { useVefaSupport } from '../hooks/useData';
import toast from 'react-hot-toast';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: VefaDestekDurumu) => {
    return status === VefaDestekDurumu.AKTIF ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const VefaDestekYonetimi: React.FC = () => {
    const { data: vefaDestekList, isLoading, error, refresh } = useVefaSupport();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as VefaDestekDurumu | 'all',
        typeFilter: 'all' as VefaDestekTuru | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVefa, setEditingVefa] = useState<Partial<VefaDestek> | null>(null);
    
    const filteredVefaList = useMemo(() => {
        return vefaDestekList.filter(vefa => {
            const lowerSearch = filters.searchTerm.toLowerCase();
            const matchesSearch = vefa.adiSoyadi.toLowerCase().includes(lowerSearch) ||
                                  vefa.sorumluGonullu.toLowerCase().includes(lowerSearch);
            const matchesStatus = filters.statusFilter === 'all' || vefa.destekDurumu === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || vefa.destekTuru === filters.typeFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [vefaDestekList, filters]);

    const handleSaveVefa = async (vefaToSave: Partial<VefaDestek>) => {
        const isNew = !vefaToSave.id;
        const promise = isNew
            ? createVefaDestek({ ...vefaToSave, kayitTarihi: new Date().toISOString() } as Omit<VefaDestek, 'id'>)
            : updateVefaDestek(vefaToSave.id!, vefaToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingVefa(null);
                return isNew ? 'Kayıt başarıyla eklendi!' : 'Kayıt başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm('Bu Vefa Destek kaydını silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteVefaDestek(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Kayıt başarıyla silindi!';
                },
                error: 'Silme işlemi sırasında bir hata oluştu.',
            });
        }
    };
    
    const columns = useMemo(() => [
        { key: 'adiSoyadi', title: 'Adı Soyadı', render: (value: any, v: VefaDestek) => v.adiSoyadi },
        { key: 'yas', title: 'Yaş', render: (value: any, v: VefaDestek) => calculateAge(v.dogumTarihi) },
        { key: 'destekTuru', title: 'Destek Türü', render: (value: any, v: VefaDestek) => v.destekTuru },
        { key: 'sorumluGonullu', title: 'Sorumlu Gönüllü', render: (value: any, v: VefaDestek) => v.sorumluGonullu },
        { key: 'destekDurumu', title: 'Destek Durumu', render: (value: any, v: VefaDestek) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(v.destekDurumu)}`}>{v.destekDurumu}</span> },
        { key: 'actions', title: 'İşlemler', render: (value: any, v: VefaDestek) => (
            <div className="flex items-center justify-end space-x-1">
                <ReactRouterDOM.Link to={`/vefa-destek/${v.id}`}><Button variant="ghost" size="sm">Detay</Button></ReactRouterDOM.Link>
                <Button variant="ghost" size="sm" onClick={() => { setEditingVefa(v); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => handleDeleteClick(v.id)}>Sil</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Vefa Destek Yönetimi">
                <Button onClick={() => { setEditingVefa({}); setIsModalOpen(true); }}>Yeni Kayıt Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Ad, soyad veya sorumlu ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Destek Türleri'}, ...Object.values(VefaDestekTuru).map(v=>({value:v,label:v}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Destek Durumları'}, ...Object.values(VefaDestekDurumu).map(v=>({value:v,label:v}))]} />
                </div>
                <Table columns={columns} data={filteredVefaList} />
            </div>
            
            {isModalOpen && editingVefa && (
                <VefaFormModal vefa={editingVefa} onClose={() => { setIsModalOpen(false); setEditingVefa(null); }} onSave={handleSaveVefa} />
            )}
        </>
    );
};


const VefaFormModal: React.FC<{ vefa: Partial<VefaDestek>; onClose: () => void; onSave: (vefa: Partial<VefaDestek>) => void; }> = ({ vefa, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<VefaDestek>>(vefa);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as VefaDestek); };
    return (
        <Modal isOpen={true} onClose={onClose} title={vefa.id ? "Vefa Destek Bilgilerini Düzenle" : "Yeni Vefa Destek Kaydı"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Adı Soyadı" name="adiSoyadi" value={formData.adiSoyadi || ''} onChange={handleChange} required />
                    <Input label="Doğum Tarihi" type="date" name="dogumTarihi" value={formData.dogumTarihi || ''} onChange={handleChange} required />
                    <Input label="Telefon" type="tel" name="telefon" value={formData.telefon || ''} onChange={handleChange} />
                    <Input label="Sorumlu Gönüllü" name="sorumluGonullu" value={formData.sorumluGonullu || ''} onChange={handleChange} required />
                    <div className="md:col-span-2"><Textarea label="Adres" name="adres" value={formData.adres || ''} onChange={handleChange} rows={2} /></div>
                    <Select label="Destek Türü" name="destekTuru" value={formData.destekTuru || ''} onChange={handleChange} options={Object.values(VefaDestekTuru).map(v=>({value:v,label:v}))} required />
                    <Select label="Destek Durumu" name="destekDurumu" value={formData.destekDurumu || ''} onChange={handleChange} options={Object.values(VefaDestekDurumu).map(v=>({value:v,label:v}))} required />
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default VefaDestekYonetimi;