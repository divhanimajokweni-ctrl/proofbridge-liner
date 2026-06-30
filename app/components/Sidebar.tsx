'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GlobalSidebar() {
  const pathname = usePathname();

  const groups = [
    {
      heading: 'Control Surfaces',
      items: [
        { name: 'Gateway Deck', href: '/gateway', icon: '🚨' },
        { name: 'Agent Terminal', href: '/gateway', icon: '🤖' },
      ],
    },
    {
      heading: 'Docs',
      items: [
        { name: 'Architecture', href: '/docs/architecture', icon: '📐' },
        { name: 'API Reference', href: '/docs/api-reference', icon: '⚙️' },
        { name: 'Cryptography', href: '/docs/cryptography', icon: '🔒' },
      ],
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 font-sans">
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2 py-3 border-b border-slate-800">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
          <span className="font-mono text-sm tracking-widest text-white font-bold">VVU-BRAIN OS</span>
        </div>
        <nav className="space-y-6">
          {groups.map((g) => (
            <div key={g.heading} className="space-y-2">
              <h3 className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold px-2">{g.heading}</h3>
              <ul className="space-y-1">
                {g.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                          active ? 'bg-slate-800 text-white border-l-2 border-cyan-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}>
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500 px-2 flex justify-between">
        <span>Gate: 2026-07-30</span>
        <span className="text-emerald-500">v2.0-STABLE</span>
      </div>
    </aside>
  );
}
