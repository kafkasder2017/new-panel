import React from 'react';
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

const DetailItem: React.FC<{ label: string; value?: React.ReactNode; children?: React.ReactNode; className?: string }> = ({
  label,
  value,
  children,
  className,
}) => (
  <div className={className}>
    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
    <div className="mt-1 text-base text-zinc-800 dark:text-zinc-200">{children || value || '-'}</div>
  </div>
);

interface GenelViewProps {
  data: Person;
}

const GenelViewComponent: React.FC<GenelViewProps> = ({ data }) => {
  const status = (data.status || (data as any).durum) as PersonStatus;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
      <DetailItem label="Ad Soyad" value={`${(data as any).ad ?? data.first_name ?? ''} ${(data as any).soyad ?? data.last_name ?? ''}`} />
      <DetailItem
        label="Durum"
        children={
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(status)}`}>
            {status}
          </span>
        }
      />
      <DetailItem label="Cep Telefonu" value={(data.phone || (data as any).telefon) as string} />
      <DetailItem label="E-posta" value={data.email} />
      <DetailItem
        label="Uyruk"
        value={(data.nationality || (data as any).uyruk || []).join?.(', ') || ''}
      />
      <DetailItem
        label="Doğum Tarihi"
        value={
          (data as any).dogumTarihi
            ? new Date((data as any).dogumTarihi).toLocaleDateString('tr-TR')
            : data.birth_date
            ? new Date(data.birth_date).toLocaleDateString('tr-TR')
            : '-'
        }
      />
      <DetailItem
        label="TC Kimlik No"
        value={(data.identity_number || (data as any).tcKimlikNo || (data as any).kimlikNo) as string}
      />
      <DetailItem label="Cinsiyet" value={(data.gender || (data as any).cinsiyet) as string} />
      <DetailItem label="Medeni Durum" value={(data.marital_status || (data as any).medeniDurum) as string} />
      <DetailItem
        label="Adres"
        value={`${(data.address || (data as any).adres) ?? ''}, ${(data.neighborhood || (data as any).mahalle) ?? ''}, ${(data.district || (data as any).ilce) ?? ''}/${(data.city || (data as any).il) ?? ''}`}
        className="sm:col-span-2 lg:col-span-3"
      />
    </div>
  );
};

// Re-renderları azaltmak için memo
const GenelView = React.memo(GenelViewComponent);
GenelView.displayName = 'GenelView';

export default GenelView;
