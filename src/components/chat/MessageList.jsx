
import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Reply, Smile } from "lucide-react";
import { format, parseISO, isToday, isYesterday, isSameDay } from "date-fns";
import { motion } from "framer-motion";

export default function MessageList({ messages, currentUser }) {
  const scrollAreaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatMessageTime = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d at HH:mm');
    }
  };

  const shouldShowDateDivider = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = parseISO(currentMessage.created_date);
    const previousDate = parseISO(previousMessage.created_date);
    
    return !isSameDay(currentDate, previousDate);
  };

  const formatDateDivider = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'EEEE, MMMM d');
    }
  };

  if (!messages.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smile className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm sm:text-base">No messages yet. Start the conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-2 sm:p-4" ref={scrollAreaRef}>
      <div className="space-y-3 sm:space-y-4">
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const showDateDivider = shouldShowDateDivider(message, previousMessage);
          const isOwnMessage = message.sender_email === currentUser?.email;
          const showAvatar = !previousMessage || previousMessage.sender_email !== message.sender_email;

          return (
            <div key={message.id}>
              {/* Date Divider */}
              {showDateDivider && (
                <div className="flex items-center my-4 sm:my-6">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <div className="px-3 sm:px-4">
                    <Badge variant="outline" className="bg-white text-gray-500 text-xs">
                      {formatDateDivider(message.created_date)}
                    </Badge>
                  </div>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>
              )}

              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group flex gap-2 sm:gap-3 hover:bg-gray-50/50 p-2 rounded-lg transition-colors ${
                  isOwnMessage ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {showAvatar ? (
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        {message.sender_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-6 h-6 sm:w-8 sm:h-8"></div>
                  )}
                </div>

                {/* Message Content */}
                <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                        {message.sender_name}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatMessageTime(message.created_date)}
                      </span>
                    </div>
                  )}

                  <div className={`${isOwnMessage ? 'flex justify-end' : ''}`}>
                    <div 
                      className={`inline-block max-w-[85%] sm:max-w-lg p-2 sm:p-3 rounded-lg break-words ${
                        isOwnMessage 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {/* File attachment */}
                      {message.file_url && (
                        <div className="mb-2">
                          <a 
                            href={message.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`text-xs sm:text-sm underline break-all ${
                              isOwnMessage ? 'text-purple-100' : 'text-purple-600'
                            }`}
                          >
                            View attachment
                          </a>
                        </div>
                      )}

                      {/* Message text */}
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.message}
                      </p>

                      {/* Event reference */}
                      {message.referenced_event_id && (
                        <div className={`mt-2 p-2 rounded border-l-4 text-xs ${
                          isOwnMessage 
                            ? 'bg-purple-400 border-purple-200' 
                            : 'bg-gray-50 border-purple-400'
                        }`}>
                          📅 Referenced Event
                        </div>
                      )}

                      {/* Edited indicator */}
                      {message.is_edited && (
                        <span className={`text-xs italic ${
                          isOwnMessage ? 'text-purple-200' : 'text-gray-500'
                        }`}>
                          (edited)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Actions - Hidden on mobile */}
                  <div className={`hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity mt-1 ${
                    isOwnMessage ? 'text-right' : ''
                  }`}>
                    <div className="inline-flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Smile className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Reply className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
