

import React, { ReactNode, useEffect, useRef } from 'react';
import { ICONS } from '../constants.tsx';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Store the currently focused element
            previousActiveElement.current = document.activeElement as HTMLElement;
            
            // Focus the modal
            modalRef.current?.focus();
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Restore body scroll
            document.body.style.overflow = 'unset';
            
            // Restore focus to the previously focused element
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
            
            // Trap focus within modal
            if (event.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement?.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement?.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                ref={modalRef}
                className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-md md:max-w-xl lg:max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                tabIndex={-1}
                role="document"
            >
                <div className="flex justify-between items-center p-5 border-b border-zinc-200 dark:border-zinc-700">
                    <h3 id="modal-title" className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 p-1 rounded-full"
                        aria-label="Modalı kapat"
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