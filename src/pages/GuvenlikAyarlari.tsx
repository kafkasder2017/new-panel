import React, { useState, useEffect } from 'react';
import { Shield, Monitor, Clock, MapPin, Smartphone, AlertTriangle, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import TwoFactorManagement from '../components/TwoFactorManagement';

interface UserSession {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_current: boolean;
  last_activity: string;
  created_at: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const GuvenlikAyarlari: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'2fa' | 'sessions' | 'password' | 'activity'>('2fa');
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (activeTab === 'sessions') {
      loadUserSessions();
    } else if (activeTab === 'activity') {
      loadSecurityEvents();
    }
  }, [activeTab]);

  const loadUserSessions = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_activity', { ascending: false });

      if (error) {
        console.error('Oturumlar yükleme hatası:', error);
        toast.error('Oturumlar yüklenemedi');
        return;
      }

      setUserSessions(sessions || []);
    } catch (error) {
      console.error('Oturumlar yükleme hatası:', error);
      toast.error('Oturumlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      const { data: events, error } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Güvenlik olayları yükleme hatası:', error);
        toast.error('Güvenlik olayları yüklenemedi');
        return;
      }

      setSecurityEvents(events || []);
    } catch (error) {
      console.error('Güvenlik olayları yükleme hatası:', error);
      toast.error('Güvenlik olayları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Oturum sonlandırma hatası:', error);
        toast.error('Oturum sonlandırılamadı');
        return;
      }

      toast.success('Oturum sonlandırıldı');
      loadUserSessions();
    } catch (error) {
      console.error('Oturum sonlandırma hatası:', error);
      toast.error('Oturum sonlandırılamadı');
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Kullanıcı oturumu bulunamadı');
        return;
      }

      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_current', false);

      if (error) {
        console.error('Oturumlar sonlandırma hatası:', error);
        toast.error('Oturumlar sonlandırılamadı');
        return;
      }

      toast.success('Diğer tüm oturumlar sonlandırıldı');
      loadUserSessions();
    } catch (error) {
      console.error('Oturumlar sonlandırma hatası:', error);
      toast.error('Oturumlar sonlandırılamadı');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Yeni şifre en az 8 karakter olmalıdır');
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Şifre değiştirme hatası:', error);
        toast.error('Şifre değiştirilemedi');
        return;
      }

      // Log security event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('security_events')
          .insert({
            user_id: user.id,
            event_type: 'password_changed',
            description: 'Kullanıcı şifresini değiştirdi',
            ip_address: null,
            user_agent: navigator.userAgent
          });
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Şifre başarıyla değiştirildi');
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      toast.error('Şifre değiştirilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="w-5 h-5" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-5 h-5" />;
    }
    return <Monitor className="w-5 h-5" />;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Key className="w-4 h-4 text-green-600" />;
      case 'logout':
        return <Key className="w-4 h-4 text-gray-600" />;
      case 'password_changed':
        return <Lock className="w-4 h-4 text-blue-600" />;
      case '2fa_enabled':
        return <Shield className="w-4 h-4 text-green-600" />;
      case '2fa_disabled':
        return <Shield className="w-4 h-4 text-red-600" />;
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const tabs = [
    { id: '2fa', label: 'İki Faktörlü Kimlik Doğrulama', icon: Shield },
    { id: 'sessions', label: 'Aktif Oturumlar', icon: Monitor },
    { id: 'password', label: 'Şifre Değiştir', icon: Lock },
    { id: 'activity', label: 'Güvenlik Aktivitesi', icon: Clock }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Güvenlik Ayarları</h1>
          <p className="text-gray-600">Hesabınızın güvenliğini yönetin ve izleyin</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === '2fa' && (
            <div className="p-6">
              <TwoFactorManagement />
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Aktif Oturumlar</h2>
                  <p className="text-gray-600">Hesabınıza bağlı tüm cihazları görüntüleyin ve yönetin</p>
                </div>
                <button
                  onClick={terminateAllOtherSessions}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Diğer Oturumları Sonlandır
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Yükleniyor...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {userSessions.map((session) => (
                    <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-gray-600">
                            {getDeviceIcon(session.user_agent)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">
                                {session.user_agent?.includes('Chrome') ? 'Chrome' :
                                 session.user_agent?.includes('Firefox') ? 'Firefox' :
                                 session.user_agent?.includes('Safari') ? 'Safari' : 'Bilinmeyen Tarayıcı'}
                              </h3>
                              {session.is_current && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Mevcut Oturum
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                IP: {session.ip_address || 'Bilinmiyor'}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                Son aktivite: {new Date(session.last_activity).toLocaleString('tr-TR')}
                              </div>
                            </div>
                          </div>
                        </div>
                        {!session.is_current && (
                          <button
                            onClick={() => terminateSession(session.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            Sonlandır
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {userSessions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Aktif oturum bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="p-6">
              <div className="max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Şifre Değiştir</h2>
                <p className="text-gray-600 mb-6">Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirin</p>

                {!showPasswordForm ? (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Şifre Değiştir
                  </button>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mevcut Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yeni Şifre
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Yeni Şifre (Tekrar)
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Güvenlik Aktivitesi</h2>
                <p className="text-gray-600">Hesabınızdaki son güvenlik olaylarını görüntüleyin</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Yükleniyor...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{event.description}</h3>
                            <span className="text-sm text-gray-500">
                              {new Date(event.created_at).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          {(event.ip_address || event.user_agent) && (
                            <div className="mt-1 text-sm text-gray-600">
                              {event.ip_address && <span>IP: {event.ip_address}</span>}
                              {event.ip_address && event.user_agent && <span className="mx-2">•</span>}
                              {event.user_agent && (
                                <span>
                                  {event.user_agent.includes('Chrome') ? 'Chrome' :
                                   event.user_agent.includes('Firefox') ? 'Firefox' :
                                   event.user_agent.includes('Safari') ? 'Safari' : 'Bilinmeyen Tarayıcı'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {securityEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Güvenlik aktivitesi bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuvenlikAyarlari;