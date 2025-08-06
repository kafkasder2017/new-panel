import * as XLSX from 'xlsx';
import { Person, YardimBasvurusu, Bagis } from '../../types';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  customHeaders?: Record<string, string>;
}

export interface ExcelImportResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export class ExcelUtils {
  // Export data to Excel
  static exportToExcel<T extends Record<string, any>>(
    data: T[],
    options: ExcelExportOptions = {}
  ): void {
    const {
      filename = 'export.xlsx',
      sheetName = 'Sheet1',
      includeHeaders = true,
      customHeaders = {},
      dateFormat = 'DD/MM/YYYY'
    } = options;

    if (!data || data.length === 0) {
      throw new Error('Dışa aktarılacak veri bulunamadı');
    }

    // Process data for export
    const processedData = data.map(row => {
      const processedRow: Record<string, any> = {};
      
      Object.keys(row).forEach(key => {
        const value = row[key];
        const headerName = customHeaders[key] || this.formatHeader(key);
        
        // Format dates
        if (value instanceof Date) {
          processedRow[headerName] = this.formatDate(value, dateFormat);
        }
        // Format boolean values
        else if (typeof value === 'boolean') {
          processedRow[headerName] = value ? 'Evet' : 'Hayır';
        }
        // Format null/undefined values
        else if (value === null || value === undefined) {
          processedRow[headerName] = '';
        }
        // Format arrays and objects
        else if (typeof value === 'object') {
          processedRow[headerName] = JSON.stringify(value);
        }
        else {
          processedRow[headerName] = value;
        }
      });
      
      return processedRow;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(processedData, {
      header: includeHeaders ? Object.keys(processedData[0]) : undefined
    });

    // Auto-size columns
    const columnWidths = this.calculateColumnWidths(processedData);
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Save file
    XLSX.writeFile(workbook, filename);
  }

  // Import data from Excel
  static async importFromExcel<T>(
    file: File,
    validator?: (row: any, index: number) => { isValid: boolean; errors: string[] }
  ): Promise<ExcelImportResult<T>> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: ''
          }) as any[][];

          if (rawData.length === 0) {
            resolve({
              data: [],
              errors: ['Excel dosyası boş'],
              warnings: [],
              totalRows: 0,
              validRows: 0
            });
            return;
          }

          // Extract headers and data
          const headers = rawData[0] as string[];
          const dataRows = rawData.slice(1);
          
          const result: ExcelImportResult<T> = {
            data: [],
            errors: [],
            warnings: [],
            totalRows: dataRows.length,
            validRows: 0
          };

          // Process each row
          dataRows.forEach((row, index) => {
            try {
              // Convert row array to object
              const rowObject: any = {};
              headers.forEach((header, colIndex) => {
                const value = row[colIndex];
                const key = this.normalizeKey(header);
                rowObject[key] = this.parseValue(value);
              });

              // Validate row if validator provided
              if (validator) {
                const validation = validator(rowObject, index);
                if (!validation.isValid) {
                  result.errors.push(`Satır ${index + 2}: ${validation.errors.join(', ')}`);
                  return;
                }
              }

              result.data.push(rowObject as T);
              result.validRows++;
            } catch (error) {
              result.errors.push(`Satır ${index + 2}: ${error}`);
            }
          });

