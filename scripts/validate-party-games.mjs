import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const fail = message => { console.error(`❌ ${message}`); process.exitCode = 1; };
const pass = message => console.log(`✅ ${message}`);
const count = (text, pattern) => [...text.matchAll(pattern)].length;

const app = read('src/App.tsx');
const extra = read('src/components/party/ExtraPartyGames.tsx');
const newGames = read('src/components/party/NewPartyGames.tsx');
const data = read('src/data/newPartyGames.ts');
const who = read('src/data/whoAmIQuestions.ts');
const secret = read('src/components/party/SecretWordPrivate.tsx');
const photo = read('src/components/party/PhotoChallengeReal.tsx');
const words = read('src/components/party/WordBankPrivate.tsx');
const acting = read('src/components/party/ActingPrivate.tsx');
const host = read('src/components/party/HostRoom.tsx');

const gameIds = ['teams','letters','who','photo','words','fast','character','riddles','family','connection','auction','order','memory','missing','acting','secret'];
for (const id of gameIds) {
  if (!app.includes(`id:'${id}'`) && !app.includes(`id: '${id}'`)) fail(`Game registry is missing ${id}`);
}
if (gameIds.every(id => app.includes(`id:'${id}'`) || app.includes(`id: '${id}'`))) pass('All 16 games are registered');

const hostRoutes = ['who','secret','acting','words','family'];
for (const route of hostRoutes) {
  if (!app.includes(`hostParams.get('host')==='${route}'`) && !app.includes(`hostParams.get('host') === '${route}'`)) fail(`Missing QR/host route: ${route}`);
}
if (hostRoutes.every(route => app.includes(`'${route}'`))) pass('Host/QR routes are present');

const extraMinimums = [
  ['auction', count(extra, /id:'auction-/g), 12],
  ['order', count(extra, /id:'order-/g), 12],
  ['memory', count(extra, /id:'memory-/g), 12],
  ['missing', count(extra, /id:'missing-/g), 12],
];
for (const [name, actual, minimum] of extraMinimums) actual >= minimum ? pass(`${name}: ${actual} curated rounds`) : fail(`${name} only has ${actual} rounds; expected at least ${minimum}`);

const feudCount = count(data, /id:'feud-/g);
feudCount >= 24 ? pass(`Family Feud bank: ${feudCount} rounds`) : fail(`Family Feud bank is too small: ${feudCount}`);

const connectionCount = count(data, /id:'connection-/g);
connectionCount >= 30 ? pass(`Connection bank: ${connectionCount} rounds`) : fail(`Connection bank is too small: ${connectionCount}`);

const whoCount = count(who, /id:\s*['"]who-/g) || count(who, /id:['"]who-/g);
whoCount >= 30 ? pass(`Who Am I bank: ${whoCount} characters`) : fail(`Who Am I bank is too small: ${whoCount}`);

if (/placeholder|coming soon|قريبًا فقط/i.test([extra,newGames,photo,words,acting,secret].join('\n'))) fail('A playable game still contains placeholder/coming-soon copy');
else pass('No placeholder gameplay remains in core party games');

const qrFiles = [secret, words, acting, host];
if (qrFiles.every(text => text.includes('createRealtimeRoomChannel'))) pass('QR games use the shared realtime transport');
else fail('At least one QR game is not using the shared realtime transport');

if ([secret, words, acting, host, newGames].some(text => text.includes("from '../../utils/peerRoom'") || text.includes('from "../../utils/peerRoom"'))) fail('Legacy PeerJS transport is still imported by a live party game');
else pass('Live party games no longer import the legacy PeerJS transport');

if (!photo.includes('wikipedia') && !photo.includes('Wikipedia') && !photo.includes('wikimedia') && !photo.includes('Wikimedia')) fail('Photo challenge no longer references its real-image source path');
else pass('Photo challenge keeps the real-image source path');

if (process.exitCode) process.exit(process.exitCode);
console.log('🎮 Party game integrity checks passed.');
