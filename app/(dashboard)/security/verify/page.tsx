"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  User, 
  Car, 
  FileText,
  Clock,
  LogOut,
  LogIn
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SecurityVerifyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [otpInput, setOtpInput] = useState('');
  const [activePasses, setActivePasses] = useState<any[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [matchedVisitor, setMatchedVisitor] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadActivePasses();
  }, []);

  async function loadActivePasses() {
    try {
      const visitors = await dbService.getVisitors();
      // filter only pending, non-expired passes
      const active = visitors.filter((v: any) => v.status === 'pending' && new Date(v.expiresAt) > new Date());
      setActivePasses(active);
    } catch (err) {
      console.error("Error loading active passes:", err);
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpInput || otpInput.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please input a valid 6-digit code.',
        type: 'warning',
      });
      return;
    }

    setSearchLoading(true);
    try {
      // Query visitors matching OTP
      const visitors = await dbService.getVisitors();
      const match = visitors.find((v: any) => v.otpCode === otpInput);
      
      if (!match) {
        toast({
          title: 'Not Found',
          description: 'No active pass matches the input passcode.',
          type: 'destructive',
        });
        setMatchedVisitor(null);
      } else {
        const isExpired = new Date(match.expiresAt) < new Date();
        if (isExpired) {
          toast({
            title: 'Pass Expired',
            description: `This pass expired on ${new Date(match.expiresAt).toLocaleTimeString()}`,
            type: 'destructive',
          });
        }
        setMatchedVisitor(match);
      }
    } catch (err: any) {
      toast({
        title: 'Search failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSimulateScan = (visitor: any) => {
    setMatchedVisitor(visitor);
    setOtpInput(visitor.otpCode);
    toast({
      title: 'QR Scan Simulated',
      description: `Loaded pass for ${visitor.name}`,
      type: 'success',
    });
  };

  const handleGateAction = async (action: 'enter' | 'exit') => {
    if (!matchedVisitor) return;

    setVerifying(true);
    try {
      if (action === 'enter') {
        // Mark visitor status as entered
        await dbService.updateVisitorStatus(matchedVisitor.id, 'approved');
        
        // Log gate entrance log
        await dbService.createVisitorLog({
          visitorId: matchedVisitor.id,
          visitorName: matchedVisitor.name,
          residentUnit: matchedVisitor.residentUnit,
          verifiedByGuardId: user?.uid || 'security-uid',
          status: 'entered',
          verificationMethod: 'otp'
        });

        confetti({
          particleCount: 120,
          spread: 80,
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });

        toast({
          title: 'Access Approved',
          description: `Visitor ${matchedVisitor.name} has been checked IN.`,
          type: 'success',
        });
      } else {
        // Mark visitor status as expired / logged out
        await dbService.updateVisitorStatus(matchedVisitor.id, 'expired');

        // Log exit gate log
        await dbService.createVisitorLog({
          visitorId: matchedVisitor.id,
          visitorName: matchedVisitor.name,
          residentUnit: matchedVisitor.residentUnit,
          verifiedByGuardId: user?.uid || 'security-uid',
          status: 'exited',
          verificationMethod: 'manual'
        });

        toast({
          title: 'Checkout Confirmed',
          description: `Visitor ${matchedVisitor.name} checked OUT successfully.`,
          type: 'success',
        });
      }

      // Reset
      setMatchedVisitor(null);
      setOtpInput('');
      loadActivePasses(); // reload presets
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['security']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Gate Sentry Verification</h1>
          <p className="text-muted-foreground">Scan visitor QR codes or input checkcodes to log gate transits</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* VERIFY CODE PANEL (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              1. Input Passcode
            </h2>

            <Card className="glass-card">
              <CardHeader>
                <CardDescription>Enter the 6-digit OTP code supplied by the visitor</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="relative">
                    <Input
                      type="text"
                      maxLength={6}
                      placeholder="e.g., 123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      disabled={searchLoading || verifying}
                      className="text-center font-bold text-lg tracking-[0.25em] pl-10"
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full cursor-pointer" 
                    loading={searchLoading}
                    disabled={otpInput.length !== 6 || verifying}
                  >
                    Verify Passcode
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* RECRUITER QR CODE SIMULATION PANEL */}
            <Card className="border border-primary/20 bg-primary/5 shadow-xs">
              <CardHeader className="p-4 pb-1.5 flex flex-row items-center gap-2">
                <QrCode className="h-4 w-4 text-primary animate-pulse" />
                <div>
                  <CardTitle className="text-sm font-bold">Simulate QR Scan</CardTitle>
                  <CardDescription className="text-[10px]">Select any active resident pass to simulate a scanner</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {activePasses.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground text-center py-2">
                    No active passes currently waiting entry. Log in as a resident to generate one first!
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5">
                    {activePasses.map((pass) => (
                      <button
                        key={pass.id}
                        onClick={() => handleSimulateScan(pass)}
                        className="w-full text-left text-[10px] p-2 bg-card hover:bg-muted/10 border border-border rounded-md flex justify-between items-center transition-colors cursor-pointer"
                      >
                        <span className="font-semibold text-foreground truncate max-w-[120px]">{pass.name}</span>
                        <span className="text-muted-foreground">Dest: {pass.residentUnit}</span>
                        <span className="text-primary font-bold">{pass.otpCode}</span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* VERIFICATION REPORT PANEL (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              2. Verification Result
            </h2>

            {matchedVisitor ? (
              <Card className="glass-card overflow-hidden animate-in zoom-in-95 duration-200">
                <CardHeader className="bg-primary/5 border-b border-border p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold">Pass Status Verified</CardTitle>
                      <CardDescription className="text-xs">Valid passcode matched in community registry</CardDescription>
                    </div>
                    <Badge variant={matchedVisitor.status === 'entered' ? 'success' : 'default'} className="uppercase">
                      {matchedVisitor.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guest details */}
                    <div className="space-y-4">
                      <h4 className="font-bold border-b border-border pb-1.5 flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" /> Guest Details
                      </h4>
                      <div className="space-y-2 text-xs">
                        <p className="text-foreground">Name: <span className="font-semibold">{matchedVisitor.name}</span></p>
                        <p className="text-foreground">Phone: <span className="font-semibold">{matchedVisitor.phone}</span></p>
                        <p className="text-foreground flex items-center gap-1.5">
                          <Car className="h-4 w-4 text-muted-foreground" /> Vehicle: <span className="font-semibold">{matchedVisitor.vehicleDetails || 'None'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Destination details */}
                    <div className="space-y-4">
                      <h4 className="font-bold border-b border-border pb-1.5 flex items-center gap-2">
                        🏢 Destination Unit
                      </h4>
                      <div className="space-y-2 text-xs">
                        <p className="text-foreground">Apartment Unit: <span className="font-semibold text-primary">{matchedVisitor.residentUnit}</span></p>
                        <p className="text-foreground">Host: <span className="font-semibold">{matchedVisitor.residentName || 'Resident Host'}</span></p>
                        <p className="text-foreground flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-muted-foreground" /> Expiry: <span className="font-semibold text-red-500">{new Date(matchedVisitor.expiresAt).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
                    <span className="font-bold">Purpose stated by host: </span> {matchedVisitor.purpose}
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t border-border p-4 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setMatchedVisitor(null)}
                    disabled={verifying}
                    className="cursor-pointer"
                  >
                    Reset
                  </Button>
                  
                  {matchedVisitor.status === 'pending' && (
                    <Button 
                      onClick={() => handleGateAction('enter')}
                      loading={verifying}
                      className="cursor-pointer gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <LogIn className="h-4 w-4" /> Approve Entry (Check IN)
                    </Button>
                  )}

                  {matchedVisitor.status === 'approved' && (
                    <Button 
                      onClick={() => handleGateAction('exit')}
                      loading={verifying}
                      className="cursor-pointer gap-2"
                      variant="destructive"
                    >
                      <LogOut className="h-4 w-4" /> Log Departure (Check OUT)
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25 h-72">
                <ShieldCheck className="h-12 w-12 text-muted-foreground mb-3 opacity-60" />
                <p className="font-semibold text-sm">Waiting Verification</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Type a 6-digit OTP code on the left or select an active pass from the simulation panel to load and verify a gate pass.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
