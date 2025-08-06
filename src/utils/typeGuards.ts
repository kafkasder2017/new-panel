// Type guards and utility functions for safe type casting

// Generic type guard for enum values
export function isEnumValue<T extends Record<string, string | number>>(
  enumObject: T,
  value: unknown
): value is T[keyof T] {
  return Object.values(enumObject).includes(value as T[keyof T]);
}

// Safe enum casting with fallback
export function safeEnumCast<T extends Record<string, string | number>>(
  enumObject: T,
  value: unknown,
  fallback: T[keyof T]
): T[keyof T] {
  return isEnumValue(enumObject, value) ? value : fallback;
}

// Type guard for string values
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

// Type guard for number values
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Type guard for boolean values
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

// Type guard for objects
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Type guard for arrays
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Safe string casting with fallback
export function safeStringCast(value: unknown, fallback = ''): string {
  return isString(value) ? value : fallback;
}

// Safe number casting with fallback
export function safeNumberCast(value: unknown, fallback = 0): number {
  return isNumber(value) ? value : fallback;
}

// Safe boolean casting with fallback
export function safeBooleanCast(value: unknown, fallback = false): boolean {
  return isBoolean(value) ? value : fallback;
}