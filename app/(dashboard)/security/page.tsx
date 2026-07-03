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
  ShieldAlert, 
  UserCheck, 
  QrCode, 
  Clock, 
  FileText, 
  LogOut,
  LogIn
} from 'lucide-react';

export default function SecurityDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const visitorLogs = await dbService.getVisitorLogs();
      setLogs(visitorLogs.slice(0, 5)); // show recent 5 logs

      // Calculate visitors currently inside the society (status = 'entered')
      const insideCount = visitorLogs.filter((l: any) => l.status === 'entered').length;
      setActiveCount(insideCount);
    } catch (err) {
      console.error("Error loading security logs:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['security']}>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Gate Sentry Console</h1>
            <p className="text-muted-foreground">
              Post: <span className="font-semibold text-foreground">{user.gateNumber || 'Gate 1'}</span> | Shift: <span className="font-semibold text-foreground capitalize">{user.shift || 'Day'}</span>
            </p>
          </div>
          <Button 
            onClick={() => router.push('/security/verify')} 
            className="gap-2 cursor-pointer shadow-lg shadow-primary/10"
          >
            <QrCode className="h-5 w-5" /> Verify Visitor Pass
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Active Visitors</CardDescription>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-emerald-500">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Guests currently logged inside the complex</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Gate Checkouts</CardDescription>
              <LogOut className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-primary">
                {logs.filter(l => l.status === 'exited').length}
              </p>
              <p className="text-xs text-muted-foreground">Recent visitor departures processed</p>
            </CardContent>
          </Card>
        </div>

        {/* Log Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary animate-pulse" />
              Real-time Gate logs
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/security/logs')}
              className="cursor-pointer text-xs"
            >
              Full History
            </Button>
          </div>

          <Card className="glass-card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading gate activity stream...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No visitor records found for today.</div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center p-4 hover:bg-muted/5 transition-colors text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        log.status === 'entered' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {log.status === 'entered' ? <LogIn className="h-4 w-4" /> : <LogOut className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{log.visitorName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Dest: <span className="font-semibold text-foreground">{log.residentUnit}</span> | Method: {log.verificationMethod.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={log.status === 'entered' ? 'success' : 'secondary'}>
                        {log.status.toUpperCase()}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.gateEntryTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
