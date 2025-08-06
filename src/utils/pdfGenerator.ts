import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Person, Bagis, YardimBasvurusu } from '../../types';

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  data: any[];
  columns: { key: string; label: string; width?: number }[];
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
  includeHeader?: boolean;
  includeFooter?: boolean;
  customStyles?: {
    headerColor?: string;
    textColor?: string;
    fontSize?: number;
  };
}

export class PDFGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;

  constructor(orientation: 'portrait' | 'landscape' = 'portrait', pageSize: 'a4' | 'a3' | 'letter' = 'a4') {
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Ana rapor oluşturma fonksiyonu
  public generateReport(options: PDFReportOptions): Promise<Blob> {
    return new Promise((resolve) => {
      this.addHeader(options.title, options.subtitle);
      this.addTable(options.data, options.columns);
      
      if (options.includeFooter !== false) {
        this.addFooter();
      }

      const pdfBlob = this.doc.output('blob');
      resolve(pdfBlob);
    });
  }

  // Kişi listesi raporu
  public generatePersonReport(people: Person[]): Promise<Blob> {
    const columns = [
      { key: 'adSoyad', label: 'Ad Soyad', width: 40 },
      { key: 'kimlikNo', label: 'Kimlik No', width: 30 },
      { key: 'telefon', label: 'Telefon', width: 30 },
      { key: 'durum', label: 'Durum', width: 25 },
      { key: 'kayitTarihi', label: 'Kayıt Tarihi', width: 30 }
    ];

    return this.generateReport({
      title: 'Kişi Listesi Raporu',
      subtitle: `Toplam ${people.length} kişi`,
      data: people.map(person => ({
        adSoyad: `${person.ad} ${person.soyad}`,
        kimlikNo: person.kimlikNo,
        telefon: person.cepTelefonu,
        durum: person.durum,
        kayitTarihi: new Date(person.kayitTarihi).toLocaleDateString('tr-TR')
      })),
      columns
    });
  }

  // Bağış raporu
  public generateDonationReport(donations: Bagis[]): Promise<Blob> {
    const columns = [
      { key: 'bagisciId', label: 'Bağışçı ID', width: 40 },
      { key: 'tutar', label: 'Tutar', width: 25 },
      { key: 'bagisTuru', label: 'Tür', width: 25 },
      { key: 'tarih', label: 'Tarih', width: 30 },
      { key: 'aciklama', label: 'Açıklama', width: 25 }
    ];

    const totalAmount = donations
      .reduce((sum, d) => sum + (d.tutar || 0), 0);

    return this.generateReport({
      title: 'Bağış Raporu',
      subtitle: `Toplam ${donations.length} bağış - Toplam Tutar: ${totalAmount.toLocaleString('tr-TR')} TL`,
      data: donations.map(donation => ({
        bagisciId: donation.bagisciId,
        tutar: donation.tutar ? `${donation.tutar.toLocaleString('tr-TR')} ${donation.paraBirimi}` : '-',
        bagisTuru: donation.bagisTuru,
        tarih: new Date(donation.tarih).toLocaleDateString('tr-TR'),
        aciklama: donation.aciklama || '-'
      })),
      columns
    });
  }

  // Yardım başvuruları raporu
  public generateAidApplicationReport(applications: YardimBasvurusu[]): Promise<Blob> {
    const columns = [
      { key: 'basvuruSahibiId', label: 'Başvuran ID', width: 40 },
      { key: 'basvuruTuru', label: 'Yardım Türü', width: 30 },
      { key: 'talepTutari', label: 'Talep Tutarı', width: 25 },
      { key: 'durum', label: 'Durum', width: 25 },
      { key: 'basvuruTarihi', label: 'Başvuru Tarihi', width: 30 }
    ];

    return this.generateReport({
      title: 'Yardım Başvuruları Raporu',
      subtitle: `Toplam ${applications.length} başvuru`,
      data: applications.map(app => ({
        basvuruSahibiId: app.basvuruSahibiId,
        basvuruTuru: app.basvuruTuru,
        talepTutari: app.talepTutari ? `${app.talepTutari.toLocaleString('tr-TR')} TL` : '-',
        durum: app.durum,
        basvuruTarihi: new Date(app.basvuruTarihi).toLocaleDateString('tr-TR')
      })),
      columns
    });
  }

  // HTML elementini PDF'e dönüştürme
  public async generateFromHTML(element: HTMLElement, filename: string = 'rapor.pdf'): Promise<Blob> {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = this.pageWidth - (this.margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    this.doc.addImage(imgData, 'PNG', this.margin, this.margin, imgWidth, imgHeight);
    
    return this.doc.output('blob');
  }

  // Başlık ekleme
  private addHeader(title: string, subtitle?: string): void {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;

    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Tarih ve saat
    this.doc.setFontSize(10);
    this.doc.text(
      `Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`,
      this.margin,
      this.currentY
    );
    this.currentY += 15;
  }

  // Tablo ekleme
  private addTable(data: any[], columns: { key: string; label: string; width?: number }[]): void {
    const startY = this.currentY;
    const rowHeight = 8;
    const headerHeight = 10;

    // Başlık satırı
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.margin, startY, this.pageWidth - (this.margin * 2), headerHeight, 'F');
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    
    let currentX = this.margin + 2;
    columns.forEach(column => {
      this.doc.text(column.label, currentX, startY + 7);
      currentX += column.width || 30;
    });

    this.currentY = startY + headerHeight;

    // Veri satırları
    this.doc.setFont('helvetica', 'normal');
    data.forEach((row, index) => {
      if (this.currentY > this.pageHeight - 30) {
        this.doc.addPage();
        this.currentY = this.margin;
      }

      currentX = this.margin + 2;
      columns.forEach(column => {
        const value = row[column.key] || '';
        this.doc.text(String(value), currentX, this.currentY + 6);
        currentX += column.width || 30;
      });

      // Zebra striping
      if (index % 2 === 1) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), rowHeight, 'F');
      }

      this.currentY += rowHeight;
    });
  }

  // Alt bilgi ekleme
  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.text(
        `Sayfa ${i} / ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 10
      );
      this.doc.text(
        'KAFKASDER - Dernek Yönetim Sistemi',
        this.margin,
        this.pageHeight - 10
      );
    }
  }

  // PDF'i indirme
  public download(filename: string = 'rapor.pdf'): void {
    this.doc.save(filename);
  }

  // PDF'i blob olarak alma
  public getBlob(): Blob {
    return this.doc.output('blob');
  }
}

// Yardımcı fonksiyonlar
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const openPDFInNewTab = (blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  URL.revokeObjectURL(url);
};

// Varsayılan PDF generator instance
export const pdfGenerator = new PDFGenerator();