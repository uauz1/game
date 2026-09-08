const STORAGE_KEY = 'qaddha.new-games.used.v1';

type UsedMap = Record<string, string[]>;

function readUsed(): UsedMap {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return value && typeof value === 'object' ? value : {};
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

export function drawWithoutRepeats<T>(game: string, pool: T[], count: number, getId: (item: T) => string) {
  const usedMap = readUsed();
  const validIds = new Set(pool.map(getId));
  const used = new Set((usedMap[game] ?? []).filter(id => validIds.has(id)));
  let fresh = pool.filter(item => !used.has(getId(item)));

  if (fresh.length < count) {
    used.clear();
    fresh = pool;
  }

  const selected = shuffled(fresh).slice(0, Math.min(count, pool.length));
  usedMap[game] = [...used, ...selected.map(getId)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usedMap));
  } catch {
    // Storage may be unavailable in private browsing; gameplay still works.
  }
  return selected;
}
