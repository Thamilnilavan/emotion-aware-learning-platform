'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Menu, X, ChevronRight, BarChart3, Shield, Zap, Lock, Eye, CheckCircle2, Play } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { BrandLogo } from '@/components/common/BrandLogo';

// --- Pro Dashboard Widget ---

const ProDashboardMockup = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [dataPoints, setDataPoints] = useState([60, 65, 58, 72, 85, 90, 88, 92]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataPoints(prev => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 20) + 75];
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5 backdrop-blur-3xl">
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between border-b border-white/5 bg-white/[0.02] px-6">
        <div className="flex gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
          <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
        </div>
        <div className="flex gap-4 text-xs font-medium text-white/40">
          {['Overview', 'Analytics', 'Interventions'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`transition-colors ${activeTab === tab ? 'text-white' : 'hover:text-white/80'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          Live Sync
        </div>
      </div>

      <div className="p-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-white/50 uppercase">Session Engagement</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-light text-white">94%</span>
              <span className="text-sm font-medium text-success">+2.4%</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1.5 pl-2 pr-4 text-sm text-white/80">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Brain className="h-3 w-3" />
            </div>
            Optimum Focus
          </div>
        </div>

        {/* Minimalist Chart */}
        <div className="relative mb-6 h-32 w-full flex items-end gap-2">
          {dataPoints.map((val, i) => (
            <motion.div 
              key={i}
              layout
              className="relative w-full rounded-t-sm bg-primary/20 transition-all"
              style={{ height: `${val}%` }}
            >
              <motion.div 
                layout
                className="absolute top-0 w-full rounded-t-sm bg-primary"
                style={{ height: '2px' }}
              />
            </motion.div>
          ))}
          {/* Faded overlay at bottom */}
          <div className="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Emotion', value: 'Focused', sub: 'Stable' },
            { label: 'Attention', value: 'High', sub: '92/100' },
            { label: 'Fatigue', value: 'Low', sub: 'No action' }
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
              <span className="text-xs font-medium text-white/40">{stat.label}</span>
              <p className="mt-1 font-semibold text-white/90">{stat.value}</p>
              <p className="mt-1 text-xs text-white/30">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="public-cosmic-page min-h-screen text-white selection:bg-primary/30 selection:text-white font-sans antialiased">
      {/* Sleek Mesh Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-[100%] bg-primary/20 blur-[150px] opacity-70 mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-[100%] bg-primary/15 blur-[120px] opacity-60 mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[10%] w-[40%] h-[40%] rounded-[100%] bg-blue-500/10 blur-[120px] opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 z-50 w-full transition-all duration-500 ${scrolled ? 'bg-[#050505]/80 py-4 shadow-2xl backdrop-blur-xl border-b border-white/5' : 'bg-transparent py-6'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
            <BrandLogo priority imageClassName="h-12 w-12" nameClassName="text-lg text-white" />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-white/60 transition-colors hover:text-white">Product</a>
            <a href="#bento" className="text-sm text-white/60 transition-colors hover:text-white">Features</a>
            <a href="#security" className="text-sm text-white/60 transition-colors hover:text-white">Security</a>
            <div className="h-4 w-[1px] bg-white/10" />
            <Link href="/login" className="text-sm font-medium text-white hover:text-white/80">Sign In</Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105 active:scale-95">
              Get Started
            </Link>
          </div>
          <button className="text-white/70 hover:text-white md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-16 lg:pt-48 lg:pb-32">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="mx-auto max-w-4xl">
            <motion.div variants={fadeIn} className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-md">
              <Zap className="mr-2 h-3 w-3 text-primary" />
              Meet Eduvo
            </motion.div>
            <motion.h1 variants={fadeIn} className="text-5xl font-medium tracking-tight sm:text-7xl lg:text-[5.5rem] leading-[1.05]">
              Learning That <br className="hidden sm:block" />
              <span className="text-white/50">Evolves With You.</span>
            </motion.h1>
            <motion.p variants={fadeIn} className="mt-8 mx-auto max-w-2xl text-lg text-white/50 sm:text-xl font-light leading-relaxed">
              Eduvo is an intelligent adaptive learning platform designed to understand learner behaviour and evolve the learning experience in real time.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-black shadow-lg transition-all hover:scale-105 sm:w-auto">
                Start learning
              </Link>
              <a href="#bento" className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/10 sm:w-auto">
                <Play className="h-4 w-4" />
                See how it works
              </a>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 flex justify-center perspective-1000"
          >
            <ProDashboardMockup />
          </motion.div>
        </div>
      </main>

      {/* Bento Box Grid Section */}
      <section id="bento" className="relative z-10 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Everything you need to deliver intelligent education.</h2>
            <p className="mt-4 text-lg text-white/50 font-light">Purpose-built features for students, educators, and administrators.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
            
            {/* Big Card 1 */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 lg:col-span-2 shadow-2xl transition-all hover:border-white/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <BarChart3 className="mb-6 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-2xl font-medium text-white">Educator Analytics</h3>
              <p className="max-w-md text-white/50 font-light leading-relaxed">
                Aggregated dashboards reveal exactly where your curriculum loses attention. Identify confusing segments instantly and adjust your teaching dynamically.
              </p>
              <div className="mt-8 flex gap-3">
                {['Real-time metrics', 'Historical trends'].map((tag, i) => (
                  <span key={i} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                    <CheckCircle2 className="mr-1.5 h-3 w-3 text-primary" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Square Card 1 */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl transition-all hover:border-white/20">
              <Eye className="mb-6 h-8 w-8 text-white/80" />
              <h3 className="mb-2 text-xl font-medium text-white">Focus Tracking</h3>
              <p className="text-white/50 font-light text-sm leading-relaxed">
                Advanced head-pose estimation monitors active attention without invasive eye-tracking hardware.
              </p>
            </div>

            {/* Square Card 2 */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl transition-all hover:border-white/20">
              <Brain className="mb-6 h-8 w-8 text-white/80" />
              <h3 className="mb-2 text-xl font-medium text-white">7 Core Emotions</h3>
              <p className="text-white/50 font-light text-sm leading-relaxed">
                Trained on FER2013 to accurately classify joy, anger, surprise, disgust, fear, sadness, and neutral states.
              </p>
            </div>

            {/* Big Card 2 */}
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 lg:col-span-2 shadow-2xl transition-all hover:border-white/20">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <Zap className="mb-6 h-8 w-8 text-blue-400" />
              <h3 className="mb-2 text-2xl font-medium text-white">Adaptive Interventions</h3>
              <p className="max-w-md text-white/50 font-light leading-relaxed">
                When fatigue develops or frustration increases, Eduvo can nudge the student, suggest a break, or offer a supportive next step.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Security & Tech */}
      <section id="security" className="relative z-10 border-t border-white/10 bg-[#050505]/65 py-24 backdrop-blur-sm sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-medium tracking-tight sm:text-4xl">Enterprise-grade privacy.</h2>
              <p className="mt-6 text-lg font-light text-white/50 leading-relaxed">
                We believe in zero-trust architecture. Video frames are processed in volatile memory and discarded instantly. Only mathematical vectors (engagement scores) are transmitted to the backend.
              </p>
              
              <dl className="mt-10 space-y-6">
                {[
                  { title: 'No storage, ever.', desc: 'We do not record, save, or cache video data anywhere in the pipeline.' },
                  { title: 'Explicit Consent', desc: 'Hardware access is strictly gated behind per-session user consent flows.' },
                  { title: 'Fail-safe Edge AI', desc: 'Preprocessing happens directly in the browser via MediaPipe, reducing payload size and increasing security.' }
                ].map((item, i) => (
                  <div key={i} className="relative pl-9">
                    <dt className="inline font-medium text-white">
                      <Lock className="absolute left-1 top-1 h-5 w-5 text-white/30" />
                      {item.title}
                    </dt>
                    <dd className="inline text-white/50 font-light ml-2">{item.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>
            
            {/* Visual */}
            <div className="relative aspect-square w-full rounded-[3rem] border border-white/10 bg-[#0a0a0a] overflow-hidden flex items-center justify-center shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div className="relative h-64 w-64 rounded-full border border-white/5 flex items-center justify-center">
                 <div className="absolute h-full w-full rounded-full border-t border-white/20 animate-spin" style={{ animationDuration: '8s' }} />
                 <div className="absolute h-[80%] w-[80%] rounded-full border border-white/5 flex items-center justify-center">
                    <div className="absolute h-full w-full rounded-full border-b border-primary/40 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
                    <Shield className="h-12 w-12 text-white/80" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-32 border-t border-white/5 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-4xl font-medium tracking-tight sm:text-5xl">Ready to upgrade your LMS?</h2>
          <p className="mt-6 text-lg font-light text-white/50">Experience the future of emotion-aware education today.</p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/register" className="rounded-full bg-white px-8 py-3.5 text-sm font-medium text-black transition-transform hover:scale-105">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
