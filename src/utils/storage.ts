const PREFIX = 'tahaddi_';

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(PREFIX + key);
    if (data === null) return fallback;
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // noop
  }
}
