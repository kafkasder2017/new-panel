/**
 * Standardized Error Handling Utility
 * Provides consistent error handling, logging, and user feedback
 */

import { logger } from './logger';
import { toast } from 'sonner';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NETWORK = 'network',
  DATABASE = 'database',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}

export interface ErrorContext {
  userId?: string | number;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: ErrorContext;
  originalError?: Error;
  timestamp: string;
}

/**
 * Creates a standardized error object
 */
export function createError(
  message: string,
  category: ErrorCategory,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: ErrorContext,
  originalError?: Error,
  code?: string
): AppError {
  return {
    message,
    code,
    severity,
    category,
    context,
    originalError,
    timestamp: new Date().toISOString()
  };
}

/**
 * Handles errors with appropriate logging and user feedback
 */
export function handleError(error: AppError | Error | string, showToast: boolean = true): void {
  let appError: AppError;

  // Convert different error types to AppError
  if (typeof error === 'string') {
    appError = createError(error, ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM);
  } else if (error instanceof Error) {
    appError = createError(
      error.message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.MEDIUM,
      undefined,
      error
    );
  } else {
    appError = error;
  }

  // Log the error
  logError(appError);

  // Show user feedback if requested
  if (showToast) {
    showErrorToast(appError);
  }
}

/**
 * Logs error with appropriate level based on severity
 */
function logError(error: AppError): void {
  const logData = {
    code: error.code,
    category: error.category,
    severity: error.severity,
    context: error.context,
    timestamp: error.timestamp,
    originalError: error.originalError?.message
  };

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      logger.error(`CRITICAL ERROR: ${error.message}`, logData);
      break;
    case ErrorSeverity.HIGH:
      logger.error(`HIGH SEVERITY: ${error.message}`, logData);
      break;
    case ErrorSeverity.MEDIUM:
      logger.warn(`MEDIUM SEVERITY: ${error.message}`, logData);
      break;
    case ErrorSeverity.LOW:
      logger.info(`LOW SEVERITY: ${error.message}`, logData);
      break;
    default:
      logger.warn(error.message, logData);
  }
}

/**
 * Shows appropriate toast notification based on error severity
 */
function showErrorToast(error: AppError): void {
  const userMessage = getUserFriendlyMessage(error);

  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      toast.error(userMessage, {
        duration: 10000,
        description: 'Lütfen sistem yöneticisi ile iletişime geçin.'
      });
      break;
    case ErrorSeverity.HIGH:
      toast.error(userMessage, {
        duration: 8000
      });
      break;
    case ErrorSeverity.MEDIUM:
      toast.warning(userMessage, {
        duration: 5000
      });
      break;
    case ErrorSeverity.LOW:
      toast.info(userMessage, {
        duration: 3000
      });
      break;
  }
}

/**
 * Converts technical error messages to user-friendly messages
 */
function getUserFriendlyMessage(error: AppError): string {
  // Check for specific error patterns and return user-friendly messages
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.';
  }

  if (message.includes('unauthorized') || message.includes('401')) {
    return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
  }

  if (message.includes('forbidden') || message.includes('403')) {
    return 'Bu işlem için yetkiniz bulunmuyor.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'Aranan kaynak bulunamadı.';
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return 'Girilen bilgiler geçersiz. Lütfen kontrol edin.';
  }

  if (message.includes('database') || message.includes('sql')) {
    return 'Veritabanı hatası oluştu. Lütfen tekrar deneyin.';
  }

  // Return original message if no pattern matches, but make it more user-friendly
  return error.message.charAt(0).toUpperCase() + error.message.slice(1);
}

/**
 * Async error handler for promises
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  category: ErrorCategory = ErrorCategory.SYSTEM,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const appError = createError(
      errorMessage,
      category,
      severity,
      context,
      error instanceof Error ? error : new Error(String(error))
    );
    handleError(appError);
    return null;
  }
}

/**
 * Error boundary helper for React components
 */
export function createErrorBoundaryHandler(componentName: string) {
  return (error: Error, errorInfo: any) => {
    const appError = createError(
      `Component error in ${componentName}`,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      {
        component: componentName,
        additionalData: {
          errorInfo: errorInfo.componentStack
        }
      },
      error
    );
    handleError(appError, false); // Don't show toast for component errors
  };
}

/**
 * Common error creators for specific scenarios
 */
export const ErrorCreators = {
  authentication: (message: string, context?: ErrorContext) =>
    createError(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH, context),

  authorization: (message: string, context?: ErrorContext) =>
    createError(message, ErrorCategory.AUTHORIZATION, ErrorSeverity.MEDIUM, context),

  validation: (message: string, context?: ErrorContext) =>
    createError(message, ErrorCategory.VALIDATION, ErrorSeverity.LOW, context),

  network: (message: string, context?: ErrorContext) =>
    createError(message, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, context),

  database: (message: string, context?: ErrorContext) =>
    createError(message, ErrorCategory.DATABASE, ErrorSeverity.HIGH, context),

  critical: (message: string, context?: ErrorContext) =>
    createError(message, ErrorCategory.SYSTEM, ErrorSeverity.CRITICAL, context)
};