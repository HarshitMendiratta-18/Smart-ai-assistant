"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { useAuth } from '@/hooks/use-auth';
import { dbService } from '@/services/database-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Plus, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  FileText,
  MapPin,
  Image as ImageIcon,
  Wrench,
  HelpCircle
} from 'lucide-react';

export default function ResidentComplaintsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // New complaint form state
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string>('other');
  
  // AI Assistant tag preview state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiTags, setAiTags] = useState<{
    category: string;
    priority: string;
    department: string;
    eta: string;
    severity: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadComplaints();
    }
  }, [user]);

  async function loadComplaints() {
    try {
      setLoading(true);
      const data = await dbService.getComplaints({ residentId: user?.uid });
      setComplaints(data);
    } catch (err) {
      console.error("Error loading complaints:", err);
    } finally {
      setLoading(false);
    }
  }

  // Trigger Gemini AI classification preview
  const handleAIAnalyze = async () => {
    if (!description || description.trim().length < 10) {
      toast({
        title: 'Need more detail',
        description: 'Please type a longer description (at least 10 letters) for AI to analyze.',
        type: 'warning',
      });
      return;
    }

    setAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      });
      const data = await res.json();
      if (res.ok) {
        setAiTags(data);
        // Automatically pre-fill the form category based on AI prediction
        setCategory(data.category);
        toast({
          title: 'AI Classification Complete',
          description: `Tags successfully predicted for category: ${data.category}`,
          type: 'success',
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({
        title: 'AI Analysis Failed',
        description: err.message || 'Unable to predict tags.',
        type: 'destructive',
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    setSubmitting(true);
    try {
      // Gather tags: use AI tags if available, otherwise default
      const finalCategory = aiTags?.category || category;
      const finalPriority = aiTags?.priority || 'low';
      const finalDept = aiTags?.department || 'administration';
      const finalEta = aiTags?.eta || '24 Hours';
      const finalSeverity = aiTags?.severity || 'minor';

      const newComp = {
        residentId: user?.uid,
        residentName: user?.name,
        unitNumber: user?.unitNumber || 'Tower A - 501',
        description,
        location: location || 'Within Unit',
        category: finalCategory,
        priority: finalPriority,
        department: finalDept,
        eta: finalEta,
        severity: finalSeverity,
        imageUrl: '', // default empty image
        status: 'open'
      };

      await dbService.createComplaint(newComp);
      
      toast({
        title: 'Ticket Submitted',
        description: 'Your complaint was logged and categorized successfully.',
        type: 'success',
      });

      // Reset form
      setDescription('');
      setLocation('');
      setCategory('other');
      setAiTags(null);

      // Reload list
      loadComplaints();
    } catch (err: any) {
      toast({
        title: 'Submission failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={['resident']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Log new repairs and monitor resolution timelines</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FILE COMPLAINT FORM (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              File New Complaint
            </h2>

            <Card className="glass-card">
              <form onSubmit={handleFormSubmit}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">What is the issue?</label>
                    <Textarea
                      placeholder="e.g., Water is dripping continuously from the basement overhead pipe near slot 45..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={submitting}
                      className="min-h-[100px]"
                      required
                    />
                    <div className="flex justify-end">
                      <Button 
                        type="button" 
                        variant="glass" 
                        size="sm" 
                        onClick={handleAIAnalyze}
                        loading={aiAnalyzing}
                        disabled={submitting}
                        className="text-xs gap-1.5 cursor-pointer text-primary border-primary/20 bg-primary/5"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Analyze with AI
                      </Button>
                    </div>
                  </div>

                  {/* AI PREVIEW TAG BOX */}
                  {aiTags && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs animate-in slide-in-from-top-2 duration-200">
                      <h4 className="font-bold flex items-center gap-1.5 text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> Copilot Predicted Tags
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-muted-foreground">Category: </span>
                          <span className="font-semibold capitalize">{aiTags.category.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Priority: </span>
                          <span className="font-semibold uppercase text-red-500">{aiTags.priority}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Department: </span>
                          <span className="font-semibold capitalize">{aiTags.department}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Severity: </span>
                          <span className="font-semibold capitalize">{aiTags.severity}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-primary/10 mt-1">
                          <span className="text-muted-foreground">Predicted ETA: </span>
                          <span className="font-bold text-foreground">{aiTags.eta}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location (optional)
                    </label>
                    <Input
                      placeholder="e.g., Basement 1 near Parking #45"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Manual Category Override</label>
                    <Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={submitting}
                    >
                      <option value="water_leakage">Water Leakage</option>
                      <option value="lift_issue">Lift / Elevator Issue</option>
                      <option value="electrical_failure">Electrical Failure</option>
                      <option value="garbage">Garbage Collection</option>
                      <option value="streetlight">Broken Streetlight</option>
                      <option value="noise">Noise Complaint</option>
                      <option value="security">Security Concern</option>
                      <option value="plumbing">Plumbing crisis</option>
                      <option value="internet">Internet / Fiber issues</option>
                      <option value="other">Other / General</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Upload Photo (optional)
                    </label>
                    <div className="border border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:bg-muted/10 transition-colors text-xs text-muted-foreground">
                      Drag & Drop or Click to browse
                    </div>
                  </div>

                  <Button type="submit" className="w-full cursor-pointer" loading={submitting}>
                    Submit Complaint
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* ACTIVE COMPLAINT TRACKER (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Ticket History
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25">
                <HelpCircle className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="font-semibold text-sm">No tickets logged yet</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  You haven't filed any complaints yet. Use the form to submit your first repair request.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {complaints.map((comp) => (
                  <Card key={comp.id} className="glass-card hover:border-primary/10 transition-colors">
                    <CardHeader className="p-5 pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                            {comp.category.replace('_', ' ')}
                          </Badge>
                          <CardTitle className="text-base font-bold mt-1">Ticket #{comp.id.substring(5, 10)}</CardTitle>
                        </div>
                        <Badge 
                          variant={
                            comp.status === 'resolved' 
                              ? 'success' 
                              : comp.status === 'in_progress' 
                              ? 'warning' 
                              : 'secondary'
                          }
                          className="capitalize"
                        >
                          {comp.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription className="text-[10px] flex items-center gap-1.5 mt-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Filed: {new Date(comp.createdAt).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 text-xs">
                      <p className="text-muted-foreground leading-relaxed mb-4">{comp.description}</p>
                      
                      {comp.location && (
                        <p className="text-[10px] text-muted-foreground mb-4">
                          📍 Location Details: <span className="text-foreground font-semibold">{comp.location}</span>
                        </p>
                      )}

                      {comp.technicianName && (
                        <div className="p-2.5 rounded-lg bg-muted/20 border border-border flex items-center gap-2 mb-4">
                          <Wrench className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="font-semibold">Assigned Tech: {comp.technicianName}</p>
                            <p className="text-[10px] text-muted-foreground">Estimated Resolution: {comp.eta}</p>
                          </div>
                        </div>
                      )}

                      {comp.technicianNotes && (
                        <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <span className="font-bold">Technician Log:</span> {comp.technicianNotes}
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-border pt-4 mt-4 text-[10px] text-muted-foreground">
                        <span>DEPT: {comp.department.toUpperCase()}</span>
                        <span className="font-semibold">PRIORITY: {comp.priority.toUpperCase()}</span>
                      </div>
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
