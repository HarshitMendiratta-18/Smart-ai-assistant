"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { geminiService } from '@/services/gemini';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  BookOpen, 
  Cpu, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AdminDocumentsPage() {
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState<'pdf' | 'docx' | 'txt' | 'manual'>('manual');

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const docs = await dbService.getKnowledgeDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error("Error loading knowledge documents:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast({
        title: 'Error',
        description: 'Please provide both a Title and Document text content.',
        type: 'warning',
      });
      return;
    }

    setIngesting(true);
    try {
      // Chunking logic: Split text by paragraphs/double-newlines
      const rawParagraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
      const chunks: { text: string; embedding: number[] }[] = [];

      toast({
        title: 'Processing Chunks',
        description: `Splitting text into ${rawParagraphs.length} guidelines. Generating vectors...`,
        type: 'default',
      });

      // Generate embedding vector for each paragraph chunk
      for (const p of rawParagraphs) {
        const embedding = await geminiService.generateEmbedding(p);
        chunks.push({
          text: p,
          embedding
        });
      }

      const docData = {
        title,
        content,
        type: docType,
        uploadedBy: 'Aravind Swamy (Admin)',
        chunkCount: chunks.length
      };

      // Store in DB
      await dbService.addKnowledgeDocument(docData, chunks);

      confetti({
        particleCount: 80,
        spread: 50
      });

      toast({
        title: 'Ingestion Completed',
        description: `RAG pipeline successfully indexed "${title}" with ${chunks.length} chunks.`,
        type: 'success',
      });

      // Clear form
      setTitle('');
      setContent('');
      loadDocuments();
    } catch (err: any) {
      toast({
        title: 'Ingestion Failed',
        description: err.message,
        type: 'destructive',
      });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Society Knowledge Base</h1>
          <p className="text-muted-foreground">Upload and index society guidelines, rules, and timings into RAG vector search</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* INGEST FORM (1/3 width) */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary animate-pulse" />
              Index New Manual
            </h2>

            <Card className="glass-card">
              <form onSubmit={handleIngestDocument}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Document Title</label>
                    <Input
                      placeholder="e.g., Club Timings & Guest Policy 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={ingesting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Manual Format Type</label>
                    <Select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value as any)}
                      disabled={ingesting}
                    >
                      <option value="manual">Structured Society Manual</option>
                      <option value="pdf">Circular PDF Upload</option>
                      <option value="txt">General Text Notice</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Document Content (Raw Text)</label>
                    <Textarea
                      placeholder="Pasted rules, divided by double newlines. For example:&#10;&#10;Clubhouse hours are 6:00 AM to 10:00 PM.&#10;&#10;Swimming pool requires nylon swimwear at all times."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      disabled={ingesting}
                      className="min-h-[180px]"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground">
                      💡 Text will be chunked by paragraph double-lines. Ensure clean separation.
                    </p>
                  </div>

                  <Button type="submit" className="w-full cursor-pointer shadow-lg" loading={ingesting}>
                    Index Guideline Document
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* ACTIVE DOCUMENTS GRID (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Active Guidelines Registry
            </h2>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 rounded-lg bg-card animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <Card className="border border-dashed border-border flex flex-col items-center justify-center p-12 text-center bg-card/25 h-72">
                <FileText className="h-10 w-10 text-muted-foreground mb-2 opacity-60" />
                <p className="font-semibold text-sm">Knowledge base is empty</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Add society guidelines, club hours, parking instructions on the left to activate RAG vector searches.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Card key={doc.id} className="glass-card">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          {doc.title}
                        </CardTitle>
                        <CardDescription className="text-[10px] mt-1">
                          Added: {new Date(doc.createdAt).toLocaleDateString()} | Chunks indexed: {doc.chunkCount || doc.chunks?.length || 0}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="uppercase text-[9px] border-primary/20 text-primary bg-primary/5">
                        {doc.type}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground max-h-24 overflow-y-auto leading-relaxed border-t border-border/20 mt-2 pt-2">
                      <span className="font-semibold text-foreground">Content Preview:</span> {doc.content}
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
