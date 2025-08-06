import { supabase } from './supabase';

// Chatbot türleri
export interface ChatbotConversation {
  id: string;
  user_id: string;
  person_id?: string;
  title?: string;
  status: 'active' | 'closed' | 'archived';
  context: Record<string, any>;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface ChatbotMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChatbotResponseTemplate {
  id: string;
  name: string;
  category?: string;
  template: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatbotSettings {
  id: string;
  key: string;
  value: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  person_id?: string;
  context?: Record<string, any>;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  metadata?: Record<string, any>;
}

// OpenAI API türleri
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

class ChatbotService {
  private openaiApiKey: string | null = null;
  private settings: Map<string, any> = new Map();

  constructor() {
    this.loadSettings();
  }

  // Ayarları yükle
  private async loadSettings(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('*');

      if (error) throw error;

      data?.forEach(setting => {
        this.settings.set(setting.key, setting.value);
      });
    } catch (error) {
      console.error('Chatbot ayarları yüklenirken hata:', error);
    }
  }

  // OpenAI API anahtarını ayarla
  setOpenAIApiKey(apiKey: string): void {
    this.openaiApiKey = apiKey;
  }

  // Yeni konuşma başlat
  async startConversation(
    userId: string,
    personId?: string,
    title?: string,
    context?: Record<string, any>
  ): Promise<ChatbotConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .insert({
          user_id: userId,
          person_id: personId,
          title: title || 'Yeni Konuşma',
          context: context || {},
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Konuşma başlatılırken hata:', error);
      return null;
    }
  }

  // Konuşmaları getir
  async getConversations(userId: string): Promise<ChatbotConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Konuşmalar getirilirken hata:', error);
      return [];
    }
  }

  // Konuşma mesajlarını getir
  async getMessages(conversationId: string): Promise<ChatbotMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Mesajlar getirilirken hata:', error);
      return [];
    }
  }

  // Mesaj kaydet
  async saveMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, any>
  ): Promise<ChatbotMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chatbot_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Mesaj kaydedilirken hata:', error);
      return null;
    }
  }

  // AI yanıtı al
  async getChatResponse(request: ChatRequest): Promise<ChatResponse | null> {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API anahtarı ayarlanmamış');
      }

      let conversationId = request.conversation_id;
      
      // Eğer konuşma ID'si yoksa yeni konuşma başlat
      if (!conversationId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Kullanıcı oturumu bulunamadı');
        
        const conversation = await this.startConversation(
          user.id,
          request.person_id,
          'AI Asistan Konuşması',
          request.context
        );
        
        if (!conversation) throw new Error('Konuşma başlatılamadı');
        conversationId = conversation.id;
      }

      // Kullanıcı mesajını kaydet
      await this.saveMessage(conversationId, 'user', request.message);

      // Konuşma geçmişini al
      const messages = await this.getMessages(conversationId);
      
      // OpenAI formatına çevir
      const openaiMessages: OpenAIMessage[] = [
        {
          role: 'system',
          content: this.settings.get('system_prompt') || 'Sen yardımcı bir asistansın.'
        },
        ...messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        }))
      ];

      // OpenAI API çağrısı
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: this.settings.get('ai_model') || 'gpt-3.5-turbo',
          messages: openaiMessages,
          max_tokens: this.settings.get('max_tokens') || 1000,
          temperature: this.settings.get('temperature') || 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API hatası: ${response.statusText}`);
      }

      const aiResponse: OpenAIResponse = await response.json();
      const aiMessage = aiResponse.choices[0]?.message?.content;

      if (!aiMessage) {
        throw new Error('AI yanıtı alınamadı');
      }

      // AI yanıtını kaydet
      await this.saveMessage(
        conversationId,
        'assistant',
        aiMessage,
        {
          tokens_used: aiResponse.usage?.total_tokens || 0,
          model: this.settings.get('ai_model') || 'gpt-3.5-turbo'
        }
      );

      // Konuşmayı güncelle
      await supabase
        .from('chatbot_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return {
        message: aiMessage,
        conversation_id: conversationId,
        metadata: {
          tokens_used: aiResponse.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      console.error('AI yanıtı alınırken hata:', error);
      return null;
    }
  }

  // Konuşmayı kapat
  async closeConversation(conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Konuşma kapatılırken hata:', error);
      return false;
    }
  }

  // Yanıt şablonlarını getir
  async getResponseTemplates(category?: string): Promise<ChatbotResponseTemplate[]> {
    try {
      let query = supabase
        .from('chatbot_response_templates')
        .select('*')
        .eq('is_active', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Yanıt şablonları getirilirken hata:', error);
      return [];
    }
  }

  // Şablon kullanarak yanıt oluştur
  processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });
    
    return processed;
  }

  // Ayar güncelle
  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chatbot_settings')
        .update({ value })
        .eq('key', key);

      if (error) throw error;
      
      this.settings.set(key, value);
      return true;
    } catch (error) {
      console.error('Ayar güncellenirken hata:', error);
      return false;
    }
  }

  // Ayar getir
  getSetting(key: string): any {
    return this.settings.get(key);
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;