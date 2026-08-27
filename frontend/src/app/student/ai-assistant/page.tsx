'use client';

import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  Brain,
  Lightbulb,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { assistantAPI, AssistantMessage } from '@/services/api/assistant';

const welcomeMessage: AssistantMessage = {
  role: 'assistant',
  content: '### Welcome\nI only assist with education and student-learning questions. I can explain difficult topics, help with assignments, create revision plans, and suggest ways to improve your study routine.\n\n### Try asking\n- Explain a course concept in simple language.\n- Build a revision plan for an upcoming assessment.\n- Help me improve my concentration while studying.',
};

const promptGroups = [
  { label: 'Understand', icon: BookOpen, prompts: ['Explain this topic simply', 'Create a short practice quiz'] },
  { label: 'Plan', icon: Target, prompts: ['Create a 7-day revision plan', 'What should I study next?'] },
  { label: 'Focus', icon: Brain, prompts: ['How can I improve my focus?', 'Suggest a better study routine'] },
];

function AIAssistantContent() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    assistantAPI.getHistory()
      .then((response) => {
        if (active) setMessages(response.data.messages || []);
      })
      .catch(() => {
        if (active) toast.error('Previous assistant messages could not be loaded');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const frame = window.requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages, loading]);

  const visibleMessages = messages.length ? messages : [welcomeMessage];

  const handleSend = async (question = message) => {
    const content = question.trim();
    if (!content || loading) return;
    const optimistic: AssistantMessage = { role: 'user', content, createdAt: new Date().toISOString() };
    setMessage('');
    setMessages((previous) => [...previous, optimistic]);
    setLoading(true);
    try {
      const response = await assistantAPI.chat(content);
      setMessages((previous) => [...previous, { role: 'assistant', content: response.data.response, createdAt: new Date().toISOString() }]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'The study assistant is temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="universe-shell h-screen overflow-hidden">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="min-w-0 flex-1 p-4 md:p-6 xl:p-8 flex flex-col h-full overflow-hidden pb-20 lg:pb-8">


          <div className="flex-1 min-h-0">
            <section className="liquid-glass flex min-w-0 flex-col overflow-hidden rounded-3xl h-full">
              <div className="flex items-center justify-between border-b border-white/50 px-5 py-4 shrink-0">
                <div className="flex items-center gap-3"><div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary"><Bot className="h-5 w-5" /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" /></div><div><p className="text-sm font-extrabold text-heading">Eduvo Assistant</p><p className="text-xs text-body">Education and student learning only</p></div></div>
              </div>

              <div ref={messagesContainerRef} className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 md:p-6">
                {visibleMessages.map((item, index) => (
                  <MessageBubble key={item._id || `${item.role}-${index}`} message={item} />
                ))}
                {!messages.length && (
                  <div className="grid gap-3 sm:grid-cols-3 md:pl-12">
                    {promptGroups.map((group) => (
                      <div key={group.label} className="rounded-2xl border border-white/60 bg-white/35 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-heading"><group.icon className="h-4 w-4 text-primary" />{group.label}</div>
                        <div className="space-y-2">{group.prompts.map((prompt) => <button key={prompt} onClick={() => void handleSend(prompt)} className="block w-full rounded-xl bg-white/60 px-3 py-2 text-left text-xs leading-5 text-body transition hover:bg-primary/10 hover:text-heading">{prompt}</button>)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {loading && <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-secondary"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-md bg-white/55 px-4 py-3"><div className="flex items-center gap-2 text-sm text-body"><LoadingSpinner size="sm" /> Organising a helpful response…</div></div></div>}
              </div>

              <div className="border-t border-white/50 bg-white/20 p-4 md:p-5 shrink-0">
                <div className="liquid-control flex items-end gap-2 rounded-2xl p-2">
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={handleKeyDown} rows={1} maxLength={2000} placeholder="Ask about a course, assignment, exam, or study plan…" aria-label="Ask Eduvo Assistant" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-heading outline-none placeholder:text-body/70" />
                  <button onClick={() => void handleSend()} disabled={!message.trim() || loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-secondary shadow-md transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-5 w-5" /></button>
                </div>
                <div className="mt-2 flex justify-between px-1 text-[11px] text-body"><span>Enter to send · Shift+Enter for a new line</span><span>{message.length}/2000</span></div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-secondary"><Bot className="h-4 w-4" /></div>}
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 md:max-w-[76%] ${isUser ? 'rounded-tr-md bg-primary text-white' : 'rounded-tl-md border border-white/60 bg-white/55 text-heading'}`}>
        {isUser ? <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p> : <StructuredReply content={message.content} />}
        {message.createdAt && <p className={`mt-2 text-[10px] ${isUser ? 'text-white/55' : 'text-body/70'}`}>{new Date(message.createdAt).toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
      </div>
    </div>
  );
}

function StructuredReply({ content }: { content: string }) {
  return <div className="space-y-2 text-sm leading-6">{content.split('\n').map((line, index) => {
    const value = line.trim();
    if (!value) return <div key={index} className="h-1" />;
    if (value.startsWith('### ')) return <h3 key={index} className="pt-1 font-extrabold text-heading"><InlineMarkdown text={value.slice(4)} /></h3>;
    if (value.startsWith('## ')) return <h3 key={index} className="pt-1 text-base font-extrabold text-heading"><InlineMarkdown text={value.slice(3)} /></h3>;
    if (/^[-*] /.test(value)) return <div key={index} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><p><InlineMarkdown text={value.slice(2)} /></p></div>;
    if (/^\d+\. /.test(value)) return <p key={index} className="pl-1"><InlineMarkdown text={value} /></p>;
    return <p key={index}><InlineMarkdown text={value} /></p>;
  })}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return <>{parts.map((part, index): ReactNode => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-extrabold text-heading">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.9em] text-primary">{part.slice(1, -1)}</code>;
    }
    return part;
  })}</>;
}

export default function Page() {
  return <ProtectedRoute role="student"><AIAssistantContent /></ProtectedRoute>;
}
