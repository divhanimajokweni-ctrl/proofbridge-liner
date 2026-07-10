'use client';

import { trustRuntimeHtml } from './trustRuntimeLayout';

export default function Home() {
  return (
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
  );
}
