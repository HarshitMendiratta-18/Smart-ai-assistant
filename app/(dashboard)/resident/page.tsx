"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  AlertTriangle, 
  QrCode, 
  Calendar, 
  Megaphone, 
  Clock, 
  Wrench,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [complaintsCount, setComplaintsCount] = useState({ active: 0, resolved: 0 });
  const [visitorsCount, setVisitorsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const [anns, comps, vis, books] = await Promise.all([
          dbService.getAnnouncements(),
          dbService.getComplaints({ residentId: user.uid }),
          dbService.getVisitors(user.uid),
          dbService.getBookings()
        ]);

        setAnnouncements(anns.slice(0, 3)); // show top 3 announcements
        
        const activeComps = comps.filter((c: any) => c.status !== 'resolved').length;
        const resolvedComps = comps.filter((c: any) => c.status === 'resolved').length;
        setComplaintsCount({ active: activeComps, resolved: resolvedComps });
        
        const activeVis = vis.filter((v: any) => v.status === 'pending').length;
        setVisitorsCount(activeVis);

        const myBooks = books.filter((b: any) => b.residentId === user.uid && b.status === 'booked').length;
        setBookingsCount(myBooks);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['resident']}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user.name}</h1>
          <p className="text-muted-foreground">
            Unit: <span className="font-semibold text-foreground">{user.unitNumber || 'Not Assigned'}</span> | Registered Resident Portal
          </p>
        </div>

        {/* Action Shortcuts Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={() => router.push('/resident/chat')} 
            variant="glass" 
            className="flex-col items-center justify-center p-6 h-28 gap-2 hover:border-primary/30 transition-all cursor-pointer"
          >
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-bold text-xs">AI Chat Assistant</span>
          </Button>

          <Button 
            onClick={() => router.push('/resident/complaints')} 
            variant="glass" 
            className="flex-col items-center justify-center p-6 h-28 gap-2 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <span className="font-bold text-xs">Report Complaint</span>
          </Button>

          <Button 
            onClick={() => router.push('/resident/visitors')} 
            variant="glass" 
            className="flex-col items-center justify-center p-6 h-28 gap-2 hover:border-emerald-500/30 transition-all cursor-pointer"
          >
            <QrCode className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-xs">Visitor Pass</span>
          </Button>

          <Button 
            onClick={() => router.push('/resident/bookings')} 
            variant="glass" 
            className="flex-col items-center justify-center p-6 h-28 gap-2 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <Calendar className="h-6 w-6 text-cyan-500" />
            <span className="font-bold text-xs">Book Amenity</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Complaints</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex justify-between items-center">
              <div>
                <p className="text-3xl font-extrabold text-red-500">{complaintsCount.active}</p>
                <p className="text-xs text-muted-foreground">Active issues reported</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-500">{complaintsCount.resolved}</p>
                <p className="text-xs text-muted-foreground">Issues resolved</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Visitor Passes</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-emerald-500">{visitorsCount}</p>
              <p className="text-xs text-muted-foreground">Pending active visitors codes</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Amenity Bookings</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-cyan-500">{bookingsCount}</p>
              <p className="text-xs text-muted-foreground">Active upcoming reservations</p>
            </CardContent>
          </Card>
        </div>

        {/* Notice Board and Information Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* NOTICE BOARD (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Community Notice Board</h2>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <Card className="border border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-card/20">
                <p className="text-sm text-muted-foreground">No recent announcements published.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <Card key={ann.id} className="glass-card overflow-hidden hover:border-primary/10 transition-colors">
                    <CardHeader className="p-5 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold line-clamp-1">{ann.title}</CardTitle>
                        <Badge 
                          variant={
                            ann.category === 'emergency' 
                              ? 'destructive' 
                              : ann.category === 'maintenance' 
                              ? 'warning' 
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {ann.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-[10px] flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ann.createdAt).toLocaleDateString()} | By {ann.authorName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {ann.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Quick Help Contacts (1/3 width) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              🚨 Emergency Support
            </h2>
            <Card className="glass-card">
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <p className="font-bold">Security Gatehouse</p>
                    <p className="text-[10px] text-muted-foreground">24/7 Guard Office</p>
                  </div>
                  <a href="tel:+919876543200" className="text-primary font-semibold hover:underline">Ext 100</a>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <p className="font-bold">Maintenance Helpdesk</p>
                    <p className="text-[10px] text-muted-foreground">Society Handyman Control</p>
                  </div>
                  <a href="tel:+919876543201" className="text-primary font-semibold hover:underline">Ext 101</a>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <p className="font-bold">Society Management Office</p>
                    <p className="text-[10px] text-muted-foreground">Admin/Billing Office</p>
                  </div>
                  <a href="tel:+919876543202" className="text-primary font-semibold hover:underline">Ext 102</a>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">Fire & Ambulance</p>
                    <p className="text-[10px] text-muted-foreground">National Services</p>
                  </div>
                  <a href="tel:112" className="text-destructive font-semibold hover:underline">Call 112</a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
