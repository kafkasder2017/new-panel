import React, { useRef, useState } from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import {
  Person,
  PersonDocument,
  DokumanTipi,
  YakinlikTuru,
} from '../../types';

/**
 * Tip güvenliği için yardımcı alt tipler.
 * Not: Projedeki Person şeması eski/yeni alan adlarını taşıyabiliyor.
 * Bu sebeple olası alanları kapsayan ve bileşenler içinde kullandığımız
 * kısıtlı alt tipler tanımlanıyor.
 */
type PersonWithOptionalCollections = Person & {
  bankaHesaplari?: Array<{ id: string; iban: string; hesapAdi: string }>;
  dokumanlar?: PersonDocument[];
  dependents?: Array<{ personId: number; relationship: YakinlikTuru }>;
};

type MinimalPersonForSelect = {
  id: any;
  ad?: string;
  soyad?: string;
  first_name?: string;
  last_name?: string;
  tcKimlikNo?: string;
  kimlikNo?: string;
  identity_number?: string;
};

// Banka Hesapları Modal
export const BankaHesaplariModal: React.FC<{
  person: PersonWithOptionalCollections;
  onClose: () => void;
  onSave: (data: Partial<PersonWithOptionalCollections>) => void;
}> = ({ person, onClose, onSave }) => {
  const [hesaplar, setHesaplar] = useState<Array<{ id: string; iban: string; hesapAdi: string }>>(
    person.bankaHesaplari || []
  );
  const [newHesap, setNewHesap] = useState<{ iban: string; hesapAdi: string }>({ iban: '', hesapAdi: '' });

  const handleAdd = () => {
    if (newHesap.iban && newHesap.hesapAdi) {
      setHesaplar([...hesaplar, { id: `new_${Date.now()}`, ...newHesap }]);
      setNewHesap({ iban: '', hesapAdi: '' });
    }
  };
  const handleDelete = (id: string) => setHesaplar(hesaplar.filter((h) => h.id !== id));
  const handleSave = () => onSave({ bankaHesaplari: hesaplar });

  return (
    <Modal isOpen={true} onClose={onClose} title="Banka Hesapları">
      <div className="space-y-4">
        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
          {hesaplar.length > 0 ? (
            hesaplar.map((hesap) => (
              <div
                key={hesap.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-zinc-100 dark:bg-zinc-700 rounded-md gap-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{hesap.hesapAdi}</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">{hesap.iban}</p>
                </div>
                <button
                  onClick={() => handleDelete(hesap.id)}
                  className="self-end sm:self-center text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-xl leading-none"
                >
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 py-4">Banka hesabı eklenmemiş.</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 border-t pt-4">
          <input
            type="text"
            placeholder="Hesap Adı"
            value={newHesap.hesapAdi}
            onChange={(e) => setNewHesap((p) => ({ ...p, hesapAdi: e.target.value }))}
            className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700"
          />
          <input
            type="text"
            placeholder="IBAN"
            value={newHesap.iban}
            onChange={(e) => setNewHesap((p) => ({ ...p, iban: e.target.value }))}
            className="flex-1 p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700"
          />
          <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">
            Ekle
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500"
          >
            İptal
          </button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700" aria-label="Değişiklikleri kaydet" title="Değişiklikleri kaydet">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Dokümanlar Modal
export const DokumanlarModal: React.FC<{
  person: PersonWithOptionalCollections;
  onClose: () => void;
  onSave: (data: Partial<PersonWithOptionalCollections>) => void;
}> = ({ person, onClose, onSave }) => {
  const [dokumanlar, setDokumanlar] = useState<PersonDocument[]>(
    person.dokumanlar || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const newDoc: PersonDocument = {
        id: `new_${Date.now()}`,
        ad: file.name,
        tip: DokumanTipi.DIGER,
        path: `people/${(person as any).id}/${file.name}`,
      };
      setDokumanlar((prev) => [...prev, newDoc]);
    } catch (error) {
      console.error(error);
      alert('Dosya işlenirken hata oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => setDokumanlar(dokumanlar.filter((d) => d.id !== id));
  const handleSave = () => onSave({ dokumanlar });

  return (
    <Modal isOpen={true} onClose={onClose} title="Dokümanlar">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto p-1">
          {dokumanlar.length > 0 ? (
            dokumanlar.map((doc) => (
              <div
                key={doc.id}
                className="group relative border border-zinc-200 dark:border-zinc-700 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-700/50"
              >
                <p className="font-semibold text-sm truncate text-zinc-800 dark:text-zinc-200" title={doc.ad}>
                  {doc.ad}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{doc.tip}</p>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center text-zinc-500 py-4">Doküman eklenmemiş.</p>
          )}
        </div>
        <div className="border-t pt-4">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full p-3 bg-zinc-100 dark:bg-zinc-700 border-dashed border-2 border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 text-zinc-600 dark:text-zinc-300 font-semibold"
          >
            {isUploading ? 'Yükleniyor...' : 'Yeni Doküman Yükle'}
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500"
          >
            İptal
          </button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Bağlı Kişiler Modal
export const BagliKisilerModal: React.FC<{
  person: PersonWithOptionalCollections;
  allPeople: MinimalPersonForSelect[];
  onClose: () => void;
  onSave: (data: Partial<PersonWithOptionalCollections>) => void;
}> = ({ person, allPeople, onClose, onSave }) => {
  const [dependents, setDependents] = useState<Array<{ personId: number; relationship: YakinlikTuru }>>(
    person.dependents || []
  );
  const [newDependent, setNewDependent] = useState<{ personId: number | ''; relationship: YakinlikTuru | '' }>({
    personId: '',
    relationship: '',
  });

  const peopleMap = new Map(
    allPeople.map((p) => [
      p.id,
      `${p.ad ?? p.first_name ?? ''} ${p.soyad ?? p.last_name ?? ''}`,
    ])
  );
  const availablePeople = allPeople.filter(
    (p) => String(p.id) !== String((person as any).id) && !dependents.some((d) => String(d.personId) === String(p.id))
  );

  const handleAdd = () => {
    if (newDependent.personId && newDependent.relationship) {
      setDependents([
        ...dependents,
        { personId: Number(newDependent.personId), relationship: newDependent.relationship as YakinlikTuru },
      ]);
      setNewDependent({ personId: '', relationship: '' });
    }
  };
  const handleDelete = (personId: number) => setDependents(dependents.filter((d) => d.personId !== personId));
  const handleSave = () => onSave({ dependents });

  return (
    <Modal isOpen={true} onClose={onClose} title="Baktığı Kişiler">
      <div className="space-y-4">
        <div className="space-y-2 max-h-60 overflow-y-auto p-1">
          {dependents.length > 0 ? (
            dependents.map((dep: any) => (
              <div
                key={dep.personId}
                className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-700 rounded-md"
              >
                <div>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {peopleMap.get(String(dep.personId)) || 'Bilinmeyen Kişi'}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{dep.relationship}</p>
                </div>
                <button
                  onClick={() => handleDelete(dep.personId)}
                  className="text-red-500 p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full text-xl leading-none"
                >
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 py-4">Bağlı kişi eklenmemiş.</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 border-t pt-4">
          <div className="flex-1">
            <SearchableSelect<MinimalPersonForSelect>
              options={availablePeople}
              value={newDependent.personId || null}
              onChange={(val) => setNewDependent((p) => ({ ...p, personId: (val as any) ?? '' }))}
              getOptionValue={(p) => p.id}
              getOptionLabel={(p) =>
                `${p.ad ?? p.first_name ?? ''} ${p.soyad ?? p.last_name ?? ''} (${p.tcKimlikNo ?? p.kimlikNo ?? p.identity_number ?? ''})`
              }
              placeholder="Kişi seçin..."
            />
          </div>
          <select
            value={newDependent.relationship}
            onChange={(e) => setNewDependent((p) => ({ ...p, relationship: e.target.value as YakinlikTuru }))}
            className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
          >
            <option value="">Yakınlık...</option>
            {Object.values(YakinlikTuru).map((y) => (
              <option key={y as any} value={y as any}>
                {y as any}
              </option>
            ))}
          </select>
          <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700">
            Ekle
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="bg-white dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-500"
          >
            İptal
          </button>
          <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
            Değişiklikleri Kaydet
          </button>
        </div>
      </div>
    </Modal>
  );
};
