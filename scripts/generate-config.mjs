import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY (Vercel Environment Variables).');
  process.exit(1);
}

const escape = (value) => String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const body = `// Generated at build time — do not commit (see js/config.example.js)
const SUPABASE_URL = '${escape(url)}';
const SUPABASE_ANON_KEY = '${escape(anon)}';
`;

fs.writeFileSync(path.join(root, 'js', 'config.js'), body, 'utf8');
console.log('Wrote js/config.js from environment variables.');
