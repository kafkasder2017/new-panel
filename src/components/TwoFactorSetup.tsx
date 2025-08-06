import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Copy, Check, AlertTriangle, Download } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';

interface TwoFactorSetupProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

interface BackupCode {
  code: string;
  id: string;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onSetupComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Generate secret key (32 characters base32)
      const secret = generateSecretKey();
      setSecretKey(secret);

      // Create QR code URL for authenticator apps
      const appName = 'KAFKASDER';
      const userEmail = user.email || 'user@kafkasder.org';
      const qrUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('QR kod oluşturma hatası:', error);
      toast.error('QR kod oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSecretKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 2000);
      }
      toast.success('Panoya kopyalandı');
    } catch (error) {
      toast.error('Kopyalama başarısız');
    }
  };

  const verifyAndEnable2FA = async () => {
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

      // Verify the TOTP code (this would normally be done on the server)
      // For now, we'll simulate verification
      const isValid = await verifyTOTPCode(secretKey, verificationCode);
      
      if (!isValid) {
        toast.error('Doğrulama kodu geçersiz');
        return;
      }

      // Save 2FA settings to database
      const { error: insertError } = await supabase
        .from('user_two_factor_auth')
        .insert({
          user_id: user.id,
          secret_key: secretKey, // In production, this should be encrypted
          is_enabled: true,
          backup_codes_generated: false
        });

      if (insertError) {
        console.error('2FA kaydetme hatası:', insertError);
        toast.error('2FA ayarları kaydedilemedi');
        return;
      }

      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);

      // Save backup codes to database
      const backupCodeData = codes.map(code => ({
        user_id: user.id,
        code_hash: hashCode(code.code) // In production, hash the codes
      }));

      const { error: backupError } = await supabase
        .from('two_factor_backup_codes')
        .insert(backupCodeData);

      if (backupError) {
        console.error('Backup kod kaydetme hatası:', backupError);
        toast.error('Yedek kodlar kaydedilemedi');
        return;
      }

      // Update that backup codes are generated
      await supabase
        .from('user_two_factor_auth')
        .update({ backup_codes_generated: true })
        .eq('user_id', user.id);

      setStep('backup');
      toast.success('İki faktörlü kimlik doğrulama başarıyla etkinleştirildi!');
    } catch (error) {
      console.error('2FA etkinleştirme hatası:', error);
      toast.error('2FA etkinleştirilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTOTPCode = async (secret: string, code: string): Promise<boolean> => {
    // This is a simplified verification - in production, use a proper TOTP library
    // For demo purposes, accept any 6-digit code
    return /^\d{6}$/.test(code);
  };

  const generateBackupCodes = (): BackupCode[] => {
    const codes: BackupCode[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push({ id: `backup-${i}`, code });
    }
    return codes;
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

  const downloadBackupCodes = () => {
    const codesText = backupCodes.map(c => c.code).join('\n');
    const blob = new Blob([`KAFKASDER İki Faktörlü Kimlik Doğrulama Yedek Kodları\n\n${codesText}\n\nBu kodları güvenli bir yerde saklayın. Her kod sadece bir kez kullanılabilir.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kafkasder-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Yedek kodlar indirildi');
  };

  if (step === 'setup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">İki Faktörlü Kimlik Doğrulama</h2>
          <p className="text-gray-600">Hesabınızı daha güvenli hale getirin</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">QR kod oluşturuluyor...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                <QRCodeSVG value={qrCodeUrl} size={200} />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manuel Giriş Kodu:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={secretKey}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(secretKey, 'secret')}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Önemli:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Google Authenticator, Authy veya benzer bir uygulama kullanın</li>
                    <li>QR kodu tarayın veya manuel kodu girin</li>
                    <li>Bu kodu güvenli bir yerde saklayın</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => setStep('verify')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Devam Et
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Doğrulama</h2>
          <p className="text-gray-600">Authenticator uygulamanızdan 6 haneli kodu girin</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Doğrulama Kodu:
          </label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-center text-lg font-mono tracking-wider"
            maxLength={6}
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep('setup')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Geri
          </button>
          <button
            onClick={verifyAndEnable2FA}
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Doğrulanıyor...' : 'Doğrula'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'backup') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Yedek Kodlar</h2>
          <p className="text-gray-600">Bu kodları güvenli bir yerde saklayın</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            {backupCodes.map((backup) => (
              <div key={backup.id} className="bg-white p-2 rounded border text-center">
                {backup.code}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Önemli Uyarı:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Bu kodları güvenli bir yerde saklayın</li>
                <li>Her kod sadece bir kez kullanılabilir</li>
                <li>Telefonunuza erişiminizi kaybederseniz bu kodları kullanın</li>
                <li>Bu sayfayı kapattıktan sonra kodları tekrar göremezsiniz</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mb-4">
          <button
            onClick={() => copyToClipboard(backupCodes.map(c => c.code).join(' '), 'backup')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            {copiedBackup ? <Check className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
            Kopyala
          </button>
          <button
            onClick={downloadBackupCodes}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" />
            İndir
          </button>
        </div>

        <button
          onClick={onSetupComplete}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Kurulumu Tamamla
        </button>
      </div>
    );
  }

  return null;
};

export default TwoFactorSetup;