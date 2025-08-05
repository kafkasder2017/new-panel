import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Yetim, EgitimSeviyesi, DestekDurumu } from '../types.ts';
import { createYetim, updateYetim, deleteYetim } from '../services/apiService.ts';
import { useOrphans } from '../hooks/useData.ts';
import { PageHeader, Table, Input, Select, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: DestekDurumu) => {
    return status === DestekDurumu.DESTEK_ALIYOR ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
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

const YetimYonetimi: React.FC = () => {
    const { data: orphans, isLoading, error, refresh } = useOrphans();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as DestekDurumu | 'all',
        educationFilter: 'all' as EgitimSeviyesi | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingYetim, setEditingYetim] = useState<Partial<Yetim> | null>(null);

    const filteredYetimler = useMemo(() => {
        return orphans.filter(yetim => {
            const lowerSearch = filters.searchTerm.toLowerCase();
            const matchesSearch = yetim.adiSoyadi.toLowerCase().includes(lowerSearch) ||
                                  yetim.veliAdi.toLowerCase().includes(lowerSearch);
            const matchesStatus = filters.statusFilter === 'all' || yetim.destekDurumu === filters.statusFilter;
            const matchesEducation = filters.educationFilter === 'all' || yetim.egitimSeviyesi === filters.educationFilter;
            return matchesSearch && matchesStatus && matchesEducation;
        }).sort((a,b) => new Date(b.kayitTarihi).getTime() - new Date(a.kayitTarihi).getTime());
    }, [orphans, filters]);

    const handleSaveYetim = async (yetimToSave: Partial<Yetim>) => {
        const isNew = !yetimToSave.id;
        const promise = isNew 
            ? createYetim({ ...yetimToSave, kayitTarihi: new Date().toISOString() } as Omit<Yetim, 'id'>)
            : updateYetim(yetimToSave.id!, yetimToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingYetim(null);
                return isNew ? 'Yetim kaydı başarıyla eklendi!' : 'Yetim kaydı başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };
    
    const handleDeleteClick = (id: number) => {
        if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteYetim(id), {
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
        { key: 'adiSoyadi', title: 'Adı Soyadı', render: (value: any, y: Yetim) => y.adiSoyadi },
        { key: 'yas', title: 'Yaş / Cinsiyet', render: (value: any, y: Yetim) => <div><div>{calculateAge(y.dogumTarihi)}</div><div className="text-xs text-zinc-500">{y.cinsiyet}</div></div> },
        { key: 'veli', title: 'Veli Bilgileri', render: (value: any, y: Yetim) => <div><div>{y.veliAdi}</div><div className="text-xs text-zinc-500">{y.veliTelefonu}</div></div> },
        { key: 'egitimSeviyesi', title: 'Eğitim Durumu', render: (value: any, y: Yetim) => y.egitimSeviyesi },
        { key: 'destekDurumu', title: 'Destek Durumu', render: (value: any, y: Yetim) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(y.destekDurumu)}`}>{y.destekDurumu}</span> },
        { key: 'actions', title: 'İşlemler', render: (value: any, y: Yetim) => (
            <div className="flex items-center justify-end space-x-1">
                <ReactRouterDOM.Link to={`/yetimler/${y.id}`}><Button variant="ghost" size="sm">Detay</Button></ReactRouterDOM.Link>
                <Button variant="ghost" size="sm" onClick={() => { setEditingYetim(y); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50" onClick={() => handleDeleteClick(y.id)}>Sil</Button>
            </div>
        )}
    ], []);
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Yetim Yönetimi">
                <Button onClick={() => { setEditingYetim({}); setIsModalOpen(true); }}>Yeni Yetim Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Yetim veya veli adı..." value={filters.searchTerm} onChange={e => setFilters(f=>({...f, searchTerm: e.target.value}))}/>
                    <Select value={filters.educationFilter} onChange={e => setFilters(f=>({...f, educationFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Eğitim Seviyeleri'}, ...Object.values(EgitimSeviyesi).map(v=>({value:v, label:v}))]}/>
                    <Select value={filters.statusFilter} onChange={e => setFilters(f=>({...f, statusFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Destek Durumları'}, ...Object.values(DestekDurumu).map(v=>({value:v, label:v}))]}/>
                </div>
                <Table columns={columns} data={filteredYetimler} />
            </div>

            {isModalOpen && editingYetim && (
                <YetimFormModal 
                    yetim={editingYetim} 
                    onClose={() => { setIsModalOpen(false); setEditingYetim(null); }}
                    onSave={handleSaveYetim}
                />
            )}
        </>
    );
};


const YetimFormModal: React.FC<{ yetim: Partial<Yetim>; onClose: () => void; onSave: (yetim: Partial<Yetim>) => void; }> = ({ yetim, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Yetim>>(yetim);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNew = !yetim.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? "Yeni Yetim Ekle" : "Yetim Bilgilerini Düzenle"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Adı Soyadı" name="adiSoyadi" value={formData.adiSoyadi || ''} onChange={handleChange} required />
                    <Input label="Doğum Tarihi" type="date" name="dogumTarihi" value={formData.dogumTarihi || ''} onChange={handleChange} required />
                    <Select label="Cinsiyet" name="cinsiyet" value={formData.cinsiyet || 'Kız'} onChange={handleChange} options={[{value:'Kız', label:'Kız'}, {value:'Erkek', label:'Erkek'}]} required/>
                    <Input label="Şehir" name="sehir" value={formData.sehir || ''} onChange={handleChange} />
                    
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                         <h4 className="text-md font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Veli Bilgileri</h4>
                    </div>
                    <Input label="Veli Adı Soyadı" name="veliAdi" value={formData.veliAdi || ''} onChange={handleChange} required />
                    <Input label="Veli Telefonu" type="tel" name="veliTelefonu" value={formData.veliTelefonu || ''} onChange={handleChange} />
                    
                    <div className="md:col-span-2 border-t pt-4 mt-2">
                         <h4 className="text-md font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Eğitim ve Destek Bilgileri</h4>
                    </div>
                    <Select label="Eğitim Seviyesi" name="egitimSeviyesi" value={formData.egitimSeviyesi || ''} onChange={handleChange} options={[{value:'', label:'Seçiniz...'}, ...Object.values(EgitimSeviyesi).map(v=>({value:v, label:v}))]} required />
                    <Input label="Okul Adı" name="okulAdi" value={formData.okulAdi || ''} onChange={handleChange} />
                    <Select label="Destek Durumu" name="destekDurumu" value={formData.destekDurumu || ''} onChange={handleChange} options={[{value:'', label:'Seçiniz...'}, ...Object.values(DestekDurumu).map(v=>({value:v, label:v}))]} required />
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default YetimYonetimi;