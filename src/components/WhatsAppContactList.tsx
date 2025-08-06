import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, Phone, MoreVertical } from 'lucide-react';
import { WhatsAppContact, WhatsAppMessage } from '../types/whatsapp';
import { whatsappService } from '../services/whatsappService';
import { toast } from 'sonner';

interface WhatsAppContactListProps {
    onSelectContact: (contact: WhatsAppContact) => void;
    selectedContactId?: string;
}

const WhatsAppContactList: React.FC<WhatsAppContactListProps> = ({ 
    onSelectContact, 
    selectedContactId 
}) => {
    const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContactName, setNewContactName] = useState('');
    const [newContactPhone, setNewContactPhone] = useState('');
    const [lastMessages, setLastMessages] = useState<{ [contactId: string]: WhatsAppMessage }>({});
    
    // WhatsApp service is imported as a singleton

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setIsLoading(true);
        try {
            const contactsData = await whatsappService.getContacts();
            setContacts(contactsData);
            
            // Load last messages for each contact
            const lastMessagesData: { [contactId: string]: WhatsAppMessage } = {};
            for (const contact of contactsData) {
                const messages = await whatsappService.getMessagesByContact(contact.id);
                if (messages.length > 0) {
                    lastMessagesData[contact.id] = messages[messages.length - 1];
                }
            }
            setLastMessages(lastMessagesData);
        } catch (error) {
            toast.error('Kişiler yüklenirken hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const addContact = async () => {
        if (!newContactName.trim() || !newContactPhone.trim()) {
            toast.error('İsim ve telefon numarası gerekli');
            return;
        }

        try {
            const contactData = {
                name: newContactName.trim(),
                phone: newContactPhone.trim(),
                phoneNumber: newContactPhone.trim(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const newContact = await whatsappService.createContact(contactData);
            setContacts(prev => [newContact, ...prev]);
            setNewContactName('');
            setNewContactPhone('');
            setShowAddContact(false);
            toast.success('Kişi eklendi');
        } catch (error) {
            toast.error('Kişi eklenirken hata oluştu');
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phoneNumber.includes(searchTerm)
    );

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (diffInHours < 168) { // 7 days
            return date.toLocaleDateString('tr-TR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit'
            });
        }
    };

    const truncateMessage = (message: string, maxLength: number = 50) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-100">WhatsApp</h2>
                    <button
                        onClick={() => setShowAddContact(true)}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full touch-manipulation"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Kişi ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-base sm:text-sm"
                    />
                </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-zinc-500 dark:text-zinc-400">
                        <MessageCircle className="w-12 h-12 mb-2" />
                        <p>Henüz kişi yok</p>
                    </div>
                ) : (
                    filteredContacts.map((contact) => {
                        const lastMessage = lastMessages[contact.id];
                        const isSelected = selectedContactId === contact.id;
                        
                        return (
                            <div
                                key={contact.id}
                                onClick={() => onSelectContact(contact)}
                                className={`group flex items-center gap-3 p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-zinc-100 dark:border-zinc-800 touch-manipulation ${
                                    isSelected ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-l-green-500' : ''
                                }`}
                            >
                                {/* Avatar */}
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm sm:text-base">
                                    {contact.name.charAt(0).toUpperCase()}
                                </div>
                                
                                {/* Contact Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-sm sm:text-base">
                                            {contact.name}
                                        </h3>
                                        {lastMessage && (
                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0 ml-2">
                                                {formatTime(lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex-1 min-w-0">
                                            {lastMessage ? (
                                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 truncate">
                                                    {lastMessage.direction === 'outbound' && (
                                                        <span className="text-green-600 dark:text-green-400 mr-1">Siz:</span>
                                                    )}
                                                    {truncateMessage(lastMessage.content, window.innerWidth < 640 ? 30 : 50)}
                                                </p>
                                            ) : (
                                                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-500">
                                                    {contact.phoneNumber}
                                                </p>
                                            )}
                                        </div>
                                        
                                        {/* Unread indicator */}
                                        {lastMessage && lastMessage.direction === 'inbound' && lastMessage.status !== 'read' && (
                                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 ml-2"></div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded touch-manipulation">
                                        <Phone className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                    </button>
                                    <button className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded touch-manipulation">
                                        <MoreVertical className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add Contact Modal */}
            {showAddContact && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-zinc-800 p-4 sm:p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">Yeni Kişi Ekle</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    İsim
                                </label>
                                <input
                                    type="text"
                                    value={newContactName}
                                    onChange={(e) => setNewContactName(e.target.value)}
                                    placeholder="Kişi adı"
                                    className="w-full px-3 py-3 sm:py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-base sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                                    Telefon Numarası
                                </label>
                                <input
                                    type="tel"
                                    value={newContactPhone}
                                    onChange={(e) => setNewContactPhone(e.target.value)}
                                    placeholder="+90 555 123 45 67"
                                    className="w-full px-3 py-3 sm:py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-base sm:text-sm"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddContact(false);
                                        setNewContactName('');
                                        setNewContactPhone('');
                                    }}
                                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 touch-manipulation"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={addContact}
                                    disabled={!newContactName.trim() || !newContactPhone.trim()}
                                    className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppContactList;