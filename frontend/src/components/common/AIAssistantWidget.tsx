'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { assistantAPI } from '@/services/api/assistant';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi there! I am your AI learning assistant. How can I help you today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create context payload (omitting the id for the API)
      const payload = messages.concat(userMessage).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await assistantAPI.chat(payload);
      
      if (res.data.success) {
        setMessages(prev => [
          ...prev, 
          { id: (Date.now() + 1).toString(), role: 'assistant', content: res.data.response }
        ]);
      } else {
        toast.error('Failed to get response from AI');
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Could not connect to the AI assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-primary/50",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <MessageCircle className="h-7 w-7" />
        <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger">
          <Sparkles className="h-2.5 w-2.5 text-white" />
        </div>
      </button>

      {/* Chat Window */}
      <div 
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-[600px] max-h-[80vh] w-[400px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/90 shadow-2xl backdrop-blur-3xl transition-all duration-300 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Gemini Assistant</h3>
              <p className="text-xs text-white/50">Powered by Google AI</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cn(
                  "flex max-w-[80%] gap-3 rounded-2xl p-4",
                  msg.role === 'user' 
                    ? "bg-primary text-white rounded-br-sm" 
                    : "bg-white/5 text-white/90 border border-white/10 rounded-bl-sm"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'user' && (
                  <div className="mt-0.5 shrink-0">
                    <User className="h-4 w-4 text-white/70" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[80%] gap-3 rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 p-4 text-white/90">
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary animate-pulse" />
                <div className="flex items-center gap-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 bg-white/5 p-4">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="w-full rounded-full border border-white/10 bg-[#050505] py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:bg-white/10 disabled:text-white/30"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
