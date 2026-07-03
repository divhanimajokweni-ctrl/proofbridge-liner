'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Users,
  UserCheck,
  Send,
  AtSign,
  Bell,
  Shield,
  ExternalLink,
  Plug,
  PlugZap,
  Globe,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  name: string;
  platform: 'discord' | 'twitter' | 'matrix' | 'twitch' | 'local';
  status: 'online' | 'idle' | 'dnd' | 'offline';
  avatar?: string;
  lastSeen: string;
  unread?: number;
}

interface Message {
  id: string;
  platform: 'discord' | 'twitter' | 'matrix' | 'twitch' | 'local';
  author: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Cipher_Master', platform: 'discord', status: 'online', lastSeen: 'now', unread: 2 },
  { id: 'c2', name: 'SpeedDemon', platform: 'twitter', status: 'online', lastSeen: '2m ago' },
  { id: 'c3', name: 'Tokyo_Node', platform: 'matrix', status: 'idle', lastSeen: '5m ago', unread: 1 },
  { id: 'c4', name: 'Oxford_Lab', platform: 'discord', status: 'dnd', lastSeen: '15m ago' },
  { id: 'c5', name: 'Guild_Leader', platform: 'twitch', status: 'online', lastSeen: '1m ago', unread: 5 },
  { id: 'c6', name: 'Lean_Fndtn', platform: 'matrix', status: 'offline', lastSeen: '2h ago' },
  { id: 'c7', name: 'MathFan42', platform: 'twitter', status: 'online', lastSeen: 'now' },
];

