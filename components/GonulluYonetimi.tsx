import React, { useState, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Gonullu, Person, Beceri, GonulluDurum, MembershipType, Not } from '../types';
import { getPersonFullName } from '../utils/compat';
import { useGonulluYonetimi } from '../hooks/useData';
import { createPerson, updatePerson } from '../services/apiService';
import { PageHeader, Table, Select, Input, Button } from './ui';
import Modal from './Modal';

const GonulluYonetimi: React.FC = () => {
    const { data, isLoading, error, refresh } = useGonulluYonetimi();
    const { gonulluler, people } = data;

    const [filters, setFilters] = useState({
        searchTerm: '',
        skillFilter: 'all' as Beceri | 'all',
        statusFilter: 'all' as GonulluDurum | 'all',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGonullu, setEditingGonullu] = useState<Partial<Gonullu> | null>(null);

    const peopleMap = useMemo(() => new Map(people.map(p => [String(p.id), p])), [people]);

    const enrichedGonulluler = useMemo(() => {
        return gonulluler.map(g => ({
            ...g,
            person: peopleMap.get(String(g.personId))
        })).filter(g => g.person);
    }, [gonulluler, peopleMap]);

    const filteredGonulluler = useMemo(() => {
        return enrichedGonulluler.filter(g => {
            const person = g.person!;
            const lowerSearch = filters.searchTerm.toLowerCase();
            const matchesSearch = `${(person as any).ad ?? person.first_name ?? ''} ${(person as any).soyad ?? person.last_name ?? ''}`.toLowerCase().includes(lowerSearch);
            const matchesSkill = filters.skillFilter === 'all' || g.beceriler.includes(filters.skillFilter);
            const matchesStatus = filters.statusFilter === 'all' || g.durum === filters.statusFilter;
            return matchesSearch && matchesSkill && matchesStatus;
        });
    }, [enrichedGonulluler, filters]);
    
    const handleSaveGonullu = async (gonulluToSave: Partial<Gonullu>) => {
        const isNew = !gonulluToSave.id;
        
        // For new volunteers, we need to update the person's membershipType to GONULLU
        if (isNew && gonulluToSave.personId) {
            const promise = updatePerson(String(gonulluToSave.personId), { 
                membershipType: MembershipType.GONULLU,
                // Store volunteer-specific data in notes or custom fields
                notes: JSON.stringify({
                    beceriler: gonulluToSave.beceriler || [],
                    musaitlik: gonulluToSave.musaitlik || '',
                    durum: gonulluToSave.durum || 'Aktif',
                    baslangicTarihi: gonulluToSave.baslangicTarihi || new Date().toISOString()
                })
            });
            
            toast.promise(promise, {
                loading: 'Kaydediliyor...',
                success: () => {
                    refresh();
                    setIsModalOpen(false);
                    setEditingGonullu(null);
                    return 'Gönüllü başarıyla eklendi!';
                },
                error: 'Bir hata oluştu.',
            });
        } else {
            // For existing volunteers, update their person record
            const personId = gonulluToSave.personId || gonulluler.find(g => g.id === gonulluToSave.id)?.personId;
            if (personId) {
                const promise = updatePerson(String(personId), {
                    notes: JSON.stringify({
                        beceriler: gonulluToSave.beceriler || [],
                        musaitlik: gonulluToSave.musaitlik || '',
                        durum: gonulluToSave.durum || 'Aktif',
                        baslangicTarihi: gonulluToSave.baslangicTarihi || new Date().toISOString()
                    })
                });
                
                toast.promise(promise, {
                    loading: 'Kaydediliyor...',
                    success: () => {
                        refresh();
                        setIsModalOpen(false);
                        setEditingGonullu(null);
                        return 'Gönüllü başarıyla güncellendi!';
                    },
                    error: 'Bir hata oluştu.',
                });
            }
        }
    };
    
    const columns = useMemo(() => [
        { key: 'person', title: 'Ad Soyad', render: (g: any) => getPersonFullName(g.person) },
        { key: 'beceriler', title: 'Beceriler', render: (g: Gonullu) => (
             <div className="flex flex-wrap gap-1">
                {g.beceriler.slice(0, 2).map(b => <span key={b} className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full">{b}</span>)}
                {g.beceriler.length > 2 && <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full">+{g.beceriler.length - 2}</span>}
            </div>
        )},
        { key: 'musaitlik', title: 'Müsaitlik', render: (g: Gonullu) => g.musaitlik },
        { key: 'toplamSaat', title: 'Toplam Katkı', render: (g: Gonullu) => `${g.toplamSaat || 0} saat` },
        { key: 'durum', title: 'Durum', render: (g: Gonullu) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${g.durum === 'Aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>{g.durum}</span>},
        { key: 'actions', title: 'İşlemler', render: (g: Gonullu) => (
            <div className="flex items-center justify-end space-x-1">
                <ReactRouterDOM.Link to={`/gonulluler/${g.id}`}><Button variant="ghost" size="sm">Detay</Button></ReactRouterDOM.Link>
                <Button variant="ghost" size="sm" onClick={() => { setEditingGonullu(g); setIsModalOpen(true); }}>Düzenle</Button>
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Gönüllü Yönetimi">
                <Button onClick={() => { setEditingGonullu({}); setIsModalOpen(true); }}>Yeni Gönüllü Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Gönüllü adı ara..." value={filters.searchTerm} onChange={e => setFilters(f=>({...f, searchTerm: e.target.value}))}/>
                    <Select value={filters.skillFilter} onChange={e => setFilters(f=>({...f, skillFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Beceriler'}, ...Object.values(Beceri).map(b => ({value: b, label: b}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f=>({...f, statusFilter: e.target.value as any}))} options={[{value:'all', label: 'Tüm Durumlar'}, ...Object.values(GonulluDurum).map(s => ({value: s, label: s}))]} />
                </div>
                <Table columns={columns} data={filteredGonulluler} />
            </div>
            {isModalOpen && (
                <GonulluFormModal
                    gonullu={editingGonullu}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveGonullu}
                    allPeople={people}
                    existingVolunteerIds={gonulluler.map(g => g.personId)}
                />
            )}
        </>
    );
};

interface GonulluFormModalProps {
    gonullu: Partial<Gonullu> | null;
    onClose: () => void;
    onSave: (gonullu: Partial<Gonullu>) => void;
    allPeople: Person[];
    existingVolunteerIds: number[];
}

const GonulluFormModal: React.FC<GonulluFormModalProps> = ({ gonullu, onClose, onSave, allPeople, existingVolunteerIds }) => {
    const [formData, setFormData] = useState<Partial<Gonullu>>(gonullu || {});
    const [selectedSkills, setSelectedSkills] = useState<Beceri[]>(gonullu?.beceriler || []);

    const availablePeople = useMemo(() => {
        return allPeople.filter(p => !existingVolunteerIds.includes(Number(p.id)));
    }, [allPeople, existingVolunteerIds]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSkillToggle = (skill: Beceri) => {
        setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData, beceriler: selectedSkills };
        onSave(finalData as Gonullu);
    };

    const isNew = !gonullu?.id;

    return (
        <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Gönüllü Ekle' : 'Gönüllü Bilgilerini Düzenle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 {isNew && (
                     <Select label="Kişi Seç" name="personId" value={formData.personId || ''} onChange={(e) => setFormData(prev => ({...prev, personId: Number(e.target.value)}))} options={[{value: '', label: 'Lütfen bir kişi seçin...'}, ...availablePeople.map(p => ({value: p.id, label: getPersonFullName(p)}))]} required/>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Başlangıç Tarihi" type="date" name="baslangicTarihi" value={formData.baslangicTarihi || new Date().toISOString().split('T')[0]} onChange={handleChange} required />
                    <Select label="Durum" name="durum" value={formData.durum || ''} onChange={handleChange} options={Object.values(GonulluDurum).map(s => ({value:s, label:s}))} required/>
                    <div className="md:col-span-2">
                        <Input label="Müsaitlik Durumu" name="musaitlik" value={formData.musaitlik || ''} onChange={handleChange} placeholder="örn: Hafta sonları" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Beceriler</label>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.values(Beceri).map(skill => (
                            <label key={skill} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer text-sm ${selectedSkills.includes(skill) ? 'bg-blue-100 border-blue-300 dark:bg-blue-900/50 dark:border-blue-700' : 'border-zinc-200 dark:border-zinc-600'}`}>
                                <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => handleSkillToggle(skill)} className="rounded text-blue-600 focus:ring-blue-500" />
                                <span>{skill}</span>
                            </label>
                        ))}
                    </div>
                 </div>
                 <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                 </div>
            </form>
        </Modal>
    );
};

export default GonulluYonetimi;
