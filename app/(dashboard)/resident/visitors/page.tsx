"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode as QrIcon, 
  Plus, 
  Clock, 
  UserCheck, 
  FileText,
  User,
  Car,
  FileQuestion,
  Share2
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';

export default function ResidentVisitorsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [purpose, setPurpose] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  
  // QR modal preview
  const [qrPassUrl, setQrPassUrl] = useState<string | null>(null);
  const [selectedPass, setSelectedPass] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadVisitors();
    }
  }, [user]);

  async function loadVisitors() {
    try {
      setLoading(true);
      const data = await dbService.getVisitors(user?.uid);
      setVisitors(data);
    } catch (err) {
      console.error("Error loading visitors:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleGeneratePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !purpose) {
      toast({
        title: 'Error',
        description: 'Please fill in visitor Name, Phone, and Purpose.',
        type: 'warning',
      });
      return;
    }

    setGenerating(true);
    try {
      const expiresAt = new Date(Date.now() + 3600000 * parseInt(durationHours)).toISOString();
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // random 6 digit OTP

      // Sign visitor data payload
      const qrPayload = JSON.stringify({
        name,
        phone,
        purpose,
        residentUnit: user?.unitNumber,
        expiresAt,
        otp: otpCode
      });

      // Render QR code image data URI
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#581c87', // primary purple color
          light: '#ffffff'
        }
      });

      const newVisitor = {
        residentId: user?.uid,
        residentUnit: user?.unitNumber || 'Tower A - 501',
        name,
        phone,
        vehicleDetails: vehicleDetails || 'None',
        purpose,
        expectedTime: new Date().toISOString(),
        expiresAt,
        passType: 'qr',
        otpCode,
        qrCodeData: qrDataUrl
      };

      const visitorObj = await dbService.createVisitor(newVisitor);
      
      confetti({
        particleCount: 80,
        spread: 60
      });

      toast({
        title: 'Pass Generated!',
        description: `Access code ${otpCode} successfully generated.`,
        type: 'success',
      });

      // Show pass preview modal
      setSelectedPass({ ...visitorObj, qrCodeData: qrDataUrl });
      setQrPassUrl(qrDataUrl);

      // Reset form
      setName('');
      setPhone('');
      setVehicleDetails('');
      setPurpose('');

      loadVisitors();
    } catch (err: any) {
      toast({
        title: 'Generation Failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSharePass = () => {
    if (navigator.share && selectedPass) {
      navigator.share({
        title: 'CommuniSync Entry Pass',
        text: `Hey ${selectedPass.name}, here is your gate pass for CommuniSync. OTP: ${selectedPass.otpCode}. Valid until ${new Date(selectedPass.expiresAt).toLocaleTimeString()}`,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback
      navigator.clipboard.writeText(`CommuniSync Visitor Gate Pass\nGuest: ${selectedPass?.name}\nOTP: ${selectedPass?.otpCode}\nValid until: ${new Date(selectedPass?.expiresAt || '').toLocaleString()}`);
      toast({
        title: 'Copied to clipboard',
        description: 'Gate pass message details copied to clipboard.',
        type: 'success',
      });
    }
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['resident']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Visitor Management</h1>
          <p className="text-muted-foreground">Pre-authorize guest entries with secure visual QR passes and checkcodes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* GENERATE VISITOR PASS FORM (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Generate Gate Pass
            </h2>

            <Card className="glass-card">
              <form onSubmit={handleGeneratePass}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Guest Full Name
                    </label>
                    <Input
                      placeholder="e.g., Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={generating}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <FileQuestion className="h-3.5 w-3.5" /> Purpose of Visit
                    </label>
                    <Input
                      placeholder="e.g., Delivery, Guest, Service worker"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      disabled={generating}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        📲 Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="Guest contact"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={generating}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Pass Duration
                      </label>
                      <Select
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        disabled={generating}
                      >
                        <option value="4">4 Hours</option>
                        <option value="12">12 Hours</option>
                        <option value="24">24 Hours (1 Day)</option>
                        <option value="72">72 Hours (3 Days)</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Car className="h-3.5 w-3.5" /> Vehicle Number (optional)
                    </label>
                    <Input
                      placeholder="e.g., KA 03 MH 1234"
                      value={vehicleDetails}
                      onChange={(e) => setVehicleDetails(e.target.value)}
                      disabled={generating}
                    />
                  </div>

                  <Button type="submit" className="w-full cursor-pointer shadow-lg" loading={generating}>
                    Generate Pass
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* ACTIVE PASSES LIST (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Active Pre-authorized Guests
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-lg bg-card animate-pulse" />
                ))}
              </div>
            ) : visitors.length === 0 ? (
              <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25">
                <QrIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">No visitors registered</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Create a pass on the left to pre-authorize your guests and deliveries.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visitors.map((vis) => {
                  const isExpired = new Date(vis.expiresAt) < new Date();
                  return (
                    <Card key={vis.id} className="glass-card hover:border-primary/10 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-bold">{vis.name}</CardTitle>
                            <CardDescription className="text-[10px] mt-0.5">Phone: {vis.phone}</CardDescription>
                          </div>
                          <Badge variant={isExpired ? 'destructive' : vis.status === 'entered' ? 'success' : 'secondary'}>
                            {isExpired ? 'EXPIRED' : vis.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground space-y-1.5">
                        <p>Purpose: <span className="text-foreground font-medium">{vis.purpose}</span></p>
                        <p>Vehicle: <span className="text-foreground font-medium">{vis.vehicleDetails}</span></p>
                        <p className="text-[10px]">Expires: {new Date(vis.expiresAt).toLocaleString()}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between border-t border-border mt-2 pt-2 text-[10px]">
                        <span className="font-bold text-primary">OTP: {vis.otpCode}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            setSelectedPass(vis);
                            setQrPassUrl(vis.qrCodeData);
                          }}
                          className="h-7 text-[10px] cursor-pointer"
                        >
                          View QR
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QR PREVIEW MODAL */}
        {selectedPass && qrPassUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setSelectedPass(null)} />
            <div className="z-50 w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold">CommuniSync Gate Pass</h3>
              <p className="text-xs text-muted-foreground mt-1">Valid for: {selectedPass.name}</p>
              
              {/* QR Image */}
              <div className="my-6 flex justify-center bg-white p-4 rounded-xl border border-border w-64 h-64 mx-auto">
                <img src={qrPassUrl} alt="Gate Pass QR" className="object-contain" />
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs font-bold text-primary tracking-wide mb-6">
                OTP PASSCODE: {selectedPass.otpCode}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedPass(null)} 
                  className="w-full cursor-pointer"
                >
                  Dismiss
                </Button>
                <Button onClick={handleSharePass} className="w-full cursor-pointer gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
