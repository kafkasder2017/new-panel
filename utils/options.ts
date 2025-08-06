// utils/options.ts
// Enum ve sabitlerden Select option üreticileri + yardımcılar

export interface Option<T = string | number> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export type OptionLike<T = any> = Option<T> | { value: T; label: string };

export function toOptions<T extends string | number>(
  values: readonly T[] | T[],
  map?: (v: T) => string
): Option<T>[] {
  return values.map((v) => ({ value: v, label: map ? map(v) : String(v) }));
}

export function withPlaceholder<T = string>(
  options: Option<T>[],
  placeholder = 'Seçiniz...',
  placeholderValue: any = ''
): Option<any>[] {
  return [{ value: placeholderValue, label: placeholder, disabled: true }, ...options];
}

export function groupOptions<T>(
  groups: Record<string, Option<T>[]>
): (Option<T> & { group: string })[] {
  const out: (Option<T> & { group: string })[] = [];
  Object.entries(groups).forEach(([group, opts]) => {
    opts.forEach((o) => out.push({ ...o, group }));
  });
  return out;
}

// Yerel dönüştürücüler
export function booleanOptions(trueLabel = 'Evet', falseLabel = 'Hayır'): Option<boolean>[] {
  return [
    { value: true, label: trueLabel },
    { value: false, label: falseLabel },
  ];
}

export function numericRangeOptions(
  start: number,
  end: number,
  step = 1,
  map?: (n: number) => string
): Option<number>[] {
  const out: Option<number>[] = [];
  if (step === 0) return out;
  const dir = Math.sign(end - start) || 1;
  for (let n = start; dir > 0 ? n <= end : n >= end; n += step * dir) {
    out.push({ value: n, label: map ? map(n) : String(n) });
  }
  return out;
}

// Domain-spesifik örnek üreticiler (projedeki yaygın alanlar)
export const genderOptions = withPlaceholder(
  toOptions(['Erkek', 'Kadın', 'Diğer'] as const),
);

export const maritalStatusOptions = withPlaceholder(
  toOptions(['Bekar', 'Evli', 'Dul', 'Boşanmış'] as const),
);

export const nationalityOptions = withPlaceholder(
  toOptions(['T.C.', 'Yabancı'] as const),
);

export const currencyOptions = withPlaceholder(
  toOptions(['TRY', 'USD', 'EUR'] as const),
);

export const monthOptions = withPlaceholder(
  toOptions(
    [
      '01', '02', '03', '04', '05', '06',
      '07', '08', '09', '10', '11', '12',
    ] as const,
    (m) => m
  ),
  'Ay'
);

export const yearOptions = (from = new Date().getFullYear(), count = 10) => {
  const years = Array.from({ length: count }, (_, i) => from - i);
  return withPlaceholder(toOptions(years, (y) => String(y)), 'Yıl');
};

// Generic enum -> options
export function enumToOptions<E extends object>(
  e: E,
  map?: (k: string, v: any) => string
): Option<any>[] {
  const values = Object.values(e).filter((v) => typeof v !== 'number');
  return toOptions(values as (string | number)[], (v) =>
    map ? map(String(v), v) : String(v)
  );
}

// Label bulucu
export function getLabel<T>(options: Option<T>[], value: T): string {
  const found = options.find((o) => o.value === value);
  return found ? found.label : String(value ?? '');
}
