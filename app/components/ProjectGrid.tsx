'use client';
import React from 'react';
import { motion } from 'framer-motion';
import '@/app/styles/cyber-glow.css';

/* ── Types ─────────────────────────────────────────── */
interface ProjectNode {
  id?: string;
  name: string;
  type: string;
  status: string;
  description: string;
  metricLabel: string;
  metricValue: string;
}

interface Props {
  projects: ProjectNode[];
  onSelect: (project: ProjectNode) => void;
}

/* ── Framer Motion orchestration variants ──────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
};

/* ── Status badge colours ──────────────────────────── */
const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   'bg-emerald-950/40 text-emerald-400 border-emerald-800',
  PILOT:    'bg-cyan-950/40   text-cyan-400   border-cyan-800',
  'PRE-PROD': 'bg-amber-950/40 text-amber-400  border-amber-800',
  DEV:      'bg-red-950/40    text-red-400     border-red-800',
};

export default function StaggeredProjectGrid({ projects, onSelect }: Props) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {projects.map((node) => (
        <motion.div
          key={node.id || node.name}
          variants={cardVariants}
          onClick={() => onSelect(node)}
          className="neon-pathway-card border border-slate-900 bg-slate-950/40 p-5 rounded cursor-pointer group relative flex flex-col justify-between h-44"
        >
          {/* Corner crosshair */}
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-slate-800 group-hover:border-cyan-400 transition-colors" />

          {/* Top section */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                {node.type}
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                  STATUS_STYLES[node.status] || 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {node.status}
              </span>
            </div>
            <h3 className="font-bold text-white tracking-tight group-hover:text-cyan-400 transition-colors text-sm">
              ⬡ {node.name}
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed font-sans line-clamp-2 mt-1">
              {node.description}
            </p>
          </div>

          {/* Bottom metric row */}
          <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>{node.metricLabel}:</span>
            <span className="text-white font-bold group-hover:text-cyan-400 transition-colors">
              {node.metricValue}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
