'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Zap, Send, FileText, Image as ImageIcon, Sparkles, User, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string; // Optional base64 or URL for display
}

export default function TutorPage() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome! I am Gemma, your elite Socratic AI coach. I can help guide your thinking, explain complex engineering topics, analyze uploaded PDFs, or inspect diagrams. Ask me anything!' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isLoading]);

  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;
    setUploadingDoc(true);
    setUploadProgress(10);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      
      // Upload PDF to Supabase storage
      await supabase.storage.from('documents').upload(`files/${fileName}`, file);
      setUploadProgress(40);

      const { data } = supabase.storage.from('documents').getPublicUrl(`files/${fileName}`);
      
      // Parse PDF client-side securely
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;
      const pdf = await pdfjsLib.getDocument(data.publicUrl).promise;
      setUploadProgress(60);

      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      setUploadProgress(80);

      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += 1000) {
        chunks.push(text.slice(i, i + 1000));
      }

      // Securely store embeddings using our backend FastAPI endpoint
      for (let i = 0; i < chunks.length; i++) {
        await api.embedAndStore(chunks[i], userId, undefined, file.name);
        setUploadProgress(80 + Math.floor((i / chunks.length) * 20));
      }
      
      setUploadProgress(100);
      setHistory(prev => [
        ...prev,
        { role: 'model', text: `Successfully indexed: **${file.name}**. I've digested it into my semantic brain. Ask me questions about it!` }
      ]);
    } catch (err) {
      console.error(err);
      alert('Error parsing or embedding file. Please check backend is healthy.');
    }
    setUploadingDoc(false);
    setUploadProgress(0);
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      const userMsg: ChatMessage = {
        role: 'user',
        text: `Uploaded diagram: ${file.name}`,
        image: base64Image
      };
      setHistory(prev => [...prev, userMsg]);
      
      try {
        // Send file directly to backend Gemini Vision endpoint
        const res = await api.uploadTutorImage(file);
        setHistory(prev => [
          ...prev,
          { role: 'model', text: `Here is my detailed analysis of the image:\n\n${res.analysis}\n\nHow would you like to build on this?` }
        ]);
      } catch (err) {
        console.error(err);
        setHistory(prev => [
          ...prev,
          { role: 'model', text: 'Error analyzing image. Please ensure your Gemini Vision API key is correct and valid.' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: message };
    const currentHistory = [...history];
    setHistory([...currentHistory, userMsg]);
    setMessage('');
    setIsLoading(true);
    try {
      const backendHistory = currentHistory.map(h => ({
        role: h.role,
        text: h.text
      }));
      
      // Let the backend do all the heavy lifting (RAG semantic search + prompt formatting)
      const res = await api.chatTutor(
        'General Socratic Learning Room',
        'Advanced Topic Discussion',
        userMsg.text,
        backendHistory,
        userId || undefined
      );

      setHistory([
        ...currentHistory,
        userMsg,
        { role: 'model', text: res.response || JSON.stringify(res) }
      ]);
    } catch (err) {
      console.error(err);
      setHistory([
        ...currentHistory,
        userMsg,
        { role: 'model', text: 'Error: Could not reach the FastAPI tutor endpoint. Check backend server console.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col animate-fade-in p-6 bg-gradient-to-b from-background via-background/95 to-secondary/10">
      <div className="max-w-5xl mx-auto w-full flex flex-1 flex-col">
        {/* Tutor Header Card */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-xl rounded-3xl p-6 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <GraduationCap size={28} className="text-primary-foreground animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Socratic Coach Room</h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <Sparkles size={12} /> Gemma 4 IT
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Secure RAG & Multimodal Learning Workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* PDF Upload */}
              <label className="flex flex-1 md:flex-initial cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/80 hover:bg-secondary px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md active:scale-95">
                <FileText size={18} className="text-primary" />
                <span>{uploadingDoc ? 'Index...' : 'Upload PDF'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={uploadFile} disabled={uploadingDoc} />
              </label>

              {/* Image Upload */}
              <label className="flex flex-1 md:flex-initial cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/80 hover:bg-secondary px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md active:scale-95">
                <ImageIcon size={18} className="text-accent" />
                <span>Multimodal</span>
                <input type="file" accept="image/*" className="hidden" onChange={uploadImage} disabled={isLoading || uploadingDoc} />
              </label>
            </div>
          </div>

          {uploadingDoc && (
            <div className="mt-4 animate-pulse">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Ingesting document into vector DB...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}
        </Card>

        {/* Chat Interface */}
        <Card className="flex-1 flex flex-col border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl min-h-[500px]">
          <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
            {/* Timeline */}
            <ScrollArea className="flex-1 pr-4">
              <div className="flex flex-col gap-6 py-2">
                {history.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-4 max-w-[85%] ${
                      msg.role === 'model' ? 'self-start' : 'self-end flex-row-reverse'
                    }`}
                  >
                    {/* Icon/Avatar */}
                    <div
                      className={`flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl shadow-sm ${
                        msg.role === 'model'
                          ? 'bg-gradient-to-br from-primary to-accent text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {msg.role === 'model' ? <GraduationCap size={18} /> : <User size={18} />}
                    </div>

                    {/* Bubble Content */}
                    <div className="flex flex-col gap-2">
                      {msg.image && (
                        <div className="rounded-2xl overflow-hidden border border-border/80 max-w-sm shadow-md">
                          <img src={msg.image} alt="Uploaded attachment" className="w-full h-auto object-cover" />
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-5 py-3.5 text-base leading-relaxed ${
                          msg.role === 'model'
                            ? 'bg-secondary/40 text-foreground border border-border/20 rounded-tl-[4px]'
                            : 'bg-primary text-primary-foreground rounded-tr-[4px] shadow-lg shadow-primary/10'
                        }`}
                      >
                        {msg.text.split('\n').map((line, idx) => (
                          <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4 self-start max-w-[80%]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm">
                      <GraduationCap size={18} className="animate-spin" />
                    </div>
                    <div className="bg-secondary/40 border border-border/20 rounded-2xl rounded-tl-[4px] px-5 py-3.5 text-sm text-muted-foreground italic flex items-center gap-2">
                      <Sparkles size={16} className="text-primary animate-pulse" />
                      Gemma is formulating a Socratic response...
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input Controls */}
            <div className="mt-4 flex gap-3 border border-border/50 bg-secondary/30 p-2 rounded-2xl">
              <input
                type="text"
                className="flex-1 bg-transparent px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/60"
                placeholder="Discuss code, upload files, or ask complex questions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !message.trim()} className="rounded-xl px-5 h-12 shadow-lg hover:shadow-xl active:scale-95 transition-all">
                <Send size={18} className="mr-1.5" />
                <span>Send</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
