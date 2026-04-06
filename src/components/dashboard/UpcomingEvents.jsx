
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, isFuture } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UpcomingEvents({ events, isLoading }) {
  const upcomingEvents = events
    .filter(event => event.event_date && isFuture(parseISO(event.event_date)) && event.status !== 'cancelled')
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-100">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg bg-slate-700" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24 bg-slate-700" />
                  <Skeleton className="h-4 w-32 bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-2xl font-bold text-slate-100">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div 
              key={event.id} 
              className="flex items-center gap-4 p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-700/30 transition-all duration-300"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/25">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-slate-100 text-sm">
                  {event.client_name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <Clock className="w-3 h-3" />
                  {format(parseISO(event.event_date), 'MMM d')}
                  {event.event_time && ` • ${event.event_time}`}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-semibold text-emerald-400">
                  ${event.amount_billed?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-slate-400">{event.photobooth_model}</p>
              </div>
            </div>
          ))}
          
          {upcomingEvents.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No upcoming events</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
