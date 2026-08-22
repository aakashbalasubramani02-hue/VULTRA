import React from 'react';
import {
  BookOpen,
  Layers,
  Filter,
  Activity,
  Sparkles,
  FileCheck,
  HelpCircle,
  ShieldCheck,
  Bot,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const MethodologyView: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Organisation Profile & Technology Inventory',
      icon: Layers,
      color: 'text-[#00E5FF]',
      badge: 'Context Ingestion',
      description:
        'Small organisations register their active technology stacks, installed versions, business services, network exposures (internet-facing vs internal), and business criticalities.',
    },
    {
      step: '02',
      title: 'Canonical Normalisation & Alias Registry',
      icon: Filter,
      color: 'text-[#00daf3]',
      badge: 'Alias Resolution',
      description:
        'Resolves product variations and informal aliases (e.g., "waf" → "Web Application Firewall", "idp" → "Identity Provider SaaS") to ensure reliable matching.',
    },
    {
      step: '03',
      title: 'Candidate Filtering & Explicit Outcome Matching',
      icon: HelpCircle,
      color: 'text-[#FFCC00]',
      badge: 'Candidate Isolation',
      description:
        'Vulnerabilities are evaluated into explicit categories: MATCH, NEEDS_VERIFICATION, EXCLUDE, or NOT_AFFECTED. Only relevant items enter the priority ranking.',
    },
    {
      step: '04',
      title: '5-Signal Deterministic Multi-Factor Scoring',
      icon: Activity,
      color: 'text-[#FF3B30]',
      badge: '0–100 Point Share Model',
      description:
        'Combines CISA KEV active exploitation (35%), FIRST EPSS probability (25%), CVSS base score (15%), Asset Exposure (15%), and Service Criticality (10%).',
    },
    {
      step: '05',
      title: 'Explainability & Plain-Language Guidance',
      icon: Sparkles,
      color: 'text-[#c3f5ff]',
      badge: 'Consequence-First',
      description:
        'Translates complex CVE descriptions into business-impact titles, plain-English "Why This Matters" justifications, and safe, conservative defensive next steps.',
    },
    {
      step: '06',
      title: 'Audit Provenance & Source Traceability',
      icon: FileCheck,
      color: 'text-[#00E5FF]',
      badge: 'Zero-AI Fact Guard',
      description:
        'Every decision retains immutable links to the source snapshot date, raw metric values, and official NVD advisory references with zero data hallucination.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-12"
    >
      {/* Editorial Header Banner */}
      <header className="border-b border-[#1E2530] pb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center text-[#00E5FF]">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-label-caps font-bold uppercase tracking-widest text-[#00E5FF]">
              Deterministic Decision Architecture
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#F5F7FA]">
              VULTRA Triage Methodology
            </h1>
          </div>
        </div>

        <p className="font-body-lg text-[#bac9cc] max-w-3xl leading-relaxed">
          VULTRA is designed around the core principle: <strong className="text-[#00E5FF] font-bold">Severity is one signal — not the decision.</strong> By evaluating organisation-specific context alongside empirical threat data, VULTRA reduces hundreds of noisy alerts down to five defensible actions.
        </p>
      </header>

      {/* 5-Signal Formula Breakdown */}
      <section className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
        <div className="border-b border-[#1E2530] pb-4">
          <h2 className="font-headline-md text-xl font-bold text-[#F5F7FA] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00E5FF]" />
            <span>The 5-Signal Deterministic Formula</span>
          </h2>
          <p className="text-xs text-[#606D7A] mt-1 font-mono">
            Scores scale strictly from 0 to 100 points based on validated mathematical weights.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[9px] text-[#606D7A] font-bold uppercase">ACTIVE THREAT</span>
              <span className="font-mono font-bold text-[#FF3B30] text-sm">35 pts max</span>
            </div>
            <h4 className="font-bold text-[#F5F7FA] text-sm">CISA KEV</h4>
            <p className="text-[#bac9cc] leading-relaxed text-[11px]">
              Confirmed active weaponisation and in-the-wild exploitation by adversaries.
            </p>
          </div>

          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[9px] text-[#606D7A] font-bold uppercase">PROBABILITY</span>
              <span className="font-mono font-bold text-[#FF9500] text-sm">25 pts max</span>
            </div>
            <h4 className="font-bold text-[#F5F7FA] text-sm">FIRST EPSS</h4>
            <p className="text-[#bac9cc] leading-relaxed text-[11px]">
              Empirical statistical probability (0–100%) of exploitation in the next 30 days.
            </p>
          </div>

          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[9px] text-[#606D7A] font-bold uppercase">TECHNICAL BASE</span>
              <span className="font-mono font-bold text-[#FFCC00] text-sm">15 pts max</span>
            </div>
            <h4 className="font-bold text-[#F5F7FA] text-sm">CVSS Base Score</h4>
            <p className="text-[#bac9cc] leading-relaxed text-[11px]">
              Standardised technical severity metric (0.0–10.0) from vulnerability disclosures.
            </p>
          </div>

          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[9px] text-[#606D7A] font-bold uppercase">PERIMETER</span>
              <span className="font-mono font-bold text-[#00E5FF] text-sm">15 pts max</span>
            </div>
            <h4 className="font-bold text-[#F5F7FA] text-sm">Asset Exposure</h4>
            <p className="text-[#bac9cc] leading-relaxed text-[11px]">
              Attack surface reachability: Internet-Facing (1.0x), Internal (0.6x), Air-Gapped (0.2x).
            </p>
          </div>

          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[9px] text-[#606D7A] font-bold uppercase">CRITICALITY</span>
              <span className="font-mono font-bold text-[#c3f5ff] text-sm">10 pts max</span>
            </div>
            <h4 className="font-bold text-[#F5F7FA] text-sm">Service Criticality</h4>
            <p className="text-[#bac9cc] leading-relaxed text-[11px]">
              Business importance: Critical (1.0x), High (0.8x), Medium (0.5x), Low (0.2x).
            </p>
          </div>
        </div>
      </section>

      {/* Step-by-Step Architecture Pipeline */}
      <section className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
        <div className="border-b border-[#1E2530] pb-4">
          <h2 className="font-headline-md text-xl font-bold text-[#F5F7FA] flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#00E5FF]" />
            <span>End-to-End Decision Pipeline</span>
          </h2>
          <p className="text-xs text-[#606D7A] mt-1 font-mono">
            Six-stage transformation from raw public vulnerability signals to defensible actions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="p-5 bg-[#0c0e12] border border-[#1E2530] hover:border-[#3b494c] transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-[#606D7A]">{st.step}</span>
                    <Icon className={`h-4 w-4 ${st.color}`} />
                    <span className="font-bold text-[#F5F7FA] text-xs sm:text-sm">{st.title}</span>
                  </div>
                  <span className="text-[10px] font-label-caps font-bold px-2 py-0.5 bg-[#191c20] text-[#bac9cc] border border-[#3b494c]">
                    {st.badge}
                  </span>
                </div>
                <p className="text-xs text-[#bac9cc] leading-relaxed pl-7">{st.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Phase 5: Local AI Copilot & Fact Guard Architecture */}
      <section className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
        <div className="border-b border-[#1E2530] pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline-md text-xl font-bold text-[#F5F7FA] flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#00E5FF]" />
              <span>VULTRA Copilot & Source-Bound Fact Guard</span>
            </h2>
            <p className="text-xs text-[#606D7A] mt-1 font-mono">
              AI translates structured evidence into plain English without making cybersecurity decisions.
            </p>
          </div>
          <span className="text-[10px] font-label-caps font-bold px-3 py-1 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 uppercase">
            Source-Bound Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-2">
            <div className="flex items-center gap-2 text-[#00E5FF] font-bold font-label-caps uppercase text-[11px]">
              <Layers className="h-3.5 w-3.5" />
              <span>1. Structured Evidence Input</span>
            </div>
            <p className="text-[#bac9cc] leading-relaxed text-[12px]">
              The local LLM receives ONLY structured facts from the deterministic engine (CVE, CVSS, KEV flag, EPSS rate, service context). It never determines ranking.
            </p>
          </div>

          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-2">
            <div className="flex items-center gap-2 text-[#FF9500] font-bold font-label-caps uppercase text-[11px]">
              <Cpu className="h-3.5 w-3.5" />
              <span>2. Local Offline Runtime</span>
            </div>
            <p className="text-[#bac9cc] leading-relaxed text-[12px]">
              Runs strictly locally via Ollama with zero paid cloud API dependencies. If Ollama is offline or times out, the system automatically uses deterministic fallback.
            </p>
          </div>

          <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-2">
            <div className="flex items-center gap-2 text-[#00daf3] font-bold font-label-caps uppercase text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>3. Deterministic Fact Guard</span>
            </div>
            <p className="text-[#bac9cc] leading-relaxed text-[12px]">
              Every generated explanation is audited against source facts. Hallucinated CVE IDs, false KEV claims, and offensive exploit commands are rejected.
            </p>
          </div>
        </div>

        {/* Safety Notice Box */}
        <div className="p-4 bg-[#0c0e12] border border-[#1E2530] text-xs flex items-start gap-3">
          <ShieldAlert className="h-4 w-4 text-[#00E5FF] shrink-0 mt-0.5" />
          <p className="text-[#606D7A] leading-relaxed text-[11px] font-mono">
            <strong className="text-[#bac9cc]">SAFETY ASSURANCE: </strong>
            AI explanations are informational summaries of supplied evidence. They do not determine vulnerability priority and do not establish that an organisation is secure.
          </p>
        </div>
      </section>
    </motion.div>
  );
};
