/**
 * Type guard utilities for safer type casting and validation
 */

/**
 * Safely cast a string value to an enum value
 * @param enumObj The enum object
 * @param value The string value to cast
 * @param defaultValue Optional default value if the cast fails
 * @returns The enum value or the default value
 */
export function safeEnumCast<T extends object, K extends keyof T, D = never>(
  enumObj: T,
  value: string | number,
  defaultValue?: D
): T[K] | D {
  // Check if the value exists in the enum
  const isValidEnumValue = Object.values(enumObj).includes(value as any);
  
  if (isValidEnumValue) {
    return value as unknown as T[K];
  }
  
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  
  throw new Error(`Invalid enum value: ${value}`);
}

/**
 * Type guard to check if a value is not null or undefined
 * @param value The value to check
 * @returns True if the value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a string
 * @param value The value to check
 * @returns True if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 * @param value The value to check
 * @returns True if the value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a boolean
 * @param value The value to check
 * @returns True if the value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}