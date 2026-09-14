const STORAGE_KEY = 'qaddha.new-games.used.v2';
const MAX_HISTORY_PER_GAME = 500;

type UsedMap = Record<string, string[]>;

function readUsed(): UsedMap {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!value || typeof value !== 'object') return {};
    return value as UsedMap;
  } catch {
    return {};
  }
}

function shuffled<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function appendHistory(history: string[], ids: string[]) {
  const next = [...history];
  for (const id of ids) {
    const existing = next.indexOf(id);
    if (existing >= 0) next.splice(existing, 1);
    next.push(id);
  }
  return next.slice(-MAX_HISTORY_PER_GAME);
}

/**
 * Draws content with a strong preference for never/recently-unseen items.
 * If a pool is nearly exhausted we recycle the least-recently-seen entries
 * instead of resetting the whole history and immediately surfacing repeats.
 */
export function drawWithoutRepeats<T>(game: string, pool: T[], count: number, getId: (item: T) => string) {
  const uniquePool = Array.from(new Map(pool.map(item => [getId(item), item])).values());
  if (!uniquePool.length || count <= 0) return [];

  const usedMap = readUsed();
  const validIds = new Set(uniquePool.map(getId));
  const history = (usedMap[game] ?? []).filter(id => validIds.has(id));
  const used = new Set(history);

  const fresh = shuffled(uniquePool.filter(item => !used.has(getId(item))));
  const needed = Math.min(count, uniquePool.length);

  // Oldest entries are safest to recycle first. Small random buckets stop the
  // sequence from becoming predictable while preserving recency protection.
  const oldestFirst = history
    .map(id => uniquePool.find(item => getId(item) === id))
    .filter((item): item is T => Boolean(item));
  const recycled: T[] = [];
  for (let i = 0; i < oldestFirst.length; i += 8) {
    recycled.push(...shuffled(oldestFirst.slice(i, i + 8)));
  }

  const selected = [...fresh, ...recycled].slice(0, needed);
  usedMap[game] = appendHistory(history, selected.map(getId));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usedMap));
  } catch {
    // Storage may be unavailable in private browsing; gameplay still works.
  }

  return selected;
}
