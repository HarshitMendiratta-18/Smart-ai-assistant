"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="relative flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h2 className="text-xl font-semibold tracking-wide animate-pulse">Initializing Portal...</h2>
          <p className="text-sm text-muted-foreground">Connecting to CommuniSync Network</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return null;
}
