"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword as fbSignIn, 
  createUserWithEmailAndPassword as fbSignUp, 
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, isMockMode } from '@/firebase/client';
import { dbService } from '@/services/database-service';
import { UserProfile, UserRole } from '@/types/user';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signUp: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load session or register listeners
  useEffect(() => {
    if (isMockMode) {
      // Simulate auth state load from sessionStorage
      const sessionUserUid = sessionStorage.getItem('cs_session_uid');
      if (sessionUserUid) {
        dbService.getUserProfile(sessionUserUid).then((profile) => {
          if (profile) {
            setUser(profile);
          } else {
            sessionStorage.removeItem('cs_session_uid');
          }
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    } else {
      // Real Firebase listener
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const profile = await dbService.getUserProfile(fbUser.uid);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  const signIn = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      if (isMockMode) {
        // Validate credentials against seeded users in localStorage
        const usersMap = JSON.parse(localStorage.getItem('cs_users') || '{}');
        const matchedProfile = Object.values(usersMap).find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase()
        ) as UserProfile | undefined;

        if (!matchedProfile) {
          throw new Error('User not found. Try one of the seeded logins (e.g. resident@communisync.com or admin@communisync.com)');
        }

        // Simulating simple auth without strict password checking in mock mode for ease
        sessionStorage.setItem('cs_session_uid', matchedProfile.uid);
        setUser(matchedProfile);
        setLoading(false);
        return matchedProfile;
      } else {
        const cred = await fbSignIn(auth, email, password);
        const profile = await dbService.getUserProfile(cred.user.uid);
        if (!profile) {
          throw new Error('User profile record not found in database.');
        }
        setUser(profile);
        setLoading(false);
        return profile;
      }
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> => {
    setLoading(true);
    try {
      const uid = isMockMode ? `user-${Date.now()}` : '';
      
      const newProfile: UserProfile = {
        uid: uid,
        email: email,
        name: profileData.name || 'New User',
        phone: profileData.phone || '',
        role: profileData.role || 'resident',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unitNumber: profileData.unitNumber,
        specialty: profileData.specialty,
        gateNumber: profileData.gateNumber,
        shift: profileData.shift,
      };

      if (isMockMode) {
        await dbService.createUserProfile(uid, newProfile);
        sessionStorage.setItem('cs_session_uid', uid);
        setUser(newProfile);
        setLoading(false);
        return newProfile;
      } else {
        const cred = await fbSignUp(auth, email, password);
        newProfile.uid = cred.user.uid;
        await dbService.createUserProfile(cred.user.uid, newProfile);
        setUser(newProfile);
        setLoading(false);
        return newProfile;
      }
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isMockMode) {
        sessionStorage.removeItem('cs_session_uid');
        setUser(null);
        setLoading(false);
        router.push('/login');
      } else {
        await fbSignOut(auth);
        setUser(null);
        setLoading(false);
        router.push('/login');
      }
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
