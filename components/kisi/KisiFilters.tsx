import React from 'react';
import { PersonStatus, Uyruk, YardimTuruDetay, MembershipType } from '../../types';
import AdvancedFilter from '../../src/components/AdvancedFilter';
import SmartSearch from '../../src/components/SmartSearch';

export interface KisiFiltersState {
  searchTerm: string;
  statusFilter: PersonStatus | 'all';
  nationalityFilter: Uyruk | 'all';
  yardimTuruFilter: YardimTuruDetay | 'all';
  cityFilter: string;
  ageRangeMin: string;
  ageRangeMax: string;
  registrationDateFrom: string;
  registrationDateTo: string;
  membershipTypeFilter: MembershipType | 'all';
  multipleStatusFilter: PersonStatus[];
  multipleNationalityFilter: Uyruk[];
}

interface KisiFiltersProps {
  filters: KisiFiltersState;
  onFiltersChange: (next: KisiFiltersState) => void;
  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  activeFilterCount: number;
  onClearAll: () => void;
  savedViews: Array<{ id: string; name: string; filters: any; createdAt: string }>;
  onLoadView: (id: string) => void;
  onOpenSaveView: () => void;
}

const KisiFilters: React.FC<KisiFiltersProps> = ({
  filters,
  onFiltersChange,
  showAdvanced,
  setShowAdvanced,
  activeFilterCount,
  onClearAll,
  savedViews,
  onLoadView,
  onOpenSaveView
}) => {

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as any;
    onFiltersChange({ ...filters, [name]: value });
  };

  return (
    <>
      {/* Akıllı Arama */}
      <div className="mb-4">
        <SmartSearch
          placeholder="Kişi ara..."
          onSearch={(searchTerm) => onFiltersChange({ ...filters, searchTerm })}
        />
      </div>

      {/* Temel Filtreler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="relative">
          <input
            type="text"
            name="searchTerm"
            placeholder="Ad, Soyad, Kimlik No, Telefon, Adres..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 pl-10 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          name="statusFilter"
          value={filters.statusFilter}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
        >
          <option value="all">Tüm Durumlar</option>
          {Object.values(PersonStatus).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          name="nationalityFilter"
          value={filters.nationalityFilter}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
        >
          <option value="all">Tüm Uyruklar</option>
          {Object.values(Uyruk).map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <select
          name="yardimTuruFilter"
          value={filters.yardimTuruFilter}
          onChange={handleFilterChange}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
        >
          <option value="all">Tüm Yardım Türleri</option>
          {Object.values(YardimTuruDetay).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Filtre Kontrolleri */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Gelişmiş Filtreler
            {showAdvanced ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                {activeFilterCount} filtre aktif
              </span>
              <button
                onClick={onClearAll}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
              >
                Temizle
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {savedViews.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) onLoadView(e.target.value);
              }}
              className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700"
              value=""
            >
              <option value="">Kayıtlı Görünümler</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>{view.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={onOpenSaveView}
            className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            Görünümü Kaydet
          </button>
        </div>
      </div>

      {/* Gelişmiş Filtreler */}
      {showAdvanced && (
        <AdvancedFilter
          filters={filters}
          onFiltersChange={(f) => onFiltersChange(f as KisiFiltersState)}
          filterOptions={[
            {
              key: 'status',
              label: 'Durum',
              type: 'select',
              options: [
                { value: 'aktif', label: 'Aktif' },
                { value: 'pasif', label: 'Pasif' },
              ],
            },
            {
              key: 'membershipType',
              label: 'Üyelik Türü',
              type: 'select',
              options: [
                { value: 'normal', label: 'Normal' },
                { value: 'onursal', label: 'Onursal' },
                { value: 'kurumsal', label: 'Kurumsal' },
              ],
            },
            { key: 'city', label: 'İl', type: 'text', placeholder: 'İl ara...' },
          ]}
          className="mb-4"
        />
      )}
    </>
  );
};

export default KisiFilters;
