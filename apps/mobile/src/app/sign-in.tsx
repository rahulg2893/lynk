import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft } from "phosphor-react-native";
import { signIn } from "@/lib/account";
import { useColors } from "@/lib/theme";
import { ProviderButtons } from "@/components/Providers";
import { IconButton, LogoMark, Text } from "@/components/ui";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const c = useColors();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }}>
      <IconButton label="Back" onPress={() => router.back()} style={{ marginLeft: -8 }}>
        <CaretLeft size={24} color={c.accentInk} weight="bold" />
      </IconButton>
      <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
        <View style={{ gap: 12 }}>
          <LogoMark height={34} />
          <Text variant="largeTitle">Welcome back</Text>
          <Text variant="callout" tone="muted">
            Sign in the way you signed up. There&apos;s no Lynk password to remember.
          </Text>
        </View>
        <ProviderButtons onChoose={signIn} />
        <Text variant="footnote" tone="muted" style={{ textAlign: "center" }}>
          New here?{" "}
          <Text variant="footnote" tone="accent" weight="600" onPress={() => router.replace("/sign-up")}>
            Create an account
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
