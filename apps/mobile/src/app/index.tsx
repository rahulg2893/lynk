import { Redirect } from "expo-router";
import { useAccount } from "@/lib/account";

export default function Index() {
  const account = useAccount();
  return <Redirect href={account?.session ? "/(tabs)/chats" : "/welcome"} />;
}
