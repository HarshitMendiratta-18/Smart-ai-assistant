"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, LogIn, LogOut, Calendar } from 'lucide-react';

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await dbService.getVisitorLogs();
      setLogs(data);
    } catch (err) {
      console.error("Error loading gate logs:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RoleGuard allowedRoles={['security']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gate Log Archives</h1>
          <p className="text-muted-foreground">Historical records of all residential gate entries and exits</p>
        </div>

        <Card className="glass-card overflow-hidden">
          <CardHeader className="p-6 border-b border-border/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" /> Roster Audits
              </CardTitle>
              <CardDescription className="text-xs">Timeline logs of guest transits</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadLogs} className="cursor-pointer">
              Refresh Feed
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-xs text-muted-foreground text-center py-12">Loading gate records...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-12">No transit logs available for today.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-card/60 text-muted-foreground">
                      <th className="p-4 font-bold">Visitor Name</th>
                      <th className="p-4 font-bold">Unit Target</th>
                      <th className="p-4 font-bold">Timestamp</th>
                      <th className="p-4 font-bold">Gate Status</th>
                      <th className="p-4 font-bold">Verification Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                        <td className="p-4 font-bold text-foreground">{log.visitorName}</td>
                        <td className="p-4 font-semibold text-primary">{log.residentUnit}</td>
                        <td className="p-4 text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(log.gateEntryTime).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge variant={log.status === 'entered' ? 'success' : 'secondary'} className="uppercase">
                            {log.status === 'entered' ? (
                              <span className="flex items-center gap-1"><LogIn className="h-3 w-3" /> Checked In</span>
                            ) : (
                              <span className="flex items-center gap-1"><LogOut className="h-3 w-3" /> Checked Out</span>
                            )}
                          </Badge>
                        </td>
                        <td className="p-4 font-semibold text-foreground uppercase">{log.verificationMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
