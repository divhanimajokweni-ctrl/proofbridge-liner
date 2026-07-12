'use client';

import AuthControl from './AuthControl';
import { trustRuntimeHtml } from './trustRuntimeLayout';

export default function Home() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <AuthControl />
      </div>
      <iframe
        title="VVU · Trust Runtime"
        srcDoc={trustRuntimeHtml}
        style={{
          border: 'none',
          display: 'block',
          width: '100%',
          height: '100vh',
        }}
      />
    </div>
  );
}
