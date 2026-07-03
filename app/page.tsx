"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  QrCode, 
  MessageSquare, 
  AlertTriangle, 
  Calendar, 
  CheckCircle,
  FileText,
  Lock,
  Cpu
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-hidden">
      {/* NAVBAR */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
              CommuniSync AI
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/login')} className="cursor-pointer">
              Log In
            </Button>
            <Button onClick={() => router.push('/register')} className="cursor-pointer">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative py-24 md:py-32 px-6 flex flex-col items-center text-center">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[400px] w-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-4xl space-y-8 z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary shadow-xs glow-primary">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            Empowering gated societies with Gemini AI
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-b from-foreground to-foreground/75 bg-clip-text text-transparent">
            The Smart Operating System <br />
            <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              For Modern Gated Communities
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Digitize your residential operations with Gemini-powered community knowledge chat, automated complaint classification, conflict-free bookings, and secure visitor QR passes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => router.push('/login')} className="w-full sm:w-auto cursor-pointer gap-2 shadow-lg">
              Launch App Console <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/register')} className="w-full sm:w-auto cursor-pointer">
              Register Unit
            </Button>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="py-24 bg-card/30 border-t border-b border-border/50 px-6">
        <div className="mx-auto max-w-7xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Core Capabilities</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything your gated community needs to orchestrate communications, services, and operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI CHAT */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs hover:border-primary/20 transition-all hover:translate-y-[-2px] duration-300">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">AI Assistant (RAG)</h3>
              <p className="text-sm text-muted-foreground">
                Retrieves rules, policies, and schedules instantly from society circulars with citations. No hallucinations.
              </p>
            </div>

            {/* COMPLAINTS */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs hover:border-primary/20 transition-all hover:translate-y-[-2px] duration-300">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Smart Complaints</h3>
              <p className="text-sm text-muted-foreground">
                Submit issues with photos. AI extracts text, tags, and automatically predicts priority, category, and ETA.
              </p>
            </div>

            {/* VISITOR PASS */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs hover:border-primary/20 transition-all hover:translate-y-[-2px] duration-300">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Secure Visitor Passes</h3>
              <p className="text-sm text-muted-foreground">
                Generate secure time-restricted QR passes and OTPs for family and guests, instantly scanned by security.
              </p>
            </div>

            {/* BOOKINGS */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs hover:border-primary/20 transition-all hover:translate-y-[-2px] duration-300">
              <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 font-bold">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Amenity Bookings</h3>
              <p className="text-sm text-muted-foreground">
                Interactive booking calendar with conflict-prevention for Gym, Clubhouse, Pool, and Tennis Court.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK SECTION */}
      <section className="py-24 px-6 flex flex-col items-center">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Full-Stack Enterprise Architecture</h2>
            <p className="text-sm text-muted-foreground">Built using industry-standard engineering patterns</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-lg border border-border bg-card/40">
              <Cpu className="h-5 w-5 mx-auto mb-2 text-violet-500" />
              <p className="font-semibold text-sm">Next.js 15 App Router</p>
              <span className="text-xs text-muted-foreground">Server Components & Streaming API</span>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/40">
              <Lock className="h-5 w-5 mx-auto mb-2 text-indigo-500" />
              <p className="font-semibold text-sm">Firebase Suite</p>
              <span className="text-xs text-muted-foreground">Auth, Firestore, Cloud Messaging</span>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/40">
              <Sparkles className="h-5 w-5 mx-auto mb-2 text-cyan-500" />
              <p className="font-semibold text-sm">Gemini AI Engine</p>
              <span className="text-xs text-muted-foreground">Embedding Search & Classification</span>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card/40">
              <FileText className="h-5 w-5 mx-auto mb-2 text-amber-500" />
              <p className="font-semibold text-sm">Role-Based Auth (RBAC)</p>
              <span className="text-xs text-muted-foreground">Technician, Resident, Admin, Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card py-12 px-6 text-center">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 CommuniSync AI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
