// app/dashboard/layout.tsx
import React from 'react';
import DashboardNav from './DashboardNav';
import '../styles/variables.css';
import '../styles/dashboard-shell.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="vvu-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <DashboardNav />
      {children}
    </div>
  );
}
