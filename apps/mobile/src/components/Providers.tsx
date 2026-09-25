import { useState } from "react";
import { View } from "react-native";
import { AppleLogo, Fingerprint, GoogleLogo } from "phosphor-react-native";
import type { SignInMethod } from "@/lib/account";
import { useColors } from "@/lib/theme";
import { Button } from "./ui";

/** Passkey first, then Apple and Google. In this preview each one "signs in" after a short pause. */
export function ProviderButtons({ onChoose, passkeyLabel = "Continue with a passkey" }: { onChoose: (m: SignInMethod) => void; passkeyLabel?: string }) {
  const c = useColors();
  const [busy, setBusy] = useState<SignInMethod | null>(null);
  const go = (m: SignInMethod) => {
    setBusy(m);
    setTimeout(() => {
      setBusy(null);
      onChoose(m);
    }, 700);
  };
  return (
    <View style={{ gap: 10 }}>
      <Button title={passkeyLabel} variant="primary" size="lg" loading={busy === "passkey"} disabled={Boolean(busy)} icon={<Fingerprint size={20} color={c.onAccent} weight="bold" />} onPress={() => go("passkey")} />
      <Button title="Continue with Apple" size="lg" loading={busy === "apple"} disabled={Boolean(busy)} icon={<AppleLogo size={20} color={c.ink} weight="fill" />} onPress={() => go("apple")} />
      <Button title="Continue with Google" size="lg" loading={busy === "google"} disabled={Boolean(busy)} icon={<GoogleLogo size={20} color={c.ink} weight="bold" />} onPress={() => go("google")} />
    </View>
  );
}
