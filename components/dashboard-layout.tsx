"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/components/theme-provider';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  MessageSquare, 
  AlertTriangle, 
  QrCode, 
  Calendar, 
  Megaphone, 
  Users, 
  FileText, 
  BarChart3, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  CheckSquare, 
  History, 
  ShieldAlert, 
  ClipboardList 
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  // Define sidebar navigation items based on user role
  const sidebarItems: Record<string, SidebarItem[]> = {
    admin: [
      { name: 'Overview', href: '/admin', icon: LayoutDashboard },
      { name: 'Manage Complaints', href: '/admin/complaints', icon: AlertTriangle },
      { name: 'Announcements', href: '/admin/notices', icon: Megaphone },
      { name: 'Society Members', href: '/admin/members', icon: Users },
      { name: 'Knowledge Docs', href: '/admin/documents', icon: FileText },
      { name: 'Analytics Reports', href: '/admin/reports', icon: BarChart3 },
    ],
    resident: [
      { name: 'Overview', href: '/resident', icon: LayoutDashboard },
      { name: 'AI Community Chat', href: '/resident/chat', icon: MessageSquare },
      { name: 'My Complaints', href: '/resident/complaints', icon: AlertTriangle },
      { name: 'Visitor Passes', href: '/resident/visitors', icon: QrCode },
      { name: 'Book Amenities', href: '/resident/bookings', icon: Calendar },
    ],
    technician: [
      { name: 'Assigned Work', href: '/technician', icon: LayoutDashboard },
      { name: 'Manage Tasks', href: '/technician/tasks', icon: CheckSquare },
      { name: 'Work History', href: '/technician/history', icon: History },
    ],
    security: [
      { name: 'Gate Control', href: '/security', icon: LayoutDashboard },
      { name: 'Verify Pass', href: '/security/verify', icon: ShieldAlert },
      { name: 'Visitor Logs', href: '/security/logs', icon: ClipboardList },
    ],
  };

  const navItems = sidebarItems[user.role] || [];

  const handleNavClick = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  const roleLabelMap: Record<string, string> = {
    admin: 'Administrator',
    resident: 'Resident',
    technician: `Technician (${user.specialty || 'General'})`,
    security: `Security Guard (${user.gateNumber || 'Gate 1'})`
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* MOBILE SIDEBAR DIALOG */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative flex w-full max-w-xs flex-col bg-card p-6 shadow-xl border-r border-border"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
                  CommuniSync AI
                </span>
                <Button size="icon" variant="ghost" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavClick(item.href)}
                      className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15' 
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4 mt-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabelMap[user.role]}</p>
                  </div>
                </div>
                <Button onClick={logout} variant="destructive" className="w-full justify-start gap-3">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-2xl font-black bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">
            CommuniSync AI
          </span>
        </div>

        <div className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavClick(item.href)}
                className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/15' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{roleLabelMap[user.role]}</p>
            </div>
          </div>
          <Button onClick={logout} variant="destructive" className="w-full justify-start gap-3">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT WINDOW */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* HEADER BAR */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/60 backdrop-blur-md px-6 z-10">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <Badge variant="secondary" className="hidden sm:inline-flex capitalize">
              {user.role} Dashboard
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <Button size="icon" variant="ghost" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-indigo-700" />}
            </Button>
            
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-foreground">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </header>

        {/* PAGE SCREEN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-background/50 p-6">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
