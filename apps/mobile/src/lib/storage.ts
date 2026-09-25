import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";

/**
 * Everything Lynk keeps on the phone lives in one SQLCipher database, so it is
 * encrypted at rest. The 256-bit key is random, made on first launch, and kept
 * in the iOS Keychain / Android Keystore (only readable while the phone is
 * unlocked, never backed up to another device), matching the roadmap's
 * Encryption section.
 */

const KEY_NAME = "lynk.db.key";

async function databaseKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(KEY_NAME);
  if (existing) return existing;
  const bytes = Crypto.getRandomBytes(32);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  await SecureStore.setItemAsync(KEY_NAME, hex, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  return hex;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db() {
  dbPromise ??= (async () => {
    const key = await databaseKey();
    const d = await SQLite.openDatabaseAsync("lynk.db");
    // A raw hex key skips SQLCipher's password derivation.
    await d.execAsync(`PRAGMA key = "x'${key}'";`);
    await d.execAsync("PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL);");
    return d;
  })();
  return dbPromise;
}

// Writes are applied in order; reads wait for earlier writes.
let queue: Promise<unknown> = Promise.resolve();

export function setJSON(key: string, value: unknown): Promise<void> {
  const run = queue.then(async () => {
    const d = await db();
    await d.runAsync("INSERT OR REPLACE INTO kv (k, v) VALUES (?, ?)", key, JSON.stringify(value));
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  await queue;
  const d = await db();
  const row = await d.getFirstAsync<{ v: string }>("SELECT v FROM kv WHERE k = ?", key);
  return row ? (JSON.parse(row.v) as T) : null;
}

export function removeKey(key: string): Promise<void> {
  const run = queue.then(async () => {
    const d = await db();
    await d.runAsync("DELETE FROM kv WHERE k = ?", key);
  });
  queue = run.catch(() => undefined);
  return run;
}
