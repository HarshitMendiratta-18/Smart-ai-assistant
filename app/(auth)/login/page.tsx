"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Sparkles, Key, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push(`/${user.role}`);
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        type: 'destructive',
      });
      return;
    }
    setFormLoading(true);
    try {
      const loggedUser = await signIn(email, password);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${loggedUser.name}!`,
        type: 'success',
      });
      router.push(`/${loggedUser.role}`);
    } catch (err: any) {
      toast({
        title: 'Authentication Failed',
        description: err.message || 'Invalid email or password.',
        type: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleQuickLogin = async (mockEmail: string) => {
    setFormLoading(true);
    try {
      const loggedUser = await signIn(mockEmail, 'password');
      toast({
        title: 'Quick Access Enabled',
        description: `Logged in as ${loggedUser.name} (${loggedUser.role})`,
        type: 'success',
      });
      router.push(`/${loggedUser.role}`);
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Dynamic Background Blurs */}
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
          <p className="text-sm text-muted-foreground">The Smart Neighborhood Operating System</p>
        </div>

        <Card className="glass-card shadow-xl border-border/40">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold">Sign In</CardTitle>
            <CardDescription>Access your community portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" loading={formLoading}>
                Sign In
              </Button>
              <div className="text-center w-full">
                <span className="text-xs text-muted-foreground">
                  New resident?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="text-primary font-medium hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* DEMO / QUICK ACCESS LOGINS PANEL */}
        <Card className="border border-primary/20 bg-primary/5 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <div>
              <CardTitle className="text-sm font-bold">Recruiter Quick Access</CardTitle>
              <CardDescription className="text-xs">Login instantly with preset roles</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs justify-start h-9 cursor-pointer"
              disabled={formLoading}
              onClick={() => handleQuickLogin('admin@communisync.com')}
            >
              👑 Admin
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs justify-start h-9 cursor-pointer"
              disabled={formLoading}
              onClick={() => handleQuickLogin('resident@communisync.com')}
            >
              🏠 Resident
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs justify-start h-9 cursor-pointer"
              disabled={formLoading}
              onClick={() => handleQuickLogin('plumber@communisync.com')}
            >
              🔧 Plumber (Tech)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs justify-start h-9 cursor-pointer"
              disabled={formLoading}
              onClick={() => handleQuickLogin('guard@communisync.com')}
            >
              👮 Guard (Security)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
