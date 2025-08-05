import React, { useState, useMemo, useRef } from 'react';
import { Kumbara, KumbaraStatus, KumbaraType, FinansalIslemTuru, HesapKategorisi } from '../types.ts';
import { createKumbara, updateKumbara, deleteKumbara, createFinansalKayit } from '../services/apiService.ts';
import { usePiggyBanks } from '../hooks/useData.ts';
import toast from 'react-hot-toast';
import { PageHeader, Table, Input, Select, Button } from './ui';
import Modal from './Modal.tsx';

const getStatusClass = (status: KumbaraStatus) => {
    return status === KumbaraStatus.AKTIF ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

const KumbaraYonetimi: React.FC = () => {
    const { data: kumbaralar, isLoading, error, refresh } = usePiggyBanks();
    
    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as KumbaraStatus | 'all',
        typeFilter: 'all' as KumbaraType | 'all',
    });

    const [modal, setModal] = useState<'form' | 'bosalt' | 'qr' | null>(null);
    const [selectedKumbara, setSelectedKumbara] = useState<Partial<Kumbara> | null>(null);
    
    const filteredKumbaralar = useMemo(() => {
        return (kumbaralar || []).filter(kumbara => {
            const matchesSearch = kumbara.code.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                                  kumbara.location.toLowerCase().includes(filters.searchTerm.toLowerCase());
            const matchesStatus = filters.statusFilter === 'all' || kumbara.status === filters.statusFilter;
            const matchesType = filters.typeFilter === 'all' || kumbara.type === filters.typeFilter;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [kumbaralar, filters]);

    const handleSaveKumbara = async (kumbaraToSave: Partial<Kumbara>) => {
        const isNew = !kumbaraToSave.id;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                if (isNew) {
                    const newKumbaraPayload = {
                        ...kumbaraToSave, balance: 0, lastEmptied: null,
                        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(kumbaraToSave.code!)}`
                    };
                    await createKumbara(newKumbaraPayload as Omit<Kumbara, 'id'>);
                } else {
                    await updateKumbara(kumbaraToSave.id!, kumbaraToSave);
                }
                setModal(null);
                setSelectedKumbara(null);
                refresh();
                resolve();
            } catch (err) { reject(err); }
        });
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: isNew ? 'Kumbara başarıyla eklendi!' : 'Kumbara başarıyla güncellendi!',
            error: 'Bir hata oluştu.',
        });
    };
    
    const handleSaveBosaltma = async (kumbaraId: number, toplananTutar: number) => {
        const kumbara = kumbaralar.find(k => k.id === kumbaraId);
        if(!kumbara) return;

        const promise = new Promise<void>(async (resolve, reject) => {
             try {
                await createFinansalKayit({
                    tarih: new Date().toISOString().split('T')[0],
                    aciklama: `Kumbara Boşaltma: ${kumbara.code} - ${kumbara.location}`,
                    tur: FinansalIslemTuru.GELIR,
                    kategori: HesapKategorisi.BAGIS,
                    tutar: toplananTutar,
                });
                await updateKumbara(kumbaraId, { balance: 0, lastEmptied: new Date().toISOString() });
                setModal(null);
                setSelectedKumbara(null);
                refresh();
                resolve();
            } catch(err) { reject(err); }
        });

         toast.promise(promise, {
            loading: 'İşlem yapılıyor...',
            success: 'Kumbara boşaltıldı ve gelir olarak kaydedildi!',
            error: 'Bir hata oluştu.',
        });
    };

    const columns = useMemo(() => [
        { key: 'code', title: 'Kod', render: (k: Kumbara) => k.code },
        { key: 'location', title: 'Konum', render: (k: Kumbara) => k.location },
        { key: 'type', title: 'Türü', render: (k: Kumbara) => k.type },
        { key: 'balance', title: 'Bakiye', render: (k: Kumbara) => k.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) },
        { key: 'lastEmptied', title: 'Son Boşaltma', render: (k: Kumbara) => k.lastEmptied ? new Date(k.lastEmptied).toLocaleDateString('tr-TR') : 'Hiç' },
        { key: 'status', title: 'Durum', render: (k: Kumbara) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(k.status)}`}>{k.status}</span> },
        { key: 'actions', title: 'İşlemler', render: (k: Kumbara) => (
            <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedKumbara(k); setModal('qr'); }}>QR Kod</Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedKumbara(k); setModal('bosalt'); }}>Boşalt</Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedKumbara(k); setModal('form'); }}>Düzenle</Button>
            </div>
        )},
    ], []);
    
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Kumbara Yönetimi">
                <Button onClick={() => { setSelectedKumbara({}); setModal('form'); }}>Yeni Kumbara Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input type="text" placeholder="Kod veya konuma göre ara..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                    <Select value={filters.typeFilter} onChange={e => setFilters(f => ({...f, typeFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Tipler'}, ...Object.values(KumbaraType).map(v => ({value: v, label: v}))]} />
                    <Select value={filters.statusFilter} onChange={e => setFilters(f => ({...f, statusFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Durumlar'}, ...Object.values(KumbaraStatus).map(v => ({value: v, label: v}))]} />
                </div>
                <Table columns={columns} data={filteredKumbaralar} />
            </div>

            {modal === 'form' && selectedKumbara && <KumbaraFormModal kumbara={selectedKumbara} onClose={() => setModal(null)} onSave={handleSaveKumbara} />}
            {modal === 'bosalt' && selectedKumbara && <BosaltModal kumbara={selectedKumbara as Kumbara} onClose={() => setModal(null)} onSave={handleSaveBosaltma} />}
            {modal === 'qr' && selectedKumbara && <QrCodeModal kumbara={selectedKumbara as Kumbara} onClose={() => setModal(null)} />}
        </>
    );
};

// Modals
const KumbaraFormModal: React.FC<{ kumbara: Partial<Kumbara>, onClose: () => void, onSave: (kumbara: Partial<Kumbara>) => void}> = ({ kumbara, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Kumbara>>(kumbara);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as Kumbara); };
    return (
        <Modal isOpen={true} onClose={onClose} title={kumbara.id ? 'Kumbara Bilgilerini Düzenle' : 'Yeni Kumbara Ekle'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Kumbara Kodu" name="code" value={formData.code || ''} onChange={handleChange} required />
                    <div className="md:col-span-2"><Input label="Konum" name="location" value={formData.location || ''} onChange={handleChange} required /></div>
                    <Select label="Türü" name="type" value={formData.type || ''} onChange={handleChange} options={Object.values(KumbaraType).map(v=>({value:v, label:v}))} required/>
                    <Select label="Durum" name="status" value={formData.status || ''} onChange={handleChange} options={Object.values(KumbaraStatus).map(v=>({value:v, label:v}))} required/>
                </div>
                <div className="pt-4 flex justify-end space-x-3"><Button type="button" variant="outline" onClick={onClose}>İptal</Button><Button type="submit">Kaydet</Button></div>
            </form>
        </Modal>
    )
};

const BosaltModal: React.FC<{ kumbara: Kumbara, onClose: () => void, onSave: (kumbaraId: number, toplananTutar: number) => void }> = ({ kumbara, onClose, onSave }) => {
    const [toplananTutar, setToplananTutar] = useState<number>(kumbara.balance);
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(kumbara.id, toplananTutar); };
    return (
        <Modal isOpen={true} onClose={onClose} title={`Kumbara Boşalt: ${kumbara.code}`}>
             <form onSubmit={handleSubmit} className="space-y-4">
                <p><strong>Konum:</strong> {kumbara.location}</p>
                <p>Mevcut Bakiye: <span className="font-bold">{kumbara.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span></p>
                <Input label="Toplanan Tutar (TL)" type="number" value={toplananTutar} onChange={(e) => setToplananTutar(Number(e.target.value))} required />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Bu tutar yeni bir gelir kaydı olarak işlenecek ve kumbara bakiyesi sıfırlanacaktır.</p>
                <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit" variant="primary">Boşaltma İşlemini Onayla</Button>
                 </div>
             </form>
        </Modal>
    );
};

const QrCodeModal: React.FC<{ kumbara: Kumbara, onClose: () => void }> = ({ kumbara, onClose }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);
    const handlePrint = () => {
        const printContent = printAreaRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<html><head><title>QR Kod Yazdır - ${kumbara.code}</title><style>body { font-family: sans-serif; text-align: center; padding-top: 50px; } img { max-width: 80%; } h3 { font-size: 1.5rem; } p { font-family: monospace; font-size: 1.2rem; }</style></head><body>${printContent}<script>window.onload = function() { window.print(); window.close(); }</script></body></html>`);
                printWindow.document.close();
            }
        }
    };
    return (
        <Modal isOpen={true} onClose={onClose} title={`QR Kod: ${kumbara.code}`}>
            <div className="text-center">
                <div ref={printAreaRef}>
                    <h3 className="text-xl font-bold mb-2">{kumbara.location}</h3>
                    <img src={kumbara.qrCodeUrl} alt={`QR Code for ${kumbara.code}`} className="mx-auto w-64 h-64 rounded-lg" />
                    <p className="font-mono mt-2 text-lg">{kumbara.code}</p>
                </div>
                 <div className="pt-4 mt-4 border-t flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>Kapat</Button>
                    <Button type="button" onClick={handlePrint}>Yazdır</Button>
                 </div>
            </div>
        </Modal>
    );
};

export default KumbaraYonetimi;