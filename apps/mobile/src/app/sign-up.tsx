import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Camera, CaretLeft, CheckCircle, ShareNetwork, WarningCircle } from "phosphor-react-native";
import { checkUsername, createAccount, startSession, suggestUsernames, updateAccount, usernameProblem, USERNAME_RULES } from "@/lib/account";
import { pickProfilePhoto } from "@/lib/media";
import { useColors } from "@/lib/theme";
import { PhoneVerify } from "@/components/PhoneVerify";
import { Avatar, Button, Field, IconButton, Text } from "@/components/ui";
import { useTopMargin } from "@/lib/layout";

/** Three steps, like the web: who you are, your phone number, then a welcome with a photo and your invite link. */
export default function SignUp() {
  const insets = useSafeAreaInsets();
  const topMargin = useTopMargin();
  const c = useColors();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const problem = usernameProblem(username);
  useEffect(() => {
    if (problem) return;
    let live = true;
    const t = setTimeout(() => {
      setStatus("checking");
      void checkUsername(username).then((free) => live && setStatus(free ? "free" : "taken"));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [username, problem]);

  const canContinue = name.trim().length > 0 && !problem && status === "free";
  const finish = (phone: string) => {
    createAccount({ name: name.trim(), username, phone }, { startSession: false });
    setStep(2);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + topMargin + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {step < 2 ? (
            <IconButton label="Back" onPress={() => (step ? setStep(step - 1) : router.back())} style={{ marginLeft: -8 }}>
              <CaretLeft size={24} color={c.accentInk} weight="bold" />
            </IconButton>
          ) : (
            <View />
          )}
          <Text variant="footnote" tone="muted">
            Step {step + 1} of 3
          </Text>
        </View>

        {step === 0 ? (
          <View style={{ gap: 20, marginTop: 24 }}>
            <Text variant="largeTitle">Who are you?</Text>
            <Field label="Your name" value={name} onChangeText={setName} placeholder="Rahul" autoFocus textContentType="name" returnKeyType="next" />
            <View>
              <Field
                label="Username"
                value={username}
                onChangeText={(t) => {
                  setTouched(true);
                  setStatus("idle");
                  setUsername(t.trim().toLowerCase());
                }}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="rahul"
                hint={USERNAME_RULES}
                error={touched && problem ? problem : null}
              />
              {!problem && status !== "idle" ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, marginTop: 6 }} accessibilityLiveRegion="polite">
                  {status === "free" ? <CheckCircle size={16} color={c.positive} weight="fill" /> : status === "taken" ? <WarningCircle size={16} color={c.dangerInk} weight="fill" /> : null}
                  <Text variant="footnote" tone={status === "taken" ? "danger" : "muted"}>
                    {status === "checking" ? "Checking…" : status === "free" ? `@${username} is yours` : `@${username} is taken. Try ${suggestUsernames(username).join(" or ")}.`}
                  </Text>
                </View>
              ) : null}
            </View>
            <Button title="Continue" variant="primary" size="lg" disabled={!canContinue} onPress={() => setStep(1)} />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={{ gap: 20, marginTop: 24 }}>
            <Text variant="largeTitle">What&apos;s your number?</Text>
            <Text variant="callout" tone="muted">
              You&apos;ll sign in with your phone number and a code we text you. Friends find you by @{username} and never see your number.
            </Text>
            <PhoneVerify onVerified={finish} />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ gap: 20, marginTop: 24, alignItems: "center" }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a profile photo"
              onPress={async () => {
                const p = await pickProfilePhoto();
                if (p) {
                  setPhoto(p);
                  updateAccount((a) => ({ ...a, profile: { ...a.profile, photo: p } }));
                }
              }}
            >
              <Avatar id="me" name={name || "You"} photo={photo} size={112} />
              <View style={{ position: "absolute", right: -6, bottom: -6, width: 38, height: 38, borderRadius: 19, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: c.bg }}>
                <Camera size={18} color={c.onAccent} weight="fill" />
              </View>
            </Pressable>
            <Text variant="largeTitle" style={{ textAlign: "center" }}>
              Welcome, {name.split(" ")[0]}
            </Text>
            <Text variant="callout" tone="muted" style={{ textAlign: "center" }}>
              Your inbox starts empty. Share your invite link so friends can find you.
            </Text>
            <Button
              title="Share invite link"
              size="lg"
              icon={<ShareNetwork size={18} color={c.ink} weight="bold" />}
              onPress={() => void Share.share({ message: `Chat with me on Lynk: https://lynk.app/invite/${username}` })}
              style={{ alignSelf: "stretch" }}
            />
            <Button title="Open Lynk" variant="primary" size="lg" onPress={startSession} style={{ alignSelf: "stretch" }} />
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
