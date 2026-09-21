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

const games = ['teams','letters','who','photo','words','fast','character','riddles','family','connection','auction','order','memory','missing','acting','secret','pressure','intruder'];
const hostRoutes = ['who','family'];

const registered = games.filter(id => app.includes(`id:'${id}'`) || app.includes(`id: '${id}'`));
registered.length === games.length ? pass(`Release registry: all ${games.length} games present`) : fail(`Release registry missing: ${games.filter(id => !registered.includes(id)).join(', ')}`);

const readyCount = (app.match(/ready:\s*true/g) || []).length;
readyCount >= games.length ? pass(`Release registry: ${readyCount} games marked ready`) : fail(`Only ${readyCount}/${games.length} games are marked ready`);

for (const id of games) {
  const routed = app.includes(`screen==='${id}'?`) || app.includes(`screen === '${id}' ?`) || app.includes(`screen==='${id}' ?`);
  if (!routed) fail(`Playable screen route missing for ${id}`);
}
if (!process.exitCode) pass('All registered games have playable screen routes');

const main = read('src/main.tsx');
if (!main.includes("host === 'who'")) fail('QR/host route missing for who');
if (!app.includes("hostParams.get('host')==='family'")) fail('QR/host route missing for family');
if (main.includes("host === 'who'") && app.includes("hostParams.get('host')==='family'")) pass('Required QR/host routes are wired');

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


const onlineLobbyFile = 'src/components/party/OnlineLobby.tsx';
const onlineClientFile = 'src/utils/onlinePlay.ts';
const authClientFile = 'src/utils/authClient.ts';
const productionMigrationFile = 'supabase/migrations/20260918012100_qaddha_production_accounts_online.sql';
for (const file of [onlineLobbyFile, onlineClientFile, authClientFile, productionMigrationFile]) {
  if (!exists(file)) fail(`Online release file missing: ${file}`);
}
if (exists(onlineLobbyFile) && exists(onlineClientFile) && exists(authClientFile)) {
  const onlineLobby = read(onlineLobbyFile);
  const onlineClient = read(onlineClientFile);
  const authClient = read(authClientFile);
  const onlineChecks = [
    [app.includes("screen==='online'") && app.includes('<OnlineRoom'), 'Online mode is integrated inside the Qaddha shell'],
    [app.includes("hostParams.has('online')") && app.includes("hostParams.has('onlineHost')"), 'Invite-code deep link is wired'],
    [onlineLobby.includes('findQuickOnlineMatch'), 'Quick Match UI is wired'],
    [onlineLobby.includes('createPrivateOnlineRoom'), 'Private-room UI is wired'],
    [onlineLobby.includes('recordOnlineDuelResult'), 'Online results persist to account stats'],
    [onlineClient.includes("private: true"), 'Online Realtime channel is private'],
    [onlineClient.includes('qaddha_record_duel_result'), 'Online result RPC is wired'],
    [authClient.includes('persistSession: true') && authClient.includes('autoRefreshToken: true'), 'Auth session persistence and refresh are enabled'],
  ];
  for (const [ok, label] of onlineChecks) ok ? pass(label) : fail(label);
}


const adminDashboardFile = 'src/components/admin/QaddhaAdminDashboard.tsx';
const adminConfigFile = 'src/utils/adminConfig.ts';
const adminMigrationFile = 'supabase/migrations/20260918044000_add_admin_overview_metrics.sql';
for (const file of [adminDashboardFile, adminConfigFile, adminMigrationFile]) {
  if (!exists(file)) fail(`Admin release file missing: ${file}`);
}
if (exists(adminDashboardFile) && exists(adminConfigFile)) {
  const adminDashboard = read(adminDashboardFile);
  const adminConfig = read(adminConfigFile);
  const adminChecks = [
    [adminDashboard.includes('QADDHA CONTROL CENTER'), 'Admin control center shell is present'],
    [adminDashboard.includes('fetchQaddhaAdminOverview'), 'Admin live overview is wired'],
    [adminDashboard.includes('آخر غرف الأونلاين'), 'Admin recent online rooms view is present'],
    [adminDashboard.includes('ALL_GAME_IDS.length'), 'Admin game controls cover the full game registry'],
    [adminConfig.includes('qaddha_admin_overview'), 'Admin overview RPC is wired'],
    [adminConfig.includes('qaddha_admin_players') && adminConfig.includes('qaddha_admin_audit'), 'Admin player operations are wired'],
    [adminDashboard.includes('آخر اللاعبين') && adminDashboard.includes('سجل الإدارة'), 'Admin player and audit views are present'],
    [adminDashboard.includes('cancelQaddhaOnlineRoom'), 'Admin room termination is wired'],
    [adminDashboard.includes('bootstrapFirstQaddhaAdmin') && adminDashboard.includes('إنشاء حساب المالك'), 'First-owner admin setup is wired'],
    [adminConfig.includes('qaddha_admin_bootstrap_available') && adminConfig.includes('qaddha_bootstrap_first_admin'), 'Admin bootstrap RPC client is wired'],
    [exists('src/admin.css') && read('src/admin.css').includes('@tailwind utilities'), 'Admin Tailwind stylesheet is present'],
    [read('public/sw.js').includes("admin.html") && read('public/sw.js').includes("cache: 'no-store'"), 'Admin navigation cache is isolated'],
  ];
  for (const [ok, label] of adminChecks) ok ? pass(label) : fail(label);
}

