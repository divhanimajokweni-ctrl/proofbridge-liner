'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  GitBranch,
  ShieldAlert,
  FileCheck2,
  ChevronDown,
  ChevronRight,
  Play,
  GitCompareArrows,
  FileArchive,
  Send,
  Bot,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type AgentDefinition,
  VVU_AGENTS,
} from '@/lib/vvu/three-roots';

// ---------------------------------------------------------------------------
// Icon Map & AgentIcon Component
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  GitBranch,
  ShieldAlert,
  FileCheck2,
};

/**
 * A dedicated component for rendering agent icons.
 * Defined at module scope to satisfy React Compiler's static-components rule.
 */
function AgentIcon({
  iconName,
  className,
  style,
  strokeWidth = 1.8,
}: {
  iconName: string;
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}) {
  const ResolvedIcon = ICON_MAP[iconName] ?? Activity;
  return <ResolvedIcon className={className} style={style} strokeWidth={strokeWidth} />;
}

// ---------------------------------------------------------------------------
// Status Helpers
// ---------------------------------------------------------------------------

type AgentStatus = AgentDefinition['status'];

const STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; dotClass: string; textClass: string; animate: boolean }
> = {
  running: {
    label: 'Running',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
    animate: true,
  },
  idle: {
    label: 'Idle',
    dotClass: 'bg-muted-foreground/50',
    textClass: 'text-muted-foreground/70',
    animate: false,
  },
  watching: {
    label: 'Watching',
    dotClass: 'bg-cyan-400',
    textClass: 'text-cyan-400',
    animate: true,
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-red-400/50',
    textClass: 'text-red-400/60',
    animate: false,
  },
};

// ---------------------------------------------------------------------------
// Agent Conversation Data
// ---------------------------------------------------------------------------

interface AgentObservation {
  summary: string;
  detail?: string;
  confidence?: number;
  actions: AgentAction[];
}

interface AgentAction {
  id: string;
  label: string;
  iconName: string;
  color: string;
}

interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp: string;
}