const MOCK_MESSAGES: Message[] = [
  { id: 'm1', platform: 'discord', author: 'Cipher_Master', content: 'seen the new Siege bounty on Auth.lean?', timestamp: new Date(Date.now() - 60000).toISOString(), isOwn: false },
  { id: 'm2', platform: 'local', author: 'You', content: 'yeah just saw it — 5000 REP is huge', timestamp: new Date(Date.now() - 45000).toISOString(), isOwn: true },
  { id: 'm3', platform: 'discord', author: 'Cipher_Master', content: 'i think the spec has a leak in the session handler. want to team up?', timestamp: new Date(Date.now() - 30000).toISOString(), isOwn: false },
  { id: 'm4', platform: 'local', author: 'You', content: 'let\'s do it. fork it into the editor', timestamp: new Date(Date.now() - 15000).toISOString(), isOwn: true },
  { id: 'm5', platform: 'discord', author: 'Cipher_Master', content: 'already did. check the shared session', timestamp: new Date(Date.now() - 5000).toISOString(), isOwn: false },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface SocialMeshProps {
  className?: string;
  onOpenChat?: (contact: Contact) => void;
  onIntegrate?: (platform: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SocialMesh({ className = '', onOpenChat, onIntegrate }: SocialMeshProps) {
  const [contacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [messages] = useState<Message[]>(MOCK_MESSAGES);
  const [activeTab, setActiveTab] = useState<'chat' | 'contacts' | 'integrations'>('chat');
  const [inputValue, setInputValue] = useState('');
  const [filterOnline, setFilterOnline] = useState(false);

  const onlineCount = contacts.filter(c => c.status === 'online').length;

  // ── Chat send (no-op in mock, would call Nexus plugin) ──
  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    setInputValue('');
  }, [inputValue]);

  // ── Status indicator ──
  const StatusDot = ({ status }: { status: Contact['status'] }) => {
    const colors = { online: '#10B981', idle: '#FBBF24', dnd: '#EF4444', offline: '#4B5563' };
    return (
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: colors[status],
          boxShadow: status === 'online' ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
          flexShrink: 0,
        }}
      />
    );
  };

  // ── Platform Icon ──
  const PlatformBadge = ({ platform }: { platform: string }) => {
    const colors: Record<string, string> = {
      discord: '#5865F2', twitter: '#1DA1F2', matrix: '#00C8FF',
      twitch: '#9146FF', local: '#10B981',
    };
    return (
      <span
        style={{
          fontSize: 7, padding: '1px 4px', borderRadius: 3,
          background: `${colors[platform] ?? '#6A8099'}20`,
          color: colors[platform] ?? '#6A8099',
          fontFamily: "'IBM Plex Mono', monospace",
          flexShrink: 0,
        }}
      >
        {platform}
      </span>
    );
  };

  return (
    <div
      className={`social-mesh ${className}`}
      style={{
        height: '100%',
        width: '100%',
        background: 'var(--substrate, #0F0F11)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--border, #2E2E32)',
          background: 'rgba(15,15,17,0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageCircle size={12} style={{ color: '#3B82F6' }} />
          <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Social Mesh
          </span>
          <span style={{ fontSize: 8, color: '#10B981' }}>
            ● {onlineCount} online
          </span>
        </div>
        <button
          onClick={() => onIntegrate?.('all')}
          style={{
            background: 'none', border: '1px solid #2E2E32',
            borderRadius: 6, padding: '2px 8px',
            color: '#6A8099', cursor: 'pointer', fontSize: 9,
            display: 'flex', alignItems: 'center', gap: 3,
          }}
        >
          <PlugZap size={10} />
          Connect
        </button>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border, #2E2E32)',
          flexShrink: 0,
        }}
      >
        {(['chat', 'contacts', 'integrations'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '6px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === tab ? '#D1D5DB' : '#6A8099',
              fontSize: 9,
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'chat' && 'Chat'}
            {tab === 'contacts' && 'Contacts'}
            {tab === 'integrations' && 'Plugins'}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chat' && (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex',
                      flexDirection: msg.isOwn ? 'row-reverse' : 'row',
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '6px 10px',
                        borderRadius: msg.isOwn ? '10px 2px 10px 10px' : '2px 10px 10px 10px',
                        background: msg.isOwn ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.isOwn ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      {!msg.isOwn && (
                        <div style={{ fontSize: 8, color: '#60A5FA', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {msg.author}
                          <PlatformBadge platform={msg.platform} />
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#D1D5DB', lineHeight: 1.4 }}>{msg.content}</div>
                      <div
                        style={{
                          fontSize: 7,
                          color: '#6A8099',
                          textAlign: msg.isOwn ? 'left' : 'right',
                          marginTop: 2,
                        }}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div
              style={{
                padding: '8px 10px',
                borderTop: '1px solid var(--border, #2E2E32)',
                display: 'flex',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Message squad..."
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #2E2E32',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  color: '#D1D5DB',
                  outline: 'none',
                }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                style={{
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  color: '#60A5FA',
                  cursor: 'pointer',
                }}
              >
                <Send size={12} />
              </motion.button>
            </div>
          </>
        )}

        {activeTab === 'contacts' && (
          <div style={{ padding: '8px 14px' }}>
            {/* Online filter toggle */}
            <div
              onClick={() => setFilterOnline(!filterOnline)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 10, height: 10, borderRadius: 3,
                  border: '1px solid #4B5563',
                  background: filterOnline ? '#3B82F6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {filterOnline && <span style={{ color: '#FFF', fontSize: 7 }}>✓</span>}
              </div>
              <span style={{ fontSize: 9, color: '#9CA3AF' }}>Show online only</span>
            </div>

            {contacts
              .filter(c => !filterOnline || c.status === 'online')
              .map(contact => (
                <motion.div
                  key={contact.id}
                  whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                  onClick={() => onOpenChat?.(contact)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <StatusDot status={contact.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#D1D5DB', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {contact.name}
                      <PlatformBadge platform={contact.platform} />
                    </div>
                    <div style={{ fontSize: 8, color: '#6A8099' }}>
                      {contact.status === 'online' ? 'Online' : contact.lastSeen}
                    </div>
                  </div>
                  {contact.unread && contact.unread > 0 ? (
                    <span
                      style={{
                        fontSize: 8, fontWeight: 700, color: '#FFF',
                        background: '#3B82F6', borderRadius: 8,
                        padding: '1px 5px', minWidth: 16, textAlign: 'center',
                      }}
                    >
                      {contact.unread}
                    </span>
                  ) : null}
                </motion.div>
              ))}
          </div>
        )}

        {activeTab === 'integrations' && (
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 9, color: '#6A8099', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Connected Services
            </div>
            {[
              { name: 'Discord', icon: 'discord', color: '#5865F2', connected: true },
              { name: 'Twitter / X', icon: 'twitter', color: '#1DA1F2', connected: true },
              { name: 'Matrix', icon: 'matrix', color: '#00C8FF', connected: true },
              { name: 'Twitch', icon: 'twitch', color: '#9146FF', connected: false },
              { name: 'GitHub', icon: 'github', color: '#FFFFFF', connected: true },
              { name: 'Stripe', icon: 'stripe', color: '#635BFF', connected: false },
            ].map(svc => (
              <div
                key={svc.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(46,46,50,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: `${svc.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: svc.color, fontSize: 8, fontWeight: 700,
                    }}
                  >
                    {svc.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#D1D5DB' }}>{svc.name}</div>
                    <div style={{ fontSize: 8, color: svc.connected ? '#10B981' : '#6A8099' }}>
                      {svc.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onIntegrate?.(svc.name)}
                  style={{
                    background: svc.connected ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${svc.connected ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                    borderRadius: 6, padding: '3px 8px',
                    color: svc.connected ? '#EF4444' : '#10B981',
                    cursor: 'pointer', fontSize: 8,
                  }}
                >
                  {svc.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}

            {/* Privacy notice */}
            <div
              style={{
                marginTop: 12,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(16,185,129,0.2)',
                background: 'rgba(16,185,129,0.05)',
              }}
            >
              <div style={{ fontSize: 9, color: '#10B981', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={10} />
                Privacy Airlock Active
              </div>
              <div style={{ fontSize: 8, color: '#6A8099', lineHeight: 1.4 }}>
                All messages are stored in your local Nexus Vault. Your conversations are never sent to external servers without explicit permission.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
