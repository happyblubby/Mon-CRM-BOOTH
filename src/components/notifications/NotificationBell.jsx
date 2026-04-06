
import React, { useState, useEffect } from "react";
import { Bell, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Notification } from "@/api/entities";
import { formatDistanceToNow } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [toastedIds, setToastedIds] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email) {
      fetchNotifications();

      const interval = setInterval(fetchNotifications, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.email) return;
    try {
      const fetchedNotifications = await Notification.filter(
        { user_email: user.email },
        "-created_date",
        20
      );
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.is_read).length);

      // Trigger toasts for new, unread notifications
      fetchedNotifications.forEach(n => {
        if (!n.is_read && !toastedIds.has(n.id)) {
          toast.info(n.title, {
            description: n.message,
            duration: 8000,
            onDismiss: () => {
                // Remove from toasted when dismissed so it can appear again if still unread
                setToastedIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(n.id);
                    return newSet;
                });
            },
            onClick: async () => {
              navigate(n.link);
              await handleMarkAsRead(n.id, false); // Mark as read without re-fetching
              setIsOpen(false);
            }
          });
          setToastedIds(prev => new Set(prev).add(n.id));
        }
      });

    } catch (error) {
      // Don't log rate limit errors which are expected with polling
      if (!error.message?.includes("429")) {
        console.error("Error fetching notifications:", error);
      }
    }
  };

  const handleMarkAsRead = async (notificationId, shouldRefetch = true) => {
    try {
      await Notification.update(notificationId, { is_read: true });
      if (shouldRefetch) {
        fetchNotifications();
      } else {
        // Manually update state if not re-fetching to provide instant UI feedback
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;
      
      // Since bulk update is not supported, we do it one by one.
      // For a real app, a backend endpoint would be better.
      await Promise.all(unreadIds.map(id => Notification.update(id, { is_read: true })));
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 mr-4 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b transition-colors ${
                  !n.is_read ? "bg-purple-50/50" : "bg-white"
                }`}
              >
                <Link to={n.link} onClick={() => {
                  handleMarkAsRead(n.id);
                  setIsOpen(false);
                }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-xs text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleMarkAsRead(n.id);
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">You're all caught up!</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
