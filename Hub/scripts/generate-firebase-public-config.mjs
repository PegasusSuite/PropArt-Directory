/**
 * Writes public/js/firebase-public-config.generated.js from process.env PUBLIC_FIREBASE_*.
 * Run from repository root: npm run config:firebase:write
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

function req(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    console.error('[config:firebase:write] Missing required env:', name);
    process.exit(1);
  }
  return String(v).trim();
}

const cfg = {
  apiKey: req('PUBLIC_FIREBASE_API_KEY'),
  authDomain: req('PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: req('PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: req('PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: req('PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: req('PUBLIC_FIREBASE_APP_ID'),
  measurementId: req('PUBLIC_FIREBASE_MEASUREMENT_ID')
};

const outPath = path.join(__dirname, '../js/firebase-public-config.generated.js');
const banner = '// Generated — do not commit credentials here; regenerate from CI or local .env\n';
const body = `${banner}(function () {\n  'use strict';\n  if (typeof window === 'undefined') return;\n  window.__PEGASUS_FIREBASE_CONFIG__ = ${JSON.stringify(cfg)};\n})();\n`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, body, 'utf8');
console.log('[config:firebase:write] wrote', path.relative(repoRoot, outPath));
