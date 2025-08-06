import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Loader2, Settings } from 'lucide-react';
import { chatbotService, ChatbotConversation, ChatbotMessage } from '../services/chatbotService';
import { supabase } from '../lib/supabase';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  personId?: string;
  context?: Record<string, any>;
}

function ChatbotModal({ isOpen, onClose, personId, context }: ChatbotModalProps): JSX.Element {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatbotConversation | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen, personId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mevcut aktif konuşmayı bul veya yeni başlat
      const conversations = await chatbotService.getConversations(user.id);
      let activeConversation = conversations.find(c => 
        c.status === 'active' && 
        (!personId || c.person_id === personId)
      );

      if (!activeConversation) {
        activeConversation = await chatbotService.startConversation(
          user.id,
          personId,
          personId ? 'Kişi Hakkında Soru' : 'Genel Soru',
          context
        );
      }

      if (activeConversation) {
        setConversation(activeConversation);
        const conversationMessages = await chatbotService.getMessages(activeConversation.id);
        setMessages(conversationMessages);
      }
    } catch (error) {
      console.error('Chat başlatılırken hata:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !conversation) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Kullanıcı mesajını UI'a ekle
      const tempUserMessage: ChatbotMessage = {
        id: 'temp-user',
        conversation_id: conversation.id,
        role: 'user',
        content: userMessage,
        metadata: {},
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMessage]);

      // AI yanıtı al
      const response = await chatbotService.getChatResponse({
        message: userMessage,
        conversation_id: conversation.id,
        person_id: personId,
        context
      });

      if (response) {
        // Mesajları yeniden yükle
        const updatedMessages = await chatbotService.getMessages(conversation.id);
        setMessages(updatedMessages);
      } else {
        // Hata durumunda geçici mesajı kaldır
        setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
        alert('AI yanıtı alınamadı. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      chatbotService.setOpenAIApiKey(apiKey.trim());
      setShowSettings(false);
      alert('API anahtarı kaydedildi!');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Asistan
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                OpenAI API Anahtarı
              </label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveApiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Kaydet
                </button>
              </div>
              <p className="text-xs text-gray-500">
                API anahtarınız güvenli bir şekilde saklanır ve sadece AI yanıtları için kullanılır.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.role === 'assistant' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.role === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" />
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Düşünüyor...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatbotModal;
