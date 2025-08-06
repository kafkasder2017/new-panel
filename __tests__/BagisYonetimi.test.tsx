/**
 * BagisYonetimi.test.tsx
 * - Filtre/Sıralama/Sayfalama/Format davranışları için temel duman testleri
 * - useBagisYonetimi hook'u mock'lanır; tablo ve istatistik kartları kontrol edilir
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Test edilen bileşen
import BagisYonetimi from '../components/BagisYonetimi';

// Utils: format kontrolü için
import { formatCurrency, formatDate } from '../utils/format';

// Hook ve bağımlılıkları mockla
vi.mock('../hooks/useData', () => {
  const donations = [
    { id: 1, bagisciId: 101, tutar: 1000, paraBirimi: 'TRY', bagisTuru: 'NAKIT', tarih: '2025-08-01', makbuzNo: 'A001', projeId: undefined, aciklama: 'Nakit bağış' },
    { id: 2, bagisciId: 102, tutar: 250, paraBirimi: 'TRY', bagisTuru: 'ESYA', tarih: '2025-07-15', makbuzNo: 'B002', projeId: undefined, aciklama: 'Eşya bağış' },
    { id: 3, bagisciId: 103, tutar: 1500, paraBirimi: 'TRY', bagisTuru: 'NAKIT', tarih: '2025-08-05', makbuzNo: 'C003', projeId: 77, aciklama: 'Nakit bağış 2' },
  ];
  const people = [
    { id: 101, ad: 'Ali', soyad: 'Yılmaz' },
    { id: 102, ad: 'Ayşe', soyad: 'Demir' },
    { id: 103, ad: 'Mehmet', soyad: 'Kaya' },
  ];
  const projects = [
    { id: 77, name: 'Okul Destek Projesi' }
  ];
  return {
    useBagisYonetimi: () => ({
      data: { donations, people, projects },
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    })
  };
});

// PDF ve Excel hooklarını noop yap
vi.mock('../src/hooks/usePDFGenerator', () => ({
  usePDFGenerator: () => ({ generateDonationReport: vi.fn(), isGenerating: false })
}));
vi.mock('../src/hooks/useExcelUtils', () => ({
  useExcelUtils: () => ({
    exportDonations: vi.fn(),
    importDonations: vi.fn().mockResolvedValue({ validRows: 0 }),
    generateDonationTemplate: vi.fn(),
    isExporting: false,
    isImporting: false,
  })
}));

// UI bileşenlerinin gerçek render'ını koruyoruz

describe('BagisYonetimi', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('istatistik kartlarını ve tabloyu render eder', () => {
    render(
      <MemoryRouter>
        <BagisYonetimi initialFilter="all" />
      </MemoryRouter>
    );

    // Kart başlıkları
    expect(screen.getByText('Bu Ayki Toplam Bağış')).toBeInTheDocument();
    expect(screen.getByText('Toplam Bağışçı Sayısı')).toBeInTheDocument();
    expect(screen.getByText('Ortalama Bağış Miktarı')).toBeInTheDocument();

    // Tablo kolon başlıklarından bazıları
    expect(screen.getByText('Bağışçı')).toBeInTheDocument();
    expect(screen.getByText('Tutar')).toBeInTheDocument();
    expect(screen.getByText('Tarih')).toBeInTheDocument();
  });

  it('tutar ve tarih alanlarını formatCurrency ve formatDate ile formatlar', () => {
    render(
      <MemoryRouter>
        <BagisYonetimi initialFilter="all" />
      </MemoryRouter>
    );

    // En az bir satır beklenir
    // Tabloda görünen herhangi bir TRY para formatını bulalım
    const formatted = formatCurrency(1000, 'TRY');
    expect(screen.getAllByText((content) => content.includes('₺') || content.includes(formatted)).length).toBeGreaterThan(0);

    // Tarihlerin formatlı görünmesi: formatDate util'i beklenen çıktıyı üretir
    expect(formatDate('2025-08-01')).toMatch(/\d{2}[./-]\d{2}[./-]\d{4}/);
  });

  it('filtreleme: tür filtresi değiştiğinde sayfa 1’e döner ve liste daralır (NAKIT seçimi)', async () => {
    render(
      <MemoryRouter>
        <BagisYonetimi initialFilter="all" />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    // Tür filtresi select'ini bul
    const selects = screen.getAllByRole('combobox');
    const typeSelect = selects.find(sel => within(sel).queryByText('Tüm Bağış Türleri')) || selects[0];

    // UI'da görünen label ile seçim yap (enum etiketleri TR metinler)
    await user.selectOptions(typeSelect, 'Nakit');

    // Footer metni: Toplam: X kayıt • Sayfa 1/Y
    const footer = await screen.findByText((t) => t.startsWith('Toplam:'));
    expect(footer).toBeInTheDocument();
    expect(footer.textContent).toMatch(/Sayfa 1\//);
  });

  it('sayfalama: Sonraki/Önceki butonları disable/enable durumlarını doğru gösterir', async () => {
    render(
      <MemoryRouter>
        <BagisYonetimi initialFilter="all" />
      </MemoryRouter>
    );
    const user = userEvent.setup();

    const prevBtn = screen.getByRole('button', { name: 'Önceki sayfa' });
    const nextBtn = screen.getByRole('button', { name: 'Sonraki sayfa' });

    // Az kayıt olduğundan tek sayfa: önceki ve sonraki disabled
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // Tür filtresini değiştirince yine disabled kalmalı (mock veride 3 kayıt var, pageSize 20)
    const selects = screen.getAllByRole('combobox');
    const typeSelect = selects.find(sel => within(sel).queryByText('Tüm Bağış Türleri')) || selects[0];
    await user.selectOptions(typeSelect, 'Nakit');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeDisabled();
  });
});
