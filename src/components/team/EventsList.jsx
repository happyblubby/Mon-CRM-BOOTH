
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, MapPin, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function EventsList({ events, memberName }) {
  const displayEvents = events || [];
  const sortedEvents = [...displayEvents].sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-2xl font-bold text-gray-900">
          Assigned Events ({displayEvents.length})
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        {displayEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Assigned</h3>
            <p className="text-gray-500">This team member has no events assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 border border-gray-100 rounded-2xl hover:border-purple-200 hover:bg-purple-50/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {event.client_name}
                      </h3>
                      <p className="text-sm text-gray-600">{event.event_name || 'Event'}</p>
                    </div>
                    <Badge className={statusColors[event.status] || statusColors.scheduled}>
                      {event.status}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.event_date ? format(parseISO(event.event_date), 'MMM d, yyyy') : 'No date'}
                      {event.event_time && ` at ${event.event_time}`}
                    </div>
                    
                    {event.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${event.amount_billed?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
                
                <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                  <Button variant="outline" size="sm" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
