import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const fail = message => { console.error(`❌ ${message}`); process.exitCode = 1; };
const pass = message => console.log(`✅ ${message}`);
const count = (text, pattern) => [...text.matchAll(pattern)].length;

const app = read('src/App.tsx');
const extra = read('src/components/party/ExtraPartyGames.tsx');
const newGames = read('src/components/party/NewPartyGames.tsx');
const premium = read('src/components/party/PremiumPartyGames.tsx');
const data = read('src/data/newPartyGames.ts');
const who = read('src/data/whoAmIQuestions.ts');
const whoExpansion = read('src/data/whoAmIExpansion.ts');
const secret = read('src/components/party/SecretWordPrivate.tsx');
const photo = read('src/components/party/PhotoChallengeReal.tsx');
const words = read('src/components/party/WordBankPrivate.tsx');
const acting = read('src/components/party/ActingPrivate.tsx');
const host = read('src/components/party/HostRoom.tsx');

const gameIds = ['teams','letters','who','photo','words','fast','character','riddles','family','connection','auction','order','memory','missing','acting','secret','pressure','intruder'];
for (const id of gameIds) {
  if (!app.includes(`id:'${id}'`) && !app.includes(`id: '${id}'`)) fail(`Game registry is missing ${id}`);
}
if (gameIds.every(id => app.includes(`id:'${id}'`) || app.includes(`id: '${id}'`))) pass('All 18 games are registered');

const hostRoutes = ['family'];
for (const route of hostRoutes) {
  if (!app.includes(`hostParams.get('host')==='${route}'`) && !app.includes(`hostParams.get('host') === '${route}'`)) fail(`Missing QR/host route: ${route}`);
}
if (hostRoutes.every(route => app.includes(`'${route}'`)) && app.includes("hostParams.has('online')") && app.includes("hostParams.has('onlineHost')")) pass('Host/QR and online-room routes are present');

const extraMinimums = [
  ['auction', count(extra.match(/const auctionRounds = \[([\s\S]*?)\n\];/)?.[1] || '', /\{ title:/g), 12],
  ['order', count(extra.match(/const orderRounds = \[([\s\S]*?)\n\];/)?.[1] || '', /\{ title:/g), 12],
  ['memory', count(extra.match(/const memoryRounds = \[([\s\S]*?)\n\];/)?.[1] || '', /^\s*\[/gm), 12],
  ['missing', count(extra.match(/const missingRounds = \[([\s\S]*?)\n\];/)?.[1] || '', /\{ items:/g), 12],
];
for (const [name, actual, minimum] of extraMinimums) actual >= minimum ? pass(`${name}: ${actual} curated rounds`) : fail(`${name} only has ${actual} rounds; expected at least ${minimum}`);

const pressureCount = count(premium, /id:'p-[emh]-/g);
pressureCount >= 36 ? pass(`Pressure bank: ${pressureCount} prompts`) : fail(`Pressure bank is too small: ${pressureCount}`);
const intruderCount = count(premium, /id:'i-[emh]-/g);
intruderCount >= 36 ? pass(`Intruder bank: ${intruderCount} rounds`) : fail(`Intruder bank is too small: ${intruderCount}`);
for (const difficulty of ['easy','medium','hard','mixed']) {
  if (!premium.includes(`id:'${difficulty}'`) && !premium.includes(`id: '${difficulty}'`)) fail(`Premium games difficulty selector is missing ${difficulty}`);
}
if (['easy','medium','hard','mixed'].every(difficulty => premium.includes(`id:'${difficulty}'`) || premium.includes(`id: '${difficulty}'`))) pass('Premium games expose truthful easy/medium/hard/random levels');

const feudCount = count(data, /id:'feud-/g);
feudCount >= 8 ? pass(`Family Feud bank: ${feudCount} rounds`) : fail(`Family Feud bank is too small: ${feudCount}`);

const connectionCount = count(data, /id:'connection-/g);
connectionCount >= 30 ? pass(`Connection bank: ${connectionCount} rounds`) : fail(`Connection bank is too small: ${connectionCount}`);

const whoCount = count(who, /id:\s*['"](?:easy|medium|hard)-/g) + count(whoExpansion, /id:\s*['"]exp-/g);
whoCount >= 40 ? pass(`Who Am I bank: ${whoCount} characters`) : fail(`Who Am I bank is too small: ${whoCount}`);

if (/coming soon|قريبًا فقط|لعبة غير متاحة/i.test([extra,newGames,premium,photo,words,acting,secret].join('\n'))) fail('A playable game still contains coming-soon/unavailable copy');
else pass('No coming-soon gameplay remains in core party games');

const qrFiles = [secret, words, acting, host];
if (qrFiles.every(text => text.includes('createRealtimeRoomChannel'))) pass('QR games use the shared realtime transport');
else fail('At least one QR game is not using the shared realtime transport');

const onlineRoom = read('src/components/party/OnlineRoom.tsx');
if ([secret, words, acting, host, newGames, onlineRoom].some(text => text.includes("from '../../utils/peerRoom'") || text.includes('from "../../utils/peerRoom"') || text.includes("from 'peerjs'") || text.includes('from "peerjs"'))) fail('Legacy PeerJS transport is still imported by a live party game');
else pass('Live party games and online rooms no longer import PeerJS');

if (!photo.includes('wikipedia') && !photo.includes('Wikipedia') && !photo.includes('wikimedia') && !photo.includes('Wikimedia')) fail('Photo challenge no longer references its real-image source path');
else pass('Photo challenge keeps the real-image source path');

for (const rpc of ['qaddha_guest_create_room','qaddha_guest_get_room','qaddha_guest_save_room','qaddha_guest_close_room']) {
  if (!onlineRoom.includes(rpc)) fail(`Online room missing durable guest RPC: ${rpc}`);
}
if (['qaddha_guest_create_room','qaddha_guest_get_room','qaddha_guest_save_room','qaddha_guest_close_room'].every(rpc => onlineRoom.includes(rpc))) pass('Durable guest room lifecycle is wired');

if (process.exitCode) process.exit(process.exitCode);
console.log('🎮 Party game integrity checks passed.');
