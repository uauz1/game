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


export type MultiplayerChallenge = {
  gameId: string;
  roundKey: string;
  answers: string[];
  points: number;
  choices?: string[];
};

const CHALLENGE_KEY = 'qaddha.multiplayer-challenge.v1';

export function publishMultiplayerChallenge(challenge: MultiplayerChallenge) {
  try {
    const clean: MultiplayerChallenge = {
      gameId: challenge.gameId,
      roundKey: challenge.roundKey,
      answers: challenge.answers.filter(Boolean).map(value => value.trim()).filter(Boolean),
      points: Math.max(0, Math.round(challenge.points)),
      choices: challenge.choices?.filter(Boolean).map(value => value.trim()).filter(Boolean),
    };
    sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(clean));
    window.dispatchEvent(new CustomEvent('qaddha:multiplayer-challenge', { detail: clean }));
  } catch {/* realtime scoring remains optional */}
}

export function clearMultiplayerChallenge(gameId?: string) {
  try {
    if (gameId) {
      const current = readMultiplayerChallenge();
      if (current && current.gameId !== gameId) return;
    }
    sessionStorage.removeItem(CHALLENGE_KEY);
    window.dispatchEvent(new CustomEvent('qaddha:multiplayer-challenge', { detail: null }));
  } catch {/* optional */}
}

export function readMultiplayerChallenge(): MultiplayerChallenge | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(CHALLENGE_KEY) || 'null') as Partial<MultiplayerChallenge> | null;
    if (!parsed || typeof parsed.gameId !== 'string' || typeof parsed.roundKey !== 'string' || !Array.isArray(parsed.answers) || typeof parsed.points !== 'number') return null;
    return {
      gameId: parsed.gameId,
      roundKey: parsed.roundKey,
      answers: parsed.answers.filter((value): value is string => typeof value === 'string'),
      points: Math.max(0, parsed.points),
      choices: Array.isArray(parsed.choices) ? parsed.choices.filter((value): value is string => typeof value === 'string') : undefined,
    };
  } catch { return null; }
}

function normalizeChallengeAnswer(value: string) {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/[\u064b-\u065f\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ـ/g, '')
    .replace(/[^\u0621-\u063a\u0641-\u064aA-Za-z0-9]/g, '');
}

export function judgeMultiplayerChallenge(challenge: MultiplayerChallenge, submittedValue: string) {
  let submitted = submittedValue.trim();
  const numeric = Number(submitted);
  if (challenge.choices && Number.isInteger(numeric) && numeric >= 1 && numeric <= challenge.choices.length) {
    submitted = challenge.choices[numeric - 1];
  }
  const actual = normalizeChallengeAnswer(submitted);
  const match = challenge.answers.find(answer => {
    const expected = normalizeChallengeAnswer(answer);
    if (!actual || !expected) return false;
    return actual === expected || (Math.min(actual.length, expected.length) >= 5 && (actual.includes(expected) || expected.includes(actual)));
  });
  return {
    correct: Boolean(match),
    points: challenge.points,
    canonical: challenge.answers[0] || '',
  };
}