          resolve(result);
        } catch (error) {
          reject(new Error(`Excel dosyası okunurken hata: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Dosya okuma hatası'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Export specific entity types with predefined formats
  static exportPersons(persons: Person[], options: Partial<ExcelExportOptions> = {}): void {
    const customHeaders = {
      id: 'ID',
      adSoyad: 'Ad Soyad',
      tcKimlik: 'TC Kimlik',
      telefon: 'Telefon',
      email: 'E-posta',
      adres: 'Adres',
      dogumTarihi: 'Doğum Tarihi',
      meslek: 'Meslek',
      gelirDurumu: 'Gelir Durumu',
      medeniDurum: 'Medeni Durum',
      cocukSayisi: 'Çocuk Sayısı',
      notlar: 'Notlar',
      kayitTarihi: 'Kayıt Tarihi',
      guncellemeTarihi: 'Güncelleme Tarihi'
    };

    this.exportToExcel(persons, {
      filename: `kisiler_${this.formatDate(new Date(), 'YYYYMMDD')}.xlsx`,
      sheetName: 'Kişiler',
      customHeaders,
      ...options
    });
  }

  static exportDonations(donations: Bagis[], options: Partial<ExcelExportOptions> = {}): void {
    const customHeaders = {
      id: 'ID',
      bagisciId: 'Bağışçı ID',
      bagisciAdi: 'Bağışçı Adı',
      miktar: 'Miktar',
      para_birimi: 'Para Birimi',
      bagis_turu: 'Bağış Türü',
      aciklama: 'Açıklama',
      tarih: 'Tarih',
      makbuz_no: 'Makbuz No',
      odeme_yontemi: 'Ödeme Yöntemi'
    };

    this.exportToExcel(donations, {
      filename: `bagislar_${this.formatDate(new Date(), 'YYYYMMDD')}.xlsx`,
      sheetName: 'Bağışlar',
      customHeaders,
      ...options
    });
  }

  static exportAidApplications(applications: YardimBasvurusu[], options: Partial<ExcelExportOptions> = {}): void {
    const customHeaders = {
      id: 'ID',
      basvuranId: 'Başvuran ID',
      basvuranAdi: 'Başvuran Adı',
      yardimTuru: 'Yardım Türü',
      aciklama: 'Açıklama',
      miktar: 'Miktar',
      durum: 'Durum',
      oncelik: 'Öncelik',
      basvuruTarihi: 'Başvuru Tarihi',
      degerlendirmeTarihi: 'Değerlendirme Tarihi',
      tamamlanmaTarihi: 'Tamamlanma Tarihi'
    };

    this.exportToExcel(applications, {
      filename: `yardim_basvurulari_${this.formatDate(new Date(), 'YYYYMMDD')}.xlsx`,
      sheetName: 'Yardım Başvuruları',
      customHeaders,
      ...options
    });
  }

  // Helper methods
  private static formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private static formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYYMMDD':
        return `${year}${month}${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  private static normalizeKey(header: string): string {
    return header
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/^_+|_+$/g, '');
  }

  private static parseValue(value: any): any {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    
    // Try to parse as number
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value);
    }
    
    // Try to parse as date
    if (typeof value === 'string' && /\d{1,2}[/\-]\d{1,2}[/\-]\d{4}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try to parse as boolean
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === 'evet' || lower === '1') {
        return true;
      }
      if (lower === 'false' || lower === 'hayır' || lower === '0') {
        return false;
      }
    }
    
    return value;
  }

  private static calculateColumnWidths(data: Record<string, any>[]): any[] {
    if (!data || data.length === 0) return [];
    
    const headers = Object.keys(data[0]);
    return headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      return { width: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
  }

  // Template generators
  static generatePersonTemplate(): void {
    const template = [{
      'Ad Soyad': 'Örnek: Ahmet Yılmaz',
      'TC Kimlik': '12345678901',
      'Telefon': '05551234567',
      'E-posta': 'ornek@email.com',
      'Adres': 'Örnek Mahalle, Örnek Sokak No:1',
      'Doğum Tarihi': '01/01/1990',
      'Meslek': 'Öğretmen',
      'Gelir Durumu': 'Orta',
      'Medeni Durum': 'Evli',
      'Çocuk Sayısı': '2',
      'Notlar': 'Örnek not'
    }];

    this.exportToExcel(template, {
      filename: 'kisi_import_template.xlsx',
      sheetName: 'Kişiler Template'
    });
  }

  static generateDonationTemplate(): void {
    const template = [{
      'Bağışçı Adı': 'Örnek: Mehmet Demir',
      'Miktar': '1000',
      'Para Birimi': 'TRY',
      'Bağış Türü': 'Nakdi',
      'Açıklama': 'Genel bağış',
      'Tarih': '01/01/2024',
      'Makbuz No': 'MKB2024001',
      'Ödeme Yöntemi': 'Banka Havalesi'
    }];

    this.exportToExcel(template, {
      filename: 'bagis_import_template.xlsx',
      sheetName: 'Bağışlar Template'
    });
  }
}