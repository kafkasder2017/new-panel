import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Person, PersonStatus, Uyruk, KimlikTuru, DosyaBaglantisi, SponsorlukTipi, RizaBeyaniStatus } from '../../types';
import { createPerson, updatePerson, deletePerson } from '../../services/apiService';
import { usePeople } from '../../hooks/useData';
import Modal from '../../components/Modal';
import { PageHeader, Table, Input, Select, Button } from '../../components/ui';

const getStatusClass = (status: PersonStatus) => {
    switch (status) {
        case PersonStatus.AKTIF: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case PersonStatus.PASIF: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case PersonStatus.BEKLEMEDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const BagisciYonetimi: React.FC = () => {
    const { data: people, isLoading, error, refresh } = usePeople();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as PersonStatus | 'all',
        nationalityFilter: 'all' as Uyruk | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBagisci, setEditingBagisci] = useState<Partial<Person> | null>(null);

    // Bağışçıları filtrele (bağış yapanlar)
    const bagiscilar = useMemo(() => {
        return people.filter(p => p.bagisYapti === true);
    }, [people]);

    const displayedData = useMemo(() => {
        return bagiscilar.filter(bagisci => {
            const matchesSearch = `${bagisci.first_name} ${bagisci.last_name}`.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  bagisci.identity_number.includes(filters.searchTerm);
            const matchesStatus = filters.statusFilter === 'all' || bagisci.status === filters.statusFilter;
            const matchesNationality = filters.nationalityFilter === 'all' || bagisci.nationality === filters.nationalityFilter;
            return matchesSearch && matchesStatus && matchesNationality;
        });
    }, [bagiscilar, filters]);
    
    const handleSave = async (bagisciToSave: Partial<Person>) => {
        const isNew = !bagisciToSave.id;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                if (bagisciToSave.id) {
                    await updatePerson(bagisciToSave.id, bagisciToSave);
                } else {
                    const payload = { 
                        ...bagisciToSave,
                        registration_date: new Date().toISOString(),
                        registering_unit: "Panel",
                        file_connection: DosyaBaglantisi.DERNEK,
                        is_record_deleted: false,
                        nationality: bagisciToSave.nationality || Uyruk.TC,
                        identity_type: bagisciToSave.identity_type || KimlikTuru.TC,
                        birth_date: bagisciToSave.birth_date || '1900-01-01',
                        country: bagisciToSave.country || 'Türkiye',
                        province: bagisciToSave.province || '',
                        district: bagisciToSave.district || '',
                        neighborhood: bagisciToSave.neighborhood || '',
                        file_number: bagisciToSave.file_number || `DN${Date.now()}`,
                        sponsorship_type: bagisciToSave.sponsorship_type || SponsorlukTipi.YOK,
                        registration_status: bagisciToSave.registration_status || 'Kaydedildi',
                        consent_statement: bagisciToSave.consent_statement || RizaBeyaniStatus.ALINDI,
                        bagisYapti: true
                    } as Omit<Person, 'id'>;
                    await createPerson(payload);
                }
                refresh();
                setIsModalOpen(false);
                setEditingBagisci(null);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: isNew ? 'Bağışçı başarıyla eklendi!' : 'Bağışçı başarıyla güncellendi!',
            error: 'Bir hata oluştu.'
        });
    };
    
     const columns = useMemo(() => [
        { key: 'adSoyad', title: 'Ad Soyad', render: (value: any, u: Person) => `${u.first_name} ${u.last_name}` },
        { key: 'kimlikNo', title: 'Kimlik No', render: (value: any, u: Person) => u.identity_number },
        { key: 'cepTelefonu', title: 'Telefon', render: (value: any, u: Person) => u.phone || '-' },
        { key: 'email', title: 'E-posta', render: (value: any, u: Person) => u.email || '-' },
        { key: 'nationality', title: 'Uyruk', render: (value: any, u: Person) => u.nationality || '-' },
        { key: 'province', title: 'İl', render: (value: any, u: Person) => u.province || '-' },
        { key: 'durum', title: 'Durum', render: (value: any, u: Person) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(u.status)}`}>{u.status}</span>},
        { key: 'actions', title: 'İşlemler', render: (value: any, u: Person) => (
            <div className="text-right">
                <Button variant="ghost" size="sm" onClick={() => { setEditingBagisci(u); setIsModalOpen(true); }}>Düzenle</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Bağışçı Yönetimi">
                <Button onClick={() => { setEditingBagisci({}); setIsModalOpen(true); }}>Yeni Bağışçı Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Ad, Soyad veya Kimlik No ile ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.nationalityFilter} onChange={e => setFilters(f => ({...f, nationalityFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Uyruklar'}, ...Object.values(Uyruk).map(u => ({value: u, label: u}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(PersonStatus).map(s => ({value: s, label: s}))]} />
                </div>
                <Table columns={columns} data={displayedData} />
            </div>
            {isModalOpen && (
                <BagisciFormModal
                    bagisci={editingBagisci}
                    onClose={() => { setIsModalOpen(false); setEditingBagisci(null); }}
                    onSave={handleSave}
                />
            )}
        </>
    );
};

const BagisciFormModal: React.FC<{
    bagisci: Partial<Person> | null,
    onClose: () => void,
    onSave: (bagisci: Partial<Person>) => void
}> = ({ bagisci, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Person>>(bagisci || { nationality: Uyruk.TC });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const isNew = !bagisci?.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Bağışçı Ekle' : 'Bağışçı Bilgilerini Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Ad" name="first_name" value={formData.first_name || ''} onChange={handleChange} required />
                    <Input label="Soyad" name="last_name" value={formData.last_name || ''} onChange={handleChange} required />
                    <Input label="Kimlik No" name="identity_number" value={formData.identity_number || ''} onChange={handleChange} required />
                    <Input label="Telefon" name="phone" value={formData.phone || ''} onChange={handleChange} />
                    <Input label="E-posta" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                    <Input label="İl" name="province" value={formData.province || ''} onChange={handleChange} />
                    <Select label="Durum" name="status" value={formData.status || ''} onChange={handleChange} options={Object.values(PersonStatus).map(s => ({value:s, label: s}))} required/>
                </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default BagisciYonetimi;