import type { Metadata } from "next";
import { PlanInviteView } from "@/components/auth/PlanInviteView";

// The plan is in the link's fragment, which never reaches the server, so the preview stays generic.
export const metadata: Metadata = {
  title: "You're invited to a plan",
  description: "Someone on Lynk wants to know if you're in. Open the link to see the plan and answer.",
};

export default function PlanInvitePage() {
  return <PlanInviteView />;
}
