export type TournamentHistoryEntry = {
  id: string;
  finishedAt: number;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: string;
  gameCount: number;
  signature: string;
};

const HISTORY_KEY = 'qaddha.tournament-history.v1';
const MAX_HISTORY = 20;

export function readTournamentHistory(): TournamentHistoryEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item: unknown): item is TournamentHistoryEntry => {
        if (!item || typeof item !== 'object') return false;
        const value = item as Partial<TournamentHistoryEntry>;
        return typeof value.id === 'string'
          && typeof value.finishedAt === 'number'
          && typeof value.teamA === 'string'
          && typeof value.teamB === 'string'
          && typeof value.scoreA === 'number'
          && typeof value.scoreB === 'number'
          && typeof value.winner === 'string'
          && typeof value.gameCount === 'number'
          && typeof value.signature === 'string';
      })
      .sort((a, b) => b.finishedAt - a.finishedAt)
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function saveTournamentResult(input: Omit<TournamentHistoryEntry, 'id' | 'finishedAt'>) {
  try {
    const history = readTournamentHistory();
    if (history.some(item => item.signature === input.signature)) return false;
    const now = Date.now();
    const entry: TournamentHistoryEntry = {
      ...input,
      id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
      finishedAt: now,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history].slice(0, MAX_HISTORY)));
    window.dispatchEvent(new CustomEvent('qaddha:tournament-history-changed'));
    return true;
  } catch {
    return false;
  }
}

export function clearTournamentHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    window.dispatchEvent(new CustomEvent('qaddha:tournament-history-changed'));
  } catch {
    // History is optional.
  }
}
