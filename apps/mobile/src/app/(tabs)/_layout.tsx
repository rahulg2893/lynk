import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColors } from "@/lib/theme";

/**
 * Five native tabs, like the web dock: Chats, Catch up, Calendar, Saved, and You.
 * No unread badge: iOS pins it past the icon's corner, onto the next tab's
 * highlight. The count shows in the Chats header and on Catch up instead.
 */
export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.accent} backgroundColor={c.bg}>
      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} md="chat" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="catch-up">
        <NativeTabs.Trigger.Label>Catch up</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "sun.horizon", selected: "sun.horizon.fill" }} md="wb_twilight" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saved">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bookmark", selected: "bookmark.fill" }} md="bookmark" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
