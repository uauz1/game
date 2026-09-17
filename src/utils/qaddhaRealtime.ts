import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const SUPABASE_URL = 'https://uhbtcjlapgpsohbkotpd.supabase.co';
// Public browser anon key. Never replace this with a service-role/private key.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InVoYnRjamxhcGdwc29oYmtvdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgyNjMsImV4cCI6MjEwNDk4NDI2M30.9T3YTqtQ3kjV4wHjuUsamK_DOgRqBel53t51dYGpIOc';
const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
const roomAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: {
    params: { eventsPerSecond: 20 },
    heartbeatIntervalMs: 15000,
    timeout: 15000,
  },
});

let lifecycleInstalled = false;

function ensureRealtimeConnected() {
  try {
    client.realtime.connect();
  } catch {
    // subscribe() still gets a chance to establish transport if an eager connect fails.
  }
}

function installReconnectLifecycle() {
  if (lifecycleInstalled || typeof window === 'undefined') return;
  lifecycleInstalled = true;
  const reconnect = () => {
    if (navigator.onLine) ensureRealtimeConnected();
  };
  window.addEventListener('online', reconnect);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reconnect();
  });
}

function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let value = '';
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

export function createPartyCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let value = '';
  for (const byte of bytes) value += roomAlphabet[byte % roomAlphabet.length];
  return value;
}

export function normalizePartyCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
}

export function isValidPartyCode(value: string) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(normalizePartyCode(value));
}

export function createPublicLobbyChannel(code: string): RealtimeChannel {
  const normalized = normalizePartyCode(code);
  if (!isValidPartyCode(normalized)) throw new Error('INVALID_PARTY_CODE');
  installReconnectLifecycle();
  ensureRealtimeConnected();
  return client.channel(`qaddha:lobby:${normalized}`, {
    config: { broadcast: { self: true, ack: false } },
  });
}

export function createPublicLobbyPresenceChannel(code: string, presenceKey: string): RealtimeChannel {
  const normalized = normalizePartyCode(code);
  if (!isValidPartyCode(normalized)) throw new Error('INVALID_PARTY_CODE');
  installReconnectLifecycle();
  ensureRealtimeConnected();
  return client.channel(`qaddha:lobby:${normalized}`, {
    config: {
      broadcast: { self: true, ack: false },
      presence: { key: presenceKey },
    },
  });
}

export function createRealtimeRoomId(game: string) {
  return `qd-${game}-${randomCode(12)}`;
}

export function createRealtimeRoomToken() {
  return randomCode(18);
}

export function isValidRealtimeRoomId(roomId: string, game: string) {
  return new RegExp(`^qd-${game}-[a-z2-9]{12}$`).test(roomId);
}

export function isValidRealtimeRoomToken(token: string) {
  return /^[a-z2-9]{18}$/.test(token);
}

export function buildRealtimeJoinUrl(game: string, roomId: string, token: string) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('host', game);
  url.searchParams.set('room', roomId);
  url.searchParams.set('token', token);
  return url.toString();
}

export function createRealtimeJoinQr(url: string) {
  return QRCode.toDataURL(url, {
    width: 640,
    margin: 4,
    errorCorrectionLevel: 'Q',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export function createRealtimeRoomChannel(game: string, roomId: string, token: string): RealtimeChannel {
  installReconnectLifecycle();
  ensureRealtimeConnected();
  return client.channel(`qaddha:${game}:${roomId}:${token}`, {
    config: {
      broadcast: { self: false, ack: false },
    },
  });
}

export async function removeRealtimeChannel(channel: RealtimeChannel) {
  try {
    return await client.removeChannel(channel);
  } catch {
    return 'error' as const;
  }
}
