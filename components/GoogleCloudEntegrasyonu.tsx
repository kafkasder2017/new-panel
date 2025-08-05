
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

const GoogleCloudEntegrasyonu: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 dark:text-zinc-500">
                 <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
            </svg>
            <h1 className="mt-6 text-3xl font-bold text-zinc-800 dark:text-zinc-200">Google Cloud Entegrasyonu</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-300">Bu modül, Google Cloud servisleriyle entegrasyon ayarlarını içerir.</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Bu özellik şu anda yapım aşamasındadır.</p>
            <ReactRouterDOM.Link 
                to="/"
                className="mt-8 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
                Ana Sayfaya Dön
            </ReactRouterDOM.Link>
        </div>
    );
};

export default GoogleCloudEntegrasyonu;
