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
import { 
  Wrench, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ClipboardList, 
  Calendar,
  Notebook
} from 'lucide-react';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  // Status dialog state
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<'assigned' | 'in_progress' | 'resolved'>('assigned');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTasks();
  }, [user]);

  async function loadTasks() {
    try {
      setLoading(true);
      const complaints = await dbService.getComplaints({ technicianId: user?.uid });
      setTasks(complaints);

      // Compute statistics
      const assigned = complaints.filter((t: any) => t.status === 'assigned').length;
      const inProgress = complaints.filter((t: any) => t.status === 'in_progress').length;
      const completed = complaints.filter((t: any) => t.status === 'resolved').length;
      setStats({ assigned, inProgress, completed });
    } catch (err) {
      console.error("Error loading technician tasks:", err);
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
      // Update complaint status
      await dbService.updateComplaint(selectedTask.id, {
        status: newStatus,
        technicianNotes: statusNote || undefined
      });

      toast({
        title: 'Status Updated',
        description: `Task status set to "${newStatus.replace('_', ' ')}"`,
        type: 'success',
      });

      setIsUpdateOpen(false);
      loadTasks(); // refresh task list
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
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Handyman Portal</h1>
          <p className="text-muted-foreground">
            Specialty: <span className="font-semibold text-foreground capitalize">{user.specialty || 'General'}</span> | CommuniSync Dispatch
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Assigned</CardDescription>
              <ClipboardList className="h-4 w-4 text-violet-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-violet-500">{stats.assigned}</p>
              <p className="text-[10px] text-muted-foreground">Jobs waiting response</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">In Progress</CardDescription>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-amber-500">{stats.inProgress}</p>
              <p className="text-[10px] text-muted-foreground">Jobs actively working</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Resolved</CardDescription>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-extrabold text-emerald-500">{stats.completed}</p>
              <p className="text-[10px] text-muted-foreground">Total resolved tickets</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Task List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            My Active Work Orders
          </h2>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/20">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
              <p className="font-semibold">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending complaints assigned to you.</p>
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
                      <Badge 
                        variant={
                          task.status === 'resolved' 
                            ? 'success' 
                            : task.status === 'in_progress' 
                            ? 'warning' 
                            : 'secondary'
                        }
                      >
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
                    
                    {task.technicianNotes && (
                      <div className="p-2.5 rounded-md bg-muted/20 border border-border text-[11px] text-muted-foreground flex gap-1.5 items-start mb-4">
                        <Notebook className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">Latest Log: </span>
                          {task.technicianNotes}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <span className="text-[10px] text-muted-foreground font-semibold">Priority: {task.priority.toUpperCase()}</span>
                      <Button 
                        size="sm" 
                        variant={task.status === 'resolved' ? 'outline' : 'default'} 
                        onClick={() => handleUpdateClick(task)}
                        className="cursor-pointer"
                      >
                        Update Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Status Update Modal */}
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
                  required={newStatus === 'resolved'} // require comments on resolution
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