/** Simulated observations for each agent */
const AGENT_OBSERVATIONS: Record<string, AgentObservation> = {
  lindiwe: {
    summary: 'I noticed something.',
    detail: 'Pressure anomaly',
    confidence: 68,
    actions: [
      { id: 'sim', label: 'Run simulation', iconName: 'Play', color: '#3dd6ff' },
      { id: 'compare', label: 'Compare historical cases', iconName: 'GitCompareArrows', color: '#3dffb0' },
      { id: 'evidence', label: 'Generate evidence package', iconName: 'FileArchive', color: '#C9A84C' },
    ],
  },
  'simulation-agent': {
    summary: '3 branches active. One diverging.',
    detail: 'Branch B-7 shows 23% deviation',
    confidence: 67,
    actions: [
      { id: 'sim', label: 'Run simulation', iconName: 'Play', color: '#3dd6ff' },
      { id: 'compare', label: 'Compare branches', iconName: 'GitCompareArrows', color: '#3dffb0' },
      { id: 'evidence', label: 'Generate evidence package', iconName: 'FileArchive', color: '#C9A84C' },
    ],
  },
  'fraud-agent': {
    summary: 'No anomalies detected.',
    detail: 'Monitoring 12 streams',
    actions: [
      { id: 'sim', label: 'Run deep scan', iconName: 'Play', color: '#CC7722' },
      { id: 'compare', label: 'Compare historical cases', iconName: 'GitCompareArrows', color: '#3dffb0' },
    ],
  },
  'compliance-agent': {
    summary: '2 pending attestations.',
    detail: 'Environment v3.2 awaiting approval',
    actions: [
      { id: 'sim', label: 'Review attestations', iconName: 'FileCheck2', color: '#C9A84C' },
      { id: 'evidence', label: 'Generate evidence package', iconName: 'FileArchive', color: '#C9A84C' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Confidence Ring
// ---------------------------------------------------------------------------

function ConfidenceRing({
  value,
  color,
  size = 36,
  strokeWidth = 3,
}: {
  value: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <span
        className="absolute font-mono text-[9px] font-semibold"
        style={{ color }}
      >
        {value}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Dot
// ---------------------------------------------------------------------------

function StatusDot({
  status,
  color,
  size = 8,
}: {
  status: AgentStatus;
  color: string;
  size?: number;
}) {
  const config = STATUS_CONFIG[status];

  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {/* Pulse ring for animated statuses */}
      {config.animate && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 6px ${color}80`,
        }}
      />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Action Icon Component (module-level to satisfy React Compiler)
// ---------------------------------------------------------------------------

function ActionIcon({
  iconName,
  color,
}: {
  iconName: string;
  color: string;
}) {
  const ResolvedIcon = ICON_MAP[iconName] ?? Play;
  return <ResolvedIcon className="h-3 w-3" style={{ color }} />;
}

// ---------------------------------------------------------------------------
// Agent Conversation
// ---------------------------------------------------------------------------

function AgentConversation({
  agent,
  onClose,
}: {
  agent: AgentDefinition;
  onClose: () => void;
}) {
  const observation = AGENT_OBSERVATIONS[agent.id] ?? {
    summary: 'No observations yet.',
    actions: [],
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'obs-1',
      role: 'agent',
      content: observation.summary + (observation.detail ? ` ${observation.detail}` : ''),
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleAction = useCallback(
    (action: AgentAction) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: action.label,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      // Simulate agent response
      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `Initiating ${action.label.toLowerCase()}... Analysis in progress. I'll report findings as they emerge.`,
          timestamp: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, agentMsg]);
        setIsTyping(false);
      }, 1200);
    },
    [],
  );

  function handleSend() {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `Acknowledged. Processing your request against current telemetry streams.`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="border-t border-white/[0.06] bg-white/[0.01]">
        {/* Agent header */}
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <StatusDot status={agent.status} color={agent.color} size={6} />
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground/60">
              {agent.role}
            </span>
          </div>
          {observation.confidence != null && (
            <ConfidenceRing value={observation.confidence} color={agent.color} size={28} strokeWidth={2.5} />
          )}
        </div>

        {/* Chat messages */}
        <div className="max-h-48 overflow-y-auto px-3 pb-2 space-y-2 custom-scrollbar">
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {/* Avatar */}
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                style={{
                  borderColor: msg.role === 'agent' ? `${agent.color}40` : 'rgba(255,255,255,0.08)',
                  background: msg.role === 'agent' ? `${agent.color}10` : 'rgba(255,255,255,0.03)',
                }}
              >
                {msg.role === 'agent' ? (
                  <Bot className="h-2.5 w-2.5" style={{ color: agent.color }} />
                ) : (
                  <Sparkles className="h-2.5 w-2.5 text-muted-foreground/60" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={cn(
                  'max-w-[85%] rounded-lg border px-2.5 py-1.5 text-[11px] leading-relaxed',
                  msg.role === 'agent'
                    ? 'border-white/[0.06] bg-white/[0.03] text-foreground/90'
                    : 'border-white/[0.08] bg-white/[0.05] text-foreground/80',
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-1"
            >
              <div
                className="flex h-5 w-5 items-center justify-center rounded-md border"
                style={{ borderColor: `${agent.color}40`, background: `${agent.color}10` }}
              >
                <Bot className="h-2.5 w-2.5" style={{ color: agent.color }} />
              </div>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1 w-1 rounded-full"
                    style={{ background: agent.color }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Action buttons */}
        {observation.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 py-2">
            {observation.actions.map((action) => (
              <motion.button
                key={action.id}
                onClick={() => handleAction(action)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-foreground"
              >
                <ActionIcon iconName={action.iconName} color={action.color} />
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="flex items-center gap-2 border-t border-white/[0.06] px-3 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ask the agent..."
            className="flex-1 bg-transparent font-mono text-[11px] text-foreground/80 placeholder:text-muted-foreground/40 outline-none"
          />
          <motion.button
            onClick={handleSend}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-md border transition-colors',
              inputValue.trim()
                ? 'border-white/[0.12] bg-white/[0.05] text-foreground/80 hover:bg-white/[0.08]'
                : 'border-white/[0.06] bg-transparent text-muted-foreground/30',
            )}
            disabled={!inputValue.trim()}
          >
            <Send className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Agent List Item
// ---------------------------------------------------------------------------

function AgentListItem({
  agent,
  isExpanded,
  onToggle,
}: {
  agent: AgentDefinition;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = STATUS_CONFIG[agent.status];

  return (
    <div
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-colors hover:border-white/[0.10]"
      style={{
        borderLeftWidth: 2,
        borderLeftColor: isExpanded ? agent.color : 'transparent',
      }}
    >
      {/* Agent header row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
      >
        {/* Icon */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
          style={{
            borderColor: `${agent.color}40`,
            background: `${agent.color}10`,
          }}
        >
          <AgentIcon iconName={agent.icon} className="h-4 w-4" style={{ color: agent.color }} />
        </div>

        {/* Name + status */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground truncate">{agent.name}</span>
            <div className="flex items-center gap-1.5">
              <StatusDot status={agent.status} color={agent.color} size={6} />
              <span className={cn('font-mono text-[9px]', config.textClass)}>
                {config.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted-foreground/60">{agent.role}</span>
            {agent.details && (
              <span className="font-mono text-[9px] text-muted-foreground/50">
                {agent.details}
              </span>
            )}
          </div>
        </div>

        {/* Confidence badge */}
        {agent.confidence != null && (
          <div className="flex items-center gap-1.5 shrink-0">
            <ConfidenceRing value={agent.confidence} color={agent.color} size={32} strokeWidth={2.5} />
          </div>
        )}

        {/* Expand chevron */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground/40"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.div>
      </button>

      {/* Expanded conversation */}
      <AnimatePresence>
        {isExpanded && (
          <AgentConversation agent={agent} onClose={onToggle} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Panel (Full List)
// ---------------------------------------------------------------------------

export interface AgentPanelProps {
  /** Override the default agents list */
  agents?: AgentDefinition[];
  /** Additional class name */
  className?: string;
}

export function AgentPanel({ agents = VVU_AGENTS, className }: AgentPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Count active agents
  const runningCount = useMemo(
    () => agents.filter((a) => a.status === 'running' || a.status === 'watching').length,
    [agents],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
            AI Collaborators
          </span>
          <span className="font-mono text-[9px] text-emerald-400/70">
            {runningCount} active
          </span>
        </div>
      </div>

      {/* Agent list */}
      <div className="flex flex-col gap-2">
        {agents.map((agent) => (
          <AgentListItem
            key={agent.id}
            agent={agent}
            isExpanded={expandedId === agent.id}
            onToggle={() => handleToggle(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Card (Compact Dock Version)
// ---------------------------------------------------------------------------

export interface AgentCardProps {
  agent: AgentDefinition;
  /** Whether this card is selected/active */
  active?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional class name */
  className?: string;
}

export function AgentCard({ agent, active = false, onClick, className }: AgentCardProps) {
  const config = STATUS_CONFIG[agent.status];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all',
        active
          ? 'border-white/[0.10] bg-white/[0.04]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03]',
        className,
      )}
      style={{
        borderLeftWidth: 2,
        borderLeftColor: active ? agent.color : 'transparent',
      }}
    >
      {/* Icon with status dot */}
      <div className="relative shrink-0">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md border"
          style={{
            borderColor: `${agent.color}40`,
            background: `${agent.color}10`,
          }}
        >
          <AgentIcon iconName={agent.icon} className="h-3.5 w-3.5" style={{ color: agent.color }} />
        </div>
        {/* Status dot overlay */}
        <span
          className="absolute -right-0.5 -top-0.5"
          style={{ width: 6, height: 6 }}
        >
          <span
            className="block rounded-full"
            style={{
              width: 6,
              height: 6,
              background: agent.color,
              boxShadow: `0 0 4px ${agent.color}80`,
            }}
          />
          {config.animate && (
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ background: agent.color }}
              animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </span>
      </div>

      {/* Name + details */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[11px] font-medium text-foreground truncate">
          {agent.name}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn('font-mono text-[8px]', config.textClass)}>
            {config.label}
          </span>
          {agent.details && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="font-mono text-[8px] text-muted-foreground/50">
                {agent.details}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Confidence / status indicator */}
      {agent.confidence != null ? (
        <span
          className="shrink-0 font-mono text-[9px] font-semibold"
          style={{ color: agent.color }}
        >
          {agent.confidence}%
        </span>
      ) : (
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />
      )}
    </motion.button>
  );
}
