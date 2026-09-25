import { useSyncExternalStore } from "react";

/**
 * Online or not: the phone's network state (fed in by <NetworkWatcher/>) and a
 * test switch in Settings that simulates losing the connection, so the
 * outbox can be tried without turning on flight mode.
 */
let network = true;
let simulated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

export const isOnline = () => network && !simulated;
export const isSimulatedOffline = () => simulated;

export function setNetworkOnline(value: boolean) {
  if (network === value) return;
  network = value;
  emit();
}

export function setSimulatedOffline(value: boolean) {
  simulated = value;
  emit();
}

export function useOnline() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    isOnline,
    isOnline,
  );
}

export function useSimulatedOffline() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    isSimulatedOffline,
    isSimulatedOffline,
  );
}

/** Subscribe outside React (the store flushes the outbox on reconnect). */
export function onConnectionChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
