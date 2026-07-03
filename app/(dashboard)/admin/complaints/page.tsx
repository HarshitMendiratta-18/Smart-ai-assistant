"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Clock, 
  Wrench, 
  CheckCircle,
  HelpCircle,
  FileText,
  User,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '@/types/user';

export default function AdminComplaintsPage() {
  const { toast } = useToast();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [allComplaints, allTechs] = await Promise.all([
        dbService.getComplaints(),
        dbService.getAllUsersByRole('technician')
      ]);
      setComplaints(allComplaints);
      setTechnicians(allTechs);
    } catch (err) {
      console.error("Error loading admin complaints data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleAssignTech = async (complaintId: string, techId: string) => {
    if (!techId) return;
    
    const selectedTech = technicians.find((t) => t.uid === techId);
    if (!selectedTech) return;

    setAssigningId(complaintId);
    try {
      await dbService.updateComplaint(complaintId, {
        status: 'assigned',
        technicianId: selectedTech.uid,
        technicianName: selectedTech.name
      });

      toast({
        title: 'Technician Assigned',
        description: `Dispatched ${selectedTech.name} to this ticket successfully.`,
        type: 'success',
      });

      loadData(); // reload
    } catch (err: any) {
      toast({
        title: 'Assignment failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dispatch Control</h1>
          <p className="text-muted-foreground">Manage active complaints and assign specialized technicians</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25">
            <CheckCircle className="h-10 w-10 text-emerald-500 mb-2" />
            <p className="font-semibold text-sm">Clean Slate!</p>
            <p className="text-xs text-muted-foreground mt-1">No community complaints filed yet.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {complaints.map((comp) => (
              <Card key={comp.id} className="glass-card">
                <CardHeader className="p-6 pb-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                        {comp.category.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Ticket #{comp.id.substring(5, 10)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge 
                        variant={
                          comp.priority === 'critical' || comp.priority === 'high' 
                            ? 'destructive' 
                            : comp.priority === 'medium' 
                            ? 'warning' 
                            : 'secondary'
                        }
                        className="text-[10px] uppercase"
                      >
                        Priority: {comp.priority}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {comp.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-base font-bold mt-2">
                    Unit {comp.unitNumber} — {comp.residentName}
                  </CardTitle>
                  <CardDescription className="text-[10px] flex items-center gap-1.5 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    Filed: {new Date(comp.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4 text-xs">
                  <p className="text-muted-foreground leading-relaxed">{comp.description}</p>
                  
                  {comp.location && (
                    <p className="text-[10px] text-muted-foreground">
                      📍 Location Details: <span className="text-foreground font-semibold">{comp.location}</span>
                    </p>
                  )}

                  {/* AI Metadata tag preview */}
                  <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>AI Predicted Department: <span className="font-semibold text-foreground capitalize">{comp.department}</span></span>
                    </div>
                    <span>Resolution ETA: <span className="font-bold text-foreground">{comp.eta}</span></span>
                  </div>

                  <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* ASSIGNMENT CONTROL */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="w-48">
                        <Select
                          disabled={assigningId === comp.id || comp.status === 'resolved'}
                          value={comp.technicianId || ''}
                          onChange={(e) => handleAssignTech(comp.id, e.target.value)}
                        >
                          <option value="" disabled>Assign Technician...</option>
                          {technicians
                            .filter((t) => t.specialty === comp.department || t.role === 'technician')
                            .map((tech) => (
                              <option key={tech.uid} value={tech.uid}>
                                {tech.name} ({tech.specialty})
                              </option>
                            ))}
                        </Select>
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground w-full sm:text-right">
                      {comp.status === 'resolved' ? (
                        <span className="text-emerald-500 font-bold flex items-center sm:justify-end gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Ticket Resolved
                        </span>
                      ) : comp.technicianName ? (
                        <span className="text-amber-500 font-bold flex items-center sm:justify-end gap-1">
                          <Wrench className="h-3.5 w-3.5 animate-pulse" /> Dispatched to {comp.technicianName}
                        </span>
                      ) : (
                        <span className="text-red-500 font-bold flex items-center sm:justify-end gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" /> Unassigned
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
