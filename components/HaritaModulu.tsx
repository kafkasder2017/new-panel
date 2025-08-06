import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import * as Leaflet from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { getPeople, getKumbaralar } from '../services/apiService';
import { Person, Kumbara, MembershipType } from '../types';

// Fix for default icon issue with bundlers like esm.sh
const DefaultIcon = Leaflet.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;

const recipientIcon = new Leaflet.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const volunteerIcon = new Leaflet.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const kumbaraIcon = new Leaflet.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

type LayerType = 'recipients' | 'volunteers' | 'boxes';

interface MapPoint {
    id: string;
    lat: number;
    lng: number;
    type: LayerType;
    data: Person | Kumbara;
}

const HaritaModulu: React.FC = () => {
    const [people, setPeople] = useState<Person[]>([]);
    const [kumbaralar, setKumbaralar] = useState<Kumbara[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [layers, setLayers] = useState<Record<LayerType, boolean>>({
        recipients: true,
        volunteers: false,
        boxes: true,
    });
    const position: Leaflet.LatLngExpression = [41.0082, 28.9784]; // Istanbul center

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [peopleData, kumbaralarData] = await Promise.all([getPeople(), getKumbaralar()]);
                setPeople(peopleData);
                setKumbaralar(kumbaralarData);
            } catch (err: any) {
                setError(err.message || "Harita verileri yüklenemedi.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const mapPoints = useMemo((): MapPoint[] => {
        const points: MapPoint[] = [];

        if (layers.recipients) {
            people
                .filter(p => p.lat && p.lng && p.aid_type_received && p.aid_type_received.length > 0)
                .forEach(p => points.push({ id: `person-${p.id}`, lat: p.lat!, lng: p.lng!, type: 'recipients', data: p }));
        }
        if (layers.volunteers) {
            people
                .filter(p => p.lat && p.lng && p.membershipType === MembershipType.GONULLU)
                .forEach(p => points.push({ id: `person-${p.id}`, lat: p.lat!, lng: p.lng!, type: 'volunteers', data: p }));
        }
        if (layers.boxes) {
            kumbaralar
                .filter(k => k.lat && k.lng)
                .forEach(k => points.push({ id: `kumbara-${k.id}`, lat: k.lat!, lng: k.lng!, type: 'boxes', data: k }));
        }

        return points;
    }, [people, kumbaralar, layers]);

    const getMarkerIcon = (type: LayerType) => {
        switch (type) {
            case 'recipients': return recipientIcon;
            case 'volunteers': return volunteerIcon;
            case 'boxes': return kumbaraIcon;
            default: return DefaultIcon;
        }
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    return (
        <div className="h-full w-full relative">
            <MapContainer {...{center: position, zoom: 11, scrollWheelZoom: true}} className="h-full w-full rounded-xl">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapPoints.map(point => (
                    <Marker key={point.id} position={[point.lat, point.lng]}>
                        <Popup>
                            {point.type === 'recipients' || point.type === 'volunteers' ? (
                                <PersonPopup person={point.data as Person} />
                            ) : (
                                <KumbaraPopup kumbara={point.data as Kumbara} />
                            )}
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
            <LayerControl layers={layers} setLayers={setLayers} />
        </div>
    );
};


const LayerControl: React.FC<{ layers: Record<LayerType, boolean>, setLayers: React.Dispatch<React.SetStateAction<Record<LayerType, boolean>>> }> = ({ layers, setLayers }) => {
    const handleLayerChange = (layer: LayerType) => {
        setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    return (
        <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700">
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Katmanlar</h4>
            <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={layers.recipients} onChange={() => handleLayerChange('recipients')} className="rounded text-red-500 focus:ring-red-500" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Yardım Alanlar</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={layers.volunteers} onChange={() => handleLayerChange('volunteers')} className="rounded text-green-500 focus:ring-green-500" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Gönüllüler</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={layers.boxes} onChange={() => handleLayerChange('boxes')} className="rounded text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">Kumbaralar</span>
                </label>
            </div>
        </div>
    );
};

const PersonPopup: React.FC<{ person: Person }> = ({ person }) => (
    <div className="text-sm">
        <h5 className="font-bold">{person.first_name} {person.last_name}</h5>
        <p>{person.address}</p>
        <p><span className="font-semibold">Durum:</span> {person.status}</p>
        <ReactRouterDOM.Link to={`/kisiler/${person.id}`} className="text-blue-600 font-semibold hover:underline mt-1 block">
            Detayları Görüntüle &rarr;
        </ReactRouterDOM.Link>
    </div>
);

const KumbaraPopup: React.FC<{ kumbara: Kumbara }> = ({ kumbara }) => (
    <div className="text-sm">
        <h5 className="font-bold">Kumbara: {kumbara.code}</h5>
        <p>{kumbara.location}</p>
        <p><span className="font-semibold">Bakiye:</span> {kumbara.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
         <ReactRouterDOM.Link to="/kumbaralar" className="text-blue-600 font-semibold hover:underline mt-1 block">
            Kumbara Yönetimine Git &rarr;
        </ReactRouterDOM.Link>
    </div>
);

export default HaritaModulu;