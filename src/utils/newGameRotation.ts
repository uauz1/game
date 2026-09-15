const STORAGE_KEY = 'qaddha.new-games.used.v1';
const LEGACY_STORAGE_KEY = 'qaddha.new-games.used.v2';
const MIGRATION_KEY = 'qaddha.new-games.used.migrated-v2';
const SITE_PREFS_KEY = 'qaddha_site_prefs_v1';
const MAX_HISTORY_PER_GAME = 1200;

type UsedMap = Record<string, string[]>;
type RepeatProtection = 'standard' | 'strict' | 'maximum';

function parseUsed(raw: string | null): UsedMap | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as UsedMap;
  } catch {
    return null;
  }
}

function readUsed(): UsedMap {
  try {
    const current = parseUsed(localStorage.getItem(STORAGE_KEY));
    if (current) return current;

    if (localStorage.getItem(MIGRATION_KEY) !== '1') {
      const legacy = parseUsed(localStorage.getItem(LEGACY_STORAGE_KEY));
      localStorage.setItem(MIGRATION_KEY, '1');
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy));
        return legacy;
      }
    }
  } catch {
    // Rotation still works in memory when storage is unavailable.
  }
  return {};
}

function readRepeatProtection(): RepeatProtection {
  try {
    const value = JSON.parse(localStorage.getItem(SITE_PREFS_KEY) ?? '{}') as { repeatProtection?: unknown };
    if (value.repeatProtection === 'standard' || value.repeatProtection === 'maximum') return value.repeatProtection;
  } catch {
    // Fall back to strict protection when preferences are unavailable.
  }
  return 'strict';
}

function protectionWindow(mode: RepeatProtection) {
  if (mode === 'maximum') return 1200;
  if (mode === 'standard') return 80;
  return 350;
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

function bucketShuffle<T>(items: T[], size = 8) {
  const result: T[] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(...shuffled(items.slice(index, index + size)));
  }
  return result;
}

/**
 * Draws unique content for the active round and keeps a long-lived history.
 * Never-seen items are always preferred first. Once a pool is exhausted,
 * older entries are recycled before anything that appeared recently.
 * The user's repeat-protection setting controls how large that recent shield is.
 */
export function drawWithoutRepeats<T>(game: string, pool: T[], count: number, getId: (item: T) => string) {
  const uniquePool = Array.from(new Map(pool.map(item => [getId(item), item])).values());
  if (!uniquePool.length || count <= 0) return [];

  const usedMap = readUsed();
  const validIds = new Set(uniquePool.map(getId));
  const history = (usedMap[game] ?? []).filter(id => validIds.has(id));
  const everSeen = new Set(history);
  const protectedIds = new Set(history.slice(-protectionWindow(readRepeatProtection())));
  const byId = new Map(uniquePool.map(item => [getId(item), item]));
  const needed = Math.min(count, uniquePool.length);

  const neverSeen = shuffled(uniquePool.filter(item => !everSeen.has(getId(item))));
  const olderSeen = bucketShuffle(
    history
      .filter(id => !protectedIds.has(id))
      .map(id => byId.get(id))
      .filter((item): item is T => Boolean(item)),
  );
  const recentlySeen = bucketShuffle(
    history
      .filter(id => protectedIds.has(id))
      .map(id => byId.get(id))
      .filter((item): item is T => Boolean(item)),
  );

  const selected = [...neverSeen, ...olderSeen, ...recentlySeen].slice(0, needed);
  usedMap[game] = appendHistory(history, selected.map(getId));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usedMap));
  } catch {
    // Storage may be unavailable in private browsing; gameplay still works.
  }

  return selected;
}
