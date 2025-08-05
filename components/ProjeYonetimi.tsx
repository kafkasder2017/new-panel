import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Proje, ProjeStatus } from '../types.ts';
import { createProje, updateProje, deleteProje } from '../services/apiService.ts';
import { useProjects } from '../hooks/useData.ts';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';const getStatusClass = (status: ProjeStatus) => {
    switch (status) {
        case ProjeStatus.PLANLAMA: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        case ProjeStatus.DEVAM_EDIYOR: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case ProjeStatus.TAMAMLANDI: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case ProjeStatus.IPTAL_EDILDI: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const getProgressClass = (status: ProjeStatus) => {
     switch (status) {
        case ProjeStatus.PLANLAMA: return 'bg-blue-500';
        case ProjeStatus.DEVAM_EDIYOR: return 'bg-yellow-500';
        case ProjeStatus.TAMAMLANDI: return 'bg-green-500';
        case ProjeStatus.IPTAL_EDILDI: return 'bg-red-500';
        default: return 'bg-zinc-500';
    }
}

const ProjeCard: React.FC<{ proje: Proje, onEdit: (proje: Proje) => void, onDelete: (id: number) => void }> = ({ proje, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 group border border-zinc-200 dark:border-zinc-700">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">{proje.name}</h3>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(proje.status)}`}>
                    {proje.status}
                </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">Yönetici: {proje.manager}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 h-10 overflow-hidden">{proje.description}</p>
        </div>
        <div>
            <div className="mb-2">
                <div className="flex justify-between text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    <span>İlerleme</span>
                    <span>{proje.progress}%</span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full ${getProgressClass(proje.status)}`} style={{ width: `${proje.progress}%` }}></div>
                </div>
            </div>
            <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                <span>Bütçe:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {proje.spent.toLocaleString('tr-TR')} / {proje.budget.toLocaleString('tr-TR')} TL
                </span>
            </div>
            <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                <span>{new Date(proje.startDate).toLocaleDateString('tr-TR')}</span>
                <span>{new Date(proje.endDate).toLocaleDateString('tr-TR')}</span>
            </div>
             <div className="border-t border-zinc-200 dark:border-zinc-700 mt-4 pt-4 flex justify-end space-x-2">
                <ReactRouterDOM.Link to={`/projeler/${proje.id}`}><Button variant="ghost" size="sm">Detaylar</Button></ReactRouterDOM.Link>
                <Button variant="ghost" size="sm" onClick={() => onEdit(proje)}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDelete(proje.id)}>Sil</Button>
            </div>
        </div>
    </div>
);

const ProjeYonetimi: React.FC = () => {
    const { data: projects, isLoading, error, refresh } = useProjects();
    const [statusFilter, setStatusFilter] = useState<ProjeStatus | 'all'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProje, setEditingProje] = useState<Partial<Proje> | null>(null);

    const filteredProjeler = useMemo(() => {
        if (statusFilter === 'all') return projects;
        return projects.filter(proje => proje.status === statusFilter);
    }, [projects, statusFilter]);
    
    const handleSaveProje = async (projeToSave: Partial<Proje>) => {
        const isNew = !projeToSave.id;
        const promise = isNew 
            ? createProje(projeToSave as Omit<Proje, 'id'>)
            : updateProje(projeToSave.id!, projeToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingProje(null);
                return isNew ? 'Proje başarıyla eklendi!' : 'Proje başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleDeleteClick = (id: number) => {
        if (window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteProje(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Proje başarıyla silindi!';
                },
                error: 'Silme işlemi sırasında bir hata oluştu.',
            });
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Proje Yönetimi">
                <div className="flex items-center gap-2">
                    <Select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as ProjeStatus | 'all')}
                        options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(ProjeStatus).map(s => ({value: s, label: s}))]}
                    />
                    <Button onClick={() => { setEditingProje({}); setIsModalOpen(true); }}>Yeni Proje Ekle</Button>
                </div>
            </PageHeader>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {filteredProjeler.map(proje => (
                        <ProjeCard key={proje.id} proje={proje} onEdit={() => { setEditingProje(proje); setIsModalOpen(true); }} onDelete={handleDeleteClick} />
                    ))}
                </div>
                {filteredProjeler.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400">
                        <p>Filtreye uygun proje bulunamadı.</p>
                    </div>
                )}
            </div>
            {isModalOpen && editingProje && (
                <ProjeFormModal 
                    proje={editingProje}
                    onClose={() => { setIsModalOpen(false); setEditingProje(null); }}
                    onSave={handleSaveProje}
                />
            )}
        </>
    );
};

const ProjeFormModal: React.FC<{ proje: Partial<Proje>, onClose: () => void, onSave: (proje: Partial<Proje>) => void }> = ({ proje, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Proje>>(proje);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['budget', 'spent', 'progress'].includes(name);
        setFormData(prev => ({...prev, [name]: isNumeric ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal isOpen={true} onClose={onClose} title={proje.id ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Input label="Proje Adı" name="name" value={formData.name || ''} onChange={handleChange} required /></div>
                    <Input label="Proje Yöneticisi" name="manager" value={formData.manager || ''} onChange={handleChange} required />
                    <Select label="Durum" name="status" value={formData.status || ''} onChange={handleChange} options={[{value:'', label:'Seçiniz...'}, ...Object.values(ProjeStatus).map(s => ({value:s, label:s}))]} required />
                    <Input label="Başlangıç Tarihi" type="date" name="startDate" value={formData.startDate || ''} onChange={handleChange} required />
                    <Input label="Bitiş Tarihi" type="date" name="endDate" value={formData.endDate || ''} onChange={handleChange} required />
                    <Input label="Toplam Bütçe (TL)" type="number" name="budget" value={formData.budget || ''} onChange={handleChange} required />
                    <Input label="Harcanan Tutar (TL)" type="number" name="spent" value={formData.spent || ''} onChange={handleChange} required />
                     <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">İlerleme (%{formData.progress || 0})</label>
                        <input type="range" name="progress" min="0" max="100" value={formData.progress || 0} onChange={handleChange} className="mt-1 block w-full" />
                    </div>
                    <div className="md:col-span-2"><Textarea label="Açıklama" name="description" value={formData.description || ''} onChange={handleChange} rows={5} required /></div>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default ProjeYonetimi;