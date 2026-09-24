import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatApp } from "@/components/chat/ChatApp";

export const metadata: Metadata = {
  title: "Chats",
};

/** The open chat comes from ?chat=, read on the client, so the page needs a Suspense boundary. */
export default function AppPage() {
  return (
    <Suspense fallback={null}>
      <ChatApp />
    </Suspense>
  );
}
