/**
 * Environment Variable Validation Utility
 * Validates required environment variables on application startup
 */

import { logger } from './logger';

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  devEmail?: string;
  devPassword?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required environment variables for the application
 */
const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: 'Supabase URL is required for database connection',
  VITE_SUPABASE_ANON_KEY: 'Supabase anonymous key is required for authentication'
} as const;

/**
 * Optional environment variables with warnings
 */
const OPTIONAL_ENV_VARS = {
  GEMINI_API_KEY: 'Gemini API key is missing - AI features may not work properly',
  VITE_OPENROUTER_API_KEY: 'OpenRouter API key is missing - fallback AI features may not work',
  VITE_DEV_EMAIL: 'Development email is missing - auto-fill feature may not work',
  VITE_DEV_PASSWORD: 'Development password is missing - auto-fill feature may not work'
} as const;

/**
 * Validates a single environment variable
 */
function validateEnvVar(key: string, value: string | undefined): { isValid: boolean; error?: string } {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${key} is empty or undefined` };
  }
  
  // Additional validation for specific variables
  switch (key) {
    case 'VITE_SUPABASE_URL':
      if (!value.startsWith('https://') || !value.includes('.supabase.co')) {
        return { isValid: false, error: 'Invalid Supabase URL format' };
      }
      break;
    case 'VITE_SUPABASE_ANON_KEY':
      if (value.length < 100) {
        return { isValid: false, error: 'Supabase anonymous key appears to be invalid (too short)' };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * Validates all required environment variables
 */
export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required environment variables
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, description]) => {
    const value = import.meta.env[key];
    const validation = validateEnvVar(key, value);
    
    if (!validation.isValid) {
      errors.push(`${description}: ${validation.error}`);
    }
  });
  
  // Check optional environment variables
  Object.entries(OPTIONAL_ENV_VARS).forEach(([key, description]) => {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      warnings.push(description);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    throw new Error(`Environment validation failed:\n${validation.errors.join('\n')}`);
  }
  
  // Log warnings if any
  if (validation.warnings.length > 0) {
    logger.warn('Environment configuration warnings', { warnings: validation.warnings });
  }
  
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    geminiApiKey: import.meta.env.GEMINI_API_KEY,
    openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
    devEmail: import.meta.env.VITE_DEV_EMAIL,
    devPassword: import.meta.env.VITE_DEV_PASSWORD
  };
}

/**
 * Development helper to check environment status
 */
export function checkEnvironmentStatus(): void {
  const validation = validateEnvironmentVariables();
  
  if (validation.isValid) {
    logger.info('All required environment variables are configured');
  } else {
    logger.error('Environment validation failed', { errors: validation.errors });
  }
  
  if (validation.warnings.length > 0) {
    logger.warn('Environment configuration has warnings', { warnings: validation.warnings });
  }
}

/**
 * Environment validation error class
 */
export class EnvironmentValidationError extends Error {
  constructor(public errors: string[], public warnings: string[] = []) {
    super(`Environment validation failed: ${errors.join(', ')}`);
    this.name = 'EnvironmentValidationError';
  }
}