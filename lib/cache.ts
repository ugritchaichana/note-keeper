// Simple localStorage JSON cache with per-user key scoping
// Safe no-op on server rendering environments.

type Json = unknown;

const prefix = 'nk-cache:';

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function keyFor(userKey: string | undefined, key: string) {
  const u = userKey && userKey.length > 0 ? userKey : 'default';
  return `${prefix}${u}:${key}`;
}

export function getJSON<T = Json>(key: string, userKey?: string): T | null {
  try {
    if (!isBrowser()) return null;
    const raw = localStorage.getItem(keyFor(userKey, key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJSON<T = Json>(key: string, value: T, userKey?: string) {
  try {
    if (!isBrowser()) return;
    localStorage.setItem(keyFor(userKey, key), JSON.stringify(value));
  } catch {
    // ignore quota or serialization errors
  }
}

export function remove(key: string, userKey?: string) {
  try {
    if (!isBrowser()) return;
    localStorage.removeItem(keyFor(userKey, key));
  } catch {
    // ignore
  }
}
