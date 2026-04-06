import React, { useState, useEffect } from "react";
import { Event } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Camera, DollarSign, Clock, MapPin, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function Compare() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ids = urlParams.get('ids');
    
    if (ids) {
      loadEvents(ids.split(','));
    } else {
      navigate(createPageUrl("Events"));
    }
  }, [navigate]);

  const loadEvents = async (eventIds) => {
    try {
      const allEvents = await Event.list();
      const selectedEvents = allEvents.filter(event => eventIds.includes(event.id));
      setEvents(selectedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events for comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  const ComparisonField = ({ label, icon: Icon, values, format: formatFn = (v) => v || '-' }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2 font-medium text-gray-700">
          <Icon className="w-4 h-4" />
          {label}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${events.length}, 1fr)` }}>
        {values.map((value, index) => (
          <div key={index} className="p-4 border-r border-gray-100 last:border-r-0">
            <span className="text-gray-900">{formatFn(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Events"))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Event Comparison
            </h1>
            <p className="text-gray-600 text-lg mt-2">
              Comparing {events.length} events side by side
            </p>
          </div>
        </motion.div>

        {events.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events to compare</h3>
              <p className="text-gray-500 mb-6">Please select events from the Events page to compare them.</p>
              <Button 
                onClick={() => navigate(createPageUrl("Events"))}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                Go to Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-gray-100 pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Event Details Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Event Headers */}
                <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-emerald-50">
                  <div className="p-4">
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${events.length}, 1fr)` }}>
                      {events.map((event, index) => (
                        <div key={event.id} className="px-4 py-2">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 mx-auto mb-3">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                              {event.client_name}
                            </h3>
                            <Badge className={`${statusColors[event.status]} text-xs`}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comparison Fields */}
                <div className="divide-y divide-gray-100">
                  <ComparisonField
                    label="Event Name/Type"
                    icon={Calendar}
                    values={events.map(e => e.event_name)}
                  />
                  
                  <ComparisonField
                    label="Event Date"
                    icon={Calendar}
                    values={events.map(e => e.event_date)}
                    format={(date) => date ? format(parseISO(date), 'MMM d, yyyy') : '-'}
                  />
                  
                  <ComparisonField
                    label="Start Time"
                    icon={Clock}
                    values={events.map(e => e.event_time)}
                  />
                  
                  <ComparisonField
                    label="Venue"
                    icon={MapPin}
                    values={events.map(e => e.venue)}
                  />
                  
                  <ComparisonField
                    label="Team Member"
                    icon={User}
                    values={events.map(e => e.team_member)}
                  />
                  
                  <ComparisonField
                    label="Photobooth Model"
                    icon={Camera}
                    values={events.map(e => e.photobooth_model)}
                  />
                  
                  <ComparisonField
                    label="Duration"
                    icon={Clock}
                    values={events.map(e => e.duration_hours)}
                    format={(hours) => hours ? `${hours} hours` : '-'}
                  />
                  
                  <ComparisonField
                    label="Amount Billed"
                    icon={DollarSign}
                    values={events.map(e => e.amount_billed)}
                    format={(amount) => amount ? `$${amount.toLocaleString()}` : '$0'}
                  />
                  
                  <ComparisonField
                    label="Client Contact"
                    icon={User}
                    values={events.map(e => e.client_contact)}
                  />
                  
                  <ComparisonField
                    label="Notes"
                    icon={FileText}
                    values={events.map(e => e.notes)}
                    format={(notes) => notes || 'No notes'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm mt-8">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Comparison Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100">
                    <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${events.reduce((sum, e) => sum + (e.amount_billed || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Total Hours</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {events.reduce((sum, e) => sum + (e.duration_hours || 0), 0)} hrs
                    </p>
                  </div>
                  
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100">
                    <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Average Value</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${(events.reduce((sum, e) => sum + (e.amount_billed || 0), 0) / events.length).toFixed(0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}