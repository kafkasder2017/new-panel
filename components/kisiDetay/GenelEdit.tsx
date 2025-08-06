import React from 'react';
import { Person, PersonStatus, MedeniDurum } from '../../types';

const FormInput: React.FC<{
  label: string;
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}> = ({ label, name, value, onChange, type = 'text', required }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
    />
  </div>
);

const FormSelect: React.FC<{
  label: string;
  name: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}> = ({ label, name, value, onChange, options, required }) => (
  <div className="flex flex-col">
    <label htmlFor={name} className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value || ''}
      onChange={onChange}
      required={required}
      className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 text-sm appearance-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="" disabled>
        Seçiniz...
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface GenelEditProps {
  formData: Person;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const GenelEdit: React.FC<GenelEditProps> = ({ formData, onChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <FormInput label="Ad" name="ad" value={(formData as any).ad} onChange={onChange as any} required />
      <FormInput label="Soyad" name="soyad" value={(formData as any).soyad} onChange={onChange as any} required />
      <FormSelect
        label="Durum"
        name={(('durum') as any)}
        value={(formData as any).durum || formData.status}
        onChange={onChange as any}
        options={Object.values(PersonStatus).map((s) => ({ value: s, label: s }))}
        required
      />
      <FormInput label="Cep Telefonu" name="phone" value={(formData as any).phone} onChange={onChange as any} required />
      <FormInput label="E-posta" name="email" value={(formData as any).email} onChange={onChange as any} type="email" />
      <FormInput
        label="Doğum Tarihi"
        name={(('dogumTarihi') as any)}
        value={(formData as any).dogumTarihi || (formData as any).birth_date}
        onChange={onChange as any}
        type="date"
      />
      <FormInput
        label="TC Kimlik No"
        name={(('identity_number') as any)}
        value={(formData as any).identity_number}
        onChange={onChange as any}
      />
      <FormSelect
        label="Medeni Durum"
        name={(('marital_status') as any)}
        value={(formData as any).marital_status}
        onChange={onChange as any}
        options={Object.values(MedeniDurum).map((s) => ({ value: s as any, label: String(s) }))}
      />
      <FormInput label="İl" name="city" value={(formData as any).city} onChange={onChange as any} />
      <FormInput label="İlçe" name="district" value={(formData as any).district} onChange={onChange as any} />
      <FormInput label="Mahalle" name="neighborhood" value={(formData as any).neighborhood} onChange={onChange as any} />
      <div className="sm:col-span-2 lg:col-span-3">
        <div className="flex flex-col">
          <label htmlFor="address" className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
            Açık Adres
          </label>
          <textarea
            id="address"
            name="address"
            value={(formData as any).address || ''}
            onChange={onChange as any}
            rows={2}
            className="p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default GenelEdit;
