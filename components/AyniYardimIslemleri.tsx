import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AyniYardimIslemi, Person, DepoUrunu } from '../types';
import { createAyniYardimIslemi } from '../services/apiService';
import { useAyniYardimIslemleri } from '../hooks/useData';
import { PageHeader, Table, Input, Select, Textarea, Button } from './ui';
import Modal from './Modal.tsx';
import { getPersonFullName } from '../utils/compat';

const AyniYardimIslemleri: React.FC = () => {
    const { data, isLoading, error, refresh } = useAyniYardimIslemleri();
    const { islemler, people, products } = data;

    const [isModalOpen, setIsModalOpen] = useState(false);

    const peopleMap = useMemo(() => new Map(people.map(p => [String(p.id), getPersonFullName(p)])), [people]);
    const productsMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);
    
    const handleSaveIslem = async (newIslem: Omit<AyniYardimIslemi, 'id'>) => {
        const promise = createAyniYardimIslemi(newIslem);
        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: () => {
                refresh();
                setIsModalOpen(false);
                return 'Yardım çıkışı başarıyla kaydedildi!';
            },
            error: (err) => err.message || 'Bir hata oluştu.'
        });
    };

    const columns = useMemo(() => [
        { key: 'tarih', title: 'Tarih', render: (i: AyniYardimIslemi) => new Date(i.tarih).toLocaleDateString('tr-TR')},
        { key: 'kisiId', title: 'Yardım Alan Kişi', render: (i: AyniYardimIslemi) => peopleMap.get(String(i.kisiId)) || 'Bilinmeyen Kişi'},
        { key: 'urunId', title: 'Verilen Ürün', render: (i: AyniYardimIslemi) => productsMap.get(i.urunId) || 'Bilinmeyen Ürün'},
        { key: 'miktar', title: 'Miktar', render: (i: AyniYardimIslemi) => `${i.miktar} ${i.birim}`},
        { key: 'notlar', title: 'Notlar', render: (i: AyniYardimIslemi) => i.notlar || '-'},
    ], [peopleMap, productsMap]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <PageHeader title="Ayni Yardım İşlemleri">
                <Button onClick={() => setIsModalOpen(true)}>Yeni Yardım Çıkışı</Button>
            </PageHeader>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <Table columns={columns} data={islemler} />
            </div>
            {isModalOpen && (
                <AyniYardimFormModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveIslem}
                    people={people}
                    products={products}
                />
            )}
        </>
    );
};


const AyniYardimFormModal: React.FC<{
    onClose: () => void;
    onSave: (islem: Omit<AyniYardimIslemi, 'id'>) => void;
    people: Person[];
    products: DepoUrunu[];
}> = ({ onClose, onSave, people, products }) => {
    
    const [formData, setFormData] = useState({
        kisiId: '',
        urunId: '',
        miktar: 1,
        notlar: '',
    });
    const [error, setError] = useState('');
    
    const selectedProduct = useMemo(() => {
        return products.find(p => String(p.id) === formData.urunId);
    }, [formData.urunId, products]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!selectedProduct) {
            setError('Lütfen geçerli bir ürün seçin.');
            return;
        }
        
        if (Number(formData.miktar) > selectedProduct.quantity) {
            setError(`Yetersiz stok! Mevcut: ${selectedProduct.quantity} ${selectedProduct.unit}.`);
            return;
        }

        onSave({
            kisiId: Number(formData.kisiId),
            urunId: Number(formData.urunId),
            miktar: Number(formData.miktar),
            birim: selectedProduct.unit,
            tarih: new Date().toISOString().split('T')[0],
            notlar: formData.notlar,
        });
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title="Yeni Ayni Yardım Çıkışı">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select label="Yardım Yapılacak Kişi" name="kisiId" value={formData.kisiId} onChange={handleChange} options={[{value: '', label: 'Kişi Seçin...'}, ...people.map(p => ({value: p.id, label: getPersonFullName(p)}))]} required />
                <Select label="Depodan Verilecek Ürün" name="urunId" value={formData.urunId} onChange={handleChange} options={[{value: '', label: 'Ürün Seçin...'}, ...products.filter(p => p.quantity > 0).map(p => ({value: p.id, label: `${p.name} (Stok: ${p.quantity} ${p.unit})`}))]} required />
                <Input label="Miktar" type="number" name="miktar" value={formData.miktar} onChange={handleChange} min="1" max={selectedProduct?.quantity || 1} required />
                <Textarea label="Notlar" name="notlar" value={formData.notlar} onChange={handleChange} placeholder="Teslimat notu, özel durum vb." />
                {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
                <div className="pt-4 flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
                    <Button type="submit">Yardım Çıkışını Kaydet</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AyniYardimIslemleri;
