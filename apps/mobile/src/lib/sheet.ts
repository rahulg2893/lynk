import { ActionSheetIOS, Alert, Platform } from "react-native";

export type SheetOption = { label: string; onPress: () => void; destructive?: boolean };

/** A native action sheet on iOS and an alert-style picker on Android. */
export function actionSheet(title: string | undefined, options: SheetOption[], message?: string) {
  if (Platform.OS === "ios") {
    const labels = [...options.map((o) => o.label), "Cancel"];
    const destructiveButtonIndex = options.map((o, i) => (o.destructive ? i : -1)).filter((i) => i >= 0);
    ActionSheetIOS.showActionSheetWithOptions(
      { title, message, options: labels, cancelButtonIndex: labels.length - 1, destructiveButtonIndex },
      (i) => options[i]?.onPress(),
    );
    return;
  }
  Alert.alert(
    title ?? "",
    message,
    [...options.map((o) => ({ text: o.label, onPress: o.onPress, style: o.destructive ? ("destructive" as const) : ("default" as const) })), { text: "Cancel", style: "cancel" as const }],
    { cancelable: true },
  );
}

/** A yes/no question with a destructive confirm. */
export function confirm(title: string, message: string, action: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: action, style: "destructive", onPress: onConfirm },
  ]);
}
