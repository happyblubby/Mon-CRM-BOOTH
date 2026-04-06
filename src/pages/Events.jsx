
import React, { useState, useEffect, useCallback } from "react";
import { Event } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Calendar as CalendarIcon, User, Camera, DollarSign, MapPin, Eye, Edit, Trash2, List } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import QuickCalendarAdd from "../components/events/QuickCalendarAdd";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EventCalendarView from "../components/events/EventCalendarView";

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState("list");

  useEffect(() => {
    // Read URL parameters to pre-set status filter if coming from dashboard stats
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam && ["scheduled", "in_progress", "completed", "cancelled"].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
    loadEvents();
  }, []);

  const filterEvents = useCallback(() => {
    let filtered = [...events];

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.team_member?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.photobooth_model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Reset selection when filters change
    setSelectedEvents([]);
    setFilteredEvents(filtered);
  }, [events, searchTerm, statusFilter]);

  useEffect(() => {
    // Only filter events when in list view, calendar view uses the full events list
    if (viewMode === 'list') {
      filterEvents();
    }
  }, [viewMode, filterEvents]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await Event.list("-event_date");
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventSelect = (eventId, checked) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, eventId]);
    } else {
      setSelectedEvents(selectedEvents.filter(id => id !== eventId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(filteredEvents.map(event => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    try {
      await Event.delete(eventId);
      toast({
        title: "Event Deleted",
        description: `"${eventName}" has been successfully deleted.`,
      });
      loadEvents(); // Reload events after deletion
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "Failed to delete the event.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">
              All Events
            </h1>
            <p className="text-slate-400 text-sm sm:text-base lg:text-lg">
              {viewMode === 'list' ? `${filteredEvents.length} of ${events.length} events` : `${events.length} total events`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {selectedEvents.length > 0 && viewMode === 'list' && (
              <Link to={createPageUrl(`Compare?ids=${selectedEvents.join(',')}`)} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-2xl border-2 border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 min-h-[48px]">
                  Compare Selected ({selectedEvents.length})
                </Button>
              </Link>
            )}

            <Link to={createPageUrl("AddEvent")} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 min-h-[48px]">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">New Event</span>
              </Button>
            </Link>
          </div>
        </motion.div>

        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 backdrop-blur-sm border-slate-700 shadow-lg rounded-2xl p-1 sm:p-2 max-w-sm mx-auto">
            <TabsTrigger value="list" className="rounded-lg sm:rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5 text-slate-300">
              <List className="w-4 h-4 mr-1 sm:mr-2" />
              List View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="rounded-lg sm:rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs sm:text-sm py-2 sm:py-2.5 text-slate-300">
              <CalendarIcon className="w-4 h-4 mr-1 sm:mr-2" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <motion.div
              key="list-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Filters - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <Input
                          placeholder="Search events, clients, team members..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 rounded-xl bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400 min-h-[48px]"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:w-auto w-full">
                        <Filter className="w-4 h-4 text-slate-500 hidden sm:block" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full sm:w-48 rounded-xl bg-slate-700 border-slate-600 text-slate-100 focus:border-purple-400 min-h-[48px]">
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Events Grid - Mobile Optimized */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {filteredEvents.length > 0 && (
                  <div className="mb-4 flex items-center gap-3">
                    <Checkbox
                      id="select-all"
                      checked={selectedEvents.length > 0 && selectedEvents.length === filteredEvents.length}
                      onCheckedChange={handleSelectAll}
                      className="border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white data-[state=checked]:border-purple-600"
                    />
                    <label htmlFor="select-all" className="text-sm text-slate-400">
                      Select all visible events
                    </label>
                  </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm hover:shadow-xl hover:border-slate-600 transition-all duration-300 group">
                        {/* ... keep existing event card jsx ... */}
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex items-start gap-3 sm:gap-4 flex-1">
                              <Checkbox
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={(checked) => handleEventSelect(event.id, checked)}
                                className="mt-1 border-slate-500 data-[state=checked]:bg-purple-600 data-[state=checked]:text-white data-[state=checked]:border-purple-600"
                              />

                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex sm:flex-row flex-col sm:items-start justify-between gap-3 sm:gap-4">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                      <h3 className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-purple-400 transition-colors truncate">
                                        {event.client_name}
                                      </h3>
                                      <Badge className={`${statusColors[event.status] || statusColors.scheduled} text-xs w-fit`}>
                                        {event.status.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>

                                    {event.event_name && (
                                      <p className="text-slate-300 font-medium text-sm sm:text-base truncate">{event.event_name}</p>
                                    )}

                                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                                      <div className="flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">
                                          {event.event_date ? format(parseISO(event.event_date), 'MMM d, yyyy') : 'No date'}
                                          {event.event_time && ` at ${event.event_time}`}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">{event.team_member}</span>
                                      </div>

                                      <div className="flex items-center gap-1 sm:hidden lg:flex">
                                        <Camera className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">{event.photobooth_model}</span>
                                      </div>

                                      {event.venue && (
                                        <div className="flex items-center gap-1 hidden sm:flex">
                                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                          <span className="truncate">{event.venue}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-center sm:text-right space-y-2 sm:space-y-3 flex-shrink-0">
                                    <div className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center justify-center sm:justify-end gap-1">
                                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                      {event.amount_billed?.toLocaleString() || '0'}
                                    </div>
                                    {event.duration_hours && (
                                      <p className="text-xs sm:text-sm text-slate-400">
                                        {event.duration_hours} hours
                                      </p>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                                      <Link to={createPageUrl(`EventDetails?id=${event.id}`)}>
                                        <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto min-h-[40px] border-slate-600 text-slate-300 hover:bg-slate-700">
                                          <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                                          <span className="text-xs sm:text-sm">View</span>
                                        </Button>
                                      </Link>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" size="icon" className="rounded-xl w-full sm:w-auto min-h-[40px] border-slate-600 text-slate-300 hover:bg-slate-700">
                                            <MoreVertical className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200">
                                          <DropdownMenuItem asChild>
                                            <Link to={createPageUrl(`EditEvent?id=${event.id}`)} className="flex items-center hover:bg-slate-700/50 focus:bg-slate-700/50">
                                              <Edit className="w-4 h-4 mr-2" /> Edit
                                            </Link>
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onSelect={() => handleDeleteEvent(event.id, event.client_name)}
                                            className="text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-500"
                                          >
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                          </DropdownMenuItem>
                                          <DropdownMenuItem asChild>
                                            <QuickCalendarAdd event={event} asMenuItem />
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>

                                {event.notes && (
                                  <div className="mt-4 p-3 bg-slate-700/50 rounded-xl">
                                    <p className="text-sm text-slate-300 line-clamp-2">{event.notes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {filteredEvents.length === 0 && !isLoading && (
                    <Card className="border-slate-700 shadow-lg bg-slate-800/50 backdrop-blur-sm">
                      <CardContent className="p-12 text-center">
                        <CalendarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-100 mb-2">No events found</h3>
                        <p className="text-slate-400 mb-6">
                          {searchTerm || statusFilter !== "all"
                            ? "Try adjusting your search or filters"
                            : "Create your first event to get started"
                          }
                        </p>
                        {!searchTerm && statusFilter === "all" && (
                          <Link to={createPageUrl("AddEvent")}>
                            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl">
                              <Plus className="w-5 h-5 mr-2" />
                              Add First Event
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <EventCalendarView events={events} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
