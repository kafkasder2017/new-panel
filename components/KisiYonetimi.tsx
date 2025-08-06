
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Person, PersonStatus, MembershipType, Uyruk, KimlikTuru, YardimTuruDetay, SavedView, KullaniciRol, SponsorlukTipi, DosyaBaglantisi, RizaBeyaniStatus } from '../types.ts';
import { createPerson, updatePerson, deletePerson, deletePeople } from '../services/apiService.ts';
import { usePeople } from '../hooks/useData.ts';
import { usePDFGenerator } from '../src/hooks/usePDFGenerator';
import { useExcelUtils } from '../src/hooks/useExcelUtils';
import Modal from './Modal.tsx';
import CameraCaptureModal from './CameraCaptureModal.tsx';

const getStatusClass = (status: PersonStatus) => {
    switch (status) {
        case PersonStatus.AKTIF: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case PersonStatus.PASIF: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case PersonStatus.BEKLEMEDE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const KisiFormModal: React.FC<{
    person: Partial<Person> | null,
    onClose: () => void,
    onSave: (person: Partial<Person>) => void
}> = ({ person, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Person>>(person || { aldigiYardimTuru: [], uyruk: [] });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (field: 'uyruk' | 'aldigiYardimTuru', value: Uyruk | YardimTuruDetay) => {
        setFormData(prev => {
            const currentValues = (prev[field] as any[]) || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isNew = !person?.id;

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={isNew ? 'Yeni Kişi Ekle' : 'Kişi Bilgilerini Düzenle'}>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Ad</label>
                            <input type="text" name="ad" value={formData.ad || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Soyad</label>
                            <input type="text" name="soyad" value={formData.soyad || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Kimlik Numarası</label>
                            <input type="text" name="kimlikNo" value={formData.kimlikNo || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Cep Telefonu</label>
                            <input type="tel" name="cepTelefonu" value={formData.cepTelefonu || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Adres</label>
                            <textarea name="adres" value={formData.adres || ''} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Durum</label>
                            <select name="durum" value={formData.durum || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700" required>
                                <option value="" disabled>Seçiniz...</option>
                                {Object.values(PersonStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        <button type="button" onClick={onClose} className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">İptal</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </Modal>
        </>
    );
};


const KisiYonetimi: React.FC = () => {
    const { data: people, isLoading, error, refresh } = usePeople();
    const { generatePersonReport, isGenerating } = usePDFGenerator();
    const { 
        exportPersons, 
        importPersons, 
        generatePersonTemplate, 
        isExporting, 
        isImporting 
    } = useExcelUtils();

    const [filters, setFilters] = useState({
        searchTerm: '',
        statusFilter: 'all' as PersonStatus | 'all',
        nationalityFilter: 'all' as Uyruk | 'all',
        yardimTuruFilter: 'all' as YardimTuruDetay | 'all',
    });
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);

    const displayedData = useMemo(() => {
        return people.filter(person => {
            const matchesSearch = `${person.ad} ${person.soyad}`.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                person.kimlikNo.includes(filters.searchTerm);
            const matchesStatus = filters.statusFilter === 'all' || person.durum === filters.statusFilter;
            const matchesNationality = filters.nationalityFilter === 'all' || person.uyruk.includes(filters.nationalityFilter as Uyruk);
            const matchesYardimTuru = filters.yardimTuruFilter === 'all' || person.aldigiYardimTuru?.includes(filters.yardimTuruFilter as YardimTuruDetay);

            return matchesSearch && matchesStatus && matchesNationality && matchesYardimTuru;
        });
    }, [people, filters]);

    useEffect(() => {
        if (headerCheckboxRef.current) {
            const numSelected = selectedIds.length;
            const numDisplayed = displayedData.length;
            headerCheckboxRef.current.checked = numSelected > 0 && numSelected === numDisplayed;
            headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numDisplayed;
        }
    }, [selectedIds, displayedData]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = displayedData.map(p => p.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (window.confirm(`${selectedIds.length} kişiyi silmek istediğinizden emin misiniz?`)) {
            const promise = deletePeople(selectedIds);
            
            toast.promise(promise, {
                loading: 'Seçilen kişiler siliniyor...',
                success: () => {
                    refresh();
                    setSelectedIds([]);
                    return 'Seçilen kişiler başarıyla silindi!';
                },
                error: 'Kişiler silinirken bir hata oluştu.',
            });
        }
    };
    
    const handleExport = () => {
        exportPersons(displayedData);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const result = await importPersons(file);
        if (result && result.validRows > 0) {
            // Refresh the data after successful import
            refresh();
        }
        
        // Reset file input
        event.target.value = '';
    };

    const handleGenerateTemplate = () => {
        generatePersonTemplate();
    };

    const handleSavePerson = async (personToSave: Partial<Person>) => {
        const isNew = !personToSave.id;
        const promise = new Promise<void>(async (resolve, reject) => {
            try {
                if (personToSave.id) { // Editing
                    await updatePerson(personToSave.id, personToSave);
                } else { // Creating
                    const payload = {
                        ...personToSave,
                        kayitTarihi: new Date().toISOString(),
                        kaydiAcanBirim: "Panel",
                        dosyaBaglantisi: DosyaBaglantisi.DERNEK,
                        isKaydiSil: false,
                        uyruk: personToSave.uyruk || [Uyruk.TC],
                        kimlikTuru: personToSave.kimlikTuru || KimlikTuru.TC,
                        dogumTarihi: personToSave.dogumTarihi || '1900-01-01',
                        ulke: personToSave.ulke || 'Türkiye',
                        sehir: personToSave.sehir || '',
                        yerlesim: personToSave.yerlesim || '',
                        mahalle: personToSave.mahalle || '',
                        dosyaNumarasi: personToSave.dosyaNumarasi || `DN${Date.now()}`,
                        sponsorlukTipi: personToSave.sponsorlukTipi || SponsorlukTipi.YOK,
                        kayitDurumu: personToSave.kayitDurumu || 'Kaydedildi',
                        rizaBeyani: personToSave.rizaBeyani || RizaBeyaniStatus.ALINDI
                    } as Omit<Person, 'id'>;
                    await createPerson(payload);
                }
                setIsFormModalOpen(false);
                setEditingPerson(null);
                refresh(); // Refresh list
                resolve();
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });

        toast.promise(promise, {
            loading: 'Kaydediliyor...',
            success: isNew ? 'Kişi başarıyla eklendi!' : 'Kişi başarıyla güncellendi!',
            error: 'Kişi kaydedilirken bir hata oluştu.',
        });
    };
    
    const handleDeletePerson = async (id: number) => {
        if (window.confirm("Bu kişiyi silmek istediğinizden emin misiniz?")) {
            const promise = deletePerson(id);
            
            toast.promise(promise, {
                loading: 'Kişi siliniyor...',
                success: () => {
                    refresh(); // Refresh list
                    return 'Kişi başarıyla silindi!';
                },
                error: 'Kişi silinirken bir hata oluştu.',
            });
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCameraCapture = (imageData: string) => {
        // Kamera ile çekilen fotoğrafı işle
        // Bu kısımda OCR veya AI ile kimlik bilgilerini çıkarabilirsiniz
        console.log('Çekilen fotoğraf:', imageData);
        
        // Örnek: OCR sonucu ile form verilerini doldur
        // Bu kısım gerçek OCR entegrasyonu ile değiştirilmelidir
        const mockOcrResult = {
            ad: 'Örnek',
            soyad: 'Kişi',
            kimlikNo: '12345678901',
            dogumTarihi: '1990-01-01'
        };
        
        setEditingPerson(mockOcrResult);
        setIsCameraModalOpen(false);
        setIsFormModalOpen(true);
        
        toast.success('Kimlik bilgileri başarıyla okundu!');
    };

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                 <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-4">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Kişi Yönetimi</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={isImporting}
                            />
                            <button 
                                disabled={isImporting}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-3-6 3 3m0 0-3 3m3-3H9" />
                                </svg>
                                <span>{isImporting ? 'İçe Aktarılıyor...' : 'Excel\'den İçe Aktar'}</span>
                            </button>
                        </div>
                        <button 
                            onClick={handleGenerateTemplate}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M8.25 9h4.5M8.25 12h4.5m-4.5 3h4.5" />
                            </svg>
                            <span>Template İndir</span>
                        </button>
                         <button 
                            onClick={handleExport} 
                            disabled={isExporting || displayedData.length === 0}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span>{isExporting ? 'Dışa Aktarılıyor...' : 'Excel\'e Aktar'}</span>
                        </button>
                        <button 
                            onClick={() => generatePersonReport(displayedData)} 
                            disabled={isGenerating || displayedData.length === 0}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <span>{isGenerating ? 'PDF Oluşturuluyor...' : 'PDF Rapor'}</span>
                        </button>
                        <button onClick={() => { setEditingPerson({}); setIsFormModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2">
                             <span>Yeni Kişi Ekle</span>
                        </button>
                        <button onClick={() => setIsCameraModalOpen(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                            <span>Kamera ile Tara</span>
                        </button>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-3 my-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{selectedIds.length} kişi seçildi</span>
                        <div>
                            <button
                                onClick={handleDeleteSelected}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700"
                            >
                                Seçilenleri Sil
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <input type="text" name="searchTerm" placeholder="Ad, Soyad, Kimlik No..." value={filters.searchTerm} onChange={handleFilterChange} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700" />
                    <select name="statusFilter" value={filters.statusFilter} onChange={handleFilterChange} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700">
                        <option value="all">Tüm Durumlar</option>
                        {Object.values(PersonStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="nationalityFilter" value={filters.nationalityFilter} onChange={handleFilterChange} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700">
                        <option value="all">Tüm Uyruklar</option>
                         {Object.values(Uyruk).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                     <select name="yardimTuruFilter" value={filters.yardimTuruFilter} onChange={handleFilterChange} className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700">
                        <option value="all">Tüm Yardım Türleri</option>
                         {Object.values(YardimTuruDetay).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400">
                        <thead className="text-xs text-zinc-700 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700/50">
                            <tr>
                                <th scope="col" className="p-4">
                                    <div className="flex items-center">
                                        <input
                                            id="checkbox-all"
                                            type="checkbox"
                                            ref={headerCheckboxRef}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 bg-zinc-100 border-zinc-300 rounded focus:ring-blue-500 dark:focus:ring-offset-zinc-800 dark:bg-zinc-600 dark:border-zinc-500"
                                        />
                                        <label htmlFor="checkbox-all" className="sr-only">select all</label>
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-4 font-semibold">Ad Soyad</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Kimlik No</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Uyruk</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Şehir</th>
                                <th scope="col" className="px-6 py-4 font-semibold">Durum</th>
                                <th scope="col" className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {displayedData.map((person) => (
                                <tr key={person.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                    <td className="w-4 p-4">
                                        <div className="flex items-center">
                                            <input
                                                id={`checkbox-${person.id}`}
                                                type="checkbox"
                                                checked={selectedIds.includes(person.id)}
                                                onChange={() => handleSelectOne(person.id)}
                                                className="w-4 h-4 text-blue-600 bg-zinc-100 border-zinc-300 rounded focus:ring-blue-500 dark:focus:ring-offset-zinc-800 dark:bg-zinc-600 dark:border-zinc-500"
                                            />
                                            <label htmlFor={`checkbox-${person.id}`} className="sr-only">select row</label>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">{person.ad} {person.soyad}</td>
                                    <td className="px-6 py-4">{person.kimlikNo}</td>
                                    <td className="px-6 py-4">{person.uyruk.join(', ')}</td>
                                    <td className="px-6 py-4">{person.sehir}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(person.durum)}`}>{person.durum}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-4">
                                            <ReactRouterDOM.Link to={`/kisiler/${person.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold">Detay</ReactRouterDOM.Link>
                                            <button onClick={() => { setEditingPerson(person); setIsFormModalOpen(true); }} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold">Düzenle</button>
                                            <button onClick={() => handleDeletePerson(person.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold">Sil</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {displayedData.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                        <p>Arama kriterlerine uygun kişi bulunamadı.</p>
                    </div>
                )}
            </div>

            {isCameraModalOpen && (
                <CameraCaptureModal
                    onClose={() => setIsCameraModalOpen(false)}
                    onCapture={handleCameraCapture}
                />
            )}
            
            {isFormModalOpen && (
                <KisiFormModal
                    person={editingPerson}
                    onClose={() => { setIsFormModalOpen(false); setEditingPerson(null); }}
                    onSave={handleSavePerson}
                />
            )}
        </>
    );
};
export default KisiYonetimi;