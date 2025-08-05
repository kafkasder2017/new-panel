import React, { useState, useMemo } from 'react';
import { DenetimKaydi, LogAction, LogEntityType } from '../types';
import { ICONS } from '../constants';
import { useDenetimKayitlari } from '../hooks/useData';
import { PageHeader, Table, Input, Select, Button } from './ui';

const getActionClass = (action: LogAction) => {
    switch (action) {
        case LogAction.CREATE: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        case LogAction.UPDATE: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        case LogAction.DELETE: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case LogAction.LOGIN:
        case LogAction.LOGOUT: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        default: return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300';
    }
};

const getEntityIcon = (entityType: LogEntityType) => {
    const iconStyle = "w-5 h-5 inline-block mr-2 text-zinc-500 dark:text-zinc-400";
    switch(entityType) {
        case LogEntityType.PERSON: return <span className={iconStyle}>{ICONS.PEOPLE}</span>;
        case LogEntityType.APPLICATION: return <span className={iconStyle}>{ICONS.AID_RECIPIENT}</span>;
        case LogEntityType.PROJECT: return <span className={iconStyle}>{ICONS.CALENDAR}</span>;
        case LogEntityType.DONATION: return <span className={iconStyle}>{ICONS.DONATION}</span>;
        case LogEntityType.USER: return <span className={iconStyle}>{ICONS.PEOPLE}</span>;
        case LogEntityType.VEFA: return <span className={iconStyle}>{ICONS.HEART_HAND}</span>;
        case LogEntityType.YETIM: return <span className={iconStyle}>{ICONS.ORPHAN}</span>;
        case LogEntityType.BURS: return <span className={iconStyle}>{ICONS.SCHOLARSHIP}</span>;
        case LogEntityType.SYSTEM: return <span className={iconStyle}>{ICONS.SETTINGS}</span>;
        case LogEntityType.COMMENT: return <span className={iconStyle}>{ICONS.MESSAGE}</span>;
        default: return null;
    }
};

const DenetimKayitlari: React.FC = () => {
    const { data: logs, isLoading, error } = useDenetimKayitlari();

    const [filters, setFilters] = useState({
        user: '',
        action: 'all' as LogAction | 'all',
        entity: 'all' as LogEntityType | 'all',
        startDate: '',
        endDate: '',
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleClearFilters = () => {
        setFilters({ user: '', action: 'all', entity: 'all', startDate: '', endDate: '' });
    };
    
    const filteredLogs = useMemo(() => {
        return logs
            .filter(log => {
                const logDate = new Date(log.timestamp);
                const startDate = filters.startDate ? new Date(filters.startDate) : null;
                const endDate = filters.endDate ? new Date(filters.endDate) : null;
                if (startDate) startDate.setHours(0,0,0,0);
                if (endDate) endDate.setHours(23,59,59,999);

                return (
                    (filters.user === '' || log.kullaniciAdi.toLowerCase().includes(filters.user.toLowerCase())) &&
                    (filters.action === 'all' || log.eylem === filters.action) &&
                    (filters.entity === 'all' || log.entityTipi === filters.entity) &&
                    (!startDate || logDate >= startDate) &&
                    (!endDate || logDate <= endDate)
                );
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [logs, filters]);
    
    const columns = useMemo(() => [
        { key: 'timestamp', title: 'Zaman Damgası', render: (l: DenetimKaydi) => new Date(l.timestamp).toLocaleString('tr-TR') },
        { key: 'kullaniciAdi', title: 'Kullanıcı', render: (l: DenetimKaydi) => l.kullaniciAdi },
        { key: 'eylem', title: 'Eylem', render: (l: DenetimKaydi) => <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getActionClass(l.eylem)}`}>{l.eylem}</span> },
        { key: 'entityTipi', title: 'Varlık', render: (l: DenetimKaydi) => <div className="flex items-center">{getEntityIcon(l.entityTipi)}<span>{l.entityTipi} {l.entityId && `(#${l.entityId})`}</span></div> },
        { key: 'aciklama', title: 'Açıklama', render: (l: DenetimKaydi) => l.aciklama },
    ], []);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    
    return (
        <>
            <PageHeader title="Denetim Kayıtları" />
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Input name="user" placeholder="Kullanıcı Adı..." value={filters.user} onChange={handleFilterChange} />
                    <Select name="action" value={filters.action} onChange={handleFilterChange} options={[{value: 'all', label: 'Tüm Eylemler'}, ...Object.values(LogAction).map(a => ({value: a, label: a}))]} />
                    <Select name="entity" value={filters.entity} onChange={handleFilterChange} options={[{value: 'all', label: 'Tüm Varlıklar'}, ...Object.values(LogEntityType).map(e => ({value: e, label: e}))]} />
                    <div className="md:col-span-3 flex items-center gap-2">
                        <Input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full"/>
                        <span className="text-zinc-500">-</span>
                        <Input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full"/>
                        <Button variant="outline" onClick={handleClearFilters}>Temizle</Button>
                    </div>
                </div>
                <Table columns={columns} data={filteredLogs} />
            </div>
        </>
    );
};

export default DenetimKayitlari;