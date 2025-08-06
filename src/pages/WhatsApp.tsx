import React, { useState } from 'react';
import { MessageCircle, Settings, Archive, Star } from 'lucide-react';
import WhatsAppContactList from '../components/WhatsAppContactList';
import WhatsAppChat from '../components/WhatsAppChat';
import { getWhatsAppContact } from '../services/whatsappService';
import { WhatsAppContact } from '../types/whatsapp';

const WhatsApp: React.FC = () => {
    const [selectedContact, setSelectedContact] = useState<WhatsAppContact | null>(null);
    const [activeTab, setActiveTab] = useState<'chats' | 'archived' | 'starred'>('chats');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleSelectContact = async (contact: WhatsAppContact) => {
        const contactData = await getWhatsAppContact(contact.id);
        setSelectedContact(contactData);
        // Mobilde sohbet açıldığında sidebar'ı kapat
        setIsSidebarOpen(false);
    };

    const handleCloseChat = () => {
        setSelectedContact(null);
        // Mobilde sohbet kapandığında sidebar'ı aç
        setIsSidebarOpen(true);
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile menu button */}
                        <button 
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg"
                        >
                            <MessageCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                        
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">WhatsApp Business</h1>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hidden sm:block">Müşteri iletişim merkezi</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg">
                            <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                
                {/* Sidebar */}
                <div className={`w-80 flex flex-col bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 transition-transform duration-300 ease-in-out z-50 ${
                    isSidebarOpen || !selectedContact ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:relative lg:z-auto fixed inset-y-0 left-0`}>
                    {/* Tabs */}
                    <div className="flex border-b border-zinc-200 dark:border-zinc-700">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'chats'
                                    ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Sohbetler
                        </button>
                        <button
                            onClick={() => setActiveTab('starred')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'starred'
                                    ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            <Star className="w-4 h-4" />
                            Yıldızlı
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === 'archived'
                                    ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                        >
                            <Archive className="w-4 h-4" />
                            Arşiv
                        </button>
                    </div>

                    {/* Contact List */}
                    <div className="flex-1">
                        {activeTab === 'chats' && (
                            <WhatsAppContactList
                                onSelectContact={handleSelectContact}
                                selectedContactId={selectedContact?.id}
                            />
                        )}
                        {activeTab === 'starred' && (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                                <Star className="w-12 h-12 mb-2" />
                                <p>Yıldızlı mesaj yok</p>
                            </div>
                        )}
                        {activeTab === 'archived' && (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
                                <Archive className="w-12 h-12 mb-2" />
                                <p>Arşivlenmiş sohbet yok</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col transition-all duration-300 ${
                    selectedContact ? 'block' : 'hidden lg:flex'
                }`}>
                    {selectedContact ? (
                        <WhatsAppChat
                            contact={selectedContact}
                            onClose={handleCloseChat}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-4">
                            <div className="text-center max-w-md">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-6 mx-auto">
                                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-zinc-400 dark:text-zinc-500" />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-zinc-700 dark:text-zinc-300">
                                    WhatsApp Business'a Hoş Geldiniz
                                </h2>
                                <p className="text-base sm:text-lg mb-4">
                                    Müşterilerinizle kolayca iletişim kurun
                                </p>
                                <div className="space-y-2 text-sm">
                                    <p>• Hızlı mesajlaşma</p>
                                    <p>• Otomatik yanıtlar</p>
                                    <p>• Müşteri takibi</p>
                                    <p>• Raporlama</p>
                                </div>
                                <div className="mt-8">
                                    <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                        <span className="hidden lg:inline">Başlamak için sol taraftan bir kişi seçin veya yeni kişi ekleyin</span>
                                        <span className="lg:hidden">Başlamak için menüden bir kişi seçin</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 px-4 sm:px-6 py-2 hidden sm:block">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Çevrimiçi
                        </span>
                        <span className="hidden md:inline">Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <span className="hidden lg:inline">WhatsApp Business API v2.0</span>
                        <span>Kafkasder Panel</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsApp;