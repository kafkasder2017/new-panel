

import React, { ReactNode } from 'react';
import { ICONS } from '../constants.tsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md md:max-w-xl lg:max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 p-1 rounded-full"
                    >
                        {ICONS.X_MARK}
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;