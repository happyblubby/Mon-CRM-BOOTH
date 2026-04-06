
import React, { useState, useEffect } from "react";
import { Event } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Calendar, DollarSign, Upload, Image, Trash2, Loader2, MapPin, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InvokeLLM } from "@/api/integrations";

export default function EditEvent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null); // Changed initial state to null
  const [uploadedImages, setUploadedImages] = useState([]); // New state for photo gallery
  const [imageUploadLoading, setImageUploadLoading] = useState(false); // New state for image upload loading
  const [imageUploadError, setImageUploadError] = useState(null); // New state for image upload error
  
  // State to store the venue from the initial load for comparison
  const [initialVenue, setInitialVenue] = useState("");

  useEffect(() => {
    loadEvent();
  }, []);

  const loadEvent = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    
    if (!eventId) {
      navigate(createPageUrl("Events"));
      return;
    }

    try {
      const event = await Event.get(eventId);
      setEventData({
        ...event,
        duration_hours: event.duration_hours || "", // Ensure number fields are strings for input value
        amount_billed: event.amount_billed || "" // Ensure number fields are strings for input value
      });
      setUploadedImages(event.photo_gallery || []); // Initialize uploadedImages from event data
      setInitialVenue(event.venue || ""); // Store the initial venue for comparison later
    } catch (error) {
      console.error("Error loading event:", error);
      setError("Failed to load event details.");
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeVenue = async (venue) => {
    if (!venue) return null;
    try {
      const response = await InvokeLLM({
        prompt: `Provide the latitude and longitude for the following venue: "${venue}". Only return a JSON object with "latitude" (number) and "longitude" (number) keys.`,
        response_json_schema: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
          },
          required: ["latitude", "longitude"],
        },
      });
      // Validate response structure and types
      if (response && typeof response.latitude === 'number' && typeof response.longitude === 'number') {
        return response;
      } else {
        console.warn("LLM geocoding returned invalid format:", response);
        return null;
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      setError("Failed to geocode venue. Please check the venue address.");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (!eventData || !eventData.id) {
      setError("Event data not loaded. Please refresh the page.");
      setIsSubmitting(false);
      return;
    }

    try {
      let dataToSubmit = {
        ...eventData,
        // Convert empty strings to undefined for duration_hours if it's not set
        duration_hours: eventData.duration_hours ? parseFloat(eventData.duration_hours) : undefined,
        // Convert empty strings to 0 for amount_billed or parse
        amount_billed: eventData.amount_billed ? parseFloat(eventData.amount_billed) : 0,
        photo_gallery: uploadedImages, // Include photo gallery data
      };

      // Only re-geocode if the venue has changed from its initial loaded value
      if (initialVenue !== eventData.venue) {
        console.log("Venue changed, geocoding new venue:", eventData.venue);
        const coordinates = await geocodeVenue(eventData.venue);
        if (coordinates) {
          dataToSubmit = {
            ...dataToSubmit,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          };
        } else {
          // If geocoding fails, ensure existing latitude/longitude are cleared
          delete dataToSubmit.latitude;
          delete dataToSubmit.longitude;
          setError("Venue geocoding failed. Event will be saved without updated map coordinates.");
        }
      } else if (eventData.latitude && eventData.longitude && eventData.venue === initialVenue) {
        // If venue hasn't changed, but coordinates exist, keep them.
        // This is important because geocoding might have happened on original save.
        dataToSubmit.latitude = eventData.latitude;
        dataToSubmit.longitude = eventData.longitude;
      } else {
        // If venue hasn't changed and no coordinates, ensure they are not sent or are undefined.
        delete dataToSubmit.latitude;
        delete dataToSubmit.longitude;
      }

      await Event.update(eventData.id, dataToSubmit);
      navigate(createPageUrl(`EventDetails?id=${eventData.id}`)); // Use eventData.id for navigation
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field, value) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageUploadLoading(true);
    setImageUploadError(null);

    try {
      const newImageUrls = [];
      for (const file of files) {
        // In a real application, you would upload the file to a storage service (e.g., S3, Cloudinary)
        // and get a public URL back. For this example, we'll simulate it with a Blob URL.
        // These URLs are temporary and only valid for the current browser session.
        // For persistence, they need to be replaced with actual hosted URLs before saving to Event.
        const imageUrl = URL.createObjectURL(file); 
        newImageUrls.push(imageUrl);
      }
      setUploadedImages(prev => [...prev, ...newImageUrls]);
      e.target.value = ''; // Clear the input so same file can be re-selected
    } catch (error) {
      console.error("Image upload failed:", error);
      setImageUploadError("Failed to upload image(s).");
    } finally {
      setImageUploadLoading(false);
    }
  };

  const removeImage = (index) => {
    // Revoke the temporary URL to free up memory if it was a Blob URL
    if (uploadedImages[index] && uploadedImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(uploadedImages[index]);
    }
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    // In a real application, you might also want to send a request to delete the image from storage.
  };

  if (isLoading || !eventData) { // Check both isLoading and eventData null state for loading screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
            onClick={() => {
              // Use eventData.id for navigation back to details page
              navigate(createPageUrl(`EventDetails?id=${eventData.id}`));
            }}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              Edit Event
            </h1>
            <p className="text-gray-600 text-lg mt-2">Update event details for {eventData.client_name}</p>
          </div>
        </motion.div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                        value={eventData.client_name || ""}
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
                        value={eventData.client_contact || ""}
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
                        value={eventData.event_name || ""}
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
                        value={eventData.venue || ""}
                        onChange={(e) => updateField("venue", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                      />
                      {eventData.latitude && eventData.longitude && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> Coordinates: {eventData.latitude?.toFixed(4)}, {eventData.longitude?.toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_date" className="text-sm font-medium text-gray-700">
                        Event Date *
                      </Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={eventData.event_date || ""}
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
                        value={eventData.event_time || ""}
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
                        value={eventData.duration_hours || ""}
                        onChange={(e) => updateField("duration_hours", e.target.value)}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400"
                        placeholder="4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select value={eventData.status || "scheduled"} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400">
                          <SelectValue placeholder="Select Status" />
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
                        value={eventData.team_member || ""}
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
                        value={eventData.photobooth_model || ""}
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
                      value={eventData.amount_billed || ""}
                      onChange={(e) => updateField("amount_billed", e.target.value)}
                      className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 md:w-1/2"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Photo Gallery */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <Image className="w-5 h-5 text-blue-600" />
                    Photo Gallery
                  </h3>
                  <div className="space-y-4">
                    <Label htmlFor="image-upload" className="text-sm font-medium text-gray-700">
                      Upload Event Photos
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="image-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 flex-grow"
                        disabled={imageUploadLoading}
                      />
                      {imageUploadLoading && <Loader2 className="w-5 h-5 animate-spin text-purple-500" />}
                    </div>
                    {imageUploadError && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{imageUploadError}</AlertDescription>
                      </Alert>
                    )}

                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                        {uploadedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={imageUrl}
                              alt={`Event Photo ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full h-7 w-7"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={eventData.notes || ""}
                    onChange={(e) => updateField("notes", e.target.value)}
                    className="rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 min-h-24"
                    placeholder="Additional notes about this event..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      // Use eventData.id for navigation back to details page
                      navigate(createPageUrl(`EventDetails?id=${eventData.id}`));
                    }}
                    className="px-8 py-3 rounded-2xl"
                  >
                    Cancel
                  </Button>
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
                        Save Changes
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
