"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Megaphone, 
  Plus, 
  Clock, 
  Trash2,
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminNoticesPage() {
  const { toast } = useToast();
  
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'maintenance' | 'event' | 'emergency' | 'general'>('general');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const data = await dbService.getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error("Error loading announcements:", err);
    } finally {
      setLoading(false);
    }
  }

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setPublishing(true);
    try {
      const newNotice = {
        title,
        content,
        category,
        authorName: 'Aravind Swamy (Admin)',
      };

      await dbService.createAnnouncement(newNotice);
      
      confetti({
        particleCount: 50,
        spread: 40
      });

      toast({
        title: 'Announcement Published!',
        description: `Notice "${title}" is now visible to all residents.`,
        type: 'success',
      });

      // Reset
      setTitle('');
      setContent('');
      setCategory('general');

      loadAnnouncements();
    } catch (err: any) {
      toast({
        title: 'Publish failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Announcement Board</h1>
          <p className="text-muted-foreground">Broadcast circulars, notices, emergency alerts, or events to residents</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* NOTICE PUBLISH FORM (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Publish Circular Notice
            </h2>

            <Card className="glass-card">
              <form onSubmit={handlePublishNotice}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Title / Headline</label>
                    <Input
                      placeholder="e.g., Independence Day Flag Hoisting"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={publishing}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Broadcasting Category</label>
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      disabled={publishing}
                    >
                      <option value="general">General Circular</option>
                      <option value="maintenance">Maintenance / Work Update</option>
                      <option value="event">Community Gathering / Event</option>
                      <option value="emergency">Emergency / Priority Warning</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Notice content body</label>
                    <Textarea
                      placeholder="Type details regarding location, times, instructions..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={publishing}
                      className="min-h-[140px]"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full cursor-pointer shadow-lg" loading={publishing}>
                    Broadcast Notice
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* ACTIVE NOTICES LIST (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Announcement History
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25 h-72">
                <Megaphone className="h-10 w-10 text-muted-foreground mb-2 opacity-60" />
                <p className="font-semibold text-sm">No notices published yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Draft and publish your first community announcement on the left panel.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <Card key={ann.id} className="glass-card hover:border-primary/10 transition-colors">
                    <CardHeader className="p-5 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-base font-bold line-clamp-1">{ann.title}</CardTitle>
                        <Badge 
                          variant={
                            ann.category === 'emergency' 
                              ? 'destructive' 
                              : ann.category === 'maintenance' 
                              ? 'warning' 
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {ann.category}
                        </Badge>
                      </div>
                      <CardDescription className="text-[10px] flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ann.createdAt).toLocaleDateString()} | Author: {ann.authorName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
                        {ann.content}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
