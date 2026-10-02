import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CaretLeft } from "phosphor-react-native";
import { signIn, useAccount } from "@/lib/account";
import { useColors } from "@/lib/theme";
import { PhoneVerify } from "@/components/PhoneVerify";
import { IconButton, LogoMark, Text } from "@/components/ui";
import { useTopMargin } from "@/lib/layout";

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const topMargin = useTopMargin();
  const c = useColors();
  const account = useAccount();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + topMargin + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }}>
      <IconButton label="Back" onPress={() => router.back()} style={{ marginLeft: -8 }}>
        <CaretLeft size={24} color={c.accentInk} weight="bold" />
      </IconButton>
      <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
        <View style={{ gap: 12 }}>
          <LogoMark height={34} />
          <Text variant="largeTitle">Welcome back</Text>
          <Text variant="callout" tone="muted">
            Sign in with your phone number. There&apos;s no Lynk password to remember.
          </Text>
        </View>
        <PhoneVerify
          check={(phone) => (account && phone !== account.profile.phone ? "There's no Lynk account for this number. Check it, or create an account." : null)}
          onVerified={signIn}
        />
        {account?.seeded ? (
          <Text variant="footnote" tone="muted" style={{ textAlign: "center" }}>
            Trying the preview? Use {account.profile.phone}.
          </Text>
        ) : null}
        <Text variant="footnote" tone="muted" style={{ textAlign: "center" }}>
          New here?{" "}
          <Text variant="footnote" tone="accent" weight="600" onPress={() => router.replace("/sign-up")}>
            Create an account
          </Text>
        </Text>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
