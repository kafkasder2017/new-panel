import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Key, Download, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import TwoFactorSetup from './TwoFactorSetup';
import TwoFactorVerification from './TwoFactorVerification';

interface TwoFactorSettings {
  id: string;
  is_enabled: boolean;
  backup_codes_generated: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface BackupCode {
  id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
}

const TwoFactorManagement: React.FC = () => {
  const [twoFactorSettings, setTwoFactorSettings] = useState<TwoFactorSettings | null>(null);
  const [backupCodes, setBackupCodes] = useState<BackupCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showVerificationForDisable, setShowVerificationForDisable] = useState(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadTwoFactorSettings();
  }, []);

  const loadTwoFactorSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Load 2FA settings
      const { data: settings, error: settingsError } = await supabase
        .from('user_two_factor_auth')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('2FA ayarları yükleme hatası:', settingsError);
        toast.error('2FA ayarları yüklenemedi');
        return;
      }

      setTwoFactorSettings(settings);

      // Load backup codes if 2FA is enabled
      if (settings?.is_enabled) {
        const { data: codes, error: codesError } = await supabase
          .from('two_factor_backup_codes')
          .select('id, is_used, used_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (codesError) {
          console.error('Yedek kodlar yükleme hatası:', codesError);
        } else {
          // Don't show actual codes for security, just metadata
          setBackupCodes(codes?.map((code, index) => ({
            ...code,
            code: `****-****` // Hide actual codes
          })) || []);
        }
      }
    } catch (error) {
      console.error('2FA ayarları yükleme hatası:', error);
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    loadTwoFactorSettings();
    toast.success('İki faktörlü kimlik doğrulama başarıyla etkinleştirildi!');
  };

  const handleDisable2FA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Delete backup codes
      await supabase
        .from('two_factor_backup_codes')
        .delete()
        .eq('user_id', user.id);

      // Delete 2FA settings
      const { error } = await supabase
        .from('user_two_factor_auth')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('2FA devre dışı bırakma hatası:', error);
        toast.error('2FA devre dışı bırakılamadı');
        return;
      }

      setTwoFactorSettings(null);
      setBackupCodes([]);
      setShowDisableConfirm(false);
      setShowVerificationForDisable(false);
      toast.success('İki faktörlü kimlik doğrulama devre dışı bırakıldı');
    } catch (error) {
      console.error('2FA devre dışı bırakma hatası:', error);
      toast.error('İşlem sırasında hata oluştu');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    try {
      setIsRegenerating(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      // Delete old backup codes
      await supabase
        .from('two_factor_backup_codes')
        .delete()
        .eq('user_id', user.id);

      // Generate new backup codes
      const codes = generateBackupCodes();
      setNewBackupCodes(codes);

      // Save new backup codes to database
      const backupCodeData = codes.map(code => ({
        user_id: user.id,
        code_hash: hashCode(code)
      }));

      const { error } = await supabase
        .from('two_factor_backup_codes')
        .insert(backupCodeData);

      if (error) {
        console.error('Yedek kod kaydetme hatası:', error);
        toast.error('Yedek kodlar kaydedilemedi');
        return;
      }

      setShowRegenerateConfirm(false);
      loadTwoFactorSettings();
      toast.success('Yeni yedek kodlar oluşturuldu');
    } catch (error) {
      console.error('Yedek kod yenileme hatası:', error);
      toast.error('Yedek kodlar yenilenemedi');
    } finally {
      setIsRegenerating(false);
    }
  };

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const hashCode = (code: string): string => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  };

  const downloadNewBackupCodes = () => {
    const codesText = newBackupCodes.join('\n');
    const blob = new Blob([`KAFKASDER İki Faktörlü Kimlik Doğrulama Yedek Kodları\n\n${codesText}\n\nBu kodları güvenli bir yerde saklayın. Her kod sadece bir kez kullanılabilir.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kafkasder-backup-codes-new.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Yedek kodlar indirildi');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Yükleniyor...</span>
      </div>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onSetupComplete={handleSetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (showVerificationForDisable) {
    return (
      <TwoFactorVerification
        onVerificationSuccess={handleDisable2FA}
        onCancel={() => setShowVerificationForDisable(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">İki Faktörlü Kimlik Doğrulama</h2>
              <p className="text-gray-600">Hesabınızın güvenliğini artırın</p>
            </div>
          </div>
          <div className="flex items-center">
            {twoFactorSettings?.is_enabled ? (
              <div className="flex items-center text-green-600">
                <ShieldCheck className="w-6 h-6 mr-2" />
                <span className="font-medium">Etkin</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <ShieldOff className="w-6 h-6 mr-2" />
                <span className="font-medium">Devre Dışı</span>
              </div>
            )}
          </div>
        </div>

        {!twoFactorSettings?.is_enabled ? (
          <div className="text-center py-8">
            <ShieldOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">İki Faktörlü Kimlik Doğrulama Devre Dışı</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Hesabınızı daha güvenli hale getirmek için iki faktörlü kimlik doğrulamayı etkinleştirin.
              Bu özellik, şifrenizin yanı sıra telefonunuzdaki bir uygulamadan kod girmenizi gerektirir.
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              İki Faktörlü Kimlik Doğrulamayı Etkinleştir
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <ShieldCheck className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-1">İki Faktörlü Kimlik Doğrulama Etkin</h3>
                  <p className="text-green-700 text-sm mb-2">
                    Hesabınız ek güvenlik katmanı ile korunuyor.
                  </p>
                  <div className="text-sm text-green-600">
                    <p>Etkinleştirilme: {new Date(twoFactorSettings.created_at).toLocaleDateString('tr-TR')}</p>
                    {twoFactorSettings.last_used_at && (
                      <p>Son kullanım: {new Date(twoFactorSettings.last_used_at).toLocaleDateString('tr-TR')}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Backup Codes Section */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Key className="w-6 h-6 text-gray-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-900">Yedek Kodlar</h3>
                    <p className="text-sm text-gray-600">Telefonunuza erişiminizi kaybettiğinizde kullanın</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRegenerateConfirm(true)}
                  className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Yenile
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {backupCodes.map((code, index) => (
                  <div
                    key={code.id}
                    className={`p-2 rounded border text-center text-sm font-mono ${
                      code.is_used 
                        ? 'bg-gray-100 text-gray-400 line-through' 
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    {code.code}
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                <p>Kullanılmayan kodlar: {backupCodes.filter(c => !c.is_used).length}/{backupCodes.length}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowDisableConfirm(true)}
                className="flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                İki Faktörlü Kimlik Doğrulamayı Devre Dışı Bırak
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disable Confirmation Modal */}
      {showDisableConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Emin misiniz?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              İki faktörlü kimlik doğrulamayı devre dışı bırakmak hesabınızın güvenliğini azaltacaktır.
              Bu işlemi onaylamak için 2FA kodunuzu girmeniz gerekecek.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisableConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowDisableConfirm(false);
                  setShowVerificationForDisable(true);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Devam Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Backup Codes Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Yedek Kodları Yenile</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Mevcut yedek kodlarınız geçersiz hale gelecek ve yeni kodlar oluşturulacak.
              Yeni kodları güvenli bir yerde saklamayı unutmayın.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleRegenerateBackupCodes}
                disabled={isRegenerating}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {isRegenerating ? 'Yenileniyor...' : 'Yenile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Backup Codes Modal */}
      {newBackupCodes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <Key className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Yeni Yedek Kodlar</h3>
              <p className="text-gray-600">Bu kodları güvenli bir yerde saklayın</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {newBackupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadNewBackupCodes}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                İndir
              </button>
              <button
                onClick={() => setNewBackupCodes([])}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorManagement;