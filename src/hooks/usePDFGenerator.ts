import { useState, useCallback } from 'react';
import { PDFGenerator, PDFReportOptions, downloadPDF, openPDFInNewTab } from '../utils/pdfGenerator';
import { Person, Bagis, YardimBasvurusu } from '../../types';
import toast from 'react-hot-toast';

export interface UsePDFGeneratorReturn {
  isGenerating: boolean;
  generatePersonReport: (people: Person[], options?: { download?: boolean; openInNewTab?: boolean }) => Promise<void>;
  generateDonationReport: (donations: Bagis[], options?: { download?: boolean; openInNewTab?: boolean }) => Promise<void>;
  generateAidApplicationReport: (applications: YardimBasvurusu[], options?: { download?: boolean; openInNewTab?: boolean }) => Promise<void>;
  generateCustomReport: (reportOptions: PDFReportOptions, options?: { download?: boolean; openInNewTab?: boolean }) => Promise<void>;
  generateFromHTML: (element: HTMLElement, filename?: string, options?: { download?: boolean; openInNewTab?: boolean }) => Promise<void>;
}

export const usePDFGenerator = (): UsePDFGeneratorReturn => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePDFGeneration = useCallback(async (
    generatorFn: () => Promise<Blob>,
    filename: string,
    options: { download?: boolean; openInNewTab?: boolean } = { download: true }
  ) => {
    setIsGenerating(true);
    
    try {
      const blob = await generatorFn();
      
      if (options.download) {
        downloadPDF(blob, filename);
      }
      
      if (options.openInNewTab) {
        openPDFInNewTab(blob);
      }
      
      toast.success('PDF raporu başarıyla oluşturuldu!');
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generatePersonReport = useCallback(async (
    people: Person[],
    options: { download?: boolean; openInNewTab?: boolean } = { download: true }
  ) => {
    const generator = new PDFGenerator();
    await handlePDFGeneration(
      () => generator.generatePersonReport(people),
      `kisi-listesi-${new Date().toISOString().split('T')[0]}.pdf`,
      options
    );
  }, [handlePDFGeneration]);

  const generateDonationReport = useCallback(async (
    donations: Bagis[],
    options: { download?: boolean; openInNewTab?: boolean } = { download: true }
  ) => {
    const generator = new PDFGenerator();
    await handlePDFGeneration(
      () => generator.generateDonationReport(donations),
      `bagis-raporu-${new Date().toISOString().split('T')[0]}.pdf`,
      options
    );
  }, [handlePDFGeneration]);

  const generateAidApplicationReport = useCallback(async (
    applications: YardimBasvurusu[],
    options: { download?: boolean; openInNewTab?: boolean } = { download: true }
  ) => {
    const generator = new PDFGenerator();
    await handlePDFGeneration(
      () => generator.generateAidApplicationReport(applications),
      `yardim-basvurulari-${new Date().toISOString().split('T')[0]}.pdf`,
      options
    );
  }, [handlePDFGeneration]);

  const generateCustomReport = useCallback(async (
    reportOptions: PDFReportOptions,
    options: { download?: boolean; openInNewTab?: boolean } = { download: true }
  ) => {
    const generator = new PDFGenerator(
      reportOptions.orientation,
      reportOptions.pageSize
    );
    await handlePDFGeneration(
      () => generator.generateReport(reportOptions),
      `ozel-rapor-${new Date().toISOString().split('T')[0]}.pdf`,
      options
    );
  }, [handlePDFGeneration]);

  const generateFromHTML = useCallback(async (
    element: HTMLElement,
    filename: string = `html-rapor-${new Date().toISOString().split('T')[0]}.pdf`,
    options: { download?: boolean; openInNewTab?: boolean } = { download: true }
  ) => {
    const generator = new PDFGenerator();
    await handlePDFGeneration(
      () => generator.generateFromHTML(element, filename),
      filename,
      options
    );
  }, [handlePDFGeneration]);

  return {
    isGenerating,
    generatePersonReport,
    generateDonationReport,
    generateAidApplicationReport,
    generateCustomReport,
    generateFromHTML
  };
};