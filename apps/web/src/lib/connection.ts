"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether Lynk can reach the network. Until the WebSocket gateway exists this
 * follows the browser's online and offline events, plus a switch in the ⌘K
 * palette that simulates losing the connection so the outbox can be tried.
 */
let simulatedOffline = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

const read = () => navigator.onLine && !simulatedOffline;

/** True while connected. Always true during server rendering. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, read, () => true);
}

export const isOnline = () => typeof navigator === "undefined" || read();

export const isSimulatedOffline = () => simulatedOffline;

export function setSimulatedOffline(value: boolean) {
  simulatedOffline = value;
  emit();
}
