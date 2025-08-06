import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { FinansalKayit, FinansalIslemTuru, HesapKategorisi, Proje } from '../types.ts';
import { createFinansalKayit, deleteFinansalKayit, updateFinansalKayit } from '../services/apiService.ts';
import { useFinancialRecords } from '../hooks/useData.ts';
import { PageHeader, StatCard, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';

const FinansalKayitlar: React.FC = () => {
    const { data, isLoading, error, refresh } = useFinancialRecords();
    const { records, projects } = data;

    const [filters, setFilters] = useState({
        searchTerm: '',
        typeFilter: 'all' as FinansalIslemTuru | 'all',
        categoryFilter: 'all' as HesapKategorisi | 'all',
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKayit, setEditingKayit] = useState<Partial<FinansalKayit> | null>(null);

    const { filteredKayitlar, totalGelir, totalGider, bakiye } = useMemo(() => {
        let currentTotalGelir = 0;
        let currentTotalGider = 0;
        
        records.forEach(k => {
            if (k.tur === FinansalIslemTuru.GELIR) {
                currentTotalGelir += k.tutar;
            } else {
                currentTotalGider += k.tutar;
            }
        });

        const filtered = records.filter(kayit => {
            const matchesSearch = kayit.aciklama.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  (kayit.belgeNo && kayit.belgeNo.toLowerCase().includes(filters.searchTerm.toLowerCase()));
            const matchesType = filters.typeFilter === 'all' || kayit.tur === filters.typeFilter;
            const matchesCategory = filters.categoryFilter === 'all' || kayit.kategori === filters.categoryFilter;
            return matchesSearch && matchesType && matchesCategory;
        });
        
        return { 
            filteredKayitlar: filtered, 
            totalGelir: currentTotalGelir, 
            totalGider: currentTotalGider, 
            bakiye: currentTotalGelir - currentTotalGider 
        };
    }, [records, filters]);

    const handleSaveKayit = async (kayitToSave: Partial<FinansalKayit>) => {
        const isNew = !kayitToSave.id;
        const promise = isNew 
            ? createFinansalKayit(kayitToSave as Omit<FinansalKayit, 'id'>)
            : updateFinansalKayit(kayitToSave.id!, kayitToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingKayit(null);
                return isNew ? 'Kayıt başarıyla eklendi!' : 'Kayıt başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm("Bu kaydı silmek istediğinizden emin misiniz?")) {
            toast.promise(deleteFinansalKayit(id), {
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
        { key: 'tarih', title: 'Tarih', render: (kayit: FinansalKayit) => new Date(kayit.tarih).toLocaleDateString('tr-TR') },
        { key: 'aciklama', title: 'Açıklama', render: (kayit: FinansalKayit) => (
            <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{kayit.aciklama}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Belge No: {kayit.belgeNo || '-'}</div>
            </div>
        )},
        { key: 'kategori', title: 'Kategori', render: (kayit: FinansalKayit) => kayit.kategori },
        { key: 'tutar', title: 'Tutar', render: (kayit: FinansalKayit) => (
            <span className={`font-semibold ${kayit.tur === FinansalIslemTuru.GELIR ? 'text-green-600' : 'text-red-600'}`}>
                {kayit.tur === FinansalIslemTuru.GELIR ? '+' : '-'} {(kayit.tutar ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </span>
        )},
        { key: 'actions', title: 'İşlemler', render: (kayit: FinansalKayit) => (
            <div className="flex items-center justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingKayit(kayit); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => handleDeleteClick(kayit.id)}>Sil</Button>
            </div>
        )}
    ], [projects]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <div className="space-y-6">
                <PageHeader title="Finans & Fon Yönetimi">
                    <Button onClick={() => { setEditingKayit({}); setIsModalOpen(true); }}>Yeni Kayıt Ekle</Button>
                </PageHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Toplam Gelir" value={(totalGelir ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} color="success" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} />
                    <StatCard title="Toplam Gider" value={(totalGider ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} color="danger" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>} />
                    <StatCard title="Bakiye" value={(bakiye ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} color="primary" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} />
                </div>

                <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                         <Input type="text" placeholder="Açıklama veya Belge No ile ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                         <Select value={filters.categoryFilter} onChange={e => setFilters(f => ({...f, categoryFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Kategoriler'}, ...Object.values(HesapKategorisi).map(c => ({value: c, label: c}))]} />
                         <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm İşlem Türleri'}, {value: FinansalIslemTuru.GELIR, label: 'Gelir'}, {value: FinansalIslemTuru.GIDER, label: 'Gider'}]} />
                    </div>
                    <Table columns={columns} data={filteredKayitlar} />
                </div>
            </div>

            {isModalOpen && editingKayit && (
                <FinansalKayitFormModal
                    kayit={editingKayit}
                    projects={projects}
                    onClose={() => { setIsModalOpen(false); setEditingKayit(null); }}
                    onSave={handleSaveKayit}
                />
            )}
        </>
    );
};

export const FinansalKayitFormModal: React.FC<{ kayit: Partial<FinansalKayit>, projects: Proje[], onClose: () => void, onSave: (kayit: Partial<FinansalKayit>) => void }> = ({ kayit, projects, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<FinansalKayit>>(kayit);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        let newState = { ...formData, [name]: value };
        
        if (name === 'tur' && value === FinansalIslemTuru.GELIR) {
            delete newState.projeId;
        }
        if (name === 'projeId' && value === '') {
            delete newState.projeId;
        } else if (name === 'projeId') {
            newState.projeId = parseInt(value, 10);
        }

        setFormData(newState);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as FinansalKayit);
    }
    
    return (
        <Modal isOpen={true} onClose={onClose} title={kayit.id ? 'Finansal Kaydı Düzenle' : 'Yeni Finansal Kayıt Ekle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="İşlem Tarihi" type="date" name="tarih" value={formData.tarih || ''} onChange={handleChange} required />
                    <Select label="İşlem Türü" name="tur" value={formData.tur || ''} onChange={handleChange} options={[{value: FinansalIslemTuru.GELIR, label: 'Gelir'}, {value: FinansalIslemTuru.GIDER, label: 'Gider'}]} required />
                    <div className="md:col-span-2">
                        <Textarea label="Açıklama" name="aciklama" value={formData.aciklama || ''} onChange={handleChange} required />
                    </div>
                    <Select label="Kategori" name="kategori" value={formData.kategori || ''} onChange={handleChange} options={Object.values(HesapKategorisi).map(c => ({value: c, label: c}))} className="md:col-span-2" required />
                    <Input label="Tutar (TL)" type="number" name="tutar" value={formData.tutar || ''} onChange={handleChange} required />
                    <Input label="Belge No (varsa)" name="belgeNo" value={formData.belgeNo || ''} onChange={handleChange} />
                    {formData.tur === FinansalIslemTuru.GIDER && (
                        <div className="md:col-span-2">
                            <Select label="İlişkili Proje (İsteğe Bağlı)" name="projeId" value={formData.projeId || ''} onChange={handleChange} options={[{value: '', label: 'Proje Seçilmedi'}, ...projects.map(p => ({value: p.id.toString(), label: p.name}))]} />
                        </div>
                    )}
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default FinansalKayitlar;