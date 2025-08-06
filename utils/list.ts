// utils/list.ts
// Liste filtreleme, sıralama ve paginasyon için saf yardımcı fonksiyonlar

export type SortDirection = 'asc' | 'desc';

export interface SortSpec<T> {
  key: keyof T | ((item: T) => any);
  direction?: SortDirection;
  nullsLast?: boolean;
  comparator?: (a: any, b: any) => number;
}

export interface Pagination {
  page: number;       // 1-based
  pageSize: number;   // > 0
}

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function isNil(v: any) {
  return v === null || v === undefined;
}

function defaultComparator(a: any, b: any) {
  if (isNil(a) && isNil(b)) return 0;
  if (isNil(a)) return -1;
  if (isNil(b)) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  const as = String(a).toLocaleLowerCase('tr-TR');
  const bs = String(b).toLocaleLowerCase('tr-TR');
  return as.localeCompare(bs, 'tr-TR');
}

function getValue<T>(item: T, key: keyof T | ((i: T) => any)) {
  return typeof key === 'function' ? key(item) : (item as any)[key];
}

/**
 * Çoklu alan sıralama desteği
 */
export function sortBy<T>(list: T[], specs: SortSpec<T> | SortSpec<T>[]): T[] {
  if (!Array.isArray(list) || list.length === 0) return list;
  const specArr = Array.isArray(specs) ? specs : [specs];

  const cloned = [...list];
  cloned.sort((a, b) => {
    for (const spec of specArr) {
      const { key, direction = 'asc', comparator = defaultComparator, nullsLast = true } = spec;
      let av = getValue(a, key);
      let bv = getValue(b, key);

      // null/undefined sonlara at
      if (nullsLast) {
        if (isNil(av) && !isNil(bv)) return 1;
        if (!isNil(av) && isNil(bv)) return -1;
      }

      let cmp = comparator(av, bv);
      if (direction === 'desc') cmp = -cmp;
      if (cmp !== 0) return cmp;
    }
    return 0;
  });

  return cloned;
}

/**
 * Basit metin araması: verilen alan(lar)da includes kontrolü (case-insensitive)
 */
export function textFilter<T>(
  list: T[],
  query: string,
  pickers: (keyof T | ((i: T) => string | number | null | undefined))[]
): T[] {
  const q = (query ?? '').toString().trim().toLocaleLowerCase('tr-TR');
  if (!q) return list;

  return list.filter(item => {
    return pickers.some(p => {
      const val = typeof p === 'function' ? p(item) : (item as any)[p];
      if (isNil(val)) return false;
      return String(val).toLocaleLowerCase('tr-TR').includes(q);
    });
  });
}

/**
 * Alan bazlı esnek filtreleme: predicate ile
 */
export function where<T>(list: T[], predicate: (item: T) => boolean): T[] {
  if (!predicate) return list;
  return list.filter(predicate);
}

/**
 * Basit bir predicate alan filtreleme yardımcı fonksiyonu
 * BagisYonetimi gibi kullanım noktaları için isim uyumluluğu sağlamak amacıyla
 * filterItems adıyla export edilir.
 */
export function filterItems<T>(list: T[], predicate: (item: T) => boolean): T[] {
  return where(list, predicate);
}

/**
 * Tek anahtar karşılaştırıcı ile sıralama - isim uyumluluğu için sortItems
 */
export function sortItems<T>(list: T[], comparator: (a: T, b: T) => number): T[] {
  const cloned = [...(list || [])];
  cloned.sort(comparator);
  return cloned;
}

/**
 * Sayfalama
 */
export function paginate<T>(list: T[], pagination: Pagination): ListResult<T> {
  const page = Math.max(1, Math.floor(pagination.page || 1));
  const pageSize = Math.max(1, Math.floor(pagination.pageSize || 10));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = list.slice(start, end);

  return { items, total, page, pageSize, totalPages };
}

/**
 * Hepsi bir arada: filtrele -> sırala -> sayfala
 */
export function filterSortPaginate<T>(
  list: T[],
  opts: {
    search?: { query: string; pickers: (keyof T | ((i: T) => string | number | null | undefined))[] };
    predicate?: (item: T) => boolean;
    sort?: SortSpec<T> | SortSpec<T>[];
    pagination?: Pagination;
  }
): ListResult<T> {
  let result = [...(list || [])];

  if (opts.predicate) {
    result = where(result, opts.predicate);
  }

  if (opts.search && opts.search.query) {
    result = textFilter(result, opts.search.query, opts.search.pickers);
  }

  if (opts.sort) {
    result = sortBy(result, opts.sort);
  }

  if (opts.pagination) {
    return paginate(result, opts.pagination);
  }

  // sayfalama yoksa yine de toplamı dön
  return {
    items: result,
    total: result.length,
    page: 1,
    pageSize: result.length || 1,
    totalPages: 1,
  };
}

/**
 * Distinct yardımcıları
 */
export function distinctBy<T, K>(list: T[], keySelector: (item: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of list) {
    const key = keySelector(item);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(item);
    }
  }
  return out;
}

/**
 * Gruplama
 */
export function groupBy<T, K extends string | number | symbol>(
  list: T[],
  keySelector: (item: T) => K
): Record<K, T[]> {
  return list.reduce((acc, item) => {
    const key = keySelector(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
