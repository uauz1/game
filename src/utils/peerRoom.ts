import type { PeerOptions } from 'peerjs';
import QRCode from 'qrcode';

const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';

function randomCode(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let value = '';
  for (const byte of bytes) value += alphabet[byte % alphabet.length];
  return value;
}

export function createRoomId(game: string) {
  return `qd-${game}-${randomCode(14)}`;
}

export function createRoomToken() {
  return randomCode(20);
}

export function buildJoinUrl(game: string, roomId: string, token: string) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('host', game);
  url.searchParams.set('room', roomId);
  url.searchParams.set('token', token);
  return url.toString();
}

export function createJoinQr(url: string) {
  return QRCode.toDataURL(url, {
    width: 640,
    margin: 4,
    errorCorrectionLevel: 'Q',
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export const peerOptions: PeerOptions = {
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  pingInterval: 5000,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
    sdpSemantics: 'unified-plan',
  },
};

export function isValidRoomId(roomId: string, game: string) {
  return new RegExp(`^qd-${game}-[a-z2-9]{14}$`).test(roomId);
}

export function isValidRoomToken(token: string) {
  return /^[a-z2-9]{20}$/.test(token);
}
