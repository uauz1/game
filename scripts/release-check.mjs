import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const exists = file => fs.existsSync(new URL(file, root));
const fail = message => { console.error(`❌ ${message}`); process.exitCode = 1; };
const pass = message => console.log(`✅ ${message}`);

const app = read('src/App.tsx');
const session = read('src/components/party/SmartPartySession.tsx');
const realtime = read('src/utils/qaddhaRealtime.ts');

const games = ['teams','letters','who','photo','words','fast','character','riddles','family','connection','auction','order','memory','missing','acting','secret'];
const hostRoutes = ['who','secret','acting','words','family'];

const registered = games.filter(id => app.includes(`id:'${id}'`) || app.includes(`id: '${id}'`));
registered.length === games.length ? pass(`Release registry: all ${games.length} games present`) : fail(`Release registry missing: ${games.filter(id => !registered.includes(id)).join(', ')}`);

const readyCount = (app.match(/ready:\s*true/g) || []).length;
readyCount >= games.length ? pass(`Release registry: ${readyCount} games marked ready`) : fail(`Only ${readyCount}/${games.length} games are marked ready`);

for (const id of games) {
  const routed = app.includes(`screen==='${id}'?`) || app.includes(`screen === '${id}' ?`) || app.includes(`screen==='${id}' ?`);
  if (!routed) fail(`Playable screen route missing for ${id}`);
}
if (!process.exitCode) pass('All registered games have playable screen routes');

for (const route of hostRoutes) {
  if (!app.includes(`hostParams.get('host')==='${route}'`) && !app.includes(`hostParams.get('host') === '${route}'`)) fail(`QR/host route missing for ${route}`);
}
if (hostRoutes.every(route => app.includes(`'${route}'`))) pass('Required QR/host routes are wired');

const coverMatches = [...app.matchAll(/cover:asset\('([^']+)'\)/g)].map(match => match[1]);
const missingCovers = coverMatches.filter(file => !exists(`public/assets/${file}`));
coverMatches.length >= games.length && missingCovers.length === 0
  ? pass(`All ${coverMatches.length} game cover assets exist`)
  : fail(`Missing cover assets: ${missingCovers.join(', ') || 'cover registry incomplete'}`);

const heroMatches = [...app.matchAll(/asset\('([^']+)'\)/g)].map(match => match[1]);
const missingHeroAssets = [...new Set(heroMatches)].filter(file => !exists(`public/assets/${file}`));
missingHeroAssets.length === 0 ? pass('All App asset() references resolve to public assets') : fail(`Broken App assets: ${missingHeroAssets.join(', ')}`);

if (session.includes('readyPresets') && session.includes('pickPlan') && session.includes('readRecentGameIds')) pass('Smart-session presets, adaptive planning, and recent-game avoidance are present');
else fail('Smart-session release features are incomplete');

if (realtime.includes('createRealtimeRoomChannel')) pass('Shared realtime room transport is present');
else fail('Shared realtime room transport entry point is missing');

const forbidden = /coming soon|قريبًا فقط|لعبة غير متاحة|TODO\b|FIXME\b/i;
const criticalFiles = [
  'src/App.tsx',
  'src/components/party/SmartPartySession.tsx',
  'src/components/party/SecretWordPrivate.tsx',
  'src/components/party/WordBankPrivate.tsx',
  'src/components/party/ActingPrivate.tsx',
  'src/components/party/FamilyFeudPro.tsx',
];
for (const file of criticalFiles) {
  if (!exists(file)) { fail(`Critical release file missing: ${file}`); continue; }
  if (forbidden.test(read(file))) fail(`Release blocker copy/marker remains in ${file}`);
}

if (!exists('public/manifest.webmanifest') && !exists('public/manifest.json')) console.warn('⚠️ PWA manifest not found under the common manifest filenames; build may use another manifest path.');
else pass('PWA manifest exists');

if (process.exitCode) process.exit(process.exitCode);
console.log('🚀 Qaddha release checks passed.');
