import React, { useState, useMemo, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { DosyaSistemiOgesi, Klasor, Dosya, FileType } from '../types.ts';
import { listFiles, uploadFile, deleteFiles, createFolder as apiCreateFolder, updateFile } from '../services/apiService.ts';


// --- ICONS ---
const FileIcons: Record<FileType, React.ReactNode> = {
    image: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
    pdf: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.3 21.3a1.4 1.4 0 0 1-1.3-2.1L10 16H8a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2.5a1.5 1.5 0 0 1 0 3H10l-1.5 2.5a1.4 1.4 0 0 1 .1 1.6 1.4 1.4 0 0 1-1.3.8Z"/><path d="M17 10.5a1.5 1.5 0 0 1 0 3h-1v-3a1.5 1.5 0 0 1 3 0v3h-1"/><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/></svg>,
    word: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-7"/><path d="m10 11 2 3 2-3"/></svg>,
    excel: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m15 13-3 3 3 3"/><path d="m10 13 3 3-3 3"/></svg>,
    other: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

const FolderIcon = <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;

// --- HELPER FUNCTIONS ---
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const DokumanArsivi: React.FC = () => {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState<DosyaSistemiOgesi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchItems = async () => {
        setIsLoading(true);
        setError('');
        try {
            const fetchedItems = await listFiles(currentPath);
            setItems(fetchedItems);
        } catch (err: any) {
            setError(err.message || "Dosyalar listelenemedi.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchItems();
    }, [currentPath]);

    const { breadcrumbs, filteredItems } = useMemo(() => {
        const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : [];
        const bc = pathParts.map((part, index) => ({
            name: part,
            path: pathParts.slice(0, index + 1).join('/'),
        }));
        
        const filtered = items.filter(item => {
            const lowerTerm = searchTerm.toLowerCase();
            if (!lowerTerm) return true;
            
            const matchesName = item.name.toLowerCase().includes(lowerTerm);
            
            if (item.type === 'file' && item.tags && item.tags.length > 0) {
                const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(lowerTerm));
                return matchesName || matchesTags;
            }
            return matchesName;
        });

        return { breadcrumbs: bc, filteredItems: filtered };
    }, [currentPath, items, searchTerm]);

    const handleCreateFolder = async () => {
        const folderName = prompt('Yeni klasör adı:');
        if (folderName) {
            const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
            try {
                await apiCreateFolder(newPath);
                await fetchItems(); // Refresh list
                toast.success(`'${folderName}' klasörü oluşturuldu.`);
            } catch (err: any) {
                toast.error("Klasör oluşturulamadı: " + err.message);
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            try {
                const newFile = await uploadFile(currentPath, file);
                setItems(prev => [...prev, newFile]);
                toast.success(`'${file.name}' başarıyla yüklendi.`);
            } catch (err: any) {
                toast.error("Dosya yüklenemedi: " + err.message);
            } finally {
                setIsLoading(false);
                if(fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };
    
    const handleDeleteItem = async (item: DosyaSistemiOgesi) => {
        if (window.confirm(`'${item.name}' öğesini silmek istediğinizden emin misiniz?`)) {
             try {
                const pathToDelete = currentPath ? `${currentPath}/${item.name}` : item.name;
                await deleteFiles([pathToDelete]);
                await fetchItems(); // Refresh list
                toast.success(`'${item.name}' başarıyla silindi.`);
            } catch (err: any) {
                toast.error("Öğe silinemedi: " + err.message);
            }
        }
    };
    

    return (
        <div className="flex h-full bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden border border-zinc-200 dark:border-zinc-700">
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex flex-col md:flex-row items-center justify-between gap-4">
                    <nav className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2 flex-wrap">
                        <button onClick={() => setCurrentPath('')} className="hover:text-blue-600 dark:hover:text-blue-400">Ana Dizim</button>
                        {breadcrumbs.map(bc => (
                            <React.Fragment key={bc.path}>
                                <span>/</span>
                                <button onClick={() => setCurrentPath(bc.path)} className="hover:text-blue-600 dark:hover:text-blue-400">{bc.name}</button>
                            </React.Fragment>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <input type="text" placeholder="Arşivde ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-sm w-48 bg-white dark:bg-zinc-700"/>
                        <button onClick={handleCreateFolder} className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-600">Yeni Klasör</button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">Dosya Yükle</button>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {isLoading ? (
                         <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
                    ) : error ? (
                        <div className="text-center text-red-600">{error}</div>
                    ) : filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                            {filteredItems.map(item => (
                                <div key={item.id} className="group relative" onDoubleClick={() => item.type === 'folder' && setCurrentPath(currentPath ? `${currentPath}/${item.name}` : item.name)}>
                                    <div className="aspect-w-1 aspect-h-1 w-full bg-zinc-100 dark:bg-zinc-700/50 rounded-lg flex items-center justify-center p-4 cursor-pointer border border-zinc-200 dark:border-zinc-700 group-hover:border-blue-500 transition-colors relative">
                                        {item.type === 'folder' ? <span className="text-zinc-400 dark:text-zinc-500 w-16 h-16">{FolderIcon}</span> : 
                                            item.fileType === 'image' && item.url ? <img src={item.url} alt={item.name} className="w-full h-full object-contain"/> : <span className="text-zinc-400 dark:text-zinc-500 w-12 h-12">{FileIcons[item.fileType]}</span>
                                        }
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate" title={item.name}>{item.name}</p>
                                        {item.type === 'file' && <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatBytes(item.size)}</p>}
                                        {item.type === 'file' && item.tags && (
                                            <div className="flex flex-wrap gap-1 justify-center mt-1">
                                                {item.tags.map(tag => <span key={tag} className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 font-medium px-1.5 py-0.5 rounded">{tag}</span>)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-full p-1 shadow">
                                        <button onClick={() => handleDeleteItem(item)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-20 text-zinc-500 dark:text-zinc-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-zinc-800 dark:text-zinc-200">Bu klasör boş</h3>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Dosyaları buraya sürükleyip bırakabilir veya yukarıdan yükleyebilirsiniz.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DokumanArsivi;