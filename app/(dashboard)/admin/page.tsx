"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  Shield, 
  Clock, 
  Wrench,
  Megaphone,
  TrendingUp,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  
  // Mounted state to prevent SSR hydration discrepancies for charts
  const [mounted, setMounted] = useState(false);
  
  const [stats, setStats] = useState({
    residents: 0,
    complaintsActive: 0,
    bookingsToday: 0,
    techniciansActive: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    async function loadAdminData() {
      try {
        const [users, complaints, bookings] = await Promise.all([
          dbService.getAllUsersByRole('resident'),
          dbService.getComplaints(),
          dbService.getBookings()
        ]);

        const techs = await dbService.getAllUsersByRole('technician');

        // Compile counts
        setStats({
          residents: users.length,
          complaintsActive: complaints.filter((c: any) => c.status !== 'resolved').length,
          bookingsToday: bookings.filter((b: any) => b.status === 'booked').length,
          techniciansActive: techs.length
        });

        // Set recent complaints (top 4)
        setRecentComplaints(complaints.slice(0, 4));

        // Compile chart data (Complaints count by Category)
        const categories = ['plumbing', 'electrical', 'lift_issue', 'garbage', 'security'];
        const data = categories.map((cat) => {
          const count = complaints.filter((c: any) => c.category === cat).length;
          return {
            name: cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            value: count
          };
        });
        setChartData(data);
      } catch (err) {
        console.error("Error fetching admin statistics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  if (!mounted) return null;

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Console</h1>
            <p className="text-muted-foreground">Orchestrating community assets, announcements, and AI workflows</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/notices')} variant="glass" className="gap-2 cursor-pointer">
              <Megaphone className="h-4 w-4 text-primary" /> Publish Announcement
            </Button>
            <Button onClick={() => router.push('/admin/documents')} className="gap-2 cursor-pointer">
              <FileText className="h-4 w-4" /> Ingest Knowledge Document
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Residents</CardDescription>
              <Users className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold">{loading ? '...' : stats.residents}</p>
              <p className="text-[10px] text-muted-foreground">Registered units</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Complaints</CardDescription>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-red-500">{loading ? '...' : stats.complaintsActive}</p>
              <p className="text-[10px] text-muted-foreground">Active unresolved cases</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Bookings</CardDescription>
              <Calendar className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-cyan-500">{loading ? '...' : stats.bookingsToday}</p>
              <p className="text-[10px] text-muted-foreground">Total facility slots today</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-center">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Technicians</CardDescription>
              <Wrench className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-emerald-500">{loading ? '...' : stats.techniciansActive}</p>
              <p className="text-[10px] text-muted-foreground">Active service staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Complaint Breakdown by Category
            </h2>
            <Card className="glass-card p-6 h-[300px]">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(10, 10, 10, 0.8)', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        borderRadius: '8px', 
                        color: '#fff' 
                      }} 
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Quick Stats Summary List (1/3 width) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">🛠️ System Health Logs</h2>
            <Card className="glass-card p-4 space-y-4">
              <div className="flex gap-3 text-xs items-start">
                <Badge variant="success">Online</Badge>
                <div>
                  <p className="font-semibold text-foreground">Gemini Model RAG pipeline</p>
                  <p className="text-muted-foreground mt-0.5">Indexing: text-embedding-004</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs items-start">
                <Badge variant="success">Online</Badge>
                <div>
                  <p className="font-semibold text-foreground">Firebase Firestore DB</p>
                  <p className="text-muted-foreground mt-0.5">Listening: active query hooks</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs items-start">
                <Badge variant="warning">Standby</Badge>
                <div>
                  <p className="font-semibold text-foreground">FCM Messaging Gateway</p>
                  <p className="text-muted-foreground mt-0.5">Web Push token hooks initialized</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">🚨 Urgent Active Complaints</h2>
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-card/60">
                    <th className="p-4 font-bold">Resident</th>
                    <th className="p-4 font-bold">Description</th>
                    <th className="p-4 font-bold">Category</th>
                    <th className="p-4 font-bold">Priority</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading complaints...</td>
                    </tr>
                  ) : recentComplaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No complaints filed yet.</td>
                    </tr>
                  ) : (
                    recentComplaints.map((comp) => (
                      <tr key={comp.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-foreground">{comp.residentName}</p>
                          <p className="text-[10px] text-muted-foreground">{comp.unitNumber}</p>
                        </td>
                        <td className="p-4 max-w-xs truncate">{comp.description}</td>
                        <td className="p-4 capitalize">{comp.category.replace('_', ' ')}</td>
                        <td className="p-4">
                          <Badge 
                            variant={
                              comp.priority === 'critical' || comp.priority === 'high' 
                                ? 'destructive' 
                                : comp.priority === 'medium' 
                                ? 'warning' 
                                : 'secondary'
                            }
                          >
                            {comp.priority}
                          </Badge>
                        </td>
                        <td className="p-4 capitalize">
                          <Badge variant="outline" className="border-primary/20 text-primary">
                            {comp.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => router.push('/admin/complaints')}
                            className="cursor-pointer"
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
