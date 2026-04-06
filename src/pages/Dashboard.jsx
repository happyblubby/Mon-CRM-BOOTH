
import React, { useState, useEffect } from "react";
import { Event } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, DollarSign, Users, Camera, TrendingUp, Clock, FilePlus, Edit } from "lucide-react";
import { format, isToday, isThisMonth, parseISO } from "date-fns";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import RecentEvents from "../components/dashboard/RecentEvents";
import UpcomingEvents from "../components/dashboard/UpcomingEvents";
import AddTaskModal from "../components/tasks/AddTaskModal";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await Event.list("-created_date");
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStats = () => {
    const totalEvents = events.length;
    const totalRevenue = events.reduce((sum, event) => sum + (event.amount_billed || 0), 0);
    const completedEvents = events.filter(event => event.status === 'completed').length;
    const todaysEvents = events.filter(event =>
      event.event_date && isToday(parseISO(event.event_date))
    ).length;
    const thisMonthRevenue = events
      .filter(event => event.event_date && isThisMonth(parseISO(event.event_date)))
      .reduce((sum, event) => sum + (event.amount_billed || 0), 0);

    return {
      totalEvents,
      totalRevenue,
      completedEvents,
      todaysEvents,
      thisMonthRevenue,
      avgEventValue: totalEvents > 0 ? totalRevenue / totalEvents : 0
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section - Mobile Optimized */}
      <div
        className="relative h-64 sm:h-80 bg-cover bg-center"
        style={{ backgroundImage: "url('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/4cba6e78c_DSC04220-2.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-end p-4 sm:p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 sm:gap-6"
          >
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 shadow-lg">
                Event Dashboard
              </h1>
              <p className="text-gray-200 text-sm sm:text-base lg:text-lg shadow-sm">
                Manage your photobooth events with style
              </p>
            </div>
            
            {/* Mobile-first button layout */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
              <Link to={createPageUrl("VisualGuideEditor")} className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-white/20 text-white backdrop-blur-sm border-white/30 hover:bg-white/30 px-4 sm:px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 min-h-[48px]"
                >
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Create Guide</span>
                </Button>
              </Link>
              
              <Button
                onClick={() => setIsAddTaskModalOpen(true)}
                variant="outline"
                className="w-full sm:w-auto bg-white/20 text-white backdrop-blur-sm border-white/30 hover:bg-white/30 px-4 sm:px-6 py-3 rounded-2xl shadow-lg transition-all duration-300 min-h-[48px]"
              >
                <FilePlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Add Task</span>
              </Button>
              
              <Link to={createPageUrl("AddEvent")} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 min-h-[48px]">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">New Event</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 p-3 sm:p-6 lg:p-12">
        {/* Stats Grid - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          <Link to={createPageUrl("Events")}>
            <StatsCard
              title="Total Events"
              value={stats.totalEvents}
              icon={Calendar}
              color="purple"
              change="+12% this month"
            />
          </Link>
          <Link to={createPageUrl("CRM?tab=invoices")}>
            <StatsCard
              title="Total Revenue"
              value={`$${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              change={`$${stats.thisMonthRevenue.toLocaleString()} this month`}
            />
          </Link>
          <Link to={createPageUrl("Events?status=completed")}>
            <StatsCard
              title="Completed Events"
              value={stats.completedEvents}
              icon={Camera}
              color="blue"
              change={`${((stats.completedEvents / stats.totalEvents) * 100 || 0).toFixed(0)}% completion rate`}
            />
          </Link>
          <Link to={createPageUrl("Events?status=in_progress")}>
            <StatsCard
              title="Today's Events"
              value={stats.todaysEvents}
              icon={Clock}
              color="orange"
              change={`Avg. $${stats.avgEventValue.toFixed(0)} per event`}
            />
          </Link>
        </motion.div>

        {/* Main Content Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <RecentEvents events={events} isLoading={isLoading} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UpcomingEvents events={events} isLoading={isLoading} />
          </motion.div>
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onOpenChange={setIsAddTaskModalOpen}
      />
    </div>
  );
}
