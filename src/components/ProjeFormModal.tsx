import React, { useState } from 'react';
import { Proje, ProjeStatus } from '../../types';
import { Input, Select, Textarea, Button } from '../../components/ui';
import Modal from '../../components/Modal';

interface ProjeFormModalProps {
  proje: Partial<Proje>;
  onClose: () => void;
  onSave: (proje: Partial<Proje>) => void;
}

export const ProjeFormModal: React.FC<ProjeFormModalProps> = ({ proje, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Proje>>(proje);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['budget', 'spent', 'progress'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={proje.id ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input 
              label="Proje Adı" 
              name="name" 
              value={formData.name || ''} 
              onChange={handleChange} 
              required 
            />
          </div>
          <Input 
            label="Proje Yöneticisi" 
            name="manager" 
            value={formData.manager || ''} 
            onChange={handleChange} 
            required 
          />
          <Select 
            label="Durum" 
            name="status" 
            value={formData.status || ''} 
            onChange={handleChange} 
            options={[
              { value: '', label: 'Seçiniz...' }, 
              ...Object.values(ProjeStatus).map(s => ({ value: s, label: s }))
            ]} 
            required 
          />
          <Input 
            label="Başlangıç Tarihi" 
            type="date" 
            name="startDate" 
            value={formData.startDate || ''} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Bitiş Tarihi" 
            type="date" 
            name="endDate" 
            value={formData.endDate || ''} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Toplam Bütçe (TL)" 
            type="number" 
            name="budget" 
            value={formData.budget || ''} 
            onChange={handleChange} 
            required 
          />
          <Input 
            label="Harcanan Tutar (TL)" 
            type="number" 
            name="spent" 
            value={formData.spent || ''} 
            onChange={handleChange} 
            required 
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              İlerleme (%{formData.progress || 0})
            </label>
            <input 
              type="range" 
              name="progress" 
              min="0" 
              max="100" 
              value={formData.progress || 0} 
              onChange={handleChange} 
              className="mt-1 block w-full" 
            />
          </div>
          <div className="md:col-span-2">
            <Textarea 
              label="Açıklama" 
              name="description" 
              value={formData.description || ''} 
              onChange={handleChange} 
              rows={5} 
              required 
            />
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