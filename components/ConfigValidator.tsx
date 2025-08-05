import React, { useEffect, useState } from 'react';
import { validateEnvironmentVariables, checkEnvironmentStatus, EnvironmentValidationError, type ValidationResult } from '../utils/envValidation';
import { ExclamationTriangleIcon, XCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface ConfigValidatorProps {
  children: React.ReactNode;
  onValidationComplete?: (isValid: boolean) => void;
}

interface ConfigValidatorState {
  isValidating: boolean;
  validationResult: ValidationResult | null;
  hasError: boolean;
}

const ConfigValidator: React.FC<ConfigValidatorProps> = ({ children, onValidationComplete }) => {
  const [state, setState] = useState<ConfigValidatorState>({
    isValidating: true,
    validationResult: null,
    hasError: false
  });

  useEffect(() => {
    const validateConfig = async () => {
      try {
        // Add a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = validateEnvironmentVariables();
        
        // Log environment status in development
        if (import.meta.env.DEV) {
          checkEnvironmentStatus();
        }
        
        setState({
          isValidating: false,
          validationResult: result,
          hasError: !result.isValid
        });
        
        onValidationComplete?.(result.isValid);
        
        if (!result.isValid) {
          throw new EnvironmentValidationError(result.errors, result.warnings);
        }
      } catch (error) {
        console.error('Configuration validation failed:', error);
        setState({
          isValidating: false,
          validationResult: null,
          hasError: true
        });
        onValidationComplete?.(false);
      }
    };

    validateConfig();
  }, [onValidationComplete]);

  const handleRetry = () => {
    setState({
      isValidating: true,
      validationResult: null,
      hasError: false
    });
    
    // Reload the page to re-read environment variables
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Loading state
  if (state.isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Konfigürasyon Kontrol Ediliyor</h2>
          <p className="text-gray-600">Ortam değişkenleri doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.hasError || !state.validationResult?.isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfigürasyon Hatası</h2>
            <p className="text-gray-600">Uygulama başlatılamadı. Lütfen ortam değişkenlerini kontrol edin.</p>
          </div>
          
          {state.validationResult?.errors && state.validationResult.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <XCircleIcon className="h-5 w-5 mr-2" />
                Gerekli Düzeltmeler:
              </h3>
              <ul className="space-y-2">
                {state.validationResult.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 bg-red-50 p-3 rounded border-l-4 border-red-400">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Nasıl Düzeltilir:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. <code className="bg-blue-100 px-1 rounded">.env.local</code> dosyasını kontrol edin</li>
              <li>2. Eksik ortam değişkenlerini ekleyin</li>
              <li>3. Değerlerin doğru formatta olduğundan emin olun</li>
              <li>4. Sayfayı yenileyin</li>
            </ol>
          </div>
          
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Success state with warnings
  if (state.validationResult?.warnings && state.validationResult.warnings.length > 0) {
    return (
      <div className="relative">
        {/* Warning banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">Konfigürasyon Uyarıları</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {state.validationResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // All good - render children
  return <>{children}</>;
};

export default ConfigValidator;