import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Plus, Calendar, BarChart3, Camera, Users, MessageCircle, BookOpen, Menu, X, Map } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import NotificationBell from '@/components/notifications/NotificationBell';
import { User } from '@/api/entities';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User as UserIcon, Shield } from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Add Event",
    url: createPageUrl("AddEvent"),
    icon: Plus,
  },
  {
    title: "All Events",
    url: createPageUrl("Events"),
    icon: Calendar,
  },
  {
    title: "Events Map",
    url: createPageUrl("EventsMap"),
    icon: Map,
  },
  {
    title: "Team Members",
    url: createPageUrl("TeamMembers"),
    icon: Users,
  },
  {
    title: "Team Chat",
    url: createPageUrl("Chat"),
    icon: MessageCircle,
  },
  {
    title: "CRM",
    url: createPageUrl("CRM"),
    icon: BarChart3,
  },
  {
    title: "Compare Events",
    url: createPageUrl("Compare"),
    icon: BarChart3,
  },
  {
    title: "Information Guide",
    url: createPageUrl("InformationGuide"),
    icon: BookOpen,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (e) {
        console.error("Failed to fetch current user:", e);
      }
    };
    fetchUser();
  }, []);

  // Handle scroll effect for floating behavior
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      // The logout will automatically redirect to login page
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSwitchAccount = async () => {
    try {
      // This will redirect to login page allowing user to login with different account
      await User.loginWithRedirect(window.location.origin);
    } catch (error) {
      console.error('Error switching account:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
          --accent-gradient: linear-gradient(135deg, #10b981 0%, #059669 100%);
          --surface-glass: rgba(15, 23, 42, 0.95);
          --surface-glass-light: rgba(30, 41, 59, 0.90);
          --text-primary: #f8fafc;
          --text-secondary: #cbd5e1;
          --border-elegant: #334155;
        }
        
        .glass-effect {
          background: var(--surface-glass);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .glass-effect-light {
          background: var(--surface-glass-light);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(148, 163, 184, 0.15);
        }
        
        .gradient-primary {
          background: var(--primary-gradient);
        }
        
        .gradient-accent {
          background: var(--accent-gradient);
        }

        .floating-sidebar {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .floating-sidebar.scrolled {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .floating-sidebar {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            width: 85vw;
            max-width: 320px;
            z-index: 50;
            transform: translateX(-100%);
          }
          
          .floating-sidebar.mobile-open {
            transform: translateX(0);
          }
        }

        @media (max-width: 480px) {
          .floating-sidebar {
            width: 90vw;
            max-width: 280px;
          }
        }

        .sidebar-overlay {
          transition: opacity 0.3s ease-in-out;
        }

        /* Dark mode scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1e293b;
        }

        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .mobile-stack {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .mobile-full-width {
            width: 100%;
          }
          
          .mobile-text-center {
            text-align: center;
          }
        }
      `}</style>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className={`glass-effect border-slate-600 text-slate-200 hover:bg-slate-700/50 transition-all duration-300 w-12 h-12 ${
            isScrolled ? 'shadow-lg shadow-black/20' : ''
          }`}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Floating Sidebar */}
      <div className={`
        floating-sidebar glass-effect border-r border-slate-600 z-40
        fixed top-0 left-0 h-full w-80 
        ${isScrolled ? 'scrolled' : ''}
        ${isMobileMenuOpen ? 'mobile-open' : ''}
        md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="border-b border-slate-600 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-100 text-base md:text-lg">PhotoEvent</h2>
                <p className="text-xs md:text-sm text-slate-400 font-medium">Pro Event Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4">
            <div className="space-y-1 md:space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 md:mb-4 px-2">
                Navigation
              </div>
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group relative overflow-hidden rounded-xl mb-1 md:mb-2 transition-all duration-300 flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 md:py-3 font-medium text-sm md:text-base min-h-[48px] ${
                    location.pathname === item.url
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25'
                      : 'hover:bg-slate-700/50 hover:shadow-md text-slate-300 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                  {location.pathname === item.url && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${
        isMobileMenuOpen ? 'md:ml-80' : 'md:ml-80'
      }`}>
        {/* Top Header */}
        <header className={`
          sticky top-0 z-30 glass-effect border-b border-slate-600 px-3 md:px-6 py-3 
          flex items-center justify-between transition-all duration-300 min-h-[60px]
          ${isScrolled ? 'shadow-lg shadow-black/10' : ''}
        `}>
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="md:hidden w-12" />
            <h1 className="text-base md:text-lg font-semibold text-slate-100 truncate">
              {currentPageName}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <NotificationBell user={user} />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-slate-700/50 px-2 py-1 h-auto">
                    <Avatar className="h-8 w-8 border border-slate-600">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs bg-slate-700 text-slate-200">
                        {user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-slate-200 truncate max-w-32">{user.full_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3" />
                            Admin
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-3 h-3" />
                            User
                          </>
                        )}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span className="text-xs text-blue-600 font-medium">Administrator</span>
                          </>
                        ) : (
                          <>
                            <UserIcon className="w-3 h-3 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">User</span>
                          </>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSwitchAccount}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Switch Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="relative">
          {children}
        </main>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChatWidget />

      <Toaster position="top-right" richColors theme="dark" />
    </div>
  );
}