import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Users, Send, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChatMessage, ChatChannel, User } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [generalChannel, setGeneralChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const messagesEndRef = useRef(null);
  const pollInterval = useRef(null);

  useEffect(() => {
    loadInitialData();
    
    // Much less aggressive online status updates - every 5 minutes
    const updateOnlineStatus = async () => {
      if (Date.now() - lastFetchTime < 30000) return; // Prevent too frequent updates
      
      try {
        const user = await User.me();
        if (user) {
          await User.updateMyUserData({
            is_online: true,
            last_seen: new Date().toISOString()
          });
          setLastFetchTime(Date.now());
        }
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    updateOnlineStatus();
    const statusInterval = setInterval(updateOnlineStatus, 300000); // Every 5 minutes

    return () => {
      clearInterval(statusInterval);
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
      // Set user offline when component unmounts
      User.me().then(user => {
        if (user) User.updateMyUserData({ is_online: false });
      }).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (isOpen && generalChannel) {
      // Only start polling when chat is open
      startPolling();
    } else {
      // Stop polling when chat is closed
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isOpen, generalChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startPolling = () => {
    if (pollInterval.current) return; // Already polling
    
    // Poll every 15 seconds when chat is open (much less aggressive)
    pollInterval.current = setInterval(() => {
      loadMessages(true); // true indicates this is a background fetch
    }, 15000);
  };

  const loadInitialData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const [user, channels] = await Promise.all([
        User.me(),
        ChatChannel.list()
      ]);
      
      setCurrentUser(user);
      
      // Find or create general channel
      let general = channels.find(c => c.name === 'general');
      if (!general) {
        general = await ChatChannel.create({
          name: 'general',
          display_name: 'General',
          description: 'General team discussions',
          channel_type: 'public',
          members: [user.email],
          created_by_email: user.email
        });
      }
      
      setGeneralChannel(general);
      await loadMessages();
      await loadOnlineUsers();
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (isBackgroundFetch = false) => {
    if (!generalChannel?.id) return;
    if (!isBackgroundFetch && isLoading) return; // Prevent concurrent loading
    
    try {
      const messagesData = await ChatMessage.filter(
        { channel_id: generalChannel.id },
        '-created_date',
        20
      );
      
      const sortedMessages = messagesData.reverse();
      
      // Check if there are new messages
      if (sortedMessages.length > lastMessageCount) {
        const newMessageCount = sortedMessages.length - lastMessageCount;
        if (!isOpen && newMessageCount > 0) {
          setUnreadCount(prev => prev + newMessageCount);
        }
        setLastMessageCount(sortedMessages.length);
      }
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      // On rate limit error, increase polling interval
      if (error.response?.status === 429 && pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = setInterval(() => {
          loadMessages(true);
        }, 30000); // Slow down to every 30 seconds
      }
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const users = await User.list();
      const online = users.filter(user => {
        if (!user.last_seen) return false;
        const lastSeen = new Date(user.last_seen);
        const now = new Date();
        return (now - lastSeen) < 600000; // Online if active within 10 minutes (more forgiving)
      });
      setOnlineUsers(online);
    } catch (error) {
      console.error('Error loading online users:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !generalChannel) return;
    
    try {
      const messageData = {
        sender_name: currentUser.full_name,
        sender_email: currentUser.email,
        channel_id: generalChannel.id,
        channel_name: generalChannel.name,
        channel_type: generalChannel.channel_type,
        message: newMessage.trim(),
        message_type: 'text'
      };

      await ChatMessage.create(messageData);
      setNewMessage('');
      
      // Immediately load messages after sending (but with rate limit protection)
      setTimeout(() => {
        loadMessages();
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Don't render on mobile
  const isMobile = window.innerWidth < 768;
  if (isMobile) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => {
                setIsOpen(true);
                setUnreadCount(0);
                // Load fresh messages when opening
                setTimeout(() => {
                  loadMessages();
                  loadOnlineUsers();
                }, 500);
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 relative"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className={`w-80 ${isMinimized ? 'h-14' : 'h-96'} bg-slate-800/95 backdrop-blur-sm border-slate-700 shadow-2xl transition-all duration-300`}>
              <CardHeader className="p-3 border-b border-slate-700 bg-slate-800/50">
                <CardTitle className="text-slate-100 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    General Chat
                    {onlineUsers.length > 0 && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400 text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {onlineUsers.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="w-6 h-6 p-0 hover:bg-slate-700"
                    >
                      <Minus className="w-3 h-3 text-slate-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="w-6 h-6 p-0 hover:bg-slate-700"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-80">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-8">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div key={message.id} className="flex items-start gap-2">
                            <Avatar className="w-6 h-6 border border-slate-600">
                              <AvatarFallback className="text-xs bg-slate-700 text-slate-300">
                                {message.sender_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-slate-300 truncate">
                                  {message.sender_name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {format(parseISO(message.created_date), 'HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-slate-200 break-words">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-3 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 text-sm"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}