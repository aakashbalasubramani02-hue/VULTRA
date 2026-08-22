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
      color: 'text-cyan-400',
      badge: 'Context Ingestion',
      description:
        'Small organisations register their active technology stacks, installed versions, business services, network exposures (internet-facing vs internal), and business criticalities.',
    },
    {
      step: '02',
      title: 'Canonical Normalisation & Alias Registry',
      icon: Filter,
      color: 'text-blue-400',
      badge: 'Alias Resolution',
      description:
        'Resolves product variations and informal aliases (e.g., "waf" → "Web Application Firewall", "idp" → "Identity Provider SaaS") to ensure reliable matching.',
    },
    {
      step: '03',
      title: 'Candidate Filtering & Explicit Outcome Matching',
      icon: HelpCircle,
      color: 'text-amber-400',
      badge: 'Candidate Isolation',
      description:
        'Vulnerabilities are evaluated into explicit categories: MATCH, NEEDS_VERIFICATION, EXCLUDE, or NOT_AFFECTED. Only relevant items enter the priority ranking.',
    },
    {
      step: '04',
      title: '5-Signal Deterministic Multi-Factor Scoring',
      icon: Activity,
      color: 'text-rose-400',
      badge: '0–100 Point Share Model',
      description:
        'Combines CISA KEV active exploitation (35%), FIRST EPSS probability (25%), CVSS base score (15%), Asset Exposure (15%), and Service Criticality (10%).',
    },
    {
      step: '05',
      title: 'Explainability & Plain-Language Guidance',
      icon: Sparkles,
      color: 'text-indigo-400',
      badge: 'Consequence-First',
      description:
        'Translates complex CVE descriptions into business-impact titles, plain-English "Why This Matters" justifications, and safe, conservative defensive next steps.',
    },
    {
      step: '06',
      title: 'Audit Provenance & Source Traceability',
      icon: FileCheck,
      color: 'text-emerald-400',
      badge: 'Zero-AI Fact Guard',
      description:
        'Every decision retains immutable links to the source snapshot date, raw metric values, and official NVD advisory references with zero data hallucination.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-4 cyber-grid">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
              Deterministic Decision Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              VULTRA Triage Methodology
            </h1>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          VULTRA is designed around the core principle: <strong className="text-cyan-300 font-bold">Severity is one signal — not the decision.</strong> By evaluating organisation-specific context alongside empirical threat data, VULTRA reduces hundreds of noisy alerts down to five defensible actions.
        </p>
      </div>

      {/* 5-Signal Formula Breakdown */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>The 5-Signal Deterministic Formula</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Scores scale strictly from 0 to 100 points based on validated mathematical weights.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 font-bold">ACTIVE THREAT</span>
              <span className="font-mono font-extrabold text-rose-400 text-sm">35 pts max</span>
            </div>
            <h4 className="font-bold text-white text-sm">CISA KEV</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Confirmed active weaponisation and in-the-wild exploitation by adversaries.
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 font-bold">PROBABILITY</span>
              <span className="font-mono font-extrabold text-amber-400 text-sm">25 pts max</span>
            </div>
            <h4 className="font-bold text-white text-sm">FIRST EPSS</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Empirical statistical probability (0–100%) of exploitation in the next 30 days.
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 font-bold">TECHNICAL BASE</span>
              <span className="font-mono font-extrabold text-orange-400 text-sm">15 pts max</span>
            </div>
            <h4 className="font-bold text-white text-sm">CVSS Base Score</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Standardised technical severity metric (0.0–10.0) from vulnerability disclosures.
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 font-bold">PERIMETER</span>
              <span className="font-mono font-extrabold text-cyan-400 text-sm">15 pts max</span>
            </div>
            <h4 className="font-bold text-white text-sm">Asset Exposure</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Attack surface reachability: Internet-Facing (1.0x), Internal (0.6x), Air-Gapped (0.2x).
            </p>
          </div>

          <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 font-bold">CRITICALITY</span>
              <span className="font-mono font-extrabold text-indigo-400 text-sm">10 pts max</span>
            </div>
            <h4 className="font-bold text-white text-sm">Service Importance</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Business importance: Critical (1.0x), High (0.8x), Medium (0.5x), Low (0.2x).
            </p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Architecture Pipeline */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span>End-to-End Decision Pipeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Six-stage transformation from raw public vulnerability signals to defensible actions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-extrabold text-xs text-slate-500">{st.step}</span>
                    <Icon className={`h-4 w-4 ${st.color}`} />
                    <span className="font-bold text-white text-xs sm:text-sm">{st.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {st.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-7">{st.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase 5: Local AI Copilot & Fact Guard Architecture */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" />
              <span>VULTRA Copilot & Source-Bound Fact Guard (Phase 5)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              AI translates structured evidence into plain English without making cybersecurity decisions.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Source-Bound Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
              <Layers className="h-4 w-4" />
              <span>1. Structured Evidence Input</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The local LLM receives ONLY structured facts from the deterministic engine (CVE, CVSS, KEV flag, EPSS rate, service context). It never determines ranking.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
              <Cpu className="h-4 w-4" />
              <span>2. Local Offline Runtime</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Runs strictly locally via Ollama with zero paid cloud API dependencies. If Ollama is offline or times out, the system automatically uses deterministic fallback.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
              <ShieldCheck className="h-4 w-4" />
              <span>3. Deterministic Fact Guard</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Every generated explanation is audited against source facts. Hallucinated CVE IDs, false KEV claims, and offensive exploit commands are rejected.
            </p>
          </div>
        </div>

        {/* Safety Notice Box */}
        <div className="p-4.5 rounded-2xl bg-slate-950 border border-slate-800/90 text-xs flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-slate-400 leading-relaxed text-[11px] font-mono">
            <strong className="text-slate-200">SAFETY ASSURANCE: </strong>
            AI explanations are informational summaries of supplied evidence. They do not determine vulnerability priority and do not establish that an organisation is secure.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
