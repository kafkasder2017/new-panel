import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Odeme, OdemeDurumu, OdemeTuru, OdemeYontemi } from '../types.ts';
import { createOdeme, updateOdeme } from '../services/apiService.ts';
import { usePayments } from '../hooks/useData.ts';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: OdemeDurumu) => {
    switch (status) {
        case OdemeDurumu.TAMAMLANAN: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case OdemeDurumu.BEKLEYEN: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case OdemeDurumu.IPTAL: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const OdemeYonetimi: React.FC = () => {
    const { data: payments, isLoading, error, refresh } = usePayments();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as OdemeDurumu | 'all',
        typeFilter: 'all' as OdemeTuru | 'all',
        methodFilter: 'all' as OdemeYontemi | 'all',
    });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Partial<Odeme> | null>(null);

    const filteredOdemeler = useMemo(() => {
        return payments.filter(odeme => {
            const matchesSearch = odeme.kisi.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  odeme.aciklama.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || odeme.durum === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || odeme.odemeTuru === filters.typeFilter;
            const matchesMethod = filters.methodFilter === 'all' || odeme.odemeYontemi === filters.methodFilter;
            return matchesSearch && matchesStatus && matchesType && matchesMethod;
        }).sort((a, b) => new Date(b.odemeTarihi).getTime() - new Date(a.odemeTarihi).getTime());
    }, [payments, filters]);
    
    const handleStatusChange = (id: number, newStatus: OdemeDurumu) => {
        const promise = updateOdeme(id, { durum: newStatus });
        toast.promise(promise, {
            loading: 'Durum güncelleniyor...',
            success: () => {
                refresh();
                return 'Durum başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleSavePayment = (paymentData: Partial<Odeme>) => {
        const isNew = !paymentData.id;
        const promise = isNew 
            ? createOdeme(paymentData as Omit<Odeme, 'id'>)
            : updateOdeme(paymentData.id!, paymentData);

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                setEditingPayment(null);
                return isNew ? 'Ödeme başarıyla eklendi!' : 'Ödeme başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };
    
    const columns = useMemo(() => [
        { key: 'person', title: 'İşlem Türü / Kişi', render: (o: Odeme) => <div><div className="font-medium text-zinc-900 dark:text-zinc-100">{o.kisi}</div><div className="text-xs text-zinc-500">{o.odemeTuru}</div></div> },
        { key: 'amount', title: 'Tutar', render: (o: Odeme) => <span className={`font-semibold ${o.odemeTuru === OdemeTuru.BAGIS_GIRISI ? 'text-green-600' : 'text-red-600'}`}>{o.odemeTuru === OdemeTuru.BAGIS_GIRISI ? '+' : '-'} {o.tutar.toLocaleString('tr-TR', { style: 'currency', currency: o.paraBirimi })}</span> },
        { key: 'method', title: 'Yöntem', render: (o: Odeme) => o.odemeYontemi },
        { key: 'date', title: 'Tarih', render: (o: Odeme) => new Date(o.odemeTarihi).toLocaleDateString('tr-TR') },
        { key: 'status', title: 'Durum', render: (o: Odeme) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(o.durum)}`}>{o.durum}</span> },
        { key: 'actions', title: 'İşlemler', render: (o: Odeme) => (
             <div className="flex items-center justify-end space-x-1">
                {o.durum === OdemeDurumu.BEKLEYEN && <Button variant="ghost" size="sm" onClick={() => handleStatusChange(o.id, OdemeDurumu.TAMAMLANAN)}>Onayla</Button>}
                <Button variant="ghost" size="sm" onClick={() => { setEditingPayment(o); setIsModalOpen(true); }}>Düzenle</Button>
                {o.durum !== OdemeDurumu.IPTAL && <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleStatusChange(o.id, OdemeDurumu.IPTAL)}>İptal</Button>}
            </div>
        )}
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Banka Ödeme Emirleri">
                <Button onClick={() => { setEditingPayment({}); setIsModalOpen(true); }}>Yeni Ödeme Kaydı</Button>
            </PageHeader>
             <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                    <div className="lg:col-span-1"><Input type="text" placeholder="Kişi veya açıklama ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))}/></div>
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm İşlem Türleri'}, ...Object.values(OdemeTuru).map(v => ({value: v, label: v}))]} />
                    <Select value={filters.methodFilter} onChange={e => setFilters(f => ({...f, methodFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Yöntemler'}, ...Object.values(OdemeYontemi).map(v => ({value: v, label: v}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(OdemeDurumu).map(v => ({value: v, label: v}))]} />
                </div>
                <Table columns={columns} data={filteredOdemeler} />
            </div>
            {isModalOpen && (
                <OdemeFormModal 
                    payment={editingPayment} 
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSavePayment}
                />
            )}
        </>
    );
};

const OdemeFormModal: React.FC<{ payment: Partial<Odeme> | null, onClose: () => void, onSave: (payment: Partial<Odeme>) => void }> = ({ payment, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Odeme>>(payment || {});
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(prev => ({...prev, [e.target.name]: e.target.name === 'tutar' ? parseFloat(e.target.value) : e.target.value}));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal isOpen={true} onClose={onClose} title={payment?.id ? "Ödeme Kaydını Düzenle" : "Yeni Ödeme Kaydı"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Input label="Kişi / Kurum" name="kisi" value={formData.kisi || ''} onChange={handleChange} required /></div>
                    <Select label="İşlem Türü" name="odemeTuru" value={formData.odemeTuru || ''} onChange={handleChange} options={[{value: '', label: 'Seçiniz...'}, ...Object.values(OdemeTuru).map(v => ({value: v, label: v}))]} required />
                    <Input label="Tutar" type="number" step="0.01" name="tutar" value={formData.tutar || ''} onChange={handleChange} required />
                    <Select label="Ödeme Yöntemi" name="odemeYontemi" value={formData.odemeYontemi || ''} onChange={handleChange} options={[{value: '', label: 'Seçiniz...'}, ...Object.values(OdemeYontemi).map(v => ({value: v, label: v}))]} required />
                    <Input label="Ödeme Tarihi" type="date" name="odemeTarihi" value={formData.odemeTarihi || new Date().toISOString().split('T')[0]} onChange={handleChange} required />
                    <div className="md:col-span-2"><Textarea label="Açıklama" name="aciklama" value={formData.aciklama || ''} onChange={handleChange} rows={3} required /></div>
                </div>
                <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Kaydet</Button>
                </div>
            </form>
        </Modal>
    );
};

export default OdemeYonetimi;