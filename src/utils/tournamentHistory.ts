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

export type TournamentTeamStanding = {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  differential: number;
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

export function getTournamentStandings(history = readTournamentHistory()): TournamentTeamStanding[] {
  const table = new Map<string, TournamentTeamStanding>();
  const touch = (team: string) => {
    const clean = team.trim() || 'فريق بدون اسم';
    const existing = table.get(clean);
    if (existing) return existing;
    const created: TournamentTeamStanding = { team: clean, played: 0, wins: 0, draws: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, differential: 0 };
    table.set(clean, created);
    return created;
  };

  history.forEach((item) => {
    const a = touch(item.teamA);
    const b = touch(item.teamB);
    a.played += 1;
    b.played += 1;
    a.pointsFor += item.scoreA;
    a.pointsAgainst += item.scoreB;
    b.pointsFor += item.scoreB;
    b.pointsAgainst += item.scoreA;

    if (item.scoreA === item.scoreB || item.winner === 'تعادل') {
      a.draws += 1;
      b.draws += 1;
    } else if (item.scoreA > item.scoreB) {
      a.wins += 1;
      b.losses += 1;
    } else {
      b.wins += 1;
      a.losses += 1;
    }
  });

  return [...table.values()]
    .map((team) => ({ ...team, differential: team.pointsFor - team.pointsAgainst }))
    .sort((a, b) => b.wins - a.wins || b.differential - a.differential || b.pointsFor - a.pointsFor || a.team.localeCompare(b.team, 'ar'));
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
