import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Person, PersonStatus } from '../../types';

interface LinkedItem {
  label: string;
  action?: () => void;
  to?: string;
  disabled?: boolean;
  count?: number;
  status?: PersonStatus | string;
}

interface LinkedRecordsProps {
  person: Person;
  onOpen: (key: 'banka' | 'dokuman' | 'bagli-kisiler') => void;
}

const LinkedRecords: React.FC<LinkedRecordsProps> = ({ person, onOpen }) => {
  const fullNameForUrl = encodeURIComponent(
    `${(person as any).ad ?? person.first_name ?? ''} ${(person as any).soyad ?? person.last_name ?? ''}`
  );

  const items: LinkedItem[] = [
    { label: 'Banka Hesapları', action: () => onOpen('banka'), count: (person as any).bankaHesaplari?.length },
    { label: 'Dokümanlar', action: () => onOpen('dokuman'), count: (person as any).dokumanlar?.length },
    { label: 'Fotoğraflar', disabled: true, count: (person as any).fotograflar?.length },
    { label: 'Bağlı Yetimler', disabled: true },
    { label: 'Baktığı Kişiler', action: () => onOpen('bagli-kisiler'), count: (person as any).dependents?.length },
    { label: 'Sponsorlar', disabled: true },
    { label: 'Referanslar', disabled: true },
    { label: 'Görüşme Kayıtları', disabled: true },
    { label: 'Yardım Talepleri', to: `/yardimlar?kisiAdi=${fullNameForUrl}` },
    { label: 'Yapılan Yardımlar', to: `/yardim-yonetimi/tum-yardimlar?kisiAdi=${fullNameForUrl}` },
    { label: 'Rıza Beyanları', disabled: true, status: (person as any).consent_statement || (person as any).rizaBeyani },
    { label: 'Sosyal Kartlar', disabled: true },
  ];

  return (
    <section
      className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700"
      aria-labelledby="linked-records-title"
      role="region"
    >
      <h3 id="linked-records-title" className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
        Bağlantılı Kayıtlar
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2" role="list">
        {items.map((item) => {
          const countSuffix = item.count !== undefined ? ` (${item.count})` : '';
          if (item.to) {
            return (
              <ReactRouterDOM.Link
                key={item.label}
                to={item.to}
                className="p-3 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                role="listitem"
                aria-label={`${item.label}${countSuffix}`}
                title={item.label}
              >
                {item.label}
              </ReactRouterDOM.Link>
            );
          }
          return (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.disabled}
              className="p-3 border border-zinc-300 dark:border-zinc-600 rounded-md text-sm text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              role="listitem"
              aria-label={`${item.label}${countSuffix}`}
              title={item.label}
              aria-disabled={item.disabled || undefined}
            >
              {item.label} {item.count !== undefined ? `(${item.count})` : ''}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default LinkedRecords;
