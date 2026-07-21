import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Link href="/" className="mb-8 inline-block text-primary hover:underline">← Back to Home</Link>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-extrabold text-heading">Privacy Policy</h1>
        </div>
        <div className="glass-card space-y-6 p-8 text-body">
          <section>
            <h2 className="mb-2 text-lg font-bold text-heading">Data Collection</h2>
            <p>EmoLearn collects emotion labels, attention scores, and engagement metrics during learning sessions. Raw webcam video is processed in server memory only and is never stored to disk.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold text-heading">Consent</h2>
            <p>Explicit consent is required before any monitoring begins. You can withdraw consent and delete all your data at any time from Privacy Settings.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold text-heading">Data Retention</h2>
            <p>Session data is retained for 6 months after your last session, then permanently deleted automatically.</p>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-bold text-heading">Your Rights</h2>
            <p>You have the right to access, export, and delete your personal data. Admin exports are always anonymised using MD5 hashing.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
