import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Kullanici, KullaniciRol, KullaniciDurum } from '../types.ts';
import { createUser, updateUser, deleteUser } from '../services/apiService.ts';
import { useKullaniciYonetimi } from '../hooks/useData.ts';
import { PageHeader, Table, Input, Select, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: KullaniciDurum) => {
    return status === KullaniciDurum.AKTIF ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

const getRoleClass = (role: KullaniciRol) => {
    switch (role) {
        case KullaniciRol.YONETICI: return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
        case KullaniciRol.EDITOR: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case KullaniciRol.MUHASEBE: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case KullaniciRol.GONULLU: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const getRoleDisplayName = (role: KullaniciRol) => {
    switch (role) {
        case KullaniciRol.YONETICI: return 'Yönetici';
        case KullaniciRol.EDITOR: return 'Editör';
        case KullaniciRol.MUHASEBE: return 'Muhasebe';
        case KullaniciRol.GONULLU: return 'Gönüllü';
        default: return role;
    }
};

const KullaniciYonetimi: React.FC = () => {
    const { data: kullanicilar, isLoading, error, refresh } = useKullaniciYonetimi();

    const [filters, setFilters] = useState({
        searchTerm: '',
        roleFilter: 'all' as KullaniciRol | 'all',
        statusFilter: 'all' as KullaniciDurum | 'all',
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingKullanici, setEditingKullanici] = useState<Partial<Kullanici> | null>(null);

    const filteredKullanicilar = useMemo(() => {
        return kullanicilar.filter(kullanici => {
            const lowerSearch = filters.searchTerm.toLowerCase();
            const matchesSearch = kullanici.kullanici_adi.toLowerCase().includes(lowerSearch) ||
                                  kullanici.email.toLowerCase().includes(lowerSearch);
            const matchesRole = filters.roleFilter === 'all' || kullanici.rol === filters.roleFilter;
            const matchesStatus = filters.statusFilter === 'all' || kullanici.durum === filters.statusFilter;
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [kullanicilar, filters]);

    const handleSaveKullanici = async (kullaniciToSave: Partial<Kullanici> & { password?: string }) => {
        const isNew = !kullaniciToSave.id;
        const promise = isNew 
            ? createUser({ ...kullaniciToSave, durum: KullaniciDurum.AKTIF } as Omit<Kullanici, 'id'> & { password?: string })
            : updateUser(kullaniciToSave.id!, kullaniciToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingKullanici(null);
                return isNew ? 'Kullanıcı başarıyla oluşturuldu!' : 'Kullanıcı başarıyla güncellendi!';
            },
            error: (err) => err.message || 'Bir hata oluştu.',
        });
    };
    
    const handleDeleteClick = (id: number) => {
        if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
            toast.promise(deleteUser(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Kullanıcı başarıyla silindi!';
                },
                error: 'Silme işlemi sırasında bir hata oluştu.',
            });
        }
    };

    const toggleUserStatus = (kullanici: Kullanici) => {
        const newStatus = kullanici.durum === KullaniciDurum.AKTIF ? KullaniciDurum.PASIF : KullaniciDurum.AKTIF;
        toast.promise(updateUser(kullanici.id, { durum: newStatus }), {
            loading: 'Durum güncelleniyor...',
            success: () => {
                refresh();
                return 'Kullanıcı durumu güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const columns = useMemo(() => [
        { key: 'kullanici_adi', title: 'Kullanıcı Adı', render: (k: Kullanici) => k.kullanici_adi },
        { key: 'email', title: 'E-posta', render: (k: Kullanici) => k.email },
        { key: 'rol', title: 'Rol', render: (k: Kullanici) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleClass(k.rol)}`}>{getRoleDisplayName(k.rol)}</span> },
        { key: 'son_giris', title: 'Son Giriş', render: (k: Kullanici) => k.son_giris ? new Date(k.son_giris).toLocaleString('tr-TR') : 'Hiç' },
        { key: 'durum', title: 'Durum', render: (k: Kullanici) => <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(k.durum)}`}>{k.durum}</span> },
        { key: 'actions', title: 'İşlemler', render: (k: Kullanici) => (
             <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingKullanici(k); setIsModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleUserStatus(k)}>{k.durum === 'Aktif' ? 'Pasif Yap' : 'Aktif Yap'}</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Kullanıcı Yönetimi">
                <Button onClick={() => { setEditingKullanici({}); setIsModalOpen(true); }}>Yeni Kullanıcı Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Kullanıcı adı veya e-posta..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))}/>
                    <Select value={filters.roleFilter} onChange={e => setFilters(f => ({...f, roleFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Roller'}, ...Object.values(KullaniciRol).map(r => ({value:r, label:getRoleDisplayName(r)}))]}/>
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Durumlar'}, ...Object.values(KullaniciDurum).map(s => ({value:s, label:s}))]}/>
                </div>
                <Table columns={columns} data={filteredKullanicilar} />
            </div>
            {isModalOpen && editingKullanici && (
                <KullaniciFormModal 
                    kullanici={editingKullanici}
                    onClose={() => {setIsModalOpen(false); setEditingKullanici(null);}}
                    onSave={handleSaveKullanici}
                />
            )}
        </>
    );
};

const KullaniciFormModal: React.FC<{ kullanici: Partial<Kullanici>, onClose: () => void, onSave: (kullanici: Partial<Kullanici> & { password?: string }) => void }> = ({ kullanici, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Kullanici> & { password?: string }>(kullanici);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNewUser = !kullanici.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNewUser ? 'Yeni Kullanıcı Ekle' : 'Kullanıcıyı Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Kullanıcı Adı" name="kullanici_adi" value={formData.kullanici_adi || ''} onChange={handleChange} required />
                    <Input label="E-posta" type="email" name="email" value={formData.email || ''} onChange={handleChange} required disabled={!isNewUser} />
                    <Select label="Rol" name="rol" value={formData.rol || ''} onChange={handleChange} options={[{value:'', label:'Seçiniz...'}, ...Object.values(KullaniciRol).map(rol => ({value:rol, label:getRoleDisplayName(rol)}))]} required />
                     {isNewUser && (
                        <Input label="Şifre" type="password" name="password" placeholder="Yeni şifre belirle" onChange={handleChange} required />
                     )}
                     {!isNewUser && (
                        <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={Object.values(KullaniciDurum).map(durum => ({value:durum, label:durum}))} required />
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

export default KullaniciYonetimi;