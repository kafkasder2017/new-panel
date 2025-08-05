import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Bagis, BagisTuru, Person, Proje } from '../types';
import { createBagis, updateBagis, deleteBagis } from '../services/apiService';
import { useBagisYonetimi } from '../hooks/useData';
import Modal from './Modal';
import { PageHeader, StatCard, Table, Input, Select, Textarea, Button } from './ui';

interface BagisYonetimiProps {
    initialFilter?: BagisTuru | 'all';
}

const BagisYonetimi: React.FC<BagisYonetimiProps> = ({ initialFilter = 'all' }) => {
    const { data, isLoading, error, refresh } = useBagisYonetimi();
    const { donations, people, projects } = data;

    const [filters, setFilters] = useState({ searchTerm: '', typeFilter: initialFilter });
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [editingDonation, setEditingDonation] = useState<Partial<Bagis> | null>(null);
    const [receiptDonation, setReceiptDonation] = useState<Bagis | null>(null);

    const peopleMap = useMemo(() => new Map(people.map(p => [p.id, `${p.ad} ${p.soyad}`])), [people]);
    const projectsMap = useMemo(() => new Map(projects.map(p => [p.id, p.name])), [projects]);

    const { filteredDonations, monthlyTotal, donorCount, averageDonation } = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        let currentMonthlyTotal = 0;
        
        donations.forEach(d => {
            if (new Date(d.tarih) >= firstDayOfMonth) {
                currentMonthlyTotal += d.tutar;
            }
        });

        const allDonors = new Set(donations.map(d => d.bagisciId));
        
        const filtered = donations.filter(d => {
            const donorName = peopleMap.get(d.bagisciId)?.toLowerCase() || '';
            const matchesSearch = donorName.includes(filters.searchTerm.toLowerCase()) || d.makbuzNo.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesType = filters.typeFilter === 'all' || d.bagisTuru === filters.typeFilter;
            return matchesSearch && matchesType;
        });

        return {
            filteredDonations: filtered,
            monthlyTotal: currentMonthlyTotal,
            donorCount: allDonors.size,
            averageDonation: donations.length > 0 ? (donations.reduce((acc, curr) => acc + curr.tutar, 0) / donations.length) : 0
        };
    }, [donations, filters, peopleMap]);

    const handleSaveDonation = async (donationToSave: Partial<Bagis>) => {
        const isNew = !donationToSave.id;
        const promise = isNew
            ? createBagis(donationToSave as Omit<Bagis, 'id'>)
            : updateBagis(donationToSave.id!, donationToSave);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsFormModalOpen(false);
                setEditingDonation(null);
                return isNew ? 'Bağış başarıyla eklendi!' : 'Bağış başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };
    
    const handleDeleteClick = (id: number) => {
        if(window.confirm('Bu bağış kaydını silmek istediğinizden emin misiniz?')) {
            toast.promise(deleteBagis(id), {
                loading: 'Siliniyor...',
                success: () => {
                    refresh();
                    return 'Bağış başarıyla silindi!';
                },
                error: 'Bir hata oluştu.',
            });
        }
    };

    const columns = useMemo(() => [
        { key: 'bagisciId', title: 'Bağışçı', render: (d: Bagis) => peopleMap.get(d.bagisciId) || 'Bilinmeyen Kişi' },
        { key: 'tutar', title: 'Tutar', render: (d: Bagis) => <span className="font-semibold text-green-600">{d.tutar.toLocaleString('tr-TR', { style: 'currency', currency: d.paraBirimi })}</span> },
        { key: 'bagisTuru', title: 'Tür', render: (d: Bagis) => d.bagisTuru },
        { key: 'tarih', title: 'Tarih', render: (d: Bagis) => new Date(d.tarih).toLocaleDateString('tr-TR') },
        { key: 'projeId', title: 'İlişkili Proje', render: (d: Bagis) => d.projeId ? projectsMap.get(d.projeId) : '-' },
        { key: 'actions', title: 'İşlemler', render: (d: Bagis) => (
             <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setReceiptDonation(d); setIsReceiptModalOpen(true); }}>Makbuz</Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditingDonation(d); setIsFormModalOpen(true); }}>Düzenle</Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(d.id)}>Sil</Button>
            </div>
        )}
    ], [peopleMap, projectsMap]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Bağış Yönetimi">
                <Button onClick={() => { setEditingDonation({}); setIsFormModalOpen(true); }}>Yeni Bağış Ekle</Button>
            </PageHeader>
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Bu Ayki Toplam Bağış" value={monthlyTotal.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} color="success" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>} />
                    <StatCard title="Toplam Bağışçı Sayısı" value={donorCount.toString()} color="primary" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.308l.143-.143-1.05-1.05a2.25 2.25 0 0 1-1.586-.858c-.035-.052-.072-.105-.108-.158l-1.3-1.3a2.25 2.25 0 0 0-3.182 0l-1.3 1.3a2.25 2.25 0 0 1-1.585.858l-1.05 1.05a9.337 9.337 0 0 0 4.121 2.308M15 19.128v-2.828l-1.3-1.3a2.25 2.25 0 0 0-3.182 0l-1.3 1.3a2.25 2.25 0 0 1-1.585.858l-1.05 1.05a9.337 9.337 0 0 0 4.121 2.308M12 6.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 0a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-4.5 0a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 0a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm9 0a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm0 0a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" /></svg>} />
                    <StatCard title="Ortalama Bağış Miktarı" value={averageDonation.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} color="warning" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>} />
                </div>
                <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input type="text" placeholder="Bağışçı adı veya makbuz no..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                        <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Bağış Türleri'}, ...Object.values(BagisTuru).map(tur => ({value: tur, label: tur}))]} />
                    </div>
                    <Table columns={columns} data={filteredDonations} />
                </div>
            </div>

            {isFormModalOpen && editingDonation && (
                <BagisFormModal
                    donation={editingDonation}
                    people={people}
                    projects={projects}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSaveDonation}
                />
            )}
            {isReceiptModalOpen && receiptDonation && (
                <MakbuzModal
                    donation={receiptDonation}
                    donorName={peopleMap.get(receiptDonation.bagisciId) || 'Bilinmeyen Kişi'}
                    onClose={() => setIsReceiptModalOpen(false)}
                />
            )}
        </>
    );
};

