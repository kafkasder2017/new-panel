/**
 * KisiYonetimi.smoke.test.tsx
 * Amaç: Kisi alt parçalarının (özellikle KisiTable) temel render ve etkileşimlerini duman testi olarak doğrulamak.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';

import KisiTable from '../components/kisi/KisiTable';
import { Person, PersonStatus } from '../types';

describe('KisiYonetimi smoke', () => {
  const sampleData: Person[] = [
    {
      id: 'p1',
      first_name: 'Ali',
      last_name: 'Yılmaz',
      identity_number: '12345678901',
      nationality: 'TR',
      city: 'İstanbul',
      email: 'ali@example.com',
      phone: '5551112233',
      status: PersonStatus.AKTIF,
      birth_date: '1990-01-01',
    } as any,
    {
      id: 'p2',
      first_name: 'Ayşe',
      last_name: 'Demir',
      identity_number: '23456789012',
      nationality: 'TR',
      city: 'Ankara',
      email: 'ayse@example.com',
      phone: '5552223344',
      status: PersonStatus.BEKLEMEDE,
      birth_date: '1992-05-05',
    } as any,
  ];

  it('KisiTable render olur ve temel aksiyonlar çağrılabilir', () => {
    const onSelectAll = vi.fn();
    const onSelectOne = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <MemoryRouter>
        <KisiTable
          data={sampleData}
          selectedIds={[]}
          onSelectAll={onSelectAll}
          onSelectOne={onSelectOne}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </MemoryRouter>
    );

    // Tablo başlığı ve satırlar
    expect(screen.getByRole('table', { name: /kişi tablosu/i })).toBeInTheDocument();
    expect(screen.getByText('Ad Soyad')).toBeInTheDocument();
    expect(screen.getByText('Kimlik No')).toBeInTheDocument();

    // Detay linki görünsün
    expect(screen.getByRole('link', { name: /ali yılmaz detay/i })).toBeInTheDocument();

    // Checkbox etiketleri (a11y)
    expect(screen.getByLabelText(/tümünü seç/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ali yılmaz seç/i)).toBeInTheDocument();
  });
});
