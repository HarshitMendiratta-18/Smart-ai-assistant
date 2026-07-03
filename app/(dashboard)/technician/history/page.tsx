"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, FileText } from 'lucide-react';

export default function TechnicianHistoryPage() {
  const { user } = useAuth();
  
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  async function loadHistory() {
    try {
      setLoading(true);
      const complaints = await dbService.getComplaints({ technicianId: user?.uid });
      // filter only resolved tasks
      setHistory(complaints.filter(c => c.status === 'resolved'));
    } catch (err) {
      console.error("Error loading task history:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['technician']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Resolution History</h1>
          <p className="text-muted-foreground">Historical ledger of your completed and signed off work orders</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-20 rounded-lg bg-card animate-pulse" />
          </div>
        ) : history.length === 0 ? (
          <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25">
            <FileText className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="font-semibold text-sm">No resolved tasks</p>
            <p className="text-xs text-muted-foreground mt-1">You haven't resolved any work orders yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((task) => (
              <Card key={task.id} className="glass-card">
                <CardHeader className="p-5 pb-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                      {task.category.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> RESOLVED
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold mt-2">Unit {task.unitNumber} — Host: {task.residentName}</CardTitle>
                  <CardDescription className="text-[10px] flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" /> Date Closed: {new Date(task.updatedAt || task.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0 text-xs space-y-3">
                  <p className="text-muted-foreground"><span className="font-semibold text-foreground">Issue: </span>{task.description}</p>
                  {task.technicianNotes && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span className="font-bold">Work log note: </span>
                      {task.technicianNotes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
