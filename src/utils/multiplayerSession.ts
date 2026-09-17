export type ActiveMultiplayerRoom = {
  code: string;
  createdAt: number;
};

const ACTIVE_ROOM_KEY = 'qaddha.active-multiplayer-room.v1';
const PLAYER_NAME_KEY = 'qaddha.multiplayer-player-name.v1';

export function saveActiveHostRoom(code: string) {
  try {
    const normalized = code.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
    if (normalized.length !== 6) return;
    localStorage.setItem(ACTIVE_ROOM_KEY, JSON.stringify({ code: normalized, createdAt: Date.now() } satisfies ActiveMultiplayerRoom));
    window.dispatchEvent(new CustomEvent('qaddha:multiplayer-room-changed'));
  } catch {/* multiplayer remains optional */}
}

export function readActiveHostRoom(): ActiveMultiplayerRoom | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACTIVE_ROOM_KEY) || 'null') as Partial<ActiveMultiplayerRoom> | null;
    if (!parsed || typeof parsed.code !== 'string' || typeof parsed.createdAt !== 'number') return null;
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(parsed.code)) return null;
    return { code: parsed.code, createdAt: parsed.createdAt };
  } catch { return null; }
}

export function clearActiveHostRoom() {
  try {
    localStorage.removeItem(ACTIVE_ROOM_KEY);
    window.dispatchEvent(new CustomEvent('qaddha:multiplayer-room-changed'));
  } catch {/* optional */}
}

export function buildMultiplayerJoinUrl(code: string) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('playroom', code.toUpperCase());
  return url.toString();
}

export function readMultiplayerPlayerName() {
  try { return (localStorage.getItem(PLAYER_NAME_KEY) || '').trim().slice(0, 18); } catch { return ''; }
}

export function saveMultiplayerPlayerName(name: string) {
  try { localStorage.setItem(PLAYER_NAME_KEY, name.trim().slice(0, 18)); } catch {/* optional */}
}

export type MultiplayerInput = {
  id: string;
  playerId: string;
  playerName: string;
  kind: 'buzz' | 'answer';
  value?: string;
  sentAt: number;
};
