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
    if (Date.now() - parsed.createdAt > 6 * 60 * 60 * 1000) {
      localStorage.removeItem(ACTIVE_ROOM_KEY);
      return null;
    }
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

export type MultiplayerTeam = 0 | 1;

export type MultiplayerInput = {
  id: string;
  playerId: string;
  playerName: string;
  team: MultiplayerTeam;
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
  mode?: 'single' | 'sequence' | 'multi';
  sequenceAnswers?: string[];
  multiAnswers?: string[];
  requiredSelections?: number;
  eligibleTeam?: MultiplayerTeam;
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
      mode: challenge.mode==='sequence'?'sequence':challenge.mode==='multi'?'multi':'single',
      sequenceAnswers: challenge.sequenceAnswers?.filter(Boolean).map(value=>value.trim()).filter(Boolean),
      multiAnswers: challenge.multiAnswers?.filter(Boolean).map(value=>value.trim()).filter(Boolean),
      requiredSelections: typeof challenge.requiredSelections==='number'?Math.max(1,Math.round(challenge.requiredSelections)):undefined,
      eligibleTeam: challenge.eligibleTeam===1?1:challenge.eligibleTeam===0?0:undefined,
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
      mode: parsed.mode==='sequence'?'sequence':parsed.mode==='multi'?'multi':'single',
      sequenceAnswers: Array.isArray(parsed.sequenceAnswers) ? parsed.sequenceAnswers.filter((value):value is string=>typeof value==='string') : undefined,
      multiAnswers: Array.isArray(parsed.multiAnswers) ? parsed.multiAnswers.filter((value):value is string=>typeof value==='string') : undefined,
      requiredSelections: typeof parsed.requiredSelections==='number'?Math.max(1,Math.round(parsed.requiredSelections)):undefined,
      eligibleTeam: parsed.eligibleTeam===1?1:parsed.eligibleTeam===0?0:undefined,
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
  if(challenge.mode==='multi'&&challenge.multiAnswers?.length){
    const selected=submittedValue.split('\u001f').map(normalizeChallengeAnswer).filter(Boolean);
    const allowed=new Set(challenge.multiAnswers.map(normalizeChallengeAnswer));
    const required=challenge.requiredSelections||selected.length;
    const correct=selected.length===required&&new Set(selected).size===selected.length&&selected.every(value=>allowed.has(value));
    return {correct,points:challenge.points,canonical:challenge.multiAnswers.join('، ')};
  }
  if(challenge.mode==='sequence'&&challenge.sequenceAnswers?.length){
    const actualParts=submittedValue.split('\u001f').map(normalizeChallengeAnswer).filter(Boolean);
    const expectedParts=challenge.sequenceAnswers.map(normalizeChallengeAnswer);
    const correct=actualParts.length===expectedParts.length&&actualParts.every((value,index)=>value===expectedParts[index]);
    return {correct,points:challenge.points,canonical:challenge.sequenceAnswers.join(' ← ')};
  }
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


export function publishMultiplayerTeamNames(names: [string, string]) {
  try {
    const clean = names.map(name => name.trim().slice(0, 22)) as [string, string];
    if (!clean[0] || !clean[1]) return;
    window.dispatchEvent(new CustomEvent('qaddha:multiplayer-team-names', { detail: clean }));
  } catch {/* optional */}
}


const PLAYER_ID_KEY = 'qaddha.multiplayer-player-id.v1';

export function readMultiplayerPlayerId() {
  try {
    const saved = localStorage.getItem(PLAYER_ID_KEY)?.trim();
    if (saved) return saved;
    const id = `p-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    localStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch {
    return `p-${Math.random().toString(36).slice(2)}`;
  }
}

export function readMultiplayerRoomScores(code: string): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(`qaddha.multiplayer-scores.${code}`) || '{}') as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([,value])=>typeof value==='number').map(([key,value])=>[key,Math.max(0,Number(value))]));
  } catch { return {}; }
}

export function saveMultiplayerRoomScores(code: string, scores: Record<string, number>) {
  try { localStorage.setItem(`qaddha.multiplayer-scores.${code}`, JSON.stringify(scores)); } catch {/* optional */}
}
