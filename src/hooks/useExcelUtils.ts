import { useState } from 'react';
import { ExcelUtils, ExcelExportOptions, ExcelImportResult } from '../utils/excelUtils';
import toast from 'react-hot-toast';
import { Person, YardimBasvurusu, Bagis } from '../../types';

export const useExcelUtils = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Generic export function
  const exportData = async <T extends Record<string, any>>(
    data: T[],
    options: ExcelExportOptions = {}
  ) => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      ExcelUtils.exportToExcel(data, options);
      toast.success(`${data.length} kayıt Excel'e aktarıldı`);
    } catch (error: any) {
      toast.error(`Excel'e aktarma hatası: ${error.message}`);
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Generic import function
  const importData = async <T>(
    file: File,
    validator?: (row: any, index: number) => { isValid: boolean; errors: string[] }
  ): Promise<ExcelImportResult<T> | null> => {
    if (isImporting) return null;
    
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const result = await ExcelUtils.importFromExcel<T>(file, validator);
      
      setImportProgress(100);
      
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} satırda hata bulundu`);
        console.warn('Import errors:', result.errors);
      }
      
      if (result.validRows > 0) {
        toast.success(`${result.validRows} kayıt başarıyla içe aktarıldı`);
      }
      
      return result;
    } catch (error: any) {
      toast.error(`Excel'den içe aktarma hatası: ${error.message}`);
      console.error('Import error:', error);
      return null;
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Specific export functions
  const exportPersons = async (persons: Person[], options: Partial<ExcelExportOptions> = {}) => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      ExcelUtils.exportPersons(persons, options);
      toast.success(`${persons.length} kişi kaydı Excel'e aktarıldı`);
    } catch (error: any) {
      toast.error(`Kişi kayıtları Excel'e aktarma hatası: ${error.message}`);
      console.error('Export persons error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportDonations = async (donations: Bagis[], options: Partial<ExcelExportOptions> = {}) => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      ExcelUtils.exportDonations(donations, options);
      toast.success(`${donations.length} bağış kaydı Excel'e aktarıldı`);
    } catch (error: any) {
      toast.error(`Bağış kayıtları Excel'e aktarma hatası: ${error.message}`);
      console.error('Export donations error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAidApplications = async (applications: YardimBasvurusu[], options: Partial<ExcelExportOptions> = {}) => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      ExcelUtils.exportAidApplications(applications, options);
      toast.success(`${applications.length} yardım başvurusu Excel'e aktarıldı`);
    } catch (error: any) {
      toast.error(`Yardım başvuruları Excel'e aktarma hatası: ${error.message}`);
      console.error('Export aid applications error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Template generators
  const generatePersonTemplate = () => {
    try {
      ExcelUtils.generatePersonTemplate();
      toast.success('Kişi import template dosyası indirildi');
    } catch (error: any) {
      toast.error(`Template oluşturma hatası: ${error.message}`);
      console.error('Generate template error:', error);
    }
  };

  const generateDonationTemplate = () => {
    try {
      ExcelUtils.generateDonationTemplate();
      toast.success('Bağış import template dosyası indirildi');
    } catch (error: any) {
      toast.error(`Template oluşturma hatası: ${error.message}`);
      console.error('Generate template error:', error);
    }
  };

  // Validators
  const validatePersonRow = (row: any, index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!row.ad_soyad || row.ad_soyad.trim() === '') {
      errors.push('Ad Soyad alanı zorunludur');
    }
    
    if (row.tc_kimlik && !/^\d{11}$/.test(row.tc_kimlik.toString())) {
      errors.push('TC Kimlik 11 haneli olmalıdır');
    }
    
    if (row.telefon && !/^\d{10,11}$/.test(row.telefon.toString().replace(/\D/g, ''))) {
      errors.push('Telefon numarası geçersiz');
    }
    
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push('E-posta adresi geçersiz');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const validateDonationRow = (row: any, index: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!row.bagisci_adi || row.bagisci_adi.trim() === '') {
      errors.push('Bağışçı adı zorunludur');
    }
    
    if (!row.miktar || isNaN(Number(row.miktar)) || Number(row.miktar) <= 0) {
      errors.push('Miktar geçerli bir sayı olmalıdır');
    }
    
    if (!row.bagis_turu || row.bagis_turu.trim() === '') {
      errors.push('Bağış türü zorunludur');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Import with validation
  const importPersons = async (file: File) => {
    return await importData<Person>(file, validatePersonRow);
  };

  const importDonations = async (file: File) => {
    return await importData<Bagis>(file, validateDonationRow);
  };

  return {
    // States
    isExporting,
    isImporting,
    importProgress,
    
    // Generic functions
    exportData,
    importData,
    
    // Specific export functions
    exportPersons,
    exportDonations,
    exportAidApplications,
    
    // Import functions with validation
    importPersons,
    importDonations,
    
    // Template generators
    generatePersonTemplate,
    generateDonationTemplate,
    
    // Validators
    validatePersonRow,
    validateDonationRow
  };
};