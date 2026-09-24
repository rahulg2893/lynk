import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/SignInForm";
import { safeNext } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Sign in",
};

const NOTICES: Record<string, string> = {
  "signed-out": "You're signed out. See you soon.",
  deleted: "Your account and everything in it has been deleted.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const params = await searchParams;
  const notice = typeof params.notice === "string" ? NOTICES[params.notice] : undefined;
  return <SignInForm next={safeNext(params.next)} notice={notice} />;
}
