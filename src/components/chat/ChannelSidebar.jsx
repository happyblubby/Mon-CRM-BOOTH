
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Hash, 
  Plus, 
  Search, 
  Users, 
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Trash2
} from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";

export default function ChannelSidebar({ 
  channels, 
  teamMembers, 
  activeChannel, 
  currentUser,
  onChannelSelect, 
  onCreateChannel,
  onStartDirectMessage,
  onDeleteChannel,
  isMobile = false
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showChannels, setShowChannels] = useState(true);
  const [showDirectMessages, setShowDirectMessages] = useState(true);

  const getOnlineStatus = (memberEmail) => {
    // Check if user was active in the last 2 minutes
    const member = teamMembers.find(m => m.email === memberEmail);
    if (!member?.last_seen) return false;
    
    const lastSeen = new Date(member.last_seen);
    const now = new Date();
    return (now - lastSeen) < 120000; // 2 minutes
  };

  const publicChannels = channels.filter(c => c.channel_type === "public");
  const directChannels = channels.filter(c => c.channel_type === "direct");

  const filteredChannels = publicChannels.filter(channel =>
    channel.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastMessageTime = (channel) => {
    if (!channel.last_message_at) return "";
    
    const date = parseISO(channel.last_message_at);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getDirectMessagePartner = (channel) => {
    // Extract partner name from direct message channel name
    const members = channel.members || [];
    const partnerEmail = members.find(email => email !== currentUser?.email);
    const partner = teamMembers.find(member => member.email === partnerEmail);
    return partner || { name: partnerEmail, email: partnerEmail };
  };

  const hasDirectMessageWith = (memberEmail) => {
    return directChannels.some(channel => 
      channel.members?.includes(currentUser?.email) && 
      channel.members?.includes(memberEmail)
    );
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50/50 ${isMobile ? 'pt-12' : ''}`}>
      {/* Header - Mobile optimized */}
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Team Chat</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-lg border-gray-200 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Channels Section - Mobile responsive */}
          <div className="mb-4 sm:mb-6">
            <div 
              className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              onClick={() => setShowChannels(!showChannels)}
            >
              <div className="flex items-center gap-2">
                {showChannels ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-gray-700 text-sm sm:text-base">Channels</span>
                <span className="text-xs text-gray-500">({filteredChannels.length})</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-6 h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateChannel();
                }}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {showChannels && (
              <div className="ml-2 space-y-1">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`group flex items-center justify-between gap-2 sm:gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      activeChannel?.id === channel.id 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => onChannelSelect(channel)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <Hash className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm sm:text-base">{channel.display_name}</p>
                        {channel.last_message_at && (
                          <p className="text-xs text-gray-500">
                            {getLastMessageTime(channel)}
                          </p>
                        )}
                      </div>
                      {channel.message_count > 0 && (
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {channel.message_count}
                        </Badge>
                      )}
                    </div>
                    {channel.channel_type === "public" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChannel(channel.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages Section - Mobile responsive */}
          <div>
            <div 
              className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              onClick={() => setShowDirectMessages(!showDirectMessages)}
            >
              <div className="flex items-center gap-2">
                {showDirectMessages ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium text-gray-700 text-sm sm:text-base">Direct Messages</span>
              </div>
            </div>

            {showDirectMessages && (
              <div className="ml-2 space-y-1">
                {/* Existing Direct Message Channels */}
                {directChannels.map((channel) => {
                  const partner = getDirectMessagePartner(channel);
                  const isOnline = getOnlineStatus(partner.email);
                  return (
                    <div
                      key={channel.id}
                      className={`group flex items-center justify-between gap-2 sm:gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        activeChannel?.id === channel.id 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      onClick={() => onChannelSelect(channel)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                            <AvatarImage src={partner.photo_url} />
                            <AvatarFallback className="text-xs">
                              {partner.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm sm:text-base">{partner.name}</p>
                          {channel.last_message_at && (
                            <p className="text-xs text-gray-500">
                              {getLastMessageTime(channel)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteChannel(channel.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}

                {/* Available Team Members for New DMs */}
                {teamMembers
                  .filter(member => 
                    member.email !== currentUser?.email && 
                    !hasDirectMessageWith(member.email)
                  )
                  .map((member) => {
                    const isOnline = getOnlineStatus(member.email);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 text-gray-700"
                        onClick={() => onStartDirectMessage && onStartDirectMessage(member)}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                            <AvatarImage src={member.photo_url} />
                            <AvatarFallback className="text-xs">
                              {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <span className="font-medium truncate text-sm sm:text-base">{member.name}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Current User - Mobile optimized */}
      <div className="p-3 sm:p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
          <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {currentUser?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
              {currentUser?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
