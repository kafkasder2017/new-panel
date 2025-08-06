import React, { useState } from 'react';
import { Shield, AlertCircle, Key } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';

interface TwoFactorVerificationProps {
  onVerificationSuccess: () => void;
  onCancel: () => void;
  userEmail?: string;
}

const TwoFactorVerification: React.FC<TwoFactorVerificationProps> = ({
  onVerificationSuccess,
  onCancel,
  userEmail
}) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const handleTOTPVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Get user's 2FA settings
      const { data: twoFactorData, error: fetchError } = await supabase
        .from('user_two_factor_auth')
        .select('secret_key, is_enabled')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !twoFactorData?.is_enabled) {
        toast.error('2FA ayarları bulunamadı');
        return;
      }

      // Verify TOTP code (in production, this should be done on the server)
      const isValid = await verifyTOTPCode(twoFactorData.secret_key, verificationCode);
      
      // Log verification attempt
      await logVerificationAttempt(user.id, 'totp', isValid);

      if (isValid) {
        // Update last used timestamp
        await supabase
          .from('user_two_factor_auth')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', user.id);

        toast.success('Doğrulama başarılı!');
        onVerificationSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= maxAttempts) {
          toast.error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.');
          onCancel();
        } else {
          toast.error(`Geçersiz kod. Kalan deneme: ${maxAttempts - newAttempts}`);
        }
      }
    } catch (error) {
      console.error('2FA doğrulama hatası:', error);
      toast.error('Doğrulama sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeVerification = async () => {
    if (!backupCode || backupCode.length < 6) {
      toast.error('Lütfen geçerli bir yedek kod girin');
      return;
    }

    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Check if backup code exists and is not used
      const codeHash = hashCode(backupCode.toUpperCase());
      const { data: backupCodeData, error: fetchError } = await supabase
        .from('two_factor_backup_codes')
        .select('id, is_used')
        .eq('user_id', user.id)
        .eq('code_hash', codeHash)
        .single();

      // Log verification attempt
      await logVerificationAttempt(user.id, 'backup_code', !!backupCodeData && !backupCodeData.is_used);

      if (fetchError || !backupCodeData) {
        toast.error('Geçersiz yedek kod');
        return;
      }

      if (backupCodeData.is_used) {
        toast.error('Bu yedek kod daha önce kullanılmış');
        return;
      }

      // Mark backup code as used
      const { error: updateError } = await supabase
        .from('two_factor_backup_codes')
        .update({ 
          is_used: true, 
          used_at: new Date().toISOString() 
        })
        .eq('id', backupCodeData.id);

      if (updateError) {
        console.error('Yedek kod güncelleme hatası:', updateError);
        toast.error('Yedek kod güncellenemedi');
        return;
      }

      toast.success('Yedek kod doğrulandı!');
      onVerificationSuccess();
    } catch (error) {
      console.error('Yedek kod doğrulama hatası:', error);
      toast.error('Doğrulama sırasında hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTOTPCode = async (secret: string, code: string): Promise<boolean> => {
    // This is a simplified verification - in production, use a proper TOTP library
    // For demo purposes, accept any 6-digit code
    return /^\d{6}$/.test(code);
  };

  const hashCode = (code: string): string => {
    // Simple hash function - in production, use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  };

  const logVerificationAttempt = async (userId: string, attemptType: 'totp' | 'backup_code', isSuccessful: boolean) => {
    try {
      await supabase
        .from('two_factor_verification_attempts')
        .insert({
          user_id: userId,
          attempt_type: attemptType,
          is_successful: isSuccessful,
          ip_address: null, // Would be filled by server in production
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Verification attempt logging error:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (useBackupCode) {
      handleBackupCodeVerification();
    } else {
      handleTOTPVerification();
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">İki Faktörlü Doğrulama</h2>
        <p className="text-gray-600">
          {userEmail && `${userEmail} için `}
          {useBackupCode ? 'Yedek kodunuzu girin' : 'Authenticator uygulamanızdan kodu girin'}
        </p>
      </div>

      {attempts > 0 && attempts < maxAttempts && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p>Başarısız deneme sayısı: {attempts}/{maxAttempts}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!useBackupCode ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doğrulama Kodu:
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yedek Kod:
            </label>
            <input
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="XXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isLoading || (!useBackupCode && verificationCode.length !== 6) || (useBackupCode && backupCode.length < 6)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {isLoading ? 'Doğrulanıyor...' : 'Doğrula'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setUseBackupCode(!useBackupCode);
            setVerificationCode('');
            setBackupCode('');
          }}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
        >
          <Key className="w-4 h-4 mr-1" />
          {useBackupCode ? 'Authenticator kodu kullan' : 'Yedek kod kullan'}
        </button>
      </div>

      {useBackupCode && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Yedek Kod Hakkında:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>2FA kurulumu sırasında aldığınız 8 karakterli kodlardan birini girin</li>
              <li>Her yedek kod sadece bir kez kullanılabilir</li>
              <li>Kullanılan kodlar geçersiz hale gelir</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorVerification;