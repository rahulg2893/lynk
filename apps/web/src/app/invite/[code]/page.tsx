import type { Metadata } from "next";
import { InviteView } from "@/components/auth/InviteView";
import { resolveInvite } from "@/lib/invites";
import { PEOPLE } from "@/lib/chat";

export async function generateMetadata({ params }: PageProps<"/invite/[code]">): Promise<Metadata> {
  const { code } = await params;
  const invite = resolveInvite(decodeURIComponent(code));
  if (invite?.kind === "group") return { title: `Join ${invite.name}` };
  if (invite?.kind === "person") return { title: `Chat with ${PEOPLE[invite.personId].name}` };
  return { title: "Invitation" };
}

export default async function InvitePage({ params }: PageProps<"/invite/[code]">) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  return <InviteView code={decoded} invite={resolveInvite(decoded)} />;
}