const BagisFormModal: React.FC<{ donation: Partial<Bagis>, people: Person[], projects: Proje[], onClose: () => void, onSave: (d: Partial<Bagis>) => void }> = ({ donation, people, projects, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Bagis>>(donation);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'tutar' || name === 'bagisciId' || name === 'projeId' ? parseFloat(value) || value : value}));
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return (
        <Modal isOpen={true} onClose={onClose} title={donation.id ? 'Bağış Düzenle' : 'Yeni Bağış Ekle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Select label="Bağışçı" name="bagisciId" value={formData.bagisciId || ''} onChange={handleChange} options={[{value: '', label: 'Kişi seçin...'}, ...people.map(p => ({value: p.id, label: `${p.ad} ${p.soyad}`}))]} required /></div>
                    <Input label="Tutar" type="number" step="0.01" name="tutar" value={formData.tutar || ''} onChange={handleChange} required />
                    <Select label="Para Birimi" name="paraBirimi" value={formData.paraBirimi || 'TRY'} onChange={handleChange} options={[{value: 'TRY', label: 'TRY'}, {value: 'USD', label: 'USD'}, {value: 'EUR', label: 'EUR'}]} />
                    <Select label="Bağış Türü" name="bagisTuru" value={formData.bagisTuru || ''} onChange={handleChange} options={[{value: '', label: 'Seçiniz...'}, ...Object.values(BagisTuru).map(t => ({value: t, label: t}))]} required />
                    <Input label="Tarih" type="date" name="tarih" value={formData.tarih || new Date().toISOString().split('T')[0]} onChange={handleChange} required />
                    <div className="md:col-span-2"><Select label="İlişkili Proje (İsteğe Bağlı)" name="projeId" value={formData.projeId || ''} onChange={handleChange} options={[{value: '', label: 'Yok'}, ...projects.map(p => ({value: p.id, label: p.name}))]} /></div>
                    <div className="md:col-span-2"><Input label="Makbuz No" name="makbuzNo" value={formData.makbuzNo || ''} onChange={handleChange} /></div>
                    <div className="md:col-span-2"><Textarea label="Açıklama" name="aciklama" value={formData.aciklama || ''} onChange={handleChange} rows={3} /></div>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                </div>
            </form>
        </Modal>
    );
};

const MakbuzModal: React.FC<{ donation: Bagis, donorName: string, onClose: () => void }> = ({ donation, donorName, onClose }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);
    const handlePrint = () => {
        const printContent = printAreaRef.current?.innerHTML;
        if(printContent) {
            const printWindow = window.open('', '_blank');
            if(printWindow) {
                printWindow.document.write(`<html><head><title>Makbuz</title><style>body { font-family: sans-serif; margin: 2rem; } .receipt { border: 1px solid #ccc; padding: 2rem; max-width: 600px; margin: auto; } h1 { text-align: center; } table { width: 100%; border-collapse: collapse; margin-top: 2rem; } th, td { border: 1px solid #eee; padding: 0.75rem; text-align: left; } th { background-color: #f8f8f8; } .footer { margin-top: 2rem; text-align: center; font-size: 0.9rem; color: #777; }</style></head><body>${printContent}<script>window.onload=function(){window.print();window.close();}</script></body></html>`);
                printWindow.document.close();
            }
        }
    };
    return (
        <Modal isOpen={true} onClose={onClose} title="Bağış Makbuzu">
            <div ref={printAreaRef} className="receipt">
                <h1 className="text-2xl font-bold text-center">KAFKASDER BAĞIŞ MAKBUZU</h1>
                <p className="text-center text-sm text-slate-500">Makbuz No: {donation.makbuzNo}</p>
                <table className="mt-6 w-full">
                    <tbody>
                        <tr><th className="w-1/3 p-2 bg-slate-50">Tarih</th><td className="p-2">{new Date(donation.tarih).toLocaleDateString('tr-TR')}</td></tr>
                        <tr><th className="p-2 bg-slate-50">Bağışçı</th><td className="p-2 font-semibold">{donorName}</td></tr>
                        <tr><th className="p-2 bg-slate-50">Tutar</th><td className="p-2 font-bold text-xl">{donation.tutar.toLocaleString('tr-TR', { style: 'currency', currency: donation.paraBirimi })}</td></tr>
                        <tr><th className="p-2 bg-slate-50">Açıklama</th><td className="p-2">{donation.aciklama || donation.bagisTuru}</td></tr>
                    </tbody>
                </table>
                <div className="footer mt-8 text-center text-slate-600">
                    <p>Yaptığınız bu değerli bağış için KAFKASDER adına teşekkür ederiz.</p>
                </div>
            </div>
            <div className="pt-6 mt-6 border-t flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>Kapat</Button>
                <Button type="button" variant="primary" onClick={handlePrint}>Yazdır</Button>
            </div>
        </Modal>
    );
};

export default BagisYonetimi;