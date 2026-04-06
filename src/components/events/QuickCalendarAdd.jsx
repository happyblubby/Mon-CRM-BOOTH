import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function QuickCalendarAdd({ event, size = "default" }) {
  const generateQuickICS = () => {
    if (!event.event_date) return "";
    
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
    
    let endDate = new Date(event.event_date);
    if (event.event_time) {
      const [hours, minutes] = event.event_time.split(':');
      endDate.setHours(parseInt(hours), parseInt(minutes));
    }
    const durationHours = event.duration_hours || 4;
    endDate.setHours(endDate.getHours() + durationHours);
    const endDateTime = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PhotoEvent Pro//Event Manager//EN',
      'BEGIN:VEVENT',
      `UID:photoevent-${event.id || Date.now()}@photoevent.com`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      `SUMMARY:PhotoBooth - ${event.client_name}${event.event_name ? ` (${event.event_name})` : ''}`,
      `LOCATION:${event.venue || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  };

  const handleQuickAdd = () => {
    if (!event.event_date) return;
    
    const icsContent = generateQuickICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${event.client_name.replace(/\s+/g, '-')}-${event.event_date}.ics`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  if (!event.event_date) return null;

  return (
    <Button
      onClick={handleQuickAdd}
      variant="outline"
      size={size}
      className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
    >
      <Calendar className="w-4 h-4 mr-1" />
      Add to Calendar
    </Button>
  );
}