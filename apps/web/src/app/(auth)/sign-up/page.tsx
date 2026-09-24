import type { Metadata } from "next";
import { SignUpFlow } from "@/components/auth/SignUpFlow";
import { safeNext } from "@/lib/paths";

export const metadata: Metadata = {
  title: "Create your account",
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const params = await searchParams;
  return <SignUpFlow next={safeNext(params.next)} />;
}
