export type ProgressionState = {
  xp: number;
  gamesStarted: number;
  uniqueGames: string[];
  tournamentsFinished: number;
  roomsJoined: number;
  lastPlayedAt: number | null;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
};

const KEY = 'qaddha.progression.v1';

const defaults: ProgressionState = {
  xp: 0,
  gamesStarted: 0,
  uniqueGames: [],
  tournamentsFinished: 0,
  roomsJoined: 0,
  lastPlayedAt: null,
};

export function readProgression(): ProgressionState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Partial<ProgressionState>;
    return {
      xp: typeof raw.xp === 'number' ? Math.max(0, raw.xp) : 0,
      gamesStarted: typeof raw.gamesStarted === 'number' ? Math.max(0, raw.gamesStarted) : 0,
      uniqueGames: Array.isArray(raw.uniqueGames) ? raw.uniqueGames.filter((id): id is string => typeof id === 'string') : [],
      tournamentsFinished: typeof raw.tournamentsFinished === 'number' ? Math.max(0, raw.tournamentsFinished) : 0,
      roomsJoined: typeof raw.roomsJoined === 'number' ? Math.max(0, raw.roomsJoined) : 0,
      lastPlayedAt: typeof raw.lastPlayedAt === 'number' ? raw.lastPlayedAt : null,
    };
  } catch {
    return defaults;
  }
}

function save(next: ProgressionState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('qaddha:progression-changed'));
  } catch {
    // Progression is optional when storage is unavailable.
  }
  return next;
}

export function recordGameStarted(gameId: string) {
  const current = readProgression();
  const firstTime = !current.uniqueGames.includes(gameId);
  return save({
    ...current,
    xp: current.xp + (firstTime ? 40 : 15),
    gamesStarted: current.gamesStarted + 1,
    uniqueGames: firstTime ? [...current.uniqueGames, gameId] : current.uniqueGames,
    lastPlayedAt: Date.now(),
  });
}

export function recordTournamentFinished() {
  const current = readProgression();
  return save({ ...current, xp: current.xp + 150, tournamentsFinished: current.tournamentsFinished + 1 });
}

export function recordRoomJoined() {
  const current = readProgression();
  return save({ ...current, xp: current.xp + 25, roomsJoined: current.roomsJoined + 1 });
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 75)) + 1);
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const start = 75 * (level - 1) * (level - 1);
  const end = 75 * level * level;
  const current = Math.max(0, xp - start);
  return { level, current, needed: Math.max(1, end - start), percent: Math.min(100, Math.round((current / Math.max(1, end - start)) * 100)) };
}

export function achievementsFor(state = readProgression()): Achievement[] {
  return [
    { id: 'first', title: 'أول تحدّي', description: 'ابدأ أول لعبة في قدّها', unlocked: state.gamesStarted >= 1 },
    { id: 'explorer', title: 'مستكشف قدّها', description: 'جرّب 5 ألعاب مختلفة', unlocked: state.uniqueGames.length >= 5 },
    { id: 'collector', title: 'جامع الألعاب', description: 'جرّب 12 لعبة مختلفة', unlocked: state.uniqueGames.length >= 12 },
    { id: 'regular', title: 'ما توقف', description: 'ابدأ 25 لعبة', unlocked: state.gamesStarted >= 25 },
    { id: 'champion', title: 'جو بطولة', description: 'أكمل بطولة قدّها', unlocked: state.tournamentsFinished >= 1 },
    { id: 'host', title: 'صاحب الغرفة', description: 'ادخل أو أنشئ غرفة أونلاين', unlocked: state.roomsJoined >= 1 },
    { id: 'veteran', title: 'قدّها المخضرم', description: 'اجمع 1000 XP', unlocked: state.xp >= 1000 },
  ];
}
