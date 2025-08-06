import React from 'react';

interface ToolbarProps {
  isImporting: boolean;
  isExporting: boolean;
  isGenerating: boolean;
  hasData: boolean;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTemplate: () => void;
  onExport: () => void;
  onPDF: () => void;
  onNew: () => void;
}

const KisiToolbar: React.FC<ToolbarProps> = ({
  isImporting,
  isExporting,
  isGenerating,
  hasData,
  onImport,
  onTemplate,
  onExport,
  onPDF,
  onNew,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 mb-4">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Kişi Yönetimi</h2>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onImport}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isImporting}
          />
          <button
            disabled={isImporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-3-6 3 3m0 0-3 3m3-3H9" />
            </svg>
            <span>{isImporting ? 'İçe Aktarılıyor...' : "Excel'den İçe Aktar"}</span>
          </button>
        </div>
        <button
          onClick={onTemplate}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M8.25 9h4.5M8.25 12h4.5m-4.5 3h4.5" />
          </svg>
          <span>Template İndir</span>
        </button>
        <button
          onClick={onExport}
          disabled={isExporting || !hasData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>{isExporting ? "Dışa Aktarılıyor..." : "Excel'e Aktar"}</span>
        </button>
        <button
          onClick={onPDF}
          disabled={isGenerating || !hasData}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <span>{isGenerating ? 'PDF Oluşturuluyor...' : 'PDF Rapor'}</span>
        </button>
        <button
          onClick={onNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>Yeni Kişi Ekle</span>
        </button>
      </div>
    </div>
  );
};

export default KisiToolbar;
