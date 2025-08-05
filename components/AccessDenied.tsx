
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

const AccessDenied: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <h1 className="mt-6 text-3xl font-bold text-zinc-800 dark:text-zinc-200">Erişim Reddedildi</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">Bu sayfayı görüntülemek için yetkiniz bulunmamaktadır.</p>
            <ReactRouterDOM.Link 
                to="/"
                className="mt-8 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                Ana Sayfaya Dön
            </ReactRouterDOM.Link>
        </div>
    );
};

export default AccessDenied;
