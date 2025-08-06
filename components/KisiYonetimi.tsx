
import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { Person, PersonStatus, MembershipType, Uyruk, KimlikTuru, YardimTuruDetay, KullaniciRol, SponsorlukTipi, DosyaBaglantisi, RizaBeyaniStatus } from '../types.ts';
import KisiToolbar from './kisi/KisiToolbar';
import KisiFilters, { KisiFiltersState } from './kisi/KisiFilters';
import KisiTable from './kisi/KisiTable';
import KisiSelectionBar from './kisi/KisiSelectionBar';

interface SavedView {
    id: string;
    name: string;
    filters: any;
    createdAt: string;
}
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
    onSave: (person: Partial<Person>) => void,
    isCameraModalOpen: boolean,
    setIsCameraModalOpen: (open: boolean) => void,
    onCameraCapture: (imageData: string) => void
}> = ({ person, onClose, onSave, isCameraModalOpen, setIsCameraModalOpen, onCameraCapture }) => {
    const [formData, setFormData] = useState<Partial<Person>>(person || {});
    
    // person prop'u değiştiğinde formData'yı güncelle
    React.useEffect(() => {
        setFormData(person || {});
    }, [person]);
    
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
                {/* Kamera ile Tara Butonu */}
                <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">Hızlı Veri Girişi</h4>
                            <p className="text-xs text-purple-700 dark:text-purple-300">Kimlik kartını kamera ile tarayarak bilgileri otomatik doldurun</p>
                        </div>
                        <button 
                            type="button"
                            onClick={() => setIsCameraModalOpen(true)} 
                            className="bg-purple-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                            <span>Kamera ile Tara</span>
                        </button>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Ad</label>
                            <input type="text" name="first_name" value={formData.first_name || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Soyad</label>
                            <input type="text" name="last_name" value={formData.last_name || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Kimlik Numarası</label>
                            <input type="text" name="identity_number" value={formData.identity_number || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Cep Telefonu</label>
                            <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg" required />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">Adres Bilgileri</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Ülke</label>
                                    <select name="country" value={formData.country || 'Türkiye'} onChange={handleChange} className="block w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700">
                                        <option value="Türkiye">Türkiye</option>
                                        <option value="Suriye">Suriye</option>
                                        <option value="Irak">Irak</option>
                                        <option value="Afganistan">Afganistan</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">İl</label>
                                    <select name="city" value={formData.city || ''} onChange={handleChange} className="block w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700">
                                        <option value="">Seçiniz...</option>
                                        <option value="İstanbul">İstanbul</option>
                                        <option value="Ankara">Ankara</option>
                                        <option value="İzmir">İzmir</option>
                                        <option value="Bursa">Bursa</option>
                                        <option value="Antalya">Antalya</option>
                                        <option value="Adana">Adana</option>
                                        <option value="Konya">Konya</option>
                                        <option value="Gaziantep">Gaziantep</option>
                                        <option value="Mersin">Mersin</option>
                                        <option value="Kayseri">Kayseri</option>
                                        <option value="Eskişehir">Eskişehir</option>
                                        <option value="Diyarbakır">Diyarbakır</option>
                                        <option value="Samsun">Samsun</option>
                                        <option value="Denizli">Denizli</option>
                                        <option value="Şanlıurfa">Şanlıurfa</option>
                                        <option value="Adapazarı">Adapazarı</option>
                                        <option value="Malatya">Malatya</option>
                                        <option value="Kahramanmaraş">Kahramanmaraş</option>
                                        <option value="Erzurum">Erzurum</option>
                                        <option value="Van">Van</option>
                                        <option value="Batman">Batman</option>
                                        <option value="Elazığ">Elazığ</option>
                                        <option value="Iğdır">Iğdır</option>
                                        <option value="Trabzon">Trabzon</option>
                                        <option value="Balıkesir">Balıkesir</option>
                                        <option value="Manisa">Manisa</option>
                                        <option value="Tokat">Tokat</option>
                                        <option value="Çorum">Çorum</option>
                                        <option value="Kırıkkale">Kırıkkale</option>
                                        <option value="Afyon">Afyon</option>
                                        <option value="Isparta">Isparta</option>
                                        <option value="Zonguldak">Zonguldak</option>
                                        <option value="Amasya">Amasya</option>
                                        <option value="Çanakkale">Çanakkale</option>
                                        <option value="Kırşehir">Kırşehir</option>
                                        <option value="Muğla">Muğla</option>
                                        <option value="Nevşehir">Nevşehir</option>
                                        <option value="Tekirdağ">Tekirdağ</option>
                                        <option value="Aydın">Aydın</option>
                                        <option value="Mardin">Mardin</option>
                                        <option value="Ordu">Ordu</option>
                                        <option value="Osmaniye">Osmaniye</option>
                                        <option value="Kütahya">Kütahya</option>
                                        <option value="Rize">Rize</option>
                                        <option value="Siirt">Siirt</option>
                                        <option value="Uşak">Uşak</option>
                                        <option value="Düzce">Düzce</option>
                                        <option value="Edirne">Edirne</option>
                                        <option value="Kırklareli">Kırklareli</option>
                                        <option value="Yozgat">Yozgat</option>
                                        <option value="Çankırı">Çankırı</option>
                                        <option value="Giresun">Giresun</option>
                                        <option value="Ağrı">Ağrı</option>
                                        <option value="Bingöl">Bingöl</option>
                                        <option value="Bitlis">Bitlis</option>
                                        <option value="Hakkari">Hakkari</option>
                                        <option value="Muş">Muş</option>
                                        <option value="Şırnak">Şırnak</option>
                                        <option value="Tunceli">Tunceli</option>
                                        <option value="Artvin">Artvin</option>
                                        <option value="Gümüşhane">Gümüşhane</option>
                                        <option value="Kilis">Kilis</option>
                                        <option value="Bayburt">Bayburt</option>
                                        <option value="Karabük">Karabük</option>
                                        <option value="Karaman">Karaman</option>
                                        <option value="Kırıkkale">Kırıkkale</option>
                                        <option value="Bartın">Bartın</option>
                                        <option value="Ardahan">Ardahan</option>
                                        <option value="Iğdır">Iğdır</option>
                                        <option value="Yalova">Yalova</option>
                                        <option value="Karabük">Karabük</option>
                                        <option value="Kilis">Kilis</option>
                                        <option value="Osmaniye">Osmaniye</option>
                                        <option value="Düzce">Düzce</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">İlçe</label>
                                    <input type="text" name="district" value={formData.district || ''} onChange={handleChange} placeholder="İlçe adını yazın" className="block w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Mahalle</label>
                                    <input type="text" name="neighborhood" value={formData.neighborhood || ''} onChange={handleChange} placeholder="Mahalle adını yazın" className="block w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 dark:text-zinc-400 mb-1">Cadde</label>
                                    <input type="text" name="address" value={formData.address || ''} onChange={handleChange} placeholder="Adres bilgisini yazın" className="block w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300">Durum</label>
                            <select name="status" value={formData.status || ''} onChange={handleChange} className="mt-1 block w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700" required>
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
                
                {/* Kamera Modal */}
                {isCameraModalOpen && (
                    <CameraCaptureModal
                        onClose={() => setIsCameraModalOpen(false)}
                        onCapture={onCameraCapture}
                    />
                )}
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

    const [filters, setFilters] = useState<KisiFiltersState>({
        searchTerm: '',
        statusFilter: 'all',
        nationalityFilter: 'all',
        yardimTuruFilter: 'all',
        cityFilter: '',
        ageRangeMin: '',
        ageRangeMax: '',
        registrationDateFrom: '',
        registrationDateTo: '',
        membershipTypeFilter: 'all',
        multipleStatusFilter: [],
        multipleNationalityFilter: [],
    });
    
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [savedViews, setSavedViews] = useState<SavedView[]>([]);
    const [currentViewName, setCurrentViewName] = useState('');
    const [showSaveViewModal, setShowSaveViewModal] = useState(false);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<Partial<Person> | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);

    const displayedData = useMemo(() => {
        return people.filter(person => {
            // Temel arama
            const matchesSearch = filters.searchTerm === '' || 
                `${person.first_name} ${person.last_name}`.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                person.identity_number?.includes(filters.searchTerm) ||
                person.phone?.includes(filters.searchTerm) ||
                person.address?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                person.country?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                person.city?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                person.district?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                person.neighborhood?.toLowerCase().includes(filters.searchTerm.toLowerCase());
            
            // Durum filtreleri
            const matchesStatus = filters.statusFilter === 'all' || person.status === filters.statusFilter;
            const matchesMultipleStatus = filters.multipleStatusFilter.length === 0 || 
                filters.multipleStatusFilter.includes(person.status);
            
            // Uyruk filtreleri
            const matchesNationality = filters.nationalityFilter === 'all' || 
                person.nationality?.includes(filters.nationalityFilter as Uyruk);
            const matchesMultipleNationality = filters.multipleNationalityFilter.length === 0 || 
                filters.multipleNationalityFilter.some(nat => person.nationality?.includes(nat));
            
            // Yardım türü filtresi
            const matchesYardimTuru = filters.yardimTuruFilter === 'all' || 
                person.aid_type_received?.includes(filters.yardimTuruFilter as YardimTuruDetay);
            
            // İl filtresi
            const matchesCity = filters.cityFilter === '' || 
                person.city?.toLowerCase().includes(filters.cityFilter.toLowerCase());
            
            // Üyelik türü filtresi
            const matchesMembershipType = filters.membershipTypeFilter === 'all' || 
                person.membershipType === filters.membershipTypeFilter;
            
            // Yaş aralığı filtresi
            let matchesAgeRange = true;
            if (filters.ageRangeMin || filters.ageRangeMax) {
                const birthDate = new Date(person.birth_date || '1900-01-01');
                const age = new Date().getFullYear() - birthDate.getFullYear();
                
                if (filters.ageRangeMin && age < parseInt(filters.ageRangeMin)) {
                    matchesAgeRange = false;
                }
                if (filters.ageRangeMax && age > parseInt(filters.ageRangeMax)) {
                    matchesAgeRange = false;
                }
            }
            
            // Kayıt tarihi aralığı filtresi
            let matchesRegistrationDate = true;
            if (filters.registrationDateFrom || filters.registrationDateTo) {
                const registrationDate = new Date(person.registration_date || '1900-01-01');
                
                if (filters.registrationDateFrom) {
                    const fromDate = new Date(filters.registrationDateFrom);
                    if (registrationDate < fromDate) {
                        matchesRegistrationDate = false;
                    }
                }
                if (filters.registrationDateTo) {
                    const toDate = new Date(filters.registrationDateTo);
                    toDate.setHours(23, 59, 59, 999); // Günün sonuna kadar
                    if (registrationDate > toDate) {
                        matchesRegistrationDate = false;
                    }
                }
            }

            return matchesSearch && matchesStatus && matchesMultipleStatus && 
                   matchesNationality && matchesMultipleNationality && matchesYardimTuru && 
                   matchesCity && matchesMembershipType && matchesAgeRange && matchesRegistrationDate;
        });
    }, [people, filters]);

    // headerCheckbox kontrolü tablo bileşenine taşındı

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = displayedData.map(p => p.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
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
                        registration_date: new Date().toISOString(),
                        registering_unit: "Panel",
                        file_connection: DosyaBaglantisi.DERNEK,
                        is_record_deleted: false,
                        nationality: personToSave.nationality || [Uyruk.TC],
                        identity_type: personToSave.identity_type || KimlikTuru.TC,
                        birth_date: personToSave.birth_date || '1900-01-01',
                        country: personToSave.country || 'Türkiye',
                        city: personToSave.city || '',
                        district: personToSave.district || '',
                        neighborhood: personToSave.neighborhood || '',
                        street: (personToSave as any).street || '',
                        avenue: (personToSave as any).avenue || '',
                        file_number: personToSave.file_number || `DN${Date.now()}`,
                        sponsorship_type: personToSave.sponsorship_type || SponsorlukTipi.YOK,
                        registration_status: personToSave.registration_status || 'Kaydedildi',
                        consent_statement: personToSave.consent_statement || RizaBeyaniStatus.ALINDI
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
    
    const handleDeletePerson = async (id: string) => {
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
    
    const handleMultipleFilterChange = (filterName: 'multipleStatusFilter' | 'multipleNationalityFilter', value: PersonStatus | Uyruk) => {
        setFilters(prev => {
            const currentValues = prev[filterName] as any[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [filterName]: newValues };
        });
    };
    
    const clearAllFilters = () => {
        setFilters({
            searchTerm: '',
            statusFilter: 'all',
            nationalityFilter: 'all',
            yardimTuruFilter: 'all',
            cityFilter: '',
            ageRangeMin: '',
            ageRangeMax: '',
            registrationDateFrom: '',
            registrationDateTo: '',
            membershipTypeFilter: 'all',
            multipleStatusFilter: [],
            multipleNationalityFilter: [],
        });
    };
    
    const saveCurrentView = () => {
        if (!currentViewName.trim()) {
            toast.error('Lütfen görünüm adı girin');
            return;
        }
        
        const newView: SavedView = {
            id: Date.now().toString(),
            name: currentViewName,
            filters: { ...filters },
            createdAt: new Date().toISOString()
        };
        
        setSavedViews(prev => [...prev, newView]);
        setCurrentViewName('');
        setShowSaveViewModal(false);
        toast.success('Görünüm kaydedildi!');
    };
    
    const loadSavedView = (view: SavedView) => {
        setFilters(view.filters);
        toast.success(`"${view.name}" görünümü yüklendi`);
    };
    
    const deleteSavedView = (viewId: string) => {
        setSavedViews(prev => prev.filter(v => v.id !== viewId));
        toast.success('Görünüm silindi');
    };
    
    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.searchTerm) count++;
        if (filters.statusFilter !== 'all') count++;
        if (filters.nationalityFilter !== 'all') count++;
        if (filters.yardimTuruFilter !== 'all') count++;
        if (filters.cityFilter) count++;
        if (filters.ageRangeMin || filters.ageRangeMax) count++;
        if (filters.registrationDateFrom || filters.registrationDateTo) count++;
        if (filters.membershipTypeFilter !== 'all') count++;
        if (filters.multipleStatusFilter.length > 0) count++;
        if (filters.multipleNationalityFilter.length > 0) count++;
        return count;
    };

    const handleCameraCapture = (imageData: string) => {
        // Kamera ile çekilen fotoğrafı işle
        // Bu kısımda OCR veya AI ile kimlik bilgilerini çıkarabilirsiniz
        console.log('Çekilen fotoğraf:', imageData);
        
        // Örnek: OCR sonucu ile form verilerini doldur
        // Bu kısım gerçek OCR entegrasyonu ile değiştirilmelidir
        const mockOcrResult = {
            first_name: 'Örnek',
            last_name: 'Kişi',
            identity_number: '12345678901',
            birth_date: '1990-01-01',
            country: 'Türkiye',
            city: 'İstanbul',
            district: 'Kadıköy',
            neighborhood: 'Fenerbahçe',
            avenue: 'Bağdat Caddesi',
            street: 'Örnek Sokak'
        };
        
        setEditingPerson(prev => ({ ...prev, ...mockOcrResult }));
        setIsCameraModalOpen(false);
        
        toast.success('Kimlik ve adres bilgileri başarıyla okundu!');
    };

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                 <KisiToolbar
                    isImporting={isImporting}
                    isExporting={isExporting}
                    isGenerating={isGenerating}
                    hasData={displayedData.length > 0}
                    onImport={handleImport}
                    onTemplate={handleGenerateTemplate}
                    onExport={handleExport}
                    onPDF={() => generatePersonReport(displayedData)}
                    onNew={() => { setEditingPerson({}); setIsFormModalOpen(true); }}
                />

                <KisiSelectionBar
                    count={selectedIds.length}
                    onDeleteSelected={handleDeleteSelected}
                />

                <KisiFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    showAdvanced={showAdvancedFilters}
                    setShowAdvanced={setShowAdvancedFilters}
                    activeFilterCount={getActiveFilterCount()}
                    onClearAll={clearAllFilters}
                    savedViews={savedViews}
                    onLoadView={(id) => {
                        const v = savedViews.find((sv) => sv.id === id);
                        if (v) loadSavedView(v);
                    }}
                    onOpenSaveView={() => setShowSaveViewModal(true)}
                />

                <KisiTable
                    data={displayedData}
                    selectedIds={selectedIds}
                    onSelectAll={handleSelectAll}
                    onSelectOne={handleSelectOne}
                    onEdit={(p) => { setEditingPerson(p); setIsFormModalOpen(true); }}
                    onDelete={handleDeletePerson}
                />
            </div>

            {isFormModalOpen && (
                <KisiFormModal
                    person={editingPerson}
                    onClose={() => { setIsFormModalOpen(false); setEditingPerson(null); }}
                    onSave={handleSavePerson}
                    isCameraModalOpen={isCameraModalOpen}
                    setIsCameraModalOpen={setIsCameraModalOpen}
                    onCameraCapture={handleCameraCapture}
                />
            )}
            
            {/* Görünüm Kaydetme Modalı */}
            {showSaveViewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg w-96">
                        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Görünümü Kaydet</h3>
                        <input
                            type="text"
                            placeholder="Görünüm adı girin..."
                            value={currentViewName}
                            onChange={(e) => setCurrentViewName(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 mb-4"
                            onKeyPress={(e) => e.key === 'Enter' && saveCurrentView()}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowSaveViewModal(false);
                                    setCurrentViewName('');
                                }}
                                className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                                İptal
                            </button>
                            <button
                                onClick={saveCurrentView}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default KisiYonetimi;
