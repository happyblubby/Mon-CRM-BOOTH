import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, isFuture } from 'date-fns';
import { motion } from 'framer-motion';
import { Navigation, Pin } from 'lucide-react';

// Custom pin icon using SVG to avoid image path issues
const customIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#7C3AED"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><circle cx="12" cy="9.5" r="2.5" fill="white"/></svg>'),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

// Component to change map view
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.flyTo(center, zoom);
  return null;
};

export default function EventsMap() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState({ center: [46.603354, 1.888334], zoom: 6 }); // Center of France

  const locations = {
    france: { center: [46.603354, 1.888334], zoom: 6 },
    paris: { center: [48.8566, 2.3522], zoom: 12 },
  };

  useEffect(() => {
    loadUpcomingEvents();
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const allEvents = await Event.list('-event_date');
      const upcomingGeocodedEvents = allEvents.filter(
        event =>
          event.latitude &&
          event.longitude &&
          event.event_date &&
          isFuture(parseISO(event.event_date)) &&
          event.status !== 'cancelled'
      );
      setEvents(upcomingGeocodedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <MapContainer center={view.center} zoom={view.zoom} style={{ height: '100vh', width: '100%', zIndex: 0 }}>
        <ChangeView center={view.center} zoom={view.zoom} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {events.map(event => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={customIcon}
          >
            <Popup>
              <div className="font-sans">
                <h3 className="font-bold text-purple-700">{event.client_name}</h3>
                <p className="text-sm text-gray-700">{event.event_name}</p>
                <p className="text-xs text-gray-500">{format(parseISO(event.event_date), 'PPP')}</p>
                <Link to={createPageUrl('EventDetails', { id: event.id })}>
                  <Button size="sm" variant="link" className="p-0 h-auto text-purple-600">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10">
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="shadow-2xl bg-white/80 backdrop-blur-sm border-gray-200">
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setView(locations.france)}
                  variant={view.zoom === locations.france.zoom ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <Navigation className="w-4 h-4 mr-2" /> France
                </Button>
                <Button
                  onClick={() => setView(locations.paris)}
                  variant={view.zoom === locations.paris.zoom ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  <Pin className="w-4 h-4 mr-2" /> Paris
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {isLoading && (
         <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
         </div>
      )}
    </div>
  );
}