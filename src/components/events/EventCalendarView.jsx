
import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";
import { User, Camera, DollarSign, Clock, MapPin, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200", 
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const EventInfoCard = ({ event }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm hover:shadow-xl hover:border-slate-600 transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-purple-500/25 flex-shrink-0">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors truncate">
                  {event.client_name}
                </h3>
                <Badge className={`${statusColors[event.status] || statusColors.scheduled} text-xs`}>
                  {event.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="flex gap-2 self-start sm:self-center">
                <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Eye className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to={createPageUrl(`EditEvent?id=${event.id}`)}>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-600 text-slate-300 hover:bg-slate-700">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{event.event_time || 'All day'}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  {event.amount_billed?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function EventCalendarView({ events }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach(event => {
      if (event.event_date) {
        // Use a simple string key for the map
        const dateKey = format(parseISO(event.event_date), 'yyyy-MM-dd');
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey).push(event);
      }
    });
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => e.event_date && isSameDay(parseISO(e.event_date), selectedDate));
  }, [selectedDate, events]);

  const modifiers = {
    event: Array.from(eventsByDate.keys()).map(dateStr => parseISO(dateStr))
  };

  const modifiersStyles = {
    event: {
      fontWeight: 'bold',
      color: '#a78bfa', // purple-400
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      <Card className="lg:col-span-1 border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-2 sm:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-0 w-full"
            classNames={{
              day_cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-purple-600/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-10 w-10 text-base text-slate-300",
              day_selected: "bg-purple-600 text-white hover:bg-purple-700 hover:text-white focus:bg-purple-600 focus:text-white",
              day_today: "bg-slate-700 text-slate-100",
              head_cell: "text-slate-400 rounded-md w-12 font-normal text-[0.8rem]",
            }}
            components={{
              DayContent: ({ date }) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                const hasEvent = eventsByDate.has(dateKey);
                return (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <span>{format(date, 'd')}</span>
                    {hasEvent && <div className="absolute bottom-1.5 w-1 h-1 bg-emerald-400 rounded-full"></div>}
                  </div>
                );
              }
            }}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </CardContent>
      </Card>
      
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Events for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}
        </h2>
        <AnimatePresence>
          {selectedDayEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDayEvents.map(event => <EventInfoCard key={event.id} event={event} />)}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="border-slate-700 shadow-md bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="font-semibold text-slate-100">No events scheduled</h3>
                  <p className="text-slate-400 text-sm">Select a different day to see other events.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
