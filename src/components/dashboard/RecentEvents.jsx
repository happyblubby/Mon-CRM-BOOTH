
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Calendar, User, Camera, DollarSign, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusColors = {
  scheduled: "bg-blue-900/30 text-blue-300 border-blue-500/20",
  in_progress: "bg-yellow-900/30 text-yellow-300 border-yellow-500/20", 
  completed: "bg-green-900/30 text-green-300 border-green-500/20",
  cancelled: "bg-red-900/30 text-red-300 border-red-500/20"
};

export default function RecentEvents({ events, isLoading }) {
  const recentEvents = events.slice(0, 6);

  if (isLoading) {
    return (
      <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-xl bg-slate-700" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 bg-slate-700" />
                  <Skeleton className="h-3 w-24 bg-slate-700" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full bg-slate-700" />
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
        <CardTitle className="text-2xl font-bold text-slate-100">Recent Events</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {recentEvents.map((event) => (
            <Link to={createPageUrl(`EventDetails?id=${event.id}`)} key={event.id}>
              <div 
                className="flex items-start gap-4 p-4 rounded-2xl border border-slate-700 hover:border-purple-500/50 hover:bg-slate-700/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-100 group-hover:text-purple-400 transition-colors">
                        {event.client_name}
                      </h3>
                      <p className="text-sm text-slate-400">{event.event_name || 'Event'}</p>
                    </div>
                    <Badge className={statusColors[event.status] || statusColors.scheduled}>
                      {event.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.event_date ? format(parseISO(event.event_date), 'MMM d, yyyy') : 'No date'}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {event.team_member}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${event.amount_billed?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {recentEvents.length === 0 && (
            <div className="text-center py-12">
              <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No events yet. Create your first event!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
