'use client';

import { useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

function AIAssistantContent() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: 'assistant', content: 'Hi! I\'m your AI Study Assistant. I can help you with study tips, revision suggestions, and learning recommendations. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');
    setMessages([...messages, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Simulate AI response (replace with actual AI API call)
    setTimeout(() => {
      const responses = [
        'Based on your recent sessions, I recommend focusing on time management techniques to improve your engagement.',
        'Try breaking your study sessions into 25-minute focused intervals with 5-minute breaks.',
        'Your emotion patterns suggest you learn best in the morning. Consider scheduling important topics then.',
        'I noticed you struggle with attention during long sessions. Try shorter, more frequent study periods.',
        'Great question! Based on your progress, you should revise the fundamentals before moving to advanced topics.',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
      setLoading(false);
    }, 1500);
  };

  const quickQuestions = [
    'How can I improve my focus?',
    'What should I study next?',
    'Give me study tips',
    'Analyze my learning patterns',
  ];

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="mb-8 flex items-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-extrabold text-heading">AI Study Assistant</h1>
              <p className="text-sm text-body">Get personalized learning guidance</p>
            </div>
          </div>

          {/* Chat Container */}
          <div className="glass-card mb-4 flex h-[500px] flex-col rounded-xl">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-heading'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                    <LoadingSpinner size="sm" />
                    <p className="text-sm text-body">Thinking...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask me anything about your learning..."
                  className="flex-1 rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm text-heading placeholder:text-body focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || loading}
                  className="rounded-xl bg-primary px-4 py-3 text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Questions */}
          <div className="glass-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-heading">Quick Questions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => setMessage(question)}
                  className="rounded-full border border-white/20 bg-muted/50 px-4 py-2 text-sm text-heading hover:bg-primary/20"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <AIAssistantContent />
    </ProtectedRoute>
  );
}
