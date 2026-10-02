import { useSyncExternalStore } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * The chat open in the right-hand pane while a Duo is partly folded. Kept
 * outside the Chats screen so it survives the switch back to one screen.
 */
type Selected = { id: string; m?: string } | null;
let selected: Selected = null;
const listeners = new Set<() => void>();

export function selectChat(next: Selected) {
  selected = next;
  listeners.forEach((fn) => fn());
}

export function useSelectedChat(): Selected {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => selected,
  );
}

/**
 * Extra space above a screen's heading when nothing sits at the top edge. On
 * iPhone Duo the status bar moves to the side, so the top inset is 0 and a
 * heading would touch the edge; elsewhere the status bar already gives room.
 */
export const TOP_MARGIN_WITHOUT_STATUS_BAR = 28;

export function useTopMargin() {
  return useSafeAreaInsets().top > 0 ? 0 : TOP_MARGIN_WITHOUT_STATUS_BAR;
}
