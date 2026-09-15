import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const SUPABASE_URL = 'https://uhbtcjlapgpsohbkotpd.supabase.co';
// Keep the browser transport on the legacy anon JWT for compatibility with the
// currently pinned supabase-js/realtime client. This is a public client key,
// not a service-role secret.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoYnRjamxhcGdwc29oYmtvdHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgyNjMsImV4cCI6MjEwNDk4NDI2M30.9T3YTqtQ3kjV4wHjuUsamK_DOgRqBel53t51dYGpIOc';
const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  realtime: {
    params: { eventsPerSecond: 20 },
    heartbeatIntervalMs: 15000,
    timeout: 15000,
  },
});

function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let value = '';
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
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
  return client.channel(`qaddha:${game}:${roomId}:${token}`, {
    config: {
      broadcast: { self: false, ack: false },
      presence: { key: `${game}-${randomCode(8)}` },
    },
  });
}

export function removeRealtimeChannel(channel: RealtimeChannel) {
  return client.removeChannel(channel);
}
