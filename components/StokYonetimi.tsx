import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DepoUrunu, DepoUrunKategorisi, DepoUrunBirimi } from '../types.ts';
import { createDepoUrunu, updateDepoUrunu } from '../services/apiService.ts';
import { useStockItems } from '../hooks/useData.ts';
import toast from 'react-hot-toast';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { PageHeader, Table, Input, Select, Button } from './ui';
import Modal from './Modal.tsx';

declare var JsBarcode: any;

const getRowClass = (urun: DepoUrunu) => {
    if (urun.quantity <= urun.minStockLevel) return 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30';
    if (urun.quantity <= urun.minStockLevel * 1.2) return 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30';
    return 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50';
};

const getExpirationInfo = (expirationDate?: string) => {
    if (!expirationDate) return { text: 'Yok', className: 'text-zinc-500' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = expDate.toLocaleDateString('tr-TR');

    if (diffDays < 0) return { text: `${formattedDate}`, className: 'text-red-600 font-bold', expired: true };
    if (diffDays <= 30) return { text: `${formattedDate}`, className: 'text-yellow-600 font-bold', expired: false };
    return { text: formattedDate, className: 'text-zinc-700 dark:text-zinc-300', expired: false };
};

const StokYonetimi: React.FC = () => {
    const { data: depo, isLoading, error, refresh } = useStockItems();
    
    const [filters, setFilters] = useState({ searchTerm: '', categoryFilter: 'all' as DepoUrunKategorisi | 'all' });
    const [modal, setModal] = useState<'form' | 'scanner' | 'print' | null>(null);
    const [selectedUrun, setSelectedUrun] = useState<Partial<DepoUrunu> | null>(null);

    const filteredDepo = useMemo(() => {
        return depo.filter(urun => {
            const lowerSearchTerm = filters.searchTerm.toLowerCase();
            const matchesSearch = urun.name.toLowerCase().includes(lowerSearchTerm) ||
                                  urun.code.toLowerCase().includes(lowerSearchTerm) ||
                                  (urun.barcode && urun.barcode.includes(lowerSearchTerm));
            const matchesCategory = filters.categoryFilter === 'all' || urun.category === filters.categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [depo, filters]);

    const handleSaveUrun = async (urunToSave: Partial<DepoUrunu>) => {
        const isNew = !urunToSave.id;
        const promise = isNew 
            ? createDepoUrunu({ ...urunToSave, lastUpdated: new Date().toISOString() } as Omit<DepoUrunu, 'id'>)
            : updateDepoUrunu(urunToSave.id!, urunToSave);
        
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setModal(null);
                return isNew ? 'Ürün başarıyla eklendi!' : 'Ürün başarıyla güncellendi!';
            },
            error: 'Bir hata oluştu.',
        });
    };

    const handleBarcodeScan = (code: string) => {
        setFilters(f => ({ ...f, searchTerm: code }));
        setModal(null);
    };

    const columns = useMemo(() => [
        { key: 'name', title: 'Ürün Adı / Kodu', render: (value: any, u: DepoUrunu) => <div><div className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</div><div className="text-xs text-zinc-500">{u.code}</div></div> },
        { key: 'barcode', title: 'Barkod', render: (value: any, u: DepoUrunu) => <span className="font-mono">{u.barcode || '-'}</span> },
        { key: 'category', title: 'Kategori', render: (value: any, u: DepoUrunu) => u.category },
        { key: 'quantity', title: 'Miktar', render: (value: any, u: DepoUrunu) => `${u.quantity} ${u.unit}` },
        { key: 'expiration', title: 'SKT', render: (value: any, u: DepoUrunu) => {
            const expInfo = getExpirationInfo(u.expirationDate);
            return <span className={expInfo.className}>{expInfo.text} {expInfo.expired && <span className="text-xs font-normal">(GEÇMİŞ)</span>}</span>;
        }},
        { key: 'actions', title: 'İşlemler', render: (value: any, u: DepoUrunu) => (
            <div className="flex items-center justify-end space-x-1">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUrun(u); setModal('print'); }}>Barkod</Button>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedUrun(u); setModal('form'); }}>Düzenle</Button>
            </div>
        )},
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Depo & Stok Yönetimi">
                <Button onClick={() => { setSelectedUrun({}); setModal('form'); }}>Yeni Ürün Ekle</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex">
                        <Input className="rounded-r-none" type="text" placeholder="Kod, ürün adı veya barkod..." value={filters.searchTerm} onChange={e => setFilters(f => ({...f, searchTerm: e.target.value}))} />
                        <Button variant="outline" className="rounded-l-none border-l-0" onClick={() => setModal('scanner')}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg></Button>
                    </div>
                    <Select value={filters.categoryFilter} onChange={e => setFilters(f => ({...f, categoryFilter: e.target.value as any}))} options={[{value: 'all', label: 'Tüm Kategoriler'}, ...Object.values(DepoUrunKategorisi).map(c => ({value: c, label: c}))]} />
                </div>
                <Table<DepoUrunu> columns={columns} data={filteredDepo} rowClassName={getRowClass} />
            </div>
            
            {modal === 'form' && selectedUrun && <UrunFormModal urun={selectedUrun} onClose={() => setModal(null)} onSave={handleSaveUrun} />}
            {modal === 'scanner' && <BarcodeScannerModal onClose={() => setModal(null)} onScan={handleBarcodeScan} />}
            {modal === 'print' && selectedUrun && <BarcodePrintModal urun={selectedUrun as DepoUrunu} onClose={() => setModal(null)} />}
        </>
    );
};

