import type { ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "@/lib/theme";

/**
 * Keeps content clear of the left and right safe areas. On iPhone Duo the
 * status bar, the camera and the tab bar sit on the side (HIG:
 * designing-for-iphone-duo › Vertical controls). This is a native view, so it
 * measures its own frame, including the tab bar inside the tab container,
 * which the root-level insets can't see.
 */
export function SideSafe({ children }: { children: ReactNode }) {
  const c = useColors();
  return (
    <SafeAreaView edges={["left", "right"]} style={{ flex: 1, backgroundColor: c.bg }}>
      {children}
    </SafeAreaView>
  );
}
