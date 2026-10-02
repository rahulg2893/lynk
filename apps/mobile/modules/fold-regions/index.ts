import { type ComponentType } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { requireNativeView } from "expo";

export type Region = {
  /** "division" is the fold; "occlusion" is a camera. */
  kind: "division" | "occlusion";
  /** A fold is reported while the device is flat too, with active false, so layouts can line up with the hinge. */
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  margins: { top: number; left: number; bottom: number; right: number };
};

export type FoldRegionsViewProps = ViewProps & {
  onRegionsChange?: (e: { nativeEvent: { regions: Region[] } }) => void;
};

/**
 * A View that reports the reserved regions crossing it, in its own
 * coordinates. On Android and on iPhones without them it's a plain View
 * that never reports.
 */
export const FoldRegionsView: ComponentType<FoldRegionsViewProps> =
  Platform.OS === "ios" ? requireNativeView<FoldRegionsViewProps>("FoldRegions") : View;