// Modals
const UrunFormModal: React.FC<{ urun: Partial<DepoUrunu>; onClose: () => void; onSave: (urun: Partial<DepoUrunu>) => void; }> = ({ urun, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<DepoUrunu>>(urun);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData(p => ({...p, [e.target.name]: e.target.value}));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData as DepoUrunu); };
    return (
        <Modal isOpen={true} onClose={onClose} title={urun.id ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Ürün Adı" name="name" value={formData.name || ''} onChange={handleChange} required />
                    <Input label="Ürün Kodu" name="code" value={formData.code || ''} onChange={handleChange} required />
                    <Input label="Barkod" name="barcode" value={formData.barcode || ''} onChange={handleChange} />
                    <Select label="Kategori" name="category" value={formData.category || ''} onChange={handleChange} options={Object.values(DepoUrunKategorisi).map(c=>({value:c,label:c}))} required />
                    <Select label="Birim" name="unit" value={formData.unit || ''} onChange={handleChange} options={Object.values(DepoUrunBirimi).map(u=>({value:u,label:u}))} required />
                    <Input label="Mevcut Miktar" type="number" name="quantity" value={formData.quantity || 0} onChange={handleChange} required />
                    <Input label="Minimum Stok Seviyesi" type="number" name="minStockLevel" value={formData.minStockLevel || 0} onChange={handleChange} required />
                    <Input label="Son Kullanma Tarihi" type="date" name="expirationDate" value={formData.expirationDate || ''} onChange={handleChange} />
                    <Input label="Raf Konumu" name="shelfLocation" value={formData.shelfLocation || ''} onChange={handleChange} />
                 </div>
                 <div className="pt-4 flex justify-end space-x-3"><Button type="button" variant="outline" onClick={onClose}>İptal</Button><Button type="submit">Kaydet</Button></div>
            </form>
        </Modal>
    );
};

const BarcodeScannerModal: React.FC<{ onClose: () => void; onScan: (code: string) => void; }> = ({ onClose, onScan }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef(new BrowserMultiFormatReader());
    const [scanError, setScanError] = useState('');

    useEffect(() => {
        const codeReader = codeReaderRef.current;
        BrowserMultiFormatReader.listVideoInputDevices().then(videoInputDevices => {
            if (videoInputDevices.length > 0 && videoRef.current) {
                codeReader.decodeFromVideoDevice(videoInputDevices[0].deviceId, videoRef.current, (result, err) => {
                    if (result) { onScan(result.getText()); (codeReader as any).reset(); }
                    if (err && err.name !== 'NotFoundException') { setScanError('Barkod okuma hatası.'); }
                });
            } else { setScanError("Kamera bulunamadı."); }
        }).catch(() => setScanError("Kamera erişim hatası."));
        return () => (codeReader as any).reset();
    }, [onScan]);
    
    return (
         <Modal isOpen={true} onClose={onClose} title="Barkod Tara">
            <div>
                <video ref={videoRef} className="w-full h-auto bg-zinc-900 rounded-md"></video>
                {scanError && <p className="text-red-500 text-sm mt-2">{scanError}</p>}
            </div>
             <div className="pt-4 mt-4 border-t flex justify-end"><Button type="button" variant="outline" onClick={onClose}>Kapat</Button></div>
        </Modal>
    );
};

const BarcodePrintModal: React.FC<{ urun: DepoUrunu, onClose: () => void; }> = ({ urun, onClose }) => {
     useEffect(() => {
        if (urun.barcode) { try { JsBarcode("#barcode", urun.barcode, { width: 2, height: 80, displayValue: true }); } catch(e) { console.error("Barkod hatası:", e); } }
    }, [urun]);
    const handlePrint = () => {
        const printContent = document.getElementById('print-area')?.innerHTML;
        const printWindow = window.open('', '_blank');
        if(printWindow && printContent){ printWindow.document.write(`<html><head><title>Barkod Yazdır</title><style>body{text-align:center;margin-top:2rem}</style></head><body>${printContent}<script>window.onload=function(){window.print();window.close()}</script></body></html>`); printWindow.document.close(); }
    }
    return (
        <Modal isOpen={true} onClose={onClose} title="Barkod Yazdır">
            <div id="print-area" className="text-center p-4 flex flex-col items-center">
                <h3 className="text-lg font-bold">{urun.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{urun.code}</p>
                {urun.barcode ? <svg id="barcode"></svg> : <p className="text-red-500 my-8">Bu ürün için barkod tanımlanmamış.</p>}
            </div>
            <div className="pt-4 mt-4 border-t flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>Kapat</Button>
                <Button type="button" onClick={handlePrint} disabled={!urun.barcode}>Yazdır</Button>
            </div>
        </Modal>
    )
}

export default StokYonetimi;