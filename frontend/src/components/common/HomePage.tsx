'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Eye, Zap, Shield, Star, Menu, X } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';

const features = [
  { icon: Brain, title: 'Emotion Detection', desc: 'CNN model trained on FER2013 detects 7 emotions in real-time from your webcam.' },
  { icon: Eye, title: 'Attention Tracking', desc: 'MediaPipe head pose estimation monitors whether you are focused on learning content.' },
  { icon: Zap, title: 'Adaptive Responses', desc: 'Smart interventions — nudges, alerts, pauses, and breaks — adapt to your engagement state.' },
];

const steps = [
  'Open your webcam',
  'Start a learning session',
  'AI monitors in background',
  'System adapts to your state',
  'Review your progress',
];

const testimonials = [
  { name: 'Sarah M.', role: 'Computer Science Student', text: 'EmoLearn helped me understand when I lose focus. The break reminders are a game changer.' },
  { name: 'Dr. James K.', role: 'Lecturer', text: 'Early warning alerts let me support struggling students before they fall behind.' },
  { name: 'Alex T.', role: 'Software Engineering', text: 'Privacy-first design gave me confidence to enable webcam monitoring during study.' },
];

export function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 z-50 w-full bg-dark-card/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <Brain className="h-7 w-7 text-primary" />
            EmoLearn
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-white/70 hover:text-white">Features</a>
            <a href="#how-it-works" className="text-sm text-white/70 hover:text-white">How It Works</a>
            <a href="#privacy" className="text-sm text-white/70 hover:text-white">Privacy</a>
            <Link href="/login" className="text-sm text-white/70 hover:text-white">Sign In</Link>
            <Link href="/register" className="rounded-2xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover">Get Started</Link>
          </div>
          <button className="text-white md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenu && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <a href="#features" className="block py-2 text-white/70" onClick={() => setMobileMenu(false)}>Features</a>
            <Link href="/login" className="block py-2 text-white/70">Sign In</Link>
            <Link href="/register" className="mt-2 block rounded-2xl bg-primary py-2 text-center text-white">Get Started</Link>
          </div>
        )}
      </nav>

      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-card via-[#1a1a36] to-primary/30" />
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-secondary/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl font-extrabold leading-tight text-white md:text-6xl lg:text-7xl"
          >
            AI-Powered Learning<br />That Adapts To You
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-10 max-w-2xl text-lg text-white/70 md:text-xl"
          >
            Real-time emotion recognition, attention tracking and adaptive interventions designed to improve online learning outcomes.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-2xl bg-primary px-8 py-4 font-semibold text-white shadow-lg hover:bg-primary-hover">Start Learning</Link>
            <a href="#how-it-works" className="rounded-2xl border border-white/30 px-8 py-4 font-semibold text-white hover:bg-white/10">View Demo</a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-16 flex justify-center gap-4 text-5xl">
            {['🧠', '👁️', '📊', '⚡'].map((e, i) => (
              <motion.span key={i} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}>{e}</motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-primary py-8 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {[
            { value: '7', label: 'Emotions Detected' },
            { value: '30s', label: 'AI Window' },
            { value: '0', label: 'Video Stored' },
            { value: '3', label: 'User Roles' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold md:text-4xl">{s.value}</p>
              <p className="text-sm text-white/80">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-heading md:text-4xl">How It Works</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8"
              >
                <f.icon className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-bold text-heading">{f.title}</h3>
                <p className="text-body">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-dark-card py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold">5 Steps to Smarter Learning</h2>
          <div className="grid gap-6 md:grid-cols-5">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold">{i + 1}</div>
                <p className="text-sm text-white/80">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-heading">AI Capabilities</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {['Happy', 'Neutral', 'Sad', 'Angry', 'Fearful', 'Disgusted', 'Surprised', 'Engagement Score'].map((item) => (
              <div key={item} className="glass-card p-6 text-center">
                <p className="font-bold text-heading">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-dark-card/5 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-heading">Research Innovation</h2>
          <p className="mx-auto mb-8 max-w-2xl text-center text-body">
            Built on FER2013, AffectNet, CK+, and RAF-DB datasets with full training pipeline, model evaluation, and comparison tools for academic research.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {['FER2013', 'AffectNet', 'CK+', 'RAF-DB'].map((ds) => (
              <span key={ds} className="rounded-2xl bg-primary/10 px-6 py-3 font-semibold text-primary">{ds}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <Shield className="mx-auto mb-6 h-16 w-16 text-primary" />
          <h2 className="mb-6 text-3xl font-extrabold text-heading">Privacy First</h2>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-3">
            {['No video stored — ever', 'GDPR compliant design', 'Full data control & deletion'].map((p) => (
              <div key={p} className="glass-card p-6">
                <p className="font-semibold text-heading">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-extrabold text-heading">Testimonials</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="glass-card p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
                </div>
                <p className="mb-4 text-body">&ldquo;{t.text}&rdquo;</p>
                <p className="font-semibold text-heading">{t.name}</p>
                <p className="text-sm text-body">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-primary to-secondary py-20 text-center text-white">
        <h2 className="mb-6 text-3xl font-extrabold">Ready to learn smarter?</h2>
        <Link href="/register" className="inline-block rounded-2xl bg-white px-8 py-4 font-semibold text-primary hover:bg-white/90">Create Free Account</Link>
      </section>

      <Footer />
    </div>
  );
}
