// Backward-compat helpers mapping new Person schema to legacy UI fields
import { Person } from '../types';

export function getPersonFullName(p?: Partial<Person> | null): string {
  if (!p) return '';
  const first = (p.first_name ?? (p as any).ad ?? '').toString();
  const last = (p.last_name ?? (p as any).soyad ?? '').toString();
  const full = `${first} ${last}`.trim();
  return full || ((p as any).adSoyad ?? '').toString();
}

export function getPersonPhone(p?: Partial<Person> | null): string {
  if (!p) return '';
  return (p.phone ?? (p as any).cepTelefonu ?? (p as any).telefon ?? '').toString();
}

export function getPersonAddress(
  p?: Partial<Person> | null
): { address: string; city: string; district: string; neighborhood: string } {
  if (!p) return { address: '', city: '', district: '', neighborhood: '' };
  const address = (p.address ?? (p as any).adres ?? '').toString();
  const city = (p.city ?? (p as any).il ?? (p as any).province ?? '').toString();
  const district = (p.district ?? (p as any).ilce ?? '').toString();
  const neighborhood = (p.neighborhood ?? (p as any).mahalle ?? '').toString();
  return { address, city, district, neighborhood };
}

export function getPersonIdentityNumber(p?: Partial<Person> | null): string {
  if (!p) return '';
  return (p.identity_number ?? (p as any).kimlikNo ?? (p as any).tcKimlikNo ?? '').toString();
}

export function getPersonGender(p?: Partial<Person> | null): string {
  if (!p) return '';
  return (p.gender ?? (p as any).cinsiyet ?? '').toString();
}

export function getPersonMaritalStatus(p?: Partial<Person> | null): string {
  if (!p) return '';
  return (p.marital_status ?? (p as any).medeniDurum ?? '').toString();
}

export function getPersonStatus(p?: Partial<Person> | null): any {
  if (!p) return '' as any;
  return (p.status ?? (p as any).durum ?? '') as any;
}

export function getLegacyId(p: { id: string | number }): string {
  return String(p?.id ?? '');
}

// Safe map lookups for mixed id types
export function mapGet<K extends string | number, V>(
  map: Map<string, V> | Map<number, V>,
  key: string | number
): V | undefined {
  // Try string key
  const v1 = (map as Map<string, V>).get(String(key));
  if (v1 !== undefined) return v1;
  // Try numeric key
  const n = Number(key);
  if (!Number.isNaN(n)) {
    const v2 = (map as Map<number, V>).get(n);
    if (v2 !== undefined) return v2;
  }
  return undefined;
}
