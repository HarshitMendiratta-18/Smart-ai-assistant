"use client";

import React, { useState, useRef, useEffect } from 'react';
import RoleGuard from '@/components/role-guard';
import { dbService } from '@/services/database-service';
import { geminiService } from '@/services/gemini';
import { searchVectors } from '@/lib/vector-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  FileText, 
  HelpCircle,
  User,
  Bot,
  ArrowRight
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: string[];
}

export default function ResidentChatPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I am your CommuniSync AI assistant. Ask me anything about our community rules, clubhouse timing, garbage schedules, parking policy, or emergency contacts!"
    }
  ]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessageText = query.trim();
    setQuery('');
    setSending(true);

    const userMessageId = `msg-user-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMessageId, role: 'user', content: userMessageText }]);

    try {
      // 1. Generate query embedding vector
      const queryVector = await geminiService.generateEmbedding(userMessageText);

      // 2. Fetch all community guideline chunks
      const allChunks = await dbService.getAllChunks();

      // 3. Compute cosine similarity matches
      const searchResults = searchVectors(
        queryVector,
        allChunks.map((c) => ({
          text: c.text,
          embedding: c.embedding,
          sourceDocumentTitle: c.sourceDocumentTitle || 'Society Rulebook'
        })),
        4,   // topK
        0.55 // minimum score threshold (slightly lowered for mock support vectors)
      );

      const contextTextArray = searchResults.map((r) => r.text);
      const uniqueSources = Array.from(new Set(searchResults.map((r) => r.sourceDocumentTitle)));

      // 4. Build chat history in Gemini format
      const history = messages
        .filter(m => m.id !== 'welcome') // skip initial greeting
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      // 5. Query the backend API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessageText,
          history,
          context: contextTextArray
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error during generation.');
      }

      // Add AI response message
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-ai-${Date.now()}`,
          role: 'model',
          content: data.response,
          sources: uniqueSources.length > 0 ? uniqueSources : ['Community Database']
        }
      ]);
    } catch (err: any) {
      toast({
        title: 'Chat connection issue',
        description: err.message || 'Unable to fetch reply from Gemini.',
        type: 'destructive',
      });
      // Append error message to feed
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'model',
          content: 'Sorry, I encountered a connection issue. Please make sure the Gemini API key is valid or try again shortly.'
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const handlePresetQuestion = (preset: string) => {
    setQuery(preset);
  };

  return (
    <RoleGuard allowedRoles={['resident']}>
      <div className="flex flex-col h-[calc(100vh-8rem)] w-full max-w-5xl mx-auto space-y-4 animate-in fade-in duration-300">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Society Copilot</h1>
          <p className="text-muted-foreground">Ask questions regarding society guidelines, schedules, and policies</p>
        </div>

        {/* CHAT DISPLAY SCREEN */}
        <Card className="glass-card flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center border shrink-0 ${
                    isUser 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-card border-border text-foreground'
                  }`}>
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message bubble */}
                  <div className="space-y-2">
                    <div className={`rounded-xl p-4 text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10' 
                        : 'bg-muted/30 border border-border text-foreground'
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                    </div>

                    {/* Sources citations */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-muted-foreground">Cited sources: </span>
                        {msg.sources.map((src, i) => (
                          <Badge 
                            key={i} 
                            variant="secondary" 
                            className="text-[9px] gap-1 px-1.5 py-0.5 border border-border"
                          >
                            <FileText className="h-3 w-3" />
                            {src}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (if feed is short) */}
          {messages.length === 1 && (
            <div className="p-6 pt-0 space-y-2">
              <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" /> Try asking:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handlePresetQuestion('What are the rules and timings for the swimming pool?')}
                  className="text-left p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/10 hover:border-primary/20 transition-all flex justify-between items-center cursor-pointer"
                >
                  🏊 Pool hours & requirements <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handlePresetQuestion('How can I book the clubhouse hall?')}
                  className="text-left p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/10 hover:border-primary/20 transition-all flex justify-between items-center cursor-pointer"
                >
                  🏢 Clubhouse booking deposits <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handlePresetQuestion('Where should visitor vehicles park?')}
                  className="text-left p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/10 hover:border-primary/20 transition-all flex justify-between items-center cursor-pointer"
                >
                  🚗 Visitor parking limits <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handlePresetQuestion('What is the schedule for door waste collection?')}
                  className="text-left p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/10 hover:border-primary/20 transition-all flex justify-between items-center cursor-pointer"
                >
                  ♻️ Waste segregation rules <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* CHAT INPUT BAR */}
          <div className="border-t border-border bg-card p-4">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Ask AI about timings, guidelines, schedules..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={sending}
                className="flex-1"
                required
              />
              <Button type="submit" size="icon" disabled={sending || !query.trim()} className="cursor-pointer">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
