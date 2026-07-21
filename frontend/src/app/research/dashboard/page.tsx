'use client';

import Link from 'next/link';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Database, BarChart3, GitCompare, FlaskConical } from 'lucide-react';

const researchLinks = [
  { href: '/research/datasets', icon: Database, title: 'Dataset Management', desc: 'FER2013, AffectNet, CK+, RAF-DB' },
  { href: '/research/training', icon: FlaskConical, title: 'Training Pipeline', desc: 'Preprocess, train, evaluate models' },
  { href: '/research/evaluation', icon: BarChart3, title: 'Model Evaluation', desc: 'Accuracy, precision, recall, F1' },
  { href: '/research/model-comparison', icon: GitCompare, title: 'Model Comparison', desc: 'Compare experimental results' },
];

function ResearchDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl p-4 md:p-8">
        <h1 className="mb-2 text-2xl font-extrabold text-heading">Research Dashboard</h1>
        <p className="mb-8 text-body">ML research tools for emotion recognition model development</p>
        <div className="grid gap-6 md:grid-cols-2">
          {researchLinks.map((link) => (
            <Link key={link.href} href={link.href} className="glass-card flex gap-4 p-6 transition-shadow hover:shadow-lg">
              <link.icon className="h-10 w-10 text-primary" />
              <div>
                <h3 className="font-bold text-heading">{link.title}</h3>
                <p className="text-sm text-body">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 glass-card p-6">
          <h3 className="mb-4 font-bold text-heading">Supported Datasets</h3>
          <div className="flex flex-wrap gap-3">
            {['FER2013', 'AffectNet', 'CK+', 'RAF-DB'].map((ds) => (
              <span key={ds} className="rounded-xl bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">{ds}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Page() {
  return <ProtectedRoute><ResearchDashboard /></ProtectedRoute>;
}
