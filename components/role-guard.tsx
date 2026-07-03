"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types/user';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect to their respective dashboard if they try to access an unauthorized route
        router.push(`/${user.role}`);
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground">
        <div className="relative flex flex-col items-center gap-4">
          {/* Animated Spinner with Gradient */}
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <h2 className="text-xl font-semibold tracking-wide animate-pulse">Verifying Credentials...</h2>
          <p className="text-sm text-muted-foreground">Securing CommuniSync connection</p>
        </div>
      </div>
    );
  }

  // If user is validated and role is allowed, render layout contents
  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return null;
}
