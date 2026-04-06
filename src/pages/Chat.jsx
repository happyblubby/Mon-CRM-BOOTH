
import React, { useState, useEffect } from "react";
import { ChatMessage, ChatChannel, TeamMember, User, Notification } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  Send,
  Plus,
  Hash,
  Users,
  Paperclip,
  Smile,
  MoreHorizontal,
  Search,
  Settings,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isToday, isYesterday } from "date-fns";

import ChannelSidebar from "../components/chat/ChannelSidebar";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import CreateChannelDialog from "../components/chat/CreateChannelDialog";
import { createPageUrl } from "@/utils";

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Load initial data just once on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const channelIdFromUrl = urlParams.get('channel');
    loadInitialData(channelIdFromUrl);
  }, [window.location.search]);

  // Set up polling for messages only for the active channel
  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id); // Load messages immediately when channel changes

      // Set up polling for new messages at a less aggressive rate
      const messagePolling = setInterval(() => {
        if (activeChannel) {
          loadMessages(activeChannel.id);
        }
      }, 8000); // Poll every 8 seconds

      return () => clearInterval(messagePolling);
    }
  }, [activeChannel]);

  // Close mobile sidebar when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const loadInitialData = async (channelIdFromUrl) => {
    try {
      setIsLoading(true);
      const [user, channelsData, teamMembersData] = await Promise.all([
        User.me(),
        ChatChannel.list("-last_message_at"),
        TeamMember.list()
      ]);

      setCurrentUser(user);
      setChannels(channelsData);
      setTeamMembers(teamMembersData);

      let initialChannel = null;
      if (channelIdFromUrl) {
        initialChannel = channelsData.find(c => c.id === channelIdFromUrl);
      }
      
      if (initialChannel) {
        setActiveChannel(initialChannel);
      } else if (channelsData.length > 0) {
        setActiveChannel(channelsData[0]);
      } else {
        await createDefaultChannels(user);
        // After creating, re-fetch and set active channel
        const newChannels = await ChatChannel.list("-last_message_at");
        setChannels(newChannels);
        if (newChannels.length > 0) {
            setActiveChannel(newChannels[0]);
        }
      }
    } catch (error) {
      // Suppress console logs for expected rate limit errors
      if (!error.message?.includes("429")) {
          console.error("Error loading chat data:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultChannels = async (user) => {
    try {
      const defaultChannels = [
        {
          name: "general",
          display_name: "General",
          description: "General team discussions",
          channel_type: "public",
          members: [user.email],
          created_by_email: user.email
        },
        {
          name: "events",
          display_name: "Events",
          description: "Discuss upcoming events and logistics",
          channel_type: "public",
          members: [user.email],
          created_by_email: user.email
        },
        {
          name: "random",
          display_name: "Random",
          description: "Non-work related chatter",
          channel_type: "public",
          members: [user.email],
          created_by_email: user.email
        }
      ];

      for (const channelData of defaultChannels) {
        await ChatChannel.create(channelData);
      }

      // Reload channels
      const updatedChannels = await ChatChannel.list("-last_message_at");
      setChannels(updatedChannels);
      if (updatedChannels.length > 0) {
        // No explicit loadMessages here, useEffect will handle it when activeChannel is set
        // setActiveChannel(updatedChannels[0]); // This is now handled by loadInitialData's post-creation logic
      }
    } catch (error) {
      console.error("Error creating default channels:", error);
    }
  };

  const loadMessages = async (channelId) => {
    try {
      const messagesData = await ChatMessage.filter(
        { channel_id: channelId },
        "-created_date",
        100
      );
      setMessages(messagesData.reverse()); // Show oldest first
    } catch (error) {
      // Suppress console logs for expected rate limit errors
      if (!error.message?.includes("429")) {
        console.error("Error loading messages:", error);
      }
    }
  };

  const handleChannelSelect = (channel) => {
    setActiveChannel(channel);
    // Close mobile sidebar when selecting a channel on mobile
    setIsMobileSidebarOpen(false);
    // The useEffect hook will now handle loading messages
  };

  const handleStartDirectMessage = async (teamMember) => {
    if (!currentUser || !teamMember) return;

    try {
      // Check if direct message channel already exists
      const existingDM = channels.find(channel => 
        channel.channel_type === "direct" &&
        channel.members?.includes(currentUser.email) &&
        channel.members?.includes(teamMember.email)
      );

      if (existingDM) {
        setActiveChannel(existingDM);
        setIsMobileSidebarOpen(false); // Close mobile sidebar after starting DM
        return;
      }

      // Create new direct message channel
      const dmChannelName = `dm-${[currentUser.email, teamMember.email].sort().join('-')}`;
      const newDMChannel = {
        name: dmChannelName,
        display_name: `${teamMember.name}`,
        description: `Direct messages with ${teamMember.name}`,
        channel_type: "direct",
        members: [currentUser.email, teamMember.email],
        created_by_email: currentUser.email
      };

      const createdChannel = await ChatChannel.create(newDMChannel);
      
      // Reload channels and select the new one
      const updatedChannels = await ChatChannel.list("-last_message_at");
      setChannels(updatedChannels);
      
      // Find and select the newly created channel
      const newChannel = updatedChannels.find(c => c.name === dmChannelName);
      if (newChannel) {
        setActiveChannel(newChannel);
      }

      // Close mobile sidebar after starting DM
      setIsMobileSidebarOpen(false);

    } catch (error) {
      console.error("Error starting direct message:", error);
    }
  };

  const handleSendMessage = async (messageData) => {
    if (!activeChannel || !currentUser) return;

    try {
      const newMessage = {
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        channel_id: activeChannel.id,
        channel_name: activeChannel.name,
        channel_type: activeChannel.channel_type,
        ...messageData
      };

      const createdMessage = await ChatMessage.create(newMessage);

      // Update channel's last message time
      await ChatChannel.update(activeChannel.id, {
        last_message_at: new Date().toISOString(),
        message_count: (activeChannel.message_count || 0) + 1
      });
      
      // Create general chat notifications
      if (activeChannel.members) {
        const notifications = activeChannel.members
          .filter(email => email !== currentUser.email)
          .map(memberEmail => ({
            user_email: memberEmail,
            title: `New message in ${activeChannel.channel_type === 'direct' ? `DM with ${currentUser.full_name}` : `#${activeChannel.display_name}`}`,
            message: `${currentUser.full_name}: ${messageData.message.substring(0, 50)}${messageData.message.length > 50 ? '...' : ''}`,
            type: 'chat',
            link: createPageUrl(`Chat?channel=${activeChannel.id}`),
            related_entity_id: createdMessage.id
          }));

        if (notifications.length > 0) {
          await Notification.bulkCreate(notifications);
        }
      }

      // Add Personalized Task Notifications
      const messageContent = messageData.message;
      // Regex to find mentions followed by "task:" or "to do:"
      const taskAssignmentRegex = /@(\w+)\s+(?:task:|to do:)\s*(.*)/i;
      const match = messageContent.match(taskAssignmentRegex);

      if (match) {
        const mentionedName = match[1]; // The captured group for the name (e.g., "John")
        const taskDescription = match[2].trim(); // The captured group for the task description

        // Find the team member based on the mentioned name (case-insensitive)
        const assignedMember = teamMembers.find(member => 
          (member.full_name && member.full_name.toLowerCase().includes(mentionedName.toLowerCase())) ||
          (member.name && member.name.toLowerCase().includes(mentionedName.toLowerCase())) ||
          (member.email && member.email.split('@')[0].toLowerCase().includes(mentionedName.toLowerCase()))
        );

        // Ensure the assigned member exists and is not the current user
        if (assignedMember && assignedMember.email !== currentUser.email) {
          const taskNotification = {
            user_email: assignedMember.email,
            title: `New task assigned to you!`,
            message: `From ${currentUser.full_name}: "${taskDescription}"`,
            type: 'task', // Custom notification type for tasks
            link: createPageUrl(`Chat?channel=${activeChannel.id}`), // Link back to the chat channel
            related_entity_id: createdMessage.id // Link to the specific message
          };
          await Notification.create(taskNotification);
        }
      }

      // Reload messages immediately
      loadMessages(activeChannel.id);

      // Refresh channels list to update last message time
      const updatedChannels = await ChatChannel.list("-last_message_at");
      setChannels(updatedChannels);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCreateChannel = async (channelData) => {
    if (!currentUser) return;

    try {
      const newChannel = {
        ...channelData,
        created_by_email: currentUser.email,
        members: channelData.members || [currentUser.email]
      };

      await ChatChannel.create(newChannel);

      // Reload channels
      const updatedChannels = await ChatChannel.list("-last_message_at");
      setChannels(updatedChannels);
      setShowCreateChannel(false);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm("Are you sure you want to delete this channel? All messages will be permanently lost.")) {
      return;
    }

    try {
      // 1. Delete all messages in the channel
      const messagesToDelete = await ChatMessage.filter({ channel_id: channelId });
      if (messagesToDelete.length > 0) {
        await Promise.all(messagesToDelete.map(msg => ChatMessage.delete(msg.id)));
      }

      // 2. Delete the channel itself
      await ChatChannel.delete(channelId);

      // 3. Update UI state
      const updatedChannels = await ChatChannel.list("-last_message_at");
      setChannels(updatedChannels);

      // If the deleted channel was active, switch to another one or to a default state
      if (activeChannel?.id === channelId) {
        setActiveChannel(updatedChannels.length > 0 ? updatedChannels[0] : null);
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-3 sm:p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <div className="flex h-screen relative">
        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Mobile responsive */}
        <div className={`
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative top-0 left-0 h-full w-full max-w-sm md:w-80 
          border-r border-gray-200 bg-white/95 backdrop-blur-sm z-50 md:z-auto
          transition-transform duration-300 ease-in-out
        `}>
          {/* Mobile Close Button */}
          <div className="md:hidden absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ChannelSidebar
            channels={channels}
            teamMembers={teamMembers}
            activeChannel={activeChannel}
            currentUser={currentUser}
            onChannelSelect={handleChannelSelect}
            onCreateChannel={() => setShowCreateChannel(true)}
            onStartDirectMessage={handleStartDirectMessage}
            onDeleteChannel={handleDeleteChannel}
            isMobile={isMobileSidebarOpen}
          />
        </div>

        {/* Main Chat Area - Mobile responsive */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* UNIFIED CHAT HEADER */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Channel List Toggle for Mobile */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden"
                >
                    <Menu className="w-5 h-5" />
                </Button>

                {activeChannel ? (
                  <>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {activeChannel.channel_type === "direct" ? (
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      ) : (
                        <Hash className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm sm:text-lg font-bold text-gray-900 truncate">
                        {activeChannel.channel_type === "direct" ? "Direct Message" : activeChannel.display_name}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {activeChannel.description || `Chat with ${activeChannel.display_name}`}
                      </p>
                    </div>
                  </>
                ) : (
                  <h2 className="text-lg font-bold text-gray-900">Team Chat</h2>
                )}
              </div>

              {activeChannel && (
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {activeChannel.members?.length || 0}
                  </Badge>
                  <Button variant="ghost" size="icon" className="w-8 h-8 sm:w-10 sm:h-10">
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          {activeChannel ? (
            <>
              {/* Messages - Mobile responsive */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  messages={messages}
                  currentUser={currentUser}
                />
              </div>

              {/* Message Input - Mobile fixed footer */}
              <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm">
                <MessageInput
                  onSendMessage={handleSendMessage}
                  currentUser={currentUser}
                  activeChannel={activeChannel}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Select a channel to start chatting
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  Choose a channel from the sidebar to begin your conversation
                </p>
                <Button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="md:hidden bg-purple-500 hover:bg-purple-600 text-white"
                >
                  Open Channels
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Channel Dialog */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        onCreateChannel={handleCreateChannel}
        teamMembers={teamMembers}
      />
    </div>
  );
}
