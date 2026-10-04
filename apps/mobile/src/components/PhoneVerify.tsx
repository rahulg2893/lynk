import { useEffect, useState } from "react";
import { View } from "react-native";
import { CODE_LENGTH, DEFAULT_DIAL, RESEND_SECONDS, checkCode, normalizePhone, phoneProblem, sendCode } from "@shared/phone";
import { Button, Field, Text } from "./ui";
import { t } from "@shared/i18n";

/**
 * Phone number, then the code we text to it, like the web's PhoneVerify.
 * `check` can reject a valid-looking number (say, one with no account).
 */
export function PhoneVerify({ onVerified, check, submitLabel = t("Send code") }: { onVerified: (phone: string) => void; check?: (phone: string) => string | null; submitLabel?: string }) {
  const [stage, setStage] = useState<"number" | "code">("number");
  const [phone, setPhone] = useState(DEFAULT_DIAL);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (!resendIn) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const send = async () => {
    const p = normalizePhone(phone);
    const problem = phoneProblem(p) ?? check?.(p) ?? null;
    if (problem) return setError(problem);
    setError(null);
    setBusy(true);
    await sendCode();
    setBusy(false);
    setCode("");
    setStage("code");
    setResendIn(RESEND_SECONDS);
  };

  const verify = async (value: string) => {
    setBusy(true);
    const ok = await checkCode(value);
    setBusy(false);
    if (ok) onVerified(normalizePhone(phone));
    else setError(t("Enter the {n}-digit code from the text.", { n: CODE_LENGTH }));
  };

  if (stage === "number") {
    return (
      <View style={{ gap: 16 }}>
        <Field
          label={t("Phone number")}
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setError(null);
          }}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          autoFocus
          hint={t("We'll text you a code. Outside India? Start with your country code.")}
          error={error}
          editable={!busy}
          onSubmitEditing={() => void send()}
        />
        <Button title={busy ? t("Sending code") : submitLabel} variant="primary" size="lg" loading={busy} onPress={() => void send()} />
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      <Text variant="callout" tone="muted">
        {t("We texted a code to {phone}.", { phone: normalizePhone(phone) })}
      </Text>
      <Field
        label={`${CODE_LENGTH}-digit code`}
        value={code}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, "").slice(0, CODE_LENGTH);
          setCode(v);
          setError(null);
          if (v.length === CODE_LENGTH) void verify(v);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={CODE_LENGTH}
        autoFocus
        hint={t("In this preview no text is sent: any 6 digits work.")}
        error={error}
        editable={!busy}
      />
      <Button title={busy ? t("Checking") : t("Verify")} variant="primary" size="lg" loading={busy} disabled={code.length !== CODE_LENGTH} onPress={() => void verify(code)} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text variant="subhead" tone="accent" onPress={busy ? undefined : () => setStage("number")}>
          {t("Change number")}
        </Text>
        <Text variant="subhead" tone={resendIn ? "muted" : "accent"} onPress={busy || resendIn ? undefined : () => void send()} style={{ fontVariant: ["tabular-nums"] }}>
          {resendIn ? t("Resend in {n}s", { n: resendIn }) : t("Resend code")}
        </Text>
      </View>
    </View>
  );
}
