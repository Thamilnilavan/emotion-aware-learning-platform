import Link from 'next/link';
import { Brain } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark-card py-12 text-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-2 text-white">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">EmoLearn</span>
          </div>
          <p className="text-sm">AI-powered emotion-aware adaptive learning for better outcomes.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Platform</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/register" className="hover:text-primary">Get Started</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Research</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/research/dashboard" className="hover:text-primary">Research Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 px-4 pt-8 text-center text-xs">
        © {new Date().getFullYear()} EmoLearn. BSc Software Engineering Final Year Project.
      </div>
    </footer>
  );
}
