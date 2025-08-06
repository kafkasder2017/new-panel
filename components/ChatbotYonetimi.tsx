import React, { useState, useEffect } from 'react';
import { Bot, Settings, MessageSquare, BarChart3, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { chatbotService, ChatbotConversation, ChatbotResponseTemplate, ChatbotSettings } from '../src/services/chatbotService';
import { supabase } from '../services/supabaseClient';

interface ChatbotYonetimiProps {
  // Props if needed
}

const ChatbotYonetimi: React.FC<ChatbotYonetimiProps> = () => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'templates' | 'settings' | 'analytics'>('conversations');
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [templates, setTemplates] = useState<ChatbotResponseTemplate[]>([]);
  const [settings, setSettings] = useState<ChatbotSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<ChatbotResponseTemplate | null>(null);
  const [editingSetting, setEditingSetting] = useState<ChatbotSettings | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalConversations: 0,
    activeConversations: 0,
    totalMessages: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      switch (activeTab) {
        case 'conversations':
          await loadConversations();
          break;
        case 'templates':
          await loadTemplates();
          break;
        case 'settings':
          await loadSettings();
          break;
        case 'analytics':
          await loadAnalytics();
          break;
      }
    } catch (error) {
      console.error('Veri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select(`
          *,
          chatbot_messages(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Konuşmalar yüklenirken hata:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const templates = await chatbotService.getResponseTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Şablonlar yüklenirken hata:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data: conversationsData } = await supabase
        .from('chatbot_conversations')
        .select('id, status');

      const { data: messagesData } = await supabase
        .from('chatbot_messages')
        .select('id');

      setAnalytics({
        totalConversations: conversationsData?.length || 0,
        activeConversations: conversationsData?.filter(c => c.status === 'active').length || 0,
        totalMessages: messagesData?.length || 0,
        avgResponseTime: 2.3 // Mock data
      });
    } catch (error) {
      console.error('Analitik veriler yüklenirken hata:', error);
    }
  };

  const saveTemplate = async (template: Partial<ChatbotResponseTemplate>) => {
    try {
      if (editingTemplate) {
        // Güncelle
        const { error } = await supabase
          .from('chatbot_response_templates')
          .update({
            name: template.name,
            category: template.category,
            template: template.template,
            variables: template.variables,
            is_active: template.is_active
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Yeni ekle
        const { error } = await supabase
          .from('chatbot_response_templates')
          .insert({
            name: template.name,
            category: template.category || 'genel',
            template: template.template,
            variables: template.variables || [],
            is_active: template.is_active ?? true
          });

        if (error) throw error;
      }

      setEditingTemplate(null);
      setShowNewTemplate(false);
      await loadTemplates();
    } catch (error) {
      console.error('Şablon kaydedilirken hata:', error);
      alert('Şablon kaydedilirken hata oluştu.');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('chatbot_response_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadTemplates();
    } catch (error) {
      console.error('Şablon silinirken hata:', error);
      alert('Şablon silinirken hata oluştu.');
    }
  };

  const saveSetting = async (setting: ChatbotSettings) => {
    try {
      const success = await chatbotService.updateSetting(setting.key, setting.value);
      if (success) {
        setEditingSetting(null);
        await loadSettings();
      } else {
        alert('Ayar güncellenirken hata oluştu.');
      }
    } catch (error) {
      console.error('Ayar kaydedilirken hata:', error);
      alert('Ayar kaydedilirken hata oluştu.');
    }
  };

  const closeConversation = async (id: string) => {
    try {
      const success = await chatbotService.closeConversation(id);
      if (success) {
        await loadConversations();
      } else {
        alert('Konuşma kapatılırken hata oluştu.');
      }
    } catch (error) {
      console.error('Konuşma kapatılırken hata:', error);
      alert('Konuşma kapatılırken hata oluştu.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR');
  };

  const tabs = [
    { id: 'conversations', label: 'Konuşmalar', icon: MessageSquare },
    { id: 'templates', label: 'Şablonlar', icon: Bot },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
    { id: 'analytics', label: 'Analitik', icon: BarChart3 }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chatbot Yönetimi</h1>
        <p className="text-gray-600">AI chatbot ayarlarını ve konuşmalarını yönetin</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div>
          {/* Conversations Tab */}
          {activeTab === 'conversations' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Başlık
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Son Güncelleme
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                      <tr key={conversation.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {conversation.title || 'Başlıksız Konuşma'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            conversation.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : conversation.status === 'closed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {conversation.status === 'active' ? 'Aktif' : 
                             conversation.status === 'closed' ? 'Kapalı' : 'Arşivlenmiş'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(conversation.updated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {conversation.status === 'active' && (
                            <button
                              onClick={() => closeConversation(conversation.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Kapat
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Yanıt Şablonları</h2>
                <button
                  onClick={() => setShowNewTemplate(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yeni Şablon</span>
                </button>
              </div>

              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.category}</p>
                        <p className="text-sm text-gray-700 mt-2">{template.template}</p>
                        {template.variables.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Değişkenler: </span>
                            <span className="text-xs text-blue-600">
                              {template.variables.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900">Chatbot Ayarları</h2>
              <div className="grid gap-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{setting.key}</h3>
                        <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                        <p className="text-sm text-gray-700 mt-2">
                          Değer: {typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingSetting(setting)}
                        className="text-blue-600 hover:text-blue-900 ml-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900">Chatbot Analitikleri</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageSquare className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Toplam Konuşma</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.totalConversations}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Bot className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Aktif Konuşma</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.activeConversations}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Toplam Mesaj</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.totalMessages}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Settings className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Ort. Yanıt Süresi</p>
                      <p className="text-2xl font-semibold text-gray-900">{analytics.avgResponseTime}s</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Edit Modal */}
      {(editingTemplate || showNewTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon'}
                </h3>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setShowNewTemplate(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <TemplateForm
                template={editingTemplate}
                onSave={saveTemplate}
                onCancel={() => {
                  setEditingTemplate(null);
                  setShowNewTemplate(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Setting Edit Modal */}
      {editingSetting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Ayar Düzenle</h3>
                <button
                  onClick={() => setEditingSetting(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <SettingForm
                setting={editingSetting}
                onSave={saveSetting}
                onCancel={() => setEditingSetting(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Template Form Component
interface TemplateFormProps {
  template: ChatbotResponseTemplate | null;
  onSave: (template: Partial<ChatbotResponseTemplate>) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    category: template?.category || '',
    template: template?.template || '',
    variables: template?.variables?.join(', ') || '',
    is_active: template?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      variables: formData.variables.split(',').map(v => v.trim()).filter(v => v)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Şablon Adı
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Kategori
        </label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Şablon Metni
        </label>
        <textarea
          value={formData.template}
          onChange={(e) => setFormData({ ...formData, template: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Değişkenler (virgülle ayırın)
        </label>
        <input
          type="text"
          value={formData.variables}
          onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ad, soyad, telefon"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
          Aktif
        </label>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
};

// Setting Form Component
interface SettingFormProps {
  setting: ChatbotSettings;
  onSave: (setting: ChatbotSettings) => void;
  onCancel: () => void;
}

const SettingForm: React.FC<SettingFormProps> = ({ setting, onSave, onCancel }) => {
  const [value, setValue] = useState(
    typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsedValue: any = value;
    
    // Try to parse as JSON if it looks like an object
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        // Keep as string if parsing fails
      }
    } else if (!isNaN(Number(value))) {
      parsedValue = Number(value);
    } else if (value === 'true' || value === 'false') {
      parsedValue = value === 'true';
    }

    onSave({ ...setting, value: parsedValue });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Anahtar
        </label>
        <input
          type="text"
          value={setting.key}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Değer
        </label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
};

export default ChatbotYonetimi;