export type PendingSessionGame = {
  gameId: string;
  mode: 'smart' | 'tournament';
  teamA: string;
  teamB: string;
  launchedAt: number;
};

export type SessionGameResult = {
  gameId: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: string;
  finishedAt: number;
  signature: string;
};

const PENDING_KEY = 'qaddha.session-pending-game.v1';
const RESULT_KEY = 'qaddha.session-game-result.v1';
const MAX_AGE = 6 * 60 * 60 * 1000;

export function beginSessionGame(input: Omit<PendingSessionGame, 'launchedAt'>) {
  try {
    const value: PendingSessionGame = { ...input, launchedAt: Date.now() };
    localStorage.setItem(PENDING_KEY, JSON.stringify(value));
    localStorage.removeItem(RESULT_KEY);
  } catch {
    // Session bridge is optional.
  }
}

export function readPendingSessionGame(): PendingSessionGame | null {
  try {
    const raw = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null') as Partial<PendingSessionGame> | null;
    if (!raw || typeof raw.gameId !== 'string' || (raw.mode !== 'smart' && raw.mode !== 'tournament') || typeof raw.launchedAt !== 'number') return null;
    if (Date.now() - raw.launchedAt > MAX_AGE) {
      clearPendingSessionGame();
      return null;
    }
    return {
      gameId: raw.gameId,
      mode: raw.mode,
      teamA: typeof raw.teamA === 'string' ? raw.teamA : 'الفريق الأول',
      teamB: typeof raw.teamB === 'string' ? raw.teamB : 'الفريق الثاني',
      launchedAt: raw.launchedAt,
    };
  } catch {
    return null;
  }
}

export function clearPendingSessionGame() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // Session bridge is optional.
  }
}

export function publishSessionGameResult(input: Omit<SessionGameResult, 'finishedAt'>) {
  try {
    const pending = readPendingSessionGame();
    if (!pending || pending.gameId !== input.gameId) return false;
    const result: SessionGameResult = { ...input, finishedAt: Date.now() };
    localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    window.dispatchEvent(new CustomEvent('qaddha:session-game-result', { detail: result }));
    return true;
  } catch {
    return false;
  }
}

export function consumeSessionGameResult(gameId?: string): SessionGameResult | null {
  try {
    const raw = JSON.parse(localStorage.getItem(RESULT_KEY) || 'null') as Partial<SessionGameResult> | null;
    if (!raw || typeof raw.gameId !== 'string' || typeof raw.finishedAt !== 'number' || typeof raw.scoreA !== 'number' || typeof raw.scoreB !== 'number') return null;
    if (Date.now() - raw.finishedAt > MAX_AGE || (gameId && raw.gameId !== gameId)) return null;
    const result: SessionGameResult = {
      gameId: raw.gameId,
      teamA: typeof raw.teamA === 'string' ? raw.teamA : 'الفريق الأول',
      teamB: typeof raw.teamB === 'string' ? raw.teamB : 'الفريق الثاني',
      scoreA: raw.scoreA,
      scoreB: raw.scoreB,
      winner: typeof raw.winner === 'string' ? raw.winner : 'تعادل',
      finishedAt: raw.finishedAt,
      signature: typeof raw.signature === 'string' ? raw.signature : `${raw.gameId}-${raw.finishedAt}`,
    };
    localStorage.removeItem(RESULT_KEY);
    localStorage.removeItem(PENDING_KEY);
    return result;
  } catch {
    return null;
  }
}
