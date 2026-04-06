
import React, { useState, useEffect } from "react";
import { TeamMember, Event } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Calendar, Camera, Mail, Phone, Edit, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function TeamMembers() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [teamMembers, searchTerm]);

  const loadData = async () => {
    try {
      const [membersData, eventsData] = await Promise.all([
        TeamMember.list("-created_date"),
        Event.list()
      ]);
      setTeamMembers(membersData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...teamMembers];

    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMembers(filtered);
  };

  const getEventsForMember = (memberName) => {
    return events.filter(event => event.team_member === memberName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:gap-6"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              Team Members
            </h1>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              {filteredMembers.length} team members
            </p>
          </div>
          
          <Link to={createPageUrl("AddTeamMember")} className="w-full sm:w-auto self-center sm:self-start">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 rounded-2xl shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/30 min-h-[48px]">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Add Team Member</span>
            </Button>
          </Link>
        </motion.div>

        {/* Search - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-400 min-h-[48px]"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Members Grid - Mobile Optimized */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {filteredMembers.map((member, index) => {
            const memberEvents = getEventsForMember(member.name);
            const completedEvents = memberEvents.filter(event => event.status === 'completed').length;
            
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group h-full">
                  <CardHeader className="text-center pb-3 sm:pb-4">
                    <div className="relative mx-auto mb-3 sm:mb-4">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white ${
                        member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    
                    <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors leading-tight">
                      {member.name}
                    </CardTitle>
                    
                    {member.role && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-2 text-xs">
                        {member.role}
                      </Badge>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                    {/* Contact Info - Mobile Optimized */}
                    <div className="space-y-2">
                      {member.email && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Event Stats - Mobile Optimized */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                          {memberEvents.length}
                        </div>
                        <p className="text-xs text-gray-500">Total Events</p>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-2xl font-bold text-emerald-600 flex items-center justify-center gap-1">
                          <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                          {completedEvents}
                        </div>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Link to={createPageUrl(`TeamMemberDetails?id=${member.id}`)} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full rounded-xl min-h-[40px]">
                          <Eye className="w-4 h-4 mr-2" />
                          <span className="text-xs sm:text-sm">View</span>
                        </Button>
                      </Link>
                      <Link to={createPageUrl(`EditTeamMember?id=${member.id}`)} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 min-h-[40px]">
                          <Edit className="w-4 h-4 mr-2" />
                          <span className="text-xs sm:text-sm">Edit</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {filteredMembers.length === 0 && !isLoading && (
            <div className="col-span-full">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No team members found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? "Try adjusting your search terms"
                      : "Add your first team member to get started"
                    }
                  </p>
                  {!searchTerm && (
                    <Link to={createPageUrl("AddTeamMember")}>
                      <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 rounded-2xl">
                        <Plus className="w-5 h-5 mr-2" />
                        Add First Team Member
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
