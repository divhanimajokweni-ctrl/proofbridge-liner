import fs from 'fs';
import path from 'path';

const dir = '.next/server';
const nftPath = path.join(dir, 'middleware.js.nft.json');
const mwPath = path.join(dir, 'middleware.js');

// Generate middleware.js.nft.json if missing
if (!fs.existsSync(nftPath)) {
  const mfPath = path.join(dir, 'middleware-manifest.json');
  let files = [];
  try {
    const m = JSON.parse(fs.readFileSync(mfPath, 'utf8'));
    files = Object.values(m.middleware || {}).flatMap(v =>
      (v.files || []).map(f => f.startsWith('server/') ? f.slice(7) : f)
    );
  } catch (e) {}
  fs.writeFileSync(nftPath, JSON.stringify({ version: 1, files }));
  console.log('Generated middleware.js.nft.json with', files.length, 'files');
}

// Generate stub middleware.js if missing
if (!fs.existsSync(mwPath)) {
  fs.writeFileSync(mwPath, `// Vercel compatibility stub - actual middleware compiled as edge function
export default function middleware() { return new Response(null, { status: 200 }); }
export const config = { matcher: [] };
`);
  console.log('Generated stub middleware.js for Vercel');
}
