"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Wrench, CheckCircle, Clock, Calendar } from 'lucide-react';

export default function TechnicianTasksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status dialog state
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'assigned' | 'in_progress' | 'resolved'>('assigned');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  async function loadTasks() {
    try {
      setLoading(true);
      const complaints = await dbService.getComplaints({ technicianId: user?.uid });
      // filter out resolved ones, only active tasks
      setTasks(complaints.filter(c => c.status !== 'resolved'));
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateClick = (task: any) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setStatusNote('');
    setIsUpdateOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setUpdating(true);
    try {
      await dbService.updateComplaint(selectedTask.id, {
        status: newStatus,
        technicianNotes: statusNote || undefined
      });

      toast({
        title: 'Work log saved',
        description: 'Status successfully updated.',
        type: 'success',
      });

      setIsUpdateOpen(false);
      loadTasks();
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['technician']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Active Dispatches</h1>
          <p className="text-muted-foreground">Manage your assigned repair work orders</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25">
            <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="font-semibold text-sm">All caught up!</p>
            <p className="text-xs text-muted-foreground">No active work orders assigned to you.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <Card key={task.id} className="glass-card flex flex-col justify-between hover:border-primary/10 transition-colors">
                <CardHeader className="p-5 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                        {task.category.replace('_', ' ')}
                      </Badge>
                      <CardTitle className="text-base font-bold mt-1">Unit {task.unitNumber}</CardTitle>
                    </div>
                    <Badge variant={task.status === 'in_progress' ? 'warning' : 'secondary'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="text-[10px] flex items-center gap-1.5 mt-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Reported: {new Date(task.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="text-xs leading-relaxed text-muted-foreground mb-4">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <span className="text-[10px] text-muted-foreground font-semibold">Priority: {task.priority.toUpperCase()}</span>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateClick(task)}
                      className="cursor-pointer"
                    >
                      Update Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Dialog */}
        <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Work Order</DialogTitle>
              <DialogDescription>Modify status and add maintenance log comments.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Select Status</label>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  disabled={updating}
                >
                  <option value="assigned">Assigned / Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Mark Resolved</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Work Log Notes</label>
                <Input
                  placeholder="Describe parts replaced, actions taken, or instructions..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  disabled={updating}
                  required={newStatus === 'resolved'}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUpdateOpen(false)}
                  disabled={updating}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" loading={updating} className="cursor-pointer">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
