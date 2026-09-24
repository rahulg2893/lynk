"use client";

/**
 * Chats at rest in this browser, encrypted with AES-256-GCM under a key that
 * can't be exported: the browser keeps the key and will only use it on
 * Lynk's behalf, so the stored data is unreadable as files on disk or in a
 * copied browser profile. (A key the browser holds can't protect against
 * code running inside Lynk's own page; see the roadmap's Encryption limits.)
 */

const DB = "lynk-secure";
const KEYS = "keys";
const DATA = "data";

let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(KEYS);
      req.result.createObjectStore(DATA);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function request<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(d.transaction(store, mode).objectStore(store));
        req.onsuccess = () => resolve(req.result as T);
        req.onerror = () => reject(req.error);
      }),
  );
}

let keyPromise: Promise<CryptoKey> | null = null;

/** The storage key: made once per browser, non-extractable, kept in IndexedDB. */
function storageKey(): Promise<CryptoKey> {
  keyPromise ??= (async () => {
    const existing = await request<CryptoKey | undefined>(KEYS, "readonly", (s) => s.get("chats"));
    if (existing) return existing;
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    await request(KEYS, "readwrite", (s) => s.put(key, "chats"));
    return key;
  })();
  return keyPromise;
}

type Sealed = { v: 1; iv: Uint8Array<ArrayBuffer>; data: ArrayBuffer };

// Writes run in order, and reads wait for earlier writes, so a page that opens
// straight after another saved always sees the latest data.
let queue: Promise<unknown> = Promise.resolve();

export function writeSecure(name: string, value: unknown): Promise<void> {
  const run = queue.then(async () => {
    const key = await storageKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    // The record name is bound in as associated data, so a record can't be swapped for another.
    const data = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(name) },
      key,
      new TextEncoder().encode(JSON.stringify(value)),
    );
    const sealed: Sealed = { v: 1, iv, data };
    await request(DATA, "readwrite", (s) => s.put(sealed, name));
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function readSecure<T>(name: string): Promise<T | null> {
  await queue;
  const sealed = await request<Sealed | undefined>(DATA, "readonly", (s) => s.get(name));
  if (!sealed) return null;
  const key = await storageKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: sealed.iv, additionalData: new TextEncoder().encode(name) },
    key,
    sealed.data,
  );
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export function deleteSecure(name: string): Promise<void> {
  const run = queue.then(() => request<void>(DATA, "readwrite", (s) => s.delete(name)));
  queue = run.catch(() => undefined);
  return run;
}

export const secureStorageAvailable = () => typeof indexedDB !== "undefined" && Boolean(globalThis.crypto?.subtle);
