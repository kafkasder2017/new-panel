
import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getEtkinlikler, getProjeler, getDavalar } from '../services/apiService';
import { CalendarEvent, CalendarEventType, Etkinlik, Proje, Dava } from '../types';
import Modal from './Modal';
import { ICONS } from '../constants';

const CalendarHeader: React.FC<{
    currentDate: Date;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onToday: () => void;
}> = ({ currentDate, onPrevMonth, onNextMonth, onToday }) => (
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
            <button onClick={onToday} className="px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-600">
                Bugün
            </button>
            <button onClick={onPrevMonth} className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700">{ICONS.CHEVRON_DOWN && React.cloneElement(ICONS.CHEVRON_DOWN, { className: 'w-5 h-5 transform -rotate-90' })}</button>
            <button onClick={onNextMonth} className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-700">{ICONS.CHEVRON_DOWN && React.cloneElement(ICONS.CHEVRON_DOWN, { className: 'w-5 h-5 transform rotate-90' })}</button>
        </div>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
            {currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
        </h2>
    </div>
);

const CalendarDays: React.FC = () => {
    const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    return (
        <div className="grid grid-cols-7">
            {days.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400 py-2 border-b border-zinc-200 dark:border-zinc-700">
                    {day}
                </div>
            ))}
        </div>
    );
};

const getEventTypeClass = (type: CalendarEventType) => {
    switch (type) {
        case CalendarEventType.ETKINLIK: return 'bg-blue-500 hover:bg-blue-600';
        case CalendarEventType.GOREV: return 'bg-yellow-500 hover:bg-yellow-600';
        case CalendarEventType.DURUSMA: return 'bg-red-500 hover:bg-red-600';
        default: return 'bg-zinc-500 hover:bg-zinc-600';
    }
};

const CalendarEventModal: React.FC<{ event: CalendarEvent; onClose: () => void; }> = ({ event, onClose }) => (
    <Modal isOpen={true} onClose={onClose} title={event.title}>
        <div className="space-y-4">
            <div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getEventTypeClass(event.type)}`}>
                    {event.type}
                </span>
            </div>
            <p><strong>Tarih:</strong> {new Date(event.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p><strong>Detaylar:</strong> {event.details}</p>
            <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-4 py-2 rounded-lg font-semibold border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600">Kapat</button>
                <ReactRouterDOM.Link to={event.link} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                    Kaynağa Git
                </ReactRouterDOM.Link>
            </div>
        </div>
    </Modal>
);

const Takvim: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [etkinlikler, projeler, davalar] = await Promise.all([
                    getEtkinlikler(),
                    getProjeler(),
                    getDavalar(),
                ]);

                const transformedEvents: CalendarEvent[] = [];

                etkinlikler.forEach((e: Etkinlik) => {
                    transformedEvents.push({
                        id: `etkinlik-${e.id}`,
                        title: e.ad,
                        date: e.tarih,
                        type: CalendarEventType.ETKINLIK,
                        link: `/etkinlikler/${e.id}`,
                        details: `Saat: ${e.saat}, Konum: ${e.konum}`
                    });
                });

                projeler.forEach((p: Proje) => {
                    (p.gorevler || []).forEach(g => {
                         transformedEvents.push({
                            id: `gorev-${p.id}-${g.id}`,
                            title: g.baslik,
                            date: g.sonTarih,
                            type: CalendarEventType.GOREV,
                            link: `/projeler/${p.id}`,
                            details: `Proje: ${p.name}`
                        });
                    });
                });
                
                davalar.forEach((d: Dava) => {
                    (d.durusmalar || []).forEach(dur => {
                         transformedEvents.push({
                            id: `durusma-${d.id}-${dur.id}`,
                            title: d.davaKonusu,
                            date: dur.tarih,
                            type: CalendarEventType.DURUSMA,
                            link: `/hukuki-yardim/${d.id}`,
                            details: `Saat: ${dur.saat}, Müvekkil: ${d.muvekkil}`
                        });
                    });
                });

                setEvents(transformedEvents);

            } catch (err: any) {
                setError(err.message || 'Takvim verileri yüklenemedi.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const { month, year } = { month: currentDate.getMonth(), year: currentDate.getFullYear() };
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Monday, 6=Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const eventsByDay = useMemo(() => {
        return events.reduce((acc, event) => {
            const date = new Date(event.date);
            if (date.getFullYear() === year && date.getMonth() === month) {
                const day = date.getDate();
                if (!acc[day]) {
                    acc[day] = [];
                }
                acc[day].push(event);
            }
            return acc;
        }, {} as Record<number, CalendarEvent[]>);
    }, [events, month, year]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;

    return (
        <>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 h-full flex flex-col">
                <CalendarHeader 
                    currentDate={currentDate}
                    onPrevMonth={() => setCurrentDate(new Date(year, month - 1, 1))}
                    onNextMonth={() => setCurrentDate(new Date(year, month + 1, 1))}
                    onToday={() => setCurrentDate(new Date())}
                />
                <CalendarDays />
                <div className="grid grid-cols-7 grid-rows-6 flex-1">
                    {blanks.map((_, i) => <div key={`blank-${i}`} className="border-r border-b border-zinc-200 dark:border-zinc-700"></div>)}
                    {days.map(day => {
                        const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                        return (
                            <div key={day} className="relative p-2 border-r border-b border-zinc-200 dark:border-zinc-700">
                                <span className={`absolute top-2 right-2 text-sm font-semibold ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                    {day}
                                </span>
                                <div className="mt-8 space-y-1">
                                    {(eventsByDay[day] || []).map(event => (
                                        <button 
                                            key={event.id} 
                                            onClick={() => setSelectedEvent(event)}
                                            className={`w-full text-left text-xs text-white font-semibold px-2 py-1 rounded-md truncate ${getEventTypeClass(event.type)}`}
                                        >
                                            {event.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {selectedEvent && <CalendarEventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
        </>
    );
};

export default Takvim;