const durableOnlineFile = 'src/components/party/OnlineRoom.tsx';
const durableGuestMigration = 'supabase/migrations/20260922011500_guest_rooms_durable.sql';
const hardenedGuestMigration = 'supabase/migrations/20260922013000_harden_guest_room_rpc.sql';
const settingsFile = 'src/components/party/SiteSettings.tsx';
const authContextFile = 'src/contexts/AuthContext.tsx';

for (const file of [durableOnlineFile,durableGuestMigration,hardenedGuestMigration,settingsFile,authContextFile]) {
  if (!exists(file)) fail(`Current production feature missing: ${file}`);
}

if (exists(durableOnlineFile)) {
  const durableOnline = read(durableOnlineFile);
  const currentOnlineChecks = [
    [durableOnline.includes('qaddha_guest_create_room'), 'Guest rooms create through Supabase'],
    [durableOnline.includes('qaddha_guest_get_room'), 'Guest room restore is wired'],
    [durableOnline.includes('qaddha_guest_save_room'), 'Guest room persistence is wired'],
    [durableOnline.includes('qaddha_guest_close_room'), 'Guest room close is wired'],
    [durableOnline.includes('HOST_TOKEN_PREFIX'), 'Host ownership token protection is present'],
    [durableOnline.includes('channel.presenceState()'), 'Realtime host presence/reconnect is present'],
    [!durableOnline.includes('peerjs') && !durableOnline.includes('new Peer('), 'Current online room has no PeerJS fallback'],
  ];
  for (const [ok,label] of currentOnlineChecks) ok ? pass(label) : fail(label);
}

if (exists(authClientFile) && exists(authContextFile)) {
  const authClient = read(authClientFile);
  const authContext = read(authContextFile);
  authClient.includes('/auth/v1/settings') && authClient.includes('external?.google')
    ? pass('Google provider availability is verified against Supabase Auth settings')
    : fail('Google provider readiness check is missing');
  authContext.includes("provider: 'google'") && authContext.includes('userinfo.email')
    ? pass('Google OAuth uses explicit Google email scope')
    : fail('Google OAuth configuration is incomplete');
}

if (exists(settingsFile)) {
  const settings = read(settingsFile);
  settings.includes('root.dataset.tvMode') && settings.includes('root.dataset.mobileMode')
    ? pass('TV and mobile display modes are wired to document datasets')
    : fail('Display preference dataset wiring is incomplete');
}

if (!app.includes("cover:asset('pressure-cover.webp')")) fail('Pressure must use its production WebP cover');
else pass('Pressure uses production WebP cover');
if (!app.includes("cover:asset('intruder-cover.webp')")) fail('Intruder must use its production WebP cover');
else pass('Intruder uses production WebP cover');

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


const autoTvFile = 'src/utils/autoTvMode.ts';
const pwaHookFile = 'src/hooks/usePWA.ts';
const serviceWorkerFile = 'public/sw.js';
const manifestFile = exists('public/manifest.webmanifest') ? 'public/manifest.webmanifest' : 'public/manifest.json';

for (const file of [autoTvFile,pwaHookFile,serviceWorkerFile]) {
  if (!exists(file)) fail(`Platform release file missing: ${file}`);
}
if (exists(autoTvFile)) {
  const autoTv = read(autoTvFile);
  autoTv.includes('root.dataset.tvMode') && autoTv.includes('root.dataset.mobileMode')
    ? pass('Automatic display detection updates TV/mobile datasets')
    : fail('Automatic TV/mobile dataset wiring is missing');
}
if (exists(pwaHookFile) && exists(serviceWorkerFile)) {
  const pwa = read(pwaHookFile);
  const sw = read(serviceWorkerFile);
  pwa.includes('qaddha:update-ready') && sw.includes("qaddha-v5")
    ? pass('PWA update signalling and current cache version are present')
    : fail('PWA update/cache hardening is incomplete');
}
if (exists(manifestFile)) {
  const manifest = read(manifestFile);
  manifest.includes('"shortcuts"') && manifest.includes('قدّها أونلاين')
    ? pass('PWA shortcuts include online entry')
    : fail('PWA shortcuts are incomplete');
}

if (!exists('public/manifest.webmanifest') && !exists('public/manifest.json')) console.warn('⚠️ PWA manifest not found under the common manifest filenames; build may use another manifest path.');
else pass('PWA manifest exists');

if (process.exitCode) process.exit(process.exitCode);
console.log('🚀 Qaddha release checks passed.');
