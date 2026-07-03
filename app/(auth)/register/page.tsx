"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Mail, User, Phone, Home, Lock, Briefcase } from 'lucide-react';
import { UserRole } from '@/types/user';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('resident');
  
  // Role specific fields
  const [unitNumber, setUnitNumber] = useState('');
  const [specialty, setSpecialty] = useState('general');
  const [gateNumber, setGateNumber] = useState('Gate 1');
  
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all primary registration fields.',
        type: 'destructive',
      });
      return;
    }

    setFormLoading(true);
    try {
      const profileData: any = { name, phone, role };
      if (role === 'resident') {
        if (!unitNumber) {
          throw new Error('Please enter your Tower and Unit Number.');
        }
        profileData.unitNumber = unitNumber;
      } else if (role === 'technician') {
        profileData.specialty = specialty;
      } else if (role === 'security') {
        profileData.gateNumber = gateNumber;
        profileData.shift = 'day';
      }

      await signUp(email, password, profileData);
      toast({
        title: 'Account Created',
        description: `Welcome to CommuniSync, ${name}! Your profile has been initialized.`,
        type: 'success',
      });
      router.push(`/${role}`);
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'Error occurred during registration.',
        type: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] translate-x-1/2 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2 shadow-sm">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            CommuniSync AI
          </h1>
          <p className="text-sm text-muted-foreground">Register a new profile</p>
        </div>

        <Card className="glass-card shadow-xl border-border/40">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create Account</CardTitle>
            <CardDescription>Join your neighborhood operating network</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3" /> Account Role
                </label>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={formLoading}
                >
                  <option value="resident">Resident / Homeowner</option>
                  <option value="technician">Maintenance Technician</option>
                  <option value="security">Security Guard</option>
                  <option value="admin">Society Admin</option>
                </Select>
              </div>

              {/* DYNAMIC ROLE CONFIGURATION FIELDS */}
              {role === 'resident' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Home className="h-3 w-3" /> Apartment Unit / Villa Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Tower B - 402"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    disabled={formLoading}
                    required
                  />
                </div>
              )}

              {role === 'technician' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    🔧 Specialty Department
                  </label>
                  <Select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    disabled={formLoading}
                  >
                    <option value="plumbing">Plumbing Department</option>
                    <option value="electrical">Electrical Department</option>
                    <option value="elevators">Elevator Systems</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="general">General Handyman</option>
                  </Select>
                </div>
              )}

              {role === 'security' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    🚧 Guard Gate Post
                  </label>
                  <Select
                    value={gateNumber}
                    onChange={(e) => setGateNumber(e.target.value)}
                    disabled={formLoading}
                  >
                    <option value="Gate 1">Main Entrance (Gate 1)</option>
                    <option value="Gate 2">Service Entrance (Gate 2)</option>
                    <option value="Gate 3">Basement Parking (Gate 3)</option>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Password
                </label>
                <Input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" loading={formLoading}>
                Sign Up & Launch
              </Button>
              <div className="text-center w-full">
                <span className="text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="text-primary font-medium hover:underline cursor-pointer"
                  >
                    Login here
                  </button>
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
