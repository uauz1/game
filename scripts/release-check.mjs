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



/* Legacy authenticated duel files remain in the repository for compatibility,
   but the production Online entry point is OnlineRoom.tsx. Current multiplayer
   release checks live above and must not depend on the legacy lobby. */


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

const authClientFile = 'src/utils/authClient.ts';
const authContextFile = 'src/contexts/AuthContext.tsx';
const durableOnlineFile = 'src/components/party/OnlineRoom.tsx';
const durableGuestMigration = 'supabase/migrations/20260922011500_guest_rooms_durable.sql';
const hardenedGuestMigration = 'supabase/migrations/20260922013000_harden_guest_room_rpc.sql';
const boundedGuestStateMigration = 'supabase/migrations/20260922015500_guard_guest_room_state.sql';
const settingsFile = 'src/utils/sitePreferences.ts';
for (const file of [durableOnlineFile,durableGuestMigration,hardenedGuestMigration,boundedGuestStateMigration,settingsFile,authContextFile]) {
  if (!exists(file)) fail(`Current production feature missing: ${file}`);
}

if (exists(durableOnlineFile)) {
  const durableOnline = read(durableOnlineFile);
  const currentOnlineChecks = [
    [durableOnline.includes('qaddha_guest_create_room'), 'Guest rooms create through Supabase'],
    [durableOnline.includes('onlineEmbed=1'), 'Online room launches the selected game inside the shared session'],
    [durableOnline.includes('onlineSeed=') && exists('src/utils/onlineDeterminism.ts'), 'Online devices share a deterministic game seed'],
    [durableOnline.includes("room.phase === 'countdown' || room.phase === 'playing'") && read('src/online-room.css').includes('.online-live-game.preloading'), 'Online game preloads during countdown to reduce start delay'],
    [read('src/online-room.css').includes('left: -200vw') || read('src/online-room.css').includes('-200vw'), 'Online game preload keeps a real viewport size to avoid responsive-layout glitches'],
    [durableOnline.includes("type: 'game-loaded'") && durableOnline.includes('launchDeadline') && durableOnline.includes('allLoaded'), 'Online room waits for device game readiness before shared launch'],
    [durableOnline.includes("type: 'game-action'") && durableOnline.includes('qaddha-online-replay') && exists('src/utils/onlineEmbedBridge.ts'), 'Online game interactions relay between room devices'],
    [read('src/utils/onlineEmbedBridge.ts').includes('seenActions') && read('src/utils/onlineEmbedBridge.ts').includes('rememberAction'), 'Realtime online actions are deduplicated before replay'],
    [read('src/utils/onlineEmbedBridge.ts').includes('pendingActions') && read('src/utils/onlineEmbedBridge.ts').includes('MutationObserver') && read('src/utils/onlineEmbedBridge.ts').includes('data-online-local'), 'Out-of-phase online actions queue until their UI exists and local-only controls stay private'],
    [read('src/utils/onlineEmbedBridge.ts').includes('action.gameId !== gameId') && durableOnline.includes('action.gameId !== room.gameId') && durableOnline.includes('action.gameId !== snapshot.gameId'), 'Stale online actions are scoped to the active game'],
    [durableOnline.includes('gameActions: OnlineGameAction[]') && durableOnline.includes('replayStoredActions') && durableOnline.includes('slice(-80)'), 'Online game actions persist for reconnect recovery'],
    [durableOnline.includes('room?.gameActions?.length') && durableOnline.includes('replayStoredActions(room)'), 'Persisted online actions replay after missed realtime events'],
    [durableOnline.includes('normalizeGameAction') && read('src/utils/onlineEmbedBridge.ts').includes('selector.length > 320'), 'Online action payloads are bounded and host-normalized'],
    [durableOnline.includes('gameRevision') && durableOnline.includes('const resyncGame') && durableOnline.includes('مزامنة اللعبة'), 'Host can force a live game reload and replay state across devices'],
    [durableOnline.includes('onlineTeam0=') && read('src/components/party/LettersGame.tsx').includes("onlineEmbed ? [] : loadUsedHuroofQuestions()") && read('src/components/party/LettersGame.tsx').includes("phase !== 'setup'"), 'Letters online mode shares room settings and ignores device-local question history'],
    [durableOnline.includes('roundOptionsForGame') && durableOnline.includes('timerOptionsForGame') && durableOnline.includes('closestAllowed'), 'Online lobby settings adapt to each selected game'],
    [durableOnline.includes("!['auction','order','memory','missing','intruder'].includes(room.gameId)") && durableOnline.includes("['who','pressure','intruder'].includes(room.gameId)"), 'Online lobby hides settings that do not apply to the selected game'],
    [durableOnline.includes('resetLobbyReadiness') && durableOnline.includes('ready: player.host'), 'Host setting changes reset guest readiness before launch'],
    [durableOnline.includes("gameId === 'secret' && r.maxPlayers < 4 ? 4 : r.maxPlayers"), 'Selecting Secret Word expands room capacity for its three-player minimum'],
    [durableOnline.includes('activePlayers.length >= minimumPlayers') && durableOnline.includes('n < minimumPlayers'), 'Shared launch and room capacity enforce each game minimum player count'],
    [durableOnline.includes("room?.gameId === 'secret' ? 3 : 2") && durableOnline.includes('onlineRoster='), 'Secret Word online rooms require three players and pass the live roster'],
    [durableOnline.includes("const teamsRequired = room?.gameId !== 'secret'") && durableOnline.includes('teamsRequired && <>'), 'Secret Word online lobby uses individual readiness instead of team balancing'],
    [durableOnline.includes('function IndividualBoard') && read('src/online-room.css').includes('.online-individual-board'), 'Secret Word has a dedicated individual-player lobby UI'],
    [durableOnline.includes("type: 'resync-game'") && durableOnline.includes('online-guest-live-tools'), 'Guests can request full live-game resync recovery'],
    [durableOnline.includes('allowGameAction') && durableOnline.includes('current.count >= 80'), 'Guest gameplay events are rate-limited by the host'],
    [durableOnline.includes("incoming.type !== 'join' && !knownPlayer") && durableOnline.includes('!knownPlayer?.connected || !allowGameAction'), 'Online room ignores control/gameplay messages from unknown or inactive players'],
    [durableOnline.includes('actionPersistTimerRef') && durableOnline.includes('450') && durableOnline.includes('persistRoom(snapshot)'), 'Online action persistence is batched to reduce realtime lag'],
    [durableOnline.includes('online-host-live-tools') && read('src/online-room.css').includes('.online-live > .online-host-score'), 'Embedded games own scoring/rounds while the room wrapper stays focused on sync'],
    [durableOnline.includes('winner: null, gameActions: []') && durableOnline.includes('gameLoadedId: undefined'), 'Returning to lobby clears stale match state'],
    [durableOnline.includes('pullPersistedRoom') && durableOnline.includes('lastRealtimeSnapshotAt') && durableOnline.includes('8000'), 'Guest room uses conditional persisted-state resync fallback'],
    [durableOnline.includes('onlineGuests = new Set') && durableOnline.includes("channel.on('presence', { event: 'sync' }"), 'Host uses presence sync for faster guest connectivity detection'],
    [durableOnline.includes("window.addEventListener('offline'") && durableOnline.includes("window.addEventListener('online'"), 'Online rooms recover explicitly from browser network changes'],
    [durableOnline.includes("disabled={!connected || !allReady") && durableOnline.includes("disabled={!connected} className={`ready"), 'Launch/readiness controls lock while realtime connection is unavailable'],
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

const contentIntelligenceFile = 'src/utils/contentIntelligence.ts';
const newGameSettingsFile = 'src/utils/newGameSettings.ts';
const newPartyGamesFile = 'src/components/party/NewPartyGames.tsx';
if (exists(contentIntelligenceFile) && exists(newGameSettingsFile) && exists(newPartyGamesFile)) {
  const contentEngine = read(contentIntelligenceFile);
  const newSettings = read(newGameSettingsFile);
  const newGames = read(newPartyGamesFile);
  contentEngine.includes('ONLINE_EMBED') && contentEngine.includes('ONLINE_EMBED ? []')
    ? pass('Online content selection ignores device-local history')
    : fail('Online content selection still depends on device-local history');
  newSettings.includes("onlineParams.get('onlineTimer')") && newSettings.includes("onlineParams.get('onlineRounds')")
    ? pass('Online party games consume shared room timing and rounds')
    : fail('Online party game timing/round settings are not shared');
  newGames.includes('ONLINE_TEAM_NAMES') && newGames.includes('if (!ONLINE_EMBED) saveSharedTeams')
    ? pass('Online party games use shared room team names without mutating local team preferences')
    : fail('Online party game teams are not isolated from local preferences');
  newGames.includes('if (ONLINE_EMBED && valid) onStart();') && newGames.includes('!ONLINE_EMBED && <HostPairingPanel')
    ? pass('Modern party games auto-start online and suppress duplicate legacy host pairing UI')
    : fail('Modern party games still require duplicate setup or host pairing in online mode');
  const teamGame = read('src/components/party/TeamGame.tsx');
  const partyBank = read('src/data/partyBank.ts');
  teamGame.includes("stage:'board'") && teamGame.includes("ONLINE_PARAMS.get('onlineTeam0')") && partyBank.includes('if (ONLINE_EMBED) return {}')
    ? pass('Team Game launches from shared online state without local question history')
    : fail('Team Game still depends on local setup/history in online mode');
  teamGame.includes("[6,12,18,24,30].includes(roundCount)?roundCount:12")
    ? pass('Team Game honors online room question count')
    : fail('Team Game does not honor online room question count');
}

if (exists(settingsFile)) {
  const settings = read(settingsFile);
  settings.includes('root.dataset.tvMode') && settings.includes('root.dataset.mobileMode')
    ? pass('TV and mobile display modes are wired to document datasets')
    : fail('Display preference dataset wiring is incomplete');
}

const partyAudioFile = 'src/utils/partyAudio.ts';
const smartSessionFile = 'src/components/party/SmartPartySession.tsx';
if (exists(partyAudioFile) && exists(smartSessionFile)) {
  const partyAudio = read(partyAudioFile);
  const smartSession = read(smartSessionFile);
  partyAudio.includes("from './sitePreferences'") && smartSession.includes("from '../../utils/sitePreferences'")
    ? pass('Audio, haptics, and smart sessions share the central preferences runtime')
    : fail('Preference consumers still bypass the central runtime');
}

if (exists(contentIntelligenceFile)) {
  const contentEngine = read(contentIntelligenceFile);
  contentEngine.includes('prefs.questionIntensity') && contentEngine.includes('prefs.repeatProtection')
    ? pass('Question intensity and repeat-protection preferences drive content selection')
    : fail('Content intelligence preferences are not wired');
}

const premiumGameFile = 'src/components/party/PremiumPartyGames.tsx';
const whoGameFile = 'src/components/party/WhoAmIPrivate.tsx';
const whoStorageFile = 'src/utils/whoAmIStorage.ts';
if (exists(whoGameFile) && exists(whoStorageFile)) {
  const whoGame = read(whoGameFile);
  const whoStorage = read(whoStorageFile);
  whoGame.includes('ONLINE_TEAM_NAMES') && whoGame.includes('!ONLINE_EMBED') && whoStorage.includes('ONLINE_EMBED')
    ? pass('Who Am I uses the shared online room without creating a second pairing flow')
    : fail('Who Am I online mode still depends on legacy pairing/local history');
  whoGame.includes('onlineAnswerVisible') && whoGame.includes('كشف الإجابة') && whoGame.includes('judge(index as 0|1)')
    ? pass('Who Am I has native reveal/judging controls inside online rooms')
    : fail('Who Am I online room is missing native judging controls');
}

const extraGameFile = 'src/components/party/ExtraPartyGames.tsx';
if (exists(extraGameFile)) {
  const extraGames = read(extraGameFile);
  extraGames.includes('onlineRoundLimit') && extraGames.includes('ONLINE_ROUNDS')
    ? pass('Extra party games honor shared online round counts')
    : fail('Extra party games ignore shared online round counts');
  extraGames.includes('ONLINE_TEAM_NAMES') && extraGames.includes('{ONLINE_TEAM_NAMES[0]}')
    ? pass('Auction uses shared online room team names')
    : fail('Auction online team labels are not using shared room names');
}

const lettersGameFile = 'src/components/party/LettersGame.tsx';
if (exists(lettersGameFile)) {
  const lettersGame = read(lettersGameFile);
  lettersGame.includes("onlineRounds") && lettersGame.includes("[1,3,5].includes(onlineRounds)")
    ? pass('Letters honors the shared online best-of setting')
    : fail('Letters online best-of setting is not shared');
}

const finalGameFile = 'src/components/party/FinalPartyGames.tsx';
if (exists(finalGameFile)) {
  const finalGames = read(finalGameFile);
  finalGames.includes('ONLINE_TEAM_NAMES') && finalGames.includes("if(ONLINE_EMBED && phase==='setup') start();")
    ? pass('Acting auto-starts with shared online room settings')
    : fail('Acting online mode is not using shared room settings');
  finalGames.includes('ONLINE_ROSTER') && finalGames.includes('ONLINE_PLAYER_NAME') && finalGames.includes('data-online-local')
    ? pass('Secret Word gives each online player a private role view')
    : fail('Secret Word online private-role support is missing');
  finalGames.includes("pointerEvents:'none'") && finalGames.includes('aria-disabled={onlineWaiting||undefined}')
    ? pass('Secret Word vote actions remain replayable while non-turn devices are locally locked')
    : fail('Secret Word online vote replay/local-lock handling is missing');
}

if (exists(premiumGameFile)) {
  const premiumGames = read(premiumGameFile);
  premiumGames.includes('ONLINE_ROUNDS') && premiumGames.includes('ONLINE_TIMER')
    ? pass('Premium online games honor shared round and timer settings')
    : fail('Premium online games do not fully honor shared round/timer settings');
  app.includes('readQaddhaPreferences().confirmExit')
    ? pass('Exit confirmation respects the saved preference')
    : fail('Exit confirmation preference is not wired');
  premiumGames.includes('readQaddhaPreferences().rememberProgress')
    ? pass('Premium game resume respects remember-progress preference')
    : fail('Remember-progress preference is not wired to premium game sessions');
  premiumGames.includes('ONLINE_EMBED') && premiumGames.includes('ONLINE_TEAM_NAMES') && premiumGames.includes('ONLINE_DIFFICULTY')
    ? pass('Premium games use shared online room settings and bypass local resume state')
    : fail('Premium games are not isolated from device-local state in online mode');
}

const premiumCssFile = 'src/premium-games.css';
if (exists(premiumCssFile)) {
  const premiumCss = read(premiumCssFile);
  premiumCss.includes('html[data-tv-mode="true"]') && !premiumCss.includes('body.tv-mode')
    ? pass('Premium games 17/18 use the current TV mode selector')
    : fail('Premium games still contain stale TV mode selectors');
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


const sharedRealtimeFile = 'src/utils/qaddhaRealtime.ts';
if (exists(sharedRealtimeFile)) {
  const sharedRealtime = read(sharedRealtimeFile);
  sharedRealtime.includes("from './authClient'") && !sharedRealtime.includes('sb_publishable_')
    ? pass('Realtime transport reuses shared Supabase configuration')
    : fail('Realtime transport still contains duplicate Supabase configuration');
  sharedRealtime.includes("replace(/[^A-HJ-NP-Z2-9]/g")
    ? pass('Realtime room codes use the production-safe alphabet')
    : fail('Realtime room code normalization is inconsistent');
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
const preferenceRuntimeFile = 'src/utils/sitePreferences.ts';
if (exists(preferenceRuntimeFile)) {
  const appSource = read('src/App.tsx');
  appSource.includes("lazy(() => import('./components/party/SiteSettings'))") && appSource.includes("from './utils/sitePreferences'")
    ? pass('Settings UI is lazy while preference runtime stays lightweight')
    : fail('Settings UI is still part of the initial bundle');
}

const platformShellFile = 'src/components/party/PlatformShell.tsx';

if (exists(platformShellFile)) {
  const platformShell = read(platformShellFile);
  platformShell.includes('beforeinstallprompt') && platformShell.includes('appinstalled') && platformShell.includes("lazy(() => import('./MultiplayerHostLayer'))")
    ? pass('PWA install prompt and lazy multiplayer shell are wired')
    : fail('PWA install prompt or lazy multiplayer shell wiring is missing');
  platformShell.includes("onlineEmbed = params.get('onlineEmbed') === '1'") && platformShell.includes('if (onlineEmbed) return <App/>')
    ? pass('Embedded online game runtime excludes global hub/multiplayer overlays')
    : fail('Embedded online game runtime isolation is missing');
  app.includes("const gameHome=()=>{ if(!onlineEmbed)setHomeConfirm(true); };") && app.includes('onHome={gameHome}')
    ? pass('Embedded online games cannot leave the shared room through local game navigation')
    : fail('Embedded online game navigation escape guard is missing');
}

if (exists(pwaHookFile) && exists(serviceWorkerFile)) {
  const pwa = read(pwaHookFile);
  const sw = read(serviceWorkerFile);
  pwa.includes('qaddha:update-ready') && sw.includes("qaddha-v7")
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
