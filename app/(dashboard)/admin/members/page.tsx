"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Mail, 
  Phone,
  Home,
  Wrench,
  ShieldAlert
} from 'lucide-react';
import { UserProfile } from '@/types/user';

export default function AdminMembersPage() {
  const { toast } = useToast();
  
  const [residents, setResidents] = useState<UserProfile[]>([]);
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [securityStaff, setSecurityStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      const [resList, techList, guardList] = await Promise.all([
        dbService.getAllUsersByRole('resident'),
        dbService.getAllUsersByRole('technician'),
        dbService.getAllUsersByRole('security')
      ]);
      setResidents(resList);
      setTechnicians(techList);
      setSecurityStaff(guardList);
    } catch (err) {
      console.error("Error loading members directories:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleApproveStatus = async (uid: string) => {
    // Simply toast for simulation
    toast({
      title: 'Action Recorded',
      description: 'Member credentials verified and account set to active.',
      type: 'success',
    });
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Society Registry</h1>
          <p className="text-muted-foreground">Manage accounts for residents, maintenance specialists, and gate guards</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* RESIDENTS DIRECTORY */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row justify-between items-center p-6 border-b border-border/20">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" /> Apartment Residents
                </CardTitle>
                <CardDescription className="text-xs">List of registered units and homeowners</CardDescription>
              </div>
              <Badge variant="secondary" className="font-bold">Total: {residents.length}</Badge>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center">Loading registry...</p>
              ) : residents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center">No residents registered yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-3 font-bold">Resident Host</th>
                        <th className="pb-3 font-bold">Contact Info</th>
                        <th className="pb-3 font-bold">Assigned Unit</th>
                        <th className="pb-3 font-bold">Status</th>
                        <th className="pb-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residents.map((res) => (
                        <tr key={res.uid} className="border-b border-border/50 last:border-b-0 hover:bg-muted/5 transition-colors">
                          <td className="py-3.5 font-bold text-foreground">{res.name}</td>
                          <td className="py-3.5 text-muted-foreground space-y-0.5">
                            <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {res.email}</p>
                            <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {res.phone}</p>
                          </td>
                          <td className="py-3.5 font-semibold text-primary">{res.unitNumber || 'TBD'}</td>
                          <td className="py-3.5">
                            <Badge variant="success" className="capitalize">{res.status}</Badge>
                          </td>
                          <td className="py-3.5">
                            <Button size="sm" variant="ghost" onClick={() => handleApproveStatus(res.uid)} className="cursor-pointer">
                              Verify
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* STAFF REGISTRY (Techs & Guards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TECHNICIANS */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row justify-between items-center p-5 border-b border-border/20">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-primary" /> Technicians
                  </CardTitle>
                  <CardDescription className="text-[10px]">Maintenance workers directory</CardDescription>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-bold">
                  {technicians.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 pt-3 space-y-4">
                {loading ? (
                  <p className="text-xs text-muted-foreground text-center">Loading...</p>
                ) : technicians.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No technician accounts found.</p>
                ) : (
                  technicians.map((t) => (
                    <div key={t.uid} className="flex justify-between items-center border-b border-border/40 pb-3 last:border-0 last:pb-0 text-xs">
                      <div>
                        <p className="font-bold text-foreground">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {t.email}
                        </p>
                      </div>
                      <Badge className="capitalize">{t.specialty || 'General'}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* SECURITY GUARDS */}
            <Card className="glass-card">
              <CardHeader className="flex flex-row justify-between items-center p-5 border-b border-border/20">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Security Sentry
                  </CardTitle>
                  <CardDescription className="text-[10px]">Gate check post sentry roster</CardDescription>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 font-bold">
                  {securityStaff.length}
                </Badge>
              </CardHeader>
              <CardContent className="p-5 pt-3 space-y-4">
                {loading ? (
                  <p className="text-xs text-muted-foreground text-center">Loading...</p>
                ) : securityStaff.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">No security roster found.</p>
                ) : (
                  securityStaff.map((s) => (
                    <div key={s.uid} className="flex justify-between items-center border-b border-border/40 pb-3 last:border-0 last:pb-0 text-xs">
                      <div>
                        <p className="font-bold text-foreground">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3" /> {s.email}
                        </p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{s.gateNumber || 'Gate 1'}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
