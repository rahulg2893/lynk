import { useLocalSearchParams } from "expo-router";
import { ChatView } from "@/components/chat/ChatView";

/** A conversation on its own screen (compact width, or opened from another tab). */
export default function ChatScreen() {
  const { id, m } = useLocalSearchParams<{ id: string; m?: string }>();
  return <ChatView id={id} jumpTo={m} />;
}
