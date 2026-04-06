
import React, { useState } from "react";
import { Event } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calendar, DollarSign, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import CalendarIntegration from "../components/events/CalendarIntegration";
import { InvokeLLM } from "@/api/integrations";

export default function AddEvent() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventData, setEventData] = useState({
    client_name: "",
    event_name: "",
    event_date: "",
    event_time: "",
    team_member: "",
    photobooth_model: "",
    venue: "",
    duration_hours: "",
    amount_billed: "",
    status: "scheduled",
    notes: "",
    client_contact: ""
  });

  const geocodeVenue = async (venue) => {
    if (!venue) return null;
    try {
      const response = await InvokeLLM({
        prompt: `Provide the latitude and longitude for the following venue: "${venue}". Only return a JSON object with "latitude" and "longitude" keys.`,
        response_json_schema: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
          },
          required: ["latitude", "longitude"],
        },
      });
      return response;
    } catch (error) {
      console.error("Geocoding failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let dataToSubmit = {
        ...eventData,
        duration_hours: eventData.duration_hours ? parseFloat(eventData.duration_hours) : undefined,
        amount_billed: eventData.amount_billed ? parseFloat(eventData.amount_billed) : 0
      };

      const coordinates = await geocodeVenue(eventData.venue);
      if (coordinates) {
        dataToSubmit = {
          ...dataToSubmit,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        };
      }
      
      const newEvent = await Event.create(dataToSubmit);
      
      if (window.confirm('Event created successfully! Would you like to add it to your calendar?')) {
        const tempEvent = { ...dataToSubmit, id: newEvent.id }; 
        const calendarComponent = new CalendarIntegration({ event: tempEvent });
        calendarComponent.addToAppleCalendar();
      }
      
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Add New Event
            </h1>
            <p className="text-gray-600 text-lg mt-2">Register a new photobooth event</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-100 pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-purple-600" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Client Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Client Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="client_name" className="text-sm font-medium text-gray-700">
                        Client Name *
                      </Label>
                      <Input
                        id="client_name"
                        value={eventData.client_name}
                        onChange={(e) => updateField("client_name", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_contact" className="text-sm font-medium text-gray-700">
                        Client Contact
                      </Label>
                      <Input
                        id="client_contact"
                        value={eventData.client_contact}
                        onChange={(e) => updateField("client_contact", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="Phone or email"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Details */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Event Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="event_name" className="text-sm font-medium text-gray-700">
                        Event Name/Type
                      </Label>
                      <Input
                        id="event_name"
                        value={eventData.event_name}
                        onChange={(e) => updateField("event_name", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="Wedding, Birthday, Corporate..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="venue" className="text-sm font-medium text-gray-700">
                        Venue
                      </Label>
                      <Input
                        id="venue"
                        value={eventData.venue}
                        onChange={(e) => updateField("venue", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_date" className="text-sm font-medium text-gray-700">
                        Event Date *
                      </Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={eventData.event_date}
                        onChange={(e) => updateField("event_date", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_time" className="text-sm font-medium text-gray-700">
                        Start Time
                      </Label>
                      <Input
                        id="event_time"
                        type="time"
                        value={eventData.event_time}
                        onChange={(e) => updateField("event_time", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration_hours" className="text-sm font-medium text-gray-700">
                        Duration (hours)
                      </Label>
                      <Input
                        id="duration_hours"
                        type="number"
                        step="0.5"
                        min="0"
                        value={eventData.duration_hours}
                        onChange={(e) => updateField("duration_hours", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={eventData.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Team & Equipment */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3">
                    Team & Equipment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="team_member" className="text-sm font-medium text-gray-700">
                        Team Member *
                      </Label>
                      <Input
                        id="team_member"
                        value={eventData.team_member}
                        onChange={(e) => updateField("team_member", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="Assigned team member"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photobooth_model" className="text-sm font-medium text-gray-700">
                        Photobooth Model *
                      </Label>
                      <Input
                        id="photobooth_model"
                        value={eventData.photobooth_model}
                        onChange={(e) => updateField("photobooth_model", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="Model/ID of photobooth"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Financial */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Financial Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="amount_billed" className="text-sm font-medium text-gray-700">
                      Amount Billed *
                    </Label>
                    <Input
                      id="amount_billed"
                      type="number"
                      step="0.01"
                      min="0"
                      value={eventData.amount_billed}
                      onChange={(e) => updateField("amount_billed", e.target.value)}
                      className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 md:w-1/2"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={eventData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 min-h-24"
                    placeholder="Additional notes about this event..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-100">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Event
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
