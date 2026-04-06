
import React, { useState, useEffect, useCallback } from "react";
import { Event } from "@/api/entities";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Camera, DollarSign, Clock, MapPin, FileText, ImageIcon, Edit, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import PhotoGallery from "../components/events/PhotoGallery";
import CalendarIntegration from "../components/events/CalendarIntegration"; // New import

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function EventDetails() {
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadEvent = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (!eventId) {
      navigate(createPageUrl("Events"));
      return;
    }
    try {
      const eventData = await Event.get(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error("Error loading event:", error);
      navigate(createPageUrl("Events"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      await Event.delete(event.id);
      toast({
        title: "Event Deleted",
        description: `"${event.client_name}" has been permanently removed.`,
      });
      navigate(createPageUrl("Events"));
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete the event. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-slate-100 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 text-slate-100 p-6 text-center">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <Button onClick={() => navigate(createPageUrl("Events"))} className="mt-4">Go to Events</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-6">
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
            className="rounded-2xl border-slate-600 bg-slate-800/50 hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              {event.client_name}
            </h1>
            <p className="text-slate-400 text-lg mt-2">{event.event_name || 'Event Details'}</p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Event Details Card */}
            <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-700 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-bold text-slate-100">Details</CardTitle>
                <Badge className={statusColors[event.status] || "bg-gray-500 text-gray-100"}>{event.status}</Badge>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-purple-400 mt-1"/>
                  <div>
                    <p className="font-semibold">Date & Time</p>
                    <p className="text-slate-300">{event.event_date ? format(parseISO(event.event_date), 'EEEE, MMMM d, yyyy') : 'No date'} {event.event_time && `at ${event.event_time}`}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-400 mt-1"/>
                  <div>
                    <p className="font-semibold">Team</p>
                    <p className="text-slate-300">{event.team_member}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-purple-400 mt-1"/>
                  <div>
                    <p className="font-semibold">Booth</p>
                    <p className="text-slate-300">{event.photobooth_model}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-400 mt-1"/>
                  <div>
                    <p className="font-semibold">Venue</p>
                    <p className="text-slate-300">{event.venue || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-purple-400 mt-1"/>
                  <div>
                    <p className="font-semibold">Duration</p>
                    <p className="text-slate-300">{event.duration_hours ? `${event.duration_hours} hours` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-400 mt-1"/>
                   <div>
                    <p className="font-semibold">Billed</p>
                    <p className="font-semibold text-emerald-400">${event.amount_billed?.toLocaleString() || '0'}</p>
                  </div>
                </div>
                {event.notes && (
                  <div className="pt-4 mt-4 border-t border-slate-700 col-span-full">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-purple-400 mt-1"/>
                       <div>
                        <p className="font-semibold">Notes</p>
                        <p className="text-slate-300">{event.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photo Gallery */}
            <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-purple-400" />
                  Event Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoGallery
                  eventId={event?.id}
                  photos={event?.photo_gallery || []}
                  onPhotosUpdate={loadEvent}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Calendar Integration */}
            <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarIntegration event={event} />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-100">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link to={createPageUrl(`EditEvent?id=${event.id}`)}>
                  <Button variant="outline" className="w-full rounded-xl border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => window.print()}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Print Details
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Event
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        event for "{event.client_name}" and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteEvent}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
