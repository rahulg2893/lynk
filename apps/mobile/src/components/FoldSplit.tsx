import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useIsFocused } from "expo-router";
import Animated, { FadeIn, FadeInLeft, FadeInRight, FadeOut, FadeOutLeft, FadeOutRight, LayoutAnimationConfig, LinearTransition } from "react-native-reanimated";
import { FoldRegionsView, type Region } from "../../modules/fold-regions";
import { useColors } from "@/lib/theme";

/** Timings for folding and unfolding: the split eases apart, the single screen fades back in. */
const SPLIT_IN = 340;
const SPLIT_OUT = 220;
const glide = LinearTransition.springify().damping(22).stiffness(200);
/** A fold change this soon after a screen comes into view is catching up, not something the person just did. */
const SETTLE_MS = 400;

/**
 * The fold as last reported, shared by every screen. Hidden tabs don't get
 * their own reports, so each report is passed to all of them; a tab that
 * appears later already has the right layout instead of animating into it.
 */
let lastFold: Region | null = null;
const listeners = new Set<(fold: Region | null) => void>();

function reportFold(next: Region | null) {
  const changed = Boolean(next) !== Boolean(lastFold) || next?.x !== lastFold?.x || next?.width !== lastFold?.width;
  lastFold = next;
  if (changed) listeners.forEach((fn) => fn(next));
}

/** Whether the Duo was partly folded when last reported. */
export const isFolded = () => Boolean(lastFold);

/**
 * One full-width screen, split into two panes only while an iPhone Duo is
 * partly folded. The panes sit on either side of the fold with a gap its
 * width, so nothing lands in the crease (HIG: designing-for-iphone-duo ›
 * Adapt your layout when the device folds). Fully open, closed, or on any
 * other phone, it shows `single`. Pass ScrollViews or lists: each pane
 * scrolls on its own.
 *
 * Folding animates on the screen in view: the panes slide apart from the
 * centre while the single screen fades out, and the reverse on unfolding.
 * Each layout sits in its own full-size layer, so the leaving one never pushes
 * the arriving one around. Screens out of view, or just coming into view,
 * switch without animating.
 * ponytail: only a vertical fold is handled; a horizontal one (device on its edge) stays single.
 */
export function FoldSplit({ single, left, right, onSplitChange }: { single: ReactNode; left: ReactNode; right: ReactNode; onSplitChange?: (split: boolean) => void }) {
  const c = useColors();
  const focused = useIsFocused();
  const [fold, setFold] = useState<Region | null>(lastFold);
  const [animate, setAnimate] = useState(false);
  // When this screen last came into view; the effect below sets it on mount too.
  const inView = useRef({ focused, since: 0 });

  useEffect(() => {
    inView.current = { focused, since: Date.now() };
  }, [focused]);

  useEffect(() => {
    const apply = (next: Region | null) => {
      const { focused: isFocused, since } = inView.current;
      setAnimate(isFocused && Date.now() - since > SETTLE_MS);
      setFold(next);
      onSplitChange?.(Boolean(next));
    };
    listeners.add(apply);
    return () => {
      listeners.delete(apply);
    };
  }, [onSplitChange]);

  const move = animate ? glide : undefined;
  return (
    <FoldRegionsView
      style={{ flex: 1, backgroundColor: c.bg }}
      onRegionsChange={(e) => reportFold(e.nativeEvent.regions.find((r) => r.kind === "division" && r.active && r.height > r.width) ?? null)}
    >
      <LayoutAnimationConfig skipEntering>
        {fold ? (
          <View key="split" style={[StyleSheet.absoluteFill, { flexDirection: "row" }]}>
            <Animated.View entering={animate ? FadeInRight.duration(SPLIT_IN) : undefined} exiting={animate ? FadeOutRight.duration(SPLIT_OUT) : undefined} layout={move} style={{ width: fold.x }}>
              {left}
            </Animated.View>
            <Animated.View layout={move} style={{ width: fold.width }} />
            <Animated.View entering={animate ? FadeInLeft.duration(SPLIT_IN) : undefined} exiting={animate ? FadeOutLeft.duration(SPLIT_OUT) : undefined} layout={move} style={{ flex: 1 }}>
              {right}
            </Animated.View>
          </View>
        ) : (
          <Animated.View key="single" entering={animate ? FadeIn.duration(SPLIT_IN) : undefined} exiting={animate ? FadeOut.duration(SPLIT_OUT) : undefined} style={StyleSheet.absoluteFill}>
            {single}
          </Animated.View>
        )}
      </LayoutAnimationConfig>
    </FoldRegionsView>
  );
}
