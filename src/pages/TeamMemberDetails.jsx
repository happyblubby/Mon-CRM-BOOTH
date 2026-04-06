
import React, { useState, useEffect } from "react";
import { TeamMember, Event, Task, User } from "@/api/entities"; // Added User import
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle }
from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Users, Mail, Phone, Calendar, FileText, Trash2, XCircle, CheckCircle, Key, Loader2 } from "lucide-react"; // Added Loader2
import { format, parseISO, subMonths } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select components

import TaskManager from "../components/team/TaskManager";
import EventsList from "../components/team/EventsList";
import LoginCredentialsDialog from "../components/team/LoginCredentialsDialog";
import { createUserLogin } from "@/api/functions";
import { updateUserRole } from "@/api/functions"; // Added updateUserRole import

export default function TeamMemberDetails() {
  const navigate = useNavigate();
  const [teamMember, setTeamMember] = useState(null);
  const [events, setEvents] = useState([]); // Renamed from memberEvents
  const [tasks, setTasks] = useState([]); // New state variable, not explicitly set by loadData in outline
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isCreatingLogin, setIsCreatingLogin] = useState(false); // New state
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false); // New state
  const [generatedCredentials, setGeneratedCredentials] = useState(null); // New state
  const [currentUser, setCurrentUser] = useState(null); // New state
  const [newRole, setNewRole] = useState(""); // New state
  const [isUpdatingRole, setIsUpdatingRole] = useState(false); // New state

  useEffect(() => {
    loadData();
    cleanupOldTasks();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3000);
    return () => clearTimeout(timer);
  };

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('id');
    
    if (!memberId) {
      navigate(createPageUrl("TeamMembers"));
      return;
    }

    setIsLoading(true);
    try {
      const [memberData, allEvents, userData] = await Promise.all([ // Added userData
        TeamMember.get(memberId),
        Event.list(),
        User.me() // Fetch current user data
      ]);
      
      setTeamMember(memberData);
      setCurrentUser(userData); // Set current user data
      setEvents(allEvents.filter(event => event.team_member === memberData.name)); // Renamed from setMemberEvents
    } catch (error) {
      console.error("Error loading data:", error);
      showNotification('Error loading data.', 'error');
      navigate(createPageUrl("TeamMembers"));
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupOldTasks = async () => {
    try {
      const fourMonthsAgo = subMonths(new Date(), 4);
      const allTasks = await Task.list();
      
      for (const task of allTasks) {
        const taskDate = parseISO(task.created_date);
        if (taskDate < fourMonthsAgo) {
          await Task.delete(task.id);
        }
      }
    } catch (error) {
      console.error("Error cleaning up old tasks:", error);
    }
  };

  const handleCreateLogin = async () => {
    if (!teamMember || !teamMember.email) {
      showNotification("Email address is required to create a login account.", 'error');
      return;
    }

    if (teamMember.has_login_account) {
      showNotification("Login account already exists for this team member.", 'error');
      return;
    }

    setIsCreatingLogin(true);
    try {
      const { data } = await createUserLogin({ teamMemberId: teamMember.id });
      
      if (data.success) {
        setGeneratedCredentials(data.credentials);
        setShowCredentialsDialog(true);
        // Optimistically update the UI to hide the button immediately
        setTeamMember(prev => ({ ...prev, has_login_account: true }));
        showNotification('Login account created successfully!', 'success');
        
        // Show additional note about Base44 platform invitation if present
        if (data.note) {
          setTimeout(() => {
            showNotification(data.note, 'info');
          }, 3000);
        }
      } else {
        showNotification(`Error creating login: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error("Error creating login:", error);
      showNotification("Failed to create login account. Please try again.", 'error');
    } finally {
      setIsCreatingLogin(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!newRole) {
      showNotification("Please select a role to assign.", 'error');
      return;
    }
    if (!teamMember?.email) {
      showNotification("Team member email not found.", 'error');
      return;
    }

    setIsUpdatingRole(true);
    try {
      const { data, error } = await updateUserRole({ email: teamMember.email, newRole });
      if (error || !data.success) {
        throw new Error(error?.response?.data?.error || data?.error || 'Failed to update role.');
      }
      showNotification(data.message, 'success');
      setNewRole(""); // Reset dropdown after successful update
    } catch (err) {
      console.error("Error updating role:", err);
      showNotification(err.message, 'error');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!teamMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6 text-center">
        <h2 className="text-2xl font-bold">Team member not found</h2>
        <Button onClick={() => navigate(createPageUrl("TeamMembers"))} className="mt-4">
          Go to Team Members
        </Button>
      </div>
    );
  }

  const completedEvents = events.filter(event => event.status === 'completed').length; // Uses 'events'
  const totalRevenue = events.reduce((sum, event) => sum + (event.amount_billed || 0), 0); // Uses 'events'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2
              ${notification.type === 'success' ? 'bg-green-500 text-white' : (notification.type === 'info' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white')}
            `}
          >
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
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
            onClick={() => navigate(createPageUrl("TeamMembers"))}
            className="rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">
              {teamMember.name}
            </h1>
            <p className="text-gray-600 text-lg mt-2">{teamMember.role || 'Team Member'}</p>
          </div>
          {/* Edit Profile button moved to Quick Actions card */}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 space-y-8" // Added space-y-8 for separation between cards
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="relative mx-auto mb-4">
                  {teamMember.photo_url ? (
                    <img
                      src={teamMember.photo_url}
                      alt={teamMember.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                      <Users className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white ${
                    teamMember.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                
                <CardTitle className="text-xl font-bold text-gray-900">
                  {teamMember.name}
                </CardTitle>
                
                {teamMember.role && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-2">
                    {teamMember.role}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-3">
                  {teamMember.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="break-all">{teamMember.email}</span>
                    </div>
                  )}
                  {teamMember.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-purple-600" />
                      <span>{teamMember.phone}</span>
                    </div>
                  )}
                  {teamMember.hire_date && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span>Hired {format(parseISO(teamMember.hire_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{events.length}</div> {/* Uses 'events' */}
                    <p className="text-xs text-gray-500">Total Events</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{completedEvents}</div>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">${totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>

                {teamMember.notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600">{teamMember.notes}</p>
                  </div>
                )}

                {/* Delete Button */}
                <div className="pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete ${teamMember.name}? This action cannot be undone.`)) {
                        try {
                          await TeamMember.delete(teamMember.id);
                          showNotification('Team member deleted successfully!', 'success');
                          navigate(createPageUrl("TeamMembers"));
                        } catch (error) {
                          console.error("Error deleting team member:", error);
                          showNotification('Error deleting team member.', 'error');
                        }
                      }
                    }}
                    className="w-full rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Team Member
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to={createPageUrl(`EditTeamMember?id=${teamMember.id}`)}>
                  <Button variant="outline" className="w-full rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
                
                {teamMember.email && !teamMember.has_login_account && (
                  <Button 
                    onClick={handleCreateLogin}
                    disabled={isCreatingLogin}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    {isCreatingLogin ? (
                      <>Creating...</>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Create Login Account
                      </>
                    )}
                  </Button>
                )}
                
                {teamMember.has_login_account && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <Key className="w-4 h-4" />
                      <span className="font-medium">Login Account Active</span>
                    </div>
                    <p className="text-green-700 text-xs mt-1">
                      This team member has login access to the system.
                    </p>
                  </div>
                )}

                {teamMember.email && (
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl"
                    onClick={() => window.open(`mailto:${teamMember.email}`)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                )}
                
                {teamMember.phone && (
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl"
                    onClick={() => window.open(`tel:${teamMember.phone}`)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Phone
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* System Permissions Card */}
            {currentUser?.role === 'admin' && teamMember.has_login_account && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">System Permissions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Assign a system-wide role. Admins have full access, while Users have restricted access.
                  </p>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={newRole} 
                      onValueChange={setNewRole} 
                      disabled={currentUser.email === teamMember.email || isUpdatingRole} // Disable if updating or self-editing
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a new role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User (Technician)</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleUpdateRole} 
                      disabled={isUpdatingRole || !newRole || currentUser.email === teamMember.email} // Disable if updating, no role selected, or self-editing
                    >
                      {isUpdatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    </Button>
                  </div>
                  {currentUser.email === teamMember.email && (
                    <p className="text-xs text-red-600 mt-2">You cannot change your own role.</p>
                  )}
                </CardContent>
              </Card>
            )}

          </motion.div>

          {/* Right Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
          >
            <TaskManager teamMember={teamMember} />
            <EventsList 
              events={events} // Uses 'events'
              memberName={teamMember.name}
            />
          </motion.div>
        </div>

        {/* Login Credentials Dialog */}
        <LoginCredentialsDialog
          isOpen={showCredentialsDialog}
          onClose={() => setShowCredentialsDialog(false)}
          credentials={generatedCredentials}
          teamMemberName={teamMember?.name}
        />
      </div>
    </div>
  );
}
