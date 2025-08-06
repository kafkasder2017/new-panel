import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Proje, ProjeStatus } from '../types.ts';
import { createProje, updateProje, deleteProje } from '../services/apiService.ts';
import { useProjects } from '../hooks/useData.ts';
import { PageHeader, Select, Button } from './ui';
import { ProjeCard } from '../src/components/ProjeCard';
import { ProjeFormModal } from '../src/components/ProjeFormModal';



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



export default ProjeYonetimi;