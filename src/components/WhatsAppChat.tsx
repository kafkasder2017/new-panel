import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { WhatsAppMessage, WhatsAppContact } from '../types/whatsapp';
import { whatsappService } from '../services/whatsappService';
import { toast } from 'sonner';

interface WhatsAppChatProps {
    contact: WhatsAppContact;
    onClose: () => void;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({ contact, onClose }) => {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    // WhatsApp service is imported as a singleton

    useEffect(() => {
        loadMessages();
    }, [contact.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const contactMessages = await whatsappService.getMessagesByContact(contact.id);
            setMessages(contactMessages);
        } catch (error) {
            toast.error('Mesajlar yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const messageData = {
                contactId: contact.id,
                content: newMessage.trim(),
                type: 'text' as const,
                messageType: 'text' as const,
                direction: 'outbound' as const
            };

            const sentMessage = await whatsappService.sendMessage(messageData);
            setMessages(prev => [...prev, sentMessage]);
            setNewMessage('');
            toast.success('Mesaj gönderildi');
        } catch (error) {
            toast.error('Mesaj gönderilemedi');
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Bugün';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Dün';
        } else {
            return date.toLocaleDateString('tr-TR');
        }
    };

    const getMessageStatus = (message: WhatsAppMessage) => {
        if (message.direction === 'inbound') return null;
        
        switch (message.status) {
            case 'sent':
                return '✓';
            case 'delivered':
                return '✓✓';
            case 'read':
                return '✓✓';
            case 'failed':
                return '✗';
            default:
                return '⏳';
        }
    };

    const groupMessagesByDate = (messages: WhatsAppMessage[]) => {
        const groups: { [key: string]: WhatsAppMessage[] } = {};
        
        messages.forEach(message => {
            const date = new Date(message.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        
        return groups;
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                        {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base truncate">{contact.name}</h3>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate">{contact.phoneNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button className="p-1.5 sm:p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full touch-manipulation">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <button className="hidden sm:block p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full touch-manipulation">
                        <MoreVertical className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1.5 sm:p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full touch-manipulation"
                    >
                        <span className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400">✕</span>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4 bg-zinc-50 dark:bg-zinc-900">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                ) : (
                    Object.entries(messageGroups).map(([date, dayMessages]) => (
                        <div key={date}>
                            {/* Date separator */}
                            <div className="flex justify-center mb-3 sm:mb-4">
                                <span className="px-2 sm:px-3 py-1 bg-zinc-200 dark:bg-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 rounded-full">
                                    {formatDate(dayMessages[0].timestamp)}
                                </span>
                            </div>
                            
                            {/* Messages for this date */}
                            {dayMessages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'} mb-1 sm:mb-2 px-2 sm:px-0`}
                                >
                                    <div
                                        className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                                            message.direction === 'outbound'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
                                        }`}
                                    >
                                        <p className="text-sm break-words">{message.content}</p>
                                        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                            message.direction === 'outbound' ? 'text-green-100' : 'text-zinc-500 dark:text-zinc-400'
                                        }`}>
                                            <span>{formatTime(message.timestamp)}</span>
                                            {message.direction === 'outbound' && (
                                                <span className={`ml-1 ${
                                                    message.status === 'read' ? 'text-blue-200' : ''
                                                }`}>
                                                    {getMessageStatus(message)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                <div className="flex items-end gap-2">
                    <button className="hidden sm:block p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-full touch-manipulation">
                        <Paperclip className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    </button>
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Mesaj yazın..."
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 pr-10 sm:pr-12 border border-zinc-300 dark:border-zinc-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-base sm:text-sm"
                            rows={1}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        <button className="hidden sm:block absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-600 rounded-full touch-manipulation">
                            <Smile className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                    </div>
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="p-2.5 sm:p-2 bg-green-500 hover:bg-green-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 rounded-full transition-colors touch-manipulation"
                    >
                        {isSending ? (
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        ) : (
                            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppChat;