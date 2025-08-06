import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Person, PersonStatus } from '../../types';

const getStatusClass = (status: PersonStatus) => {
  switch (status) {
    case PersonStatus.AKTIF:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case PersonStatus.PASIF:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    case PersonStatus.BEKLEMEDE:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
  }
};

interface KisiTableProps {
  data: Person[];
  selectedIds: string[];
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectOne: (id: string) => void;
  onEdit: (p: Person) => void;
  onDelete: (id: string) => void;
}

const KisiTableComponent: React.FC<KisiTableProps> = ({
  data,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onEdit,
  onDelete,
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    const numSelected = selectedIds.length;
    const numDisplayed = data.length;
    headerCheckboxRef.current.checked = numSelected > 0 && numSelected === numDisplayed;
    headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numDisplayed;
  }, [selectedIds, data]);

  // Sanallaştırma: react-window'sız basit bir windowing (performans için)
  //  - Aynı görsel tasarımı korumak için table yapısını muhafaza ediyoruz.
  //  - Ortalama satır yüksekliği ~56px (py-4) kabul edilerek hesaplama yapılıyor.
  const containerRef = useRef<HTMLDivElement>(null);
  const rowHeight = 56; // px, tailwind py-4 + içerik yüksekliği ile yaklaşık
  const overscan = 8;

  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(600);

  const onScroll = useCallback(() => {
    if (!containerRef.current) return;
    setScrollTop(containerRef.current.scrollTop);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleResize = () => setViewportHeight(el.clientHeight);
    handleResize();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [onScroll]);

  const total = data.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    total,
    Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan
  );
  const items = data.slice(startIndex, endIndex);

  const topSpacer = startIndex * rowHeight;
  const bottomSpacer = (total - endIndex) * rowHeight;

  return (
    <div className="overflow-x-auto">
      <div
        ref={containerRef}
        className="max-h-[70vh] overflow-y-auto"
        aria-label="Kişi Tablosu Scroll Container"
      >
        <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400" role="table" aria-label="Kişi Tablosu">
          <thead className="sticky top-0 z-10 text-xs text-zinc-700 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-700/50">
            <tr role="row">
              <th scope="col" className="p-4">
                <div className="flex items-center">
                  <input
                    id="checkbox-all"
                    type="checkbox"
                    ref={headerCheckboxRef}
                    onChange={onSelectAll}
                    aria-label="Tümünü seç"
                    className="w-4 h-4 text-blue-600 bg-zinc-100 border-zinc-300 rounded focus:ring-blue-500 dark:focus:ring-offset-zinc-800 dark:bg-zinc-600 dark:border-zinc-500"
                  />
                  <label htmlFor="checkbox-all" className="sr-only">
                    select all
                  </label>
                </div>
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Ad Soyad
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Kimlik No
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Uyruk
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                İl
              </th>
              <th scope="col" className="px-6 py-4 font-semibold">
                Durum
              </th>
              <th scope="col" className="px-6 py-4 font-semibold text-right">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {/* Üst spacer */}
            {topSpacer > 0 && (
              <tr style={{ height: topSpacer }}>
                <td colSpan={7} />
              </tr>
            )}

            {items.map((person, i) => (
              <tr key={person.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50" style={{ height: rowHeight }}>
                <td className="w-4 p-4">
                  <div className="flex items-center">
                    <input
                      id={`checkbox-${person.id}`}
                      type="checkbox"
                      checked={selectedIds.includes(person.id)}
                      onChange={() => onSelectOne(person.id)}
                      aria-label={`${person.first_name} ${person.last_name} seç`}
                      className="w-4 h-4 text-blue-600 bg-zinc-100 border-zinc-300 rounded focus:ring-blue-500 dark:focus:ring-offset-zinc-800 dark:bg-zinc-600 dark:border-zinc-500"
                    />
                    <label htmlFor={`checkbox-${person.id}`} className="sr-only">
                      select row
                    </label>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {person.first_name} {person.last_name}
                </td>
                <td className="px-6 py-4">{person.identity_number}</td>
                <td className="px-6 py-4">{person.nationality}</td>
                <td className="px-6 py-4">{person.city}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                      person.status as PersonStatus
                    )}`}
                  >
                    {person.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-4">
                    <ReactRouterDOM.Link
                      to={`/kisiler/${person.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
                      aria-label={`${person.first_name} ${person.last_name} detay`}
                    >
                      Detay
                    </ReactRouterDOM.Link>
                    <button
                      onClick={() => onEdit(person)}
                      className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold"
                      aria-label={`${person.first_name} ${person.last_name} düzenle`}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => onDelete(person.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold"
                      aria-label={`${person.first_name} ${person.last_name} sil`}
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Alt spacer */}
            {bottomSpacer > 0 && (
              <tr style={{ height: bottomSpacer }}>
                <td colSpan={7} />
              </tr>
            )}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="text-center py-10 text-zinc-500">
            <p>Arama kriterlerine uygun kişi bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize table to avoid unnecessary re-renders when props shallow-equal
const KisiTable = React.memo(KisiTableComponent);
KisiTable.displayName = 'KisiTable';

export default KisiTable;
