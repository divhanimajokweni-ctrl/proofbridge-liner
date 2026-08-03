'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Square,
  RefreshCw,
  Shield,
  FileCheck,
  Hash,
  Cpu,
  HardDrive,
  Activity,
  Users,
  Vote,
  FileText,
  Plus,
  Circle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Bot,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useIDEStore, PLUGINS, type PluginId, AUTONOMY_LABELS, AUTONOMY_COLORS } from './ide-store';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Sidebar Section Header
// ---------------------------------------------------------------------------

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold tracking-wider text-[#858585] uppercase">
      <span>{label}</span>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tree Item
// ---------------------------------------------------------------------------

function TreeItem({
  label,
  icon: Icon,
  depth = 0,
  status,
  color,
  onClick,
  active = false,
}: {
  label: string;
  icon?: LucideIcon;
  depth?: number;
  status?: 'active' | 'standby' | 'error' | 'idle';
  color?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const statusColors = {
    active: '#3dffb0',
    standby: '#eab308',
    error: '#ef4444',
    idle: '#858585',
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-1.5 px-3 py-[3px] text-[13px] cursor-pointer
        transition-colors duration-100
        ${active ? 'bg-[#094771] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}
      `}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" style={{ color: color ?? '#858585' }} strokeWidth={1.5} />}
      {!Icon && status && (
        <Circle
          className="h-2.5 w-2.5 shrink-0 fill-current"
          style={{ color: statusColors[status] }}
        />
      )}
      <span className="truncate">{label}</span>
      {status && Icon && (
        <Circle
          className="h-2 w-2 shrink-0 ml-auto fill-current"
          style={{ color: statusColors[status] }}
        />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-3 py-1 text-[11px] font-semibold tracking-wider text-[#858585] uppercase hover:bg-[#2a2d2e] transition-colors"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {label}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plugin Sidebar Content
// ---------------------------------------------------------------------------

function HBKSidebar() {
  const addTerminalEntry = useIDEStore((s) => s.addTerminalEntry);

  return (
    <div className="flex flex-col gap-0">
      <CollapsibleSection label="Simulation Nodes">
        <TreeItem label="Cape Town Simulation" icon={ChevronDown} depth={0} color="#C9A84C" />
        <TreeItem label="node_01_active" status="active" depth={1} />
        <TreeItem label="node_02_standby" status="standby" depth={1} />
        <TreeItem label="node_03_idle" status="idle" depth={1} />
        <TreeItem label="node_04_error" status="error" depth={1} />
      </CollapsibleSection>

      <CollapsibleSection label="Pipeline Parameters">
        <TreeItem label="epochs: 100" icon={Activity} depth={0} />
        <TreeItem label="samples: 10000" icon={Hash} depth={0} />
        <TreeItem label="burn_in: 0.2" icon={RefreshCw} depth={0} />
      </CollapsibleSection>

      <CollapsibleSection label="Provenance" defaultOpen={false}>
        <TreeItem label="results.json" icon={FileCheck} depth={0} status="active" />
        <TreeItem label="metrics.json" icon={FileText} depth={0} status="active" />
        <TreeItem label="provenance.json" icon={Shield} depth={0} status="active" />
        <TreeItem label="ledger.json" icon={FileText} depth={0} status="standby" />
      </CollapsibleSection>

      <div className="px-3 mt-4 flex flex-col gap-2">
        <button
          onClick={() => addTerminalEntry({ level: 'info', source: 'hbk', message: '> HBK Simulation started. Cape Town node cluster initializing...' })}
          className="w-full flex items-center justify-center gap-2 bg-[#C9A84C]/20 hover:bg-[#C9A84C]/30 text-[#C9A84C] border border-[#C9A84C]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors"
        >
          <Play className="h-3 w-3" /> Run Simulation
        </button>
        <button
          onClick={() => addTerminalEntry({ level: 'warn', source: 'hbk', message: '> HBK Simulation halted by operator.' })}
          className="w-full flex items-center justify-center gap-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors"
        >
          <Square className="h-3 w-3" /> Stop
        </button>
      </div>
    </div>
  );
}

function UbuntuPoolsSidebar() {
  return (
    <div className="flex flex-col gap-0">
      <CollapsibleSection label="Active Stokvels">
        <TreeItem label="Western Cape Water Trust" icon={Users} depth={0} color="#3dd6ff" status="active" />
        <TreeItem label="Gauteng Infrastructure Fund" icon={Users} depth={0} color="#3dd6ff" status="active" />
        <TreeItem label="KZN Community Pool" icon={Users} depth={0} color="#3dd6ff" status="standby" />
      </CollapsibleSection>

      <CollapsibleSection label="Governance">
        <TreeItem label="Constitution v2.1" icon={FileText} depth={0} />
        <TreeItem label="Active Proposals (3)" icon={Vote} depth={0} />
        <TreeItem label="Amendment Queue" icon={FileText} depth={0} />
      </CollapsibleSection>

      <CollapsibleSection label="Members">
        <TreeItem label="42 Active Members" icon={Users} depth={0} />
        <TreeItem label="7 Pending Approval" icon={Users} depth={0} />
      </CollapsibleSection>

      <div className="px-3 mt-4 flex flex-col gap-2">
        <button className="w-full flex items-center justify-center gap-2 bg-[#3dd6ff]/20 hover:bg-[#3dd6ff]/30 text-[#3dd6ff] border border-[#3dd6ff]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors">
          <Plus className="h-3 w-3" /> Create Stokvel
        </button>
        <button className="w-full flex items-center justify-center gap-2 bg-[#3dd6ff]/10 hover:bg-[#3dd6ff]/20 text-[#3dd6ff] border border-[#3dd6ff]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors">
          <Vote className="h-3 w-3" /> Propose Amendment
        </button>
      </div>
    </div>
  );
}

function ProofBridgeSidebar() {
  return (
    <div className="flex flex-col gap-0">
      <CollapsibleSection label="Receipt Ledger">
        <TreeItem label="Receipt #847 (Signed)" icon={FileCheck} depth={0} status="active" color="#3dffb0" />
        <TreeItem label="Receipt #846 (Signed)" icon={FileCheck} depth={0} status="active" color="#3dffb0" />
        <TreeItem label="Receipt #845 (Unverified)" icon={FileText} depth={0} status="standby" />
      </CollapsibleSection>

      <CollapsibleSection label="MMR Anchors">
        <TreeItem label="Root Hash: 0x7f3a..." icon={Hash} depth={0} />
        <TreeItem label="Last Anchor: 2m ago" icon={Shield} depth={0} />
        <TreeItem label="Tree Size: 847 leaves" icon={Activity} depth={0} />
      </CollapsibleSection>

      <CollapsibleSection label="Verification Queue">
        <TreeItem label="3 Pending" icon={Eye} depth={0} />
        <TreeItem label="12 Verified Today" icon={CheckCircle2} depth={0} />
      </CollapsibleSection>

      <div className="px-3 mt-4 flex flex-col gap-2">
        <button className="w-full flex items-center justify-center gap-2 bg-[#3dffb0]/20 hover:bg-[#3dffb0]/30 text-[#3dffb0] border border-[#3dffb0]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors">
          <Shield className="h-3 w-3" /> Verify Canvas State
        </button>
        <button className="w-full flex items-center justify-center gap-2 bg-[#3dffb0]/10 hover:bg-[#3dffb0]/20 text-[#3dffb0] border border-[#3dffb0]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors">
          <Hash className="h-3 w-3" /> Anchor Receipt
        </button>
      </div>
    </div>
  );
}

function AIRComputeSidebar() {
  return (
    <div className="flex flex-col gap-0">
      <CollapsibleSection label="GPU Cluster">
        <TreeItem label="GPU_0 (ROCm MI250)" icon={Cpu} depth={0} status="active" color="#b23dff" />
        <TreeItem label="GPU_1 (ROCm MI250)" icon={Cpu} depth={0} status="active" color="#b23dff" />
        <TreeItem label="GPU_2 (Standby)" icon={Cpu} depth={0} status="standby" />
      </CollapsibleSection>

      <CollapsibleSection label="Inference Endpoints">
        <TreeItem label="Lindiwe-v3 (Live)" icon={Zap} depth={0} status="active" />
        <TreeItem label="HBK-Model (Warm)" icon={Zap} depth={0} status="standby" />
      </CollapsibleSection>

      <CollapsibleSection label="Telemetry">
        <TreeItem label="CPU: 34% | Memory: 2.7/8 GB" icon={HardDrive} depth={0} />
        <TreeItem label="Events: 12,847 processed" icon={Activity} depth={0} />
        <TreeItem label="Trust Score: 72/100" icon={Shield} depth={0} />
      </CollapsibleSection>

      <div className="px-3 mt-4 flex flex-col gap-2">
        <button className="w-full flex items-center justify-center gap-2 bg-[#b23dff]/20 hover:bg-[#b23dff]/30 text-[#b23dff] border border-[#b23dff]/30 py-1.5 px-3 rounded text-xs font-mono transition-colors">
          <Zap className="h-3 w-3" /> Deploy Model
        </button>
      </div>
    </div>
  );
}

function LindiweSidebar() {
  const autonomyLevel = useIDEStore((s) => s.autonomyLevel);
  const setAutonomyLevel = useIDEStore((s) => s.setAutonomyLevel);
  const circuitBreaker = useIDEStore((s) => s.circuitBreaker);

  return (
    <div className="flex flex-col gap-0">
      <CollapsibleSection label="Autonomy Matrix">
        <div className="px-3 py-2 flex flex-col gap-2">
          {([1, 2, 3] as const).map((level) => (
            <button
              key={level}
              onClick={() => setAutonomyLevel(level)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-all
                ${autonomyLevel === level
                  ? 'bg-[#2a2d2e] border border-[#3c3c3c]'
                  : 'hover:bg-[#2a2d2e]/50 border border-transparent'
                }
              `}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: AUTONOMY_COLORS[level],
                  boxShadow: autonomyLevel === level ? `0 0 8px ${AUTONOMY_COLORS[level]}60` : 'none',
                }}
              />
              <div className="flex flex-col items-start">
                <span className="font-semibold text-white">
                  Level {level}: {AUTONOMY_LABELS[level]}
                </span>
                <span className="text-[10px] text-[#858585] mt-0.5">
                  {level === 1 && 'Passive monitoring'}
                  {level === 2 && 'Pre-writes fixes, awaits confirmation'}
                  {level === 3 && 'Full override authority (armed)'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Circuit Breaker">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            {circuitBreaker === 'NORMAL' && <CheckCircle2 className="h-4 w-4 text-[#3dffb0]" />}
            {circuitBreaker === 'DEGRADED' && <AlertTriangle className="h-4 w-4 text-[#eab308]" />}
            {circuitBreaker === 'TRIGGERED' && <XCircle className="h-4 w-4 text-[#ef4444]" />}
            <span className="text-xs font-mono" style={{
              color: circuitBreaker === 'NORMAL' ? '#3dffb0' : circuitBreaker === 'DEGRADED' ? '#eab308' : '#ef4444'
            }}>
              {circuitBreaker}
            </span>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection label="Agent Status">
        <TreeItem label="Lindiwe-v3 (Online)" icon={Bot} depth={0} status="active" color="#a855f7" />
        <TreeItem label="Fraud Detection Agent" icon={Eye} depth={0} status="active" />
        <TreeItem label="Compliance Agent" icon={Shield} depth={0} status="standby" />
        <TreeItem label="Simulation Agent" icon={Activity} depth={0} status="idle" />
      </CollapsibleSection>
    </div>
  );
}

function ExplorerSidebar() {
  return (
    <div className="flex flex-col gap-0">
      <CollapsibleSection label="Open Editors">
        <TreeItem label="Trust Sphere [Live]" icon={Activity} depth={0} status="active" />
        <TreeItem label="output.log" icon={FileText} depth={0} />
        <TreeItem label="CAD Visualizer" icon={FileText} depth={0} />
      </CollapsibleSection>

      <CollapsibleSection label="VVU Workspace">
        <TreeItem label="src/" icon={ChevronDown} depth={0} />
        <TreeItem label="components/" icon={ChevronRight} depth={1} />
        <TreeItem label="lib/" icon={ChevronRight} depth={1} />
        <TreeItem label="app/" icon={ChevronRight} depth={1} />
        <TreeItem label="pipeline/" icon={ChevronRight} depth={1} />
        <TreeItem label="config.yaml" icon={FileText} depth={1} />
        <TreeItem label="schema.prisma" icon={FileText} depth={1} />
      </CollapsibleSection>

      <CollapsibleSection label="Outlines">
        <TreeItem label="Trust Architecture" icon={Shield} depth={0} />
        <TreeItem label="Three-Root Model" icon={Hash} depth={0} />
      </CollapsibleSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar Content Map
// ---------------------------------------------------------------------------

const SIDEBAR_CONTENT: Record<PluginId, React.ComponentType> = {
  EXPLORER: ExplorerSidebar,
  UBUNTU_POOLS: UbuntuPoolsSidebar,
  PROOFBRIDGE: ProofBridgeSidebar,
  HBK: HBKSidebar,
  AIR_COMPUTE: AIRComputeSidebar,
  LINDIWE: LindiweSidebar,
  WALLET: ExplorerSidebar, // placeholder
};

// ---------------------------------------------------------------------------
// Primary Sidebar
// ---------------------------------------------------------------------------

export function PrimarySidebar() {
  const activePlugin = useIDEStore((s) => s.activePlugin);
  const sidebarOpen = useIDEStore((s) => s.sidebarOpen);
  const sidebarWidth = useIDEStore((s) => s.sidebarWidth);

  const pluginMeta = PLUGINS.find((p) => p.id === activePlugin);
  const ContentComponent = SIDEBAR_CONTENT[activePlugin] ?? ExplorerSidebar;

  if (!sidebarOpen) return null;

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: sidebarWidth, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="bg-[#252526] border-r border-[#2d2d2d] flex flex-col shrink-0 overflow-hidden"
      style={{ width: sidebarWidth }}
      aria-label={`Primary Sidebar — ${pluginMeta?.label ?? 'Explorer'}`}
    >
      {/* Header */}
      <div className="px-3 py-2 text-[11px] tracking-[0.15em] text-[#858585] font-semibold uppercase border-b border-[#2d2d2d] flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: pluginMeta?.color ?? '#858585' }}
        />
        {pluginMeta?.label ?? 'Explorer'}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        <ContentComponent />
      </div>
    </motion.aside>
  );
}
