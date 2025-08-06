import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatbotModal from './ChatbotModal';

interface ChatbotFABProps {
  personId?: string;
  context?: Record<string, any>;
  className?: string;
}

const ChatbotFAB: React.FC<ChatbotFABProps> = ({
  personId,
  context,
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <button
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="AI Asistan ile Sohbet Et"
        >
          <MessageCircle className="h-6 w-6" />
          
          {/* Tooltip */}
          <div className={`absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap transition-all duration-200 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}>
            AI Asistan ile Sohbet Et
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
          
          {/* Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>
        </button>
      </div>

      {/* Chatbot Modal */}
      <ChatbotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        personId={personId}
        context={context}
      />
    </>
  );
};

export default ChatbotFAB;