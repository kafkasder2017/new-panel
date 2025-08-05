import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { OgrenciBursu, BursTuru, BursDurumu } from '../types.ts';
import { createOgrenciBursu, updateOgrenciBursu, deleteOgrenciBursu } from '../services/apiService.ts';
import { useScholarships } from '../hooks/useData.ts';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';const getStatusClass = (status: BursDurumu) => {
    switch (status) {
        case BursDurumu.AKTIF: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case BursDurumu.TAMAMLANDI: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case BursDurumu.IPTAL_EDILDI: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const OgrenciBurslari: React.FC = () => {
    const { data: scholarships, isLoading, error, refresh } = useScholarships();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as BursDurumu | 'all',
        typeFilter: 'all' as BursTuru | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBurs, setEditingBurs] = useState<Partial<OgrenciBursu> | null>(null);

    const filteredBurslar = useMemo(() => {
        return scholarships.filter(burs => {
            const matchesSearch = burs.ogrenciAdi.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  burs.okulAdi.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || burs.durum === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || burs.bursTuru === filters.typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [scholarships, filters]);

    const handleSaveBurs = async (bursToSave: Partial<OgrenciBursu>) => {
        const isNew = !bursToSave.id;
        const promise = isNew 
            ? createOgrenciBursu(bursToSave as Omit<OgrenciBursu, 'id'>)
            : updateOgrenciBursu(bursToSave.id!, bursToSave);
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingBurs(null);
                return isNew ? 'Burs kaydı başarıyla eklendi!' : 'Burs kaydı başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const columns = useMemo(() => [
        { key: 'student', title: 'Öğrenci Adı', render: (b: OgrenciBursu) => b.ogrenciAdi },
        { key: 'school', title: 'Okul / Bölüm', render: (b: OgrenciBursu) => <div><div>{b.okulAdi}</div><div className="text-xs text-zinc-500">{b.bolum}</div></div> },
        { key: 'type', title: 'Burs Türü', render: (b: OgrenciBursu) => b.bursTuru },
        { key: 'amount', title: 'Aylık Tutar', render: (b: OgrenciBursu) => b.bursMiktari.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) },
        { key: 'gpa', title: 'GPA', render: (b: OgrenciBursu) => typeof b.gpa === 'number' ? b.gpa.toFixed(2) : 'N/A' },
        { key: 'status', title: 'Durum', render: (b: OgrenciBursu) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(b.durum)}`}>{b.durum}</span> },
        { key: 'actions', title: 'İşlemler', render: (b: OgrenciBursu) => (
            <div className="flex items-center justify-end space-x-1">
                <ReactRouterDOM.Link to={`/burslar/${b.id}`}><Button variant="ghost" size="sm">Detaylar</Button></ReactRouterDOM.Link>
                <Button variant="ghost" size="sm" onClick={() => { setEditingBurs(b); setIsModalOpen(true); }}>Düzenle</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Burs Yönetimi">
                <Button onClick={() => { setEditingBurs({}); setIsModalOpen(true); }}>Yeni Burs Başvurusu</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Öğrenci veya okul adı..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Burs Tipleri'}, ...Object.values(BursTuru).map(v => ({value: v, label: v}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(BursDurumu).map(v => ({value: v, label: v}))]} />
                </div>
                <Table columns={columns} data={filteredBurslar} />
            </div>

            {isModalOpen && editingBurs && (
                <BursFormModal
                    burs={editingBurs}
                    onClose={() => { setIsModalOpen(false); setEditingBurs(null); }}
                    onSave={handleSaveBurs}
                />
            )}
        </>
    );
};

const BursFormModal: React.FC<{ burs: Partial<OgrenciBursu>; onClose: () => void; onSave: (burs: Partial<OgrenciBursu>) => void; }> = ({ burs, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<OgrenciBursu>>(burs);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['bursMiktari', 'gpa'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const isNew = !burs.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? "Yeni Burs Başvurusu Ekle" : "Burs Bilgilerini Düzenle"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Öğrenci Adı" name="ogrenciAdi" value={formData.ogrenciAdi || ''} onChange={handleChange} required />
                    <Input label="Okul Adı" name="okulAdi" value={formData.okulAdi || ''} onChange={handleChange} required />
                    <div className="md:col-span-2"><Input label="Bölüm" name="bolum" value={formData.bolum || ''} onChange={handleChange} required /></div>
                    <Select label="Burs Türü" name="bursTuru" value={formData.bursTuru || ''} onChange={handleChange} options={[{value:'', label:'Seçiniz...'}, ...Object.values(BursTuru).map(v=>({value:v, label:v}))]} required />
                    <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={[{value:'', label:'Seçiniz...'}, ...Object.values(BursDurumu).map(v=>({value:v, label:v}))]} required />
                    <Input label="Aylık Burs Miktarı (TL)" type="number" name="bursMiktari" value={formData.bursMiktari || ''} onChange={handleChange} required />
                    <Input label="Genel Not Ortalaması (GPA)" type="number" name="gpa" step="0.01" min="0" max="4" value={formData.gpa || ''} onChange={handleChange} required />
                    <Input label="Başlangıç Tarihi" type="date" name="baslangicTarihi" value={formData.baslangicTarihi || ''} onChange={handleChange} required />
                    <Input label="Bitiş Tarihi" type="date" name="bitisTarihi" value={formData.bitisTarihi || ''} onChange={handleChange} required />
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};


export default OgrenciBurslari;