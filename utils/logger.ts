/**
 * Logger utility for secure logging
 * Only logs debug information in development environment
 */

export const logger = {
  debug: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(message, data);
    }
  },
  
  info: (message: string, data?: any) => {
    console.info(message, data);
  },
  
  warn: (message: string, data?: any) => {
    console.warn(message, data);
  },
  
  error: (message: string, error?: any) => {
    console.error(message, error);
    // In production, you could send this to an error tracking service
    // like Sentry, LogRocket, etc.
  },
  
  // Secure debug for sensitive operations
  secureDebug: (message: string, sensitiveData?: any) => {
    if (import.meta.env.DEV) {
      // Only log non-sensitive parts in development
      const sanitizedData = sensitiveData ? {
        ...sensitiveData,
        // Remove or mask sensitive fields
        password: '[REDACTED]',
        token: '[REDACTED]',
        apiKey: '[REDACTED]'
      } : undefined;
      console.log(`🔒 ${message}`, sanitizedData);
    }
  }
};

export default logger;