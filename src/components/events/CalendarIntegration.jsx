import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function CalendarIntegration({ event }) {
  const generateICSFile = () => {
    // Format dates for ICS (YYYYMMDDTHHMMSSZ format)
    const formatICSDate = (dateStr, timeStr = "") => {
      if (!dateStr) return "";
      
      let date = new Date(dateStr);
      
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        date.setHours(parseInt(hours), parseInt(minutes));
      }
      
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    };

    const startDateTime = formatICSDate(event.event_date, event.event_time);
    
    // Calculate end time (add duration or default 4 hours)
    let endDate = new Date(event.event_date);
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      endDate.setHours(parseInt(hours), parseInt(minutes));
    }
    const durationHours = event.duration_hours || 4;
    endDate.setHours(endDate.getHours() + durationHours);
    const endDateTime = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    // Create event description
    let description = `PhotoBooth Event for ${event.client_name}`;
    if (event.event_name) description += ` - ${event.event_name}`;
    if (event.photobooth_model) description += `\\nPhotoBooth: ${event.photobooth_model}`;
    if (event.team_member) description += `\\nTeam Member: ${event.team_member}`;
    if (event.client_contact) description += `\\nClient Contact: ${event.client_contact}`;
    if (event.notes) description += `\\nNotes: ${event.notes}`;
    description += `\\nAmount: $${(event.amount_billed || 0).toLocaleString()}`;

    // Generate unique ID for the event
    const eventId = `photoevent-${event.id}@photoevent.com`;

    // Create ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PhotoEvent Pro//Event Manager//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:PhotoBooth - ${event.client_name}${event.event_name ? ` (${event.event_name})` : ''}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${event.venue || 'TBD'}`,
      `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      `CREATED:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
      `LAST-MODIFIED:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'DESCRIPTION:PhotoBooth Event Reminder',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  const downloadICSFile = () => {
    const icsContent = generateICSFile();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `photoevent-${event.client_name.replace(/\s+/g, '-')}-${event.event_date}.ics`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const addToAppleCalendar = () => {
    downloadICSFile();
  };

  if (!event.event_date) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={addToAppleCalendar}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
      >
        <Calendar className="w-4 h-4 mr-2" />
        Add to Apple Calendar
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        Downloads a calendar file that opens in Apple Calendar, Google Calendar, or Outlook
      </p>
    </div>
  );
}