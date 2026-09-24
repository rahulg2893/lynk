import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PersonView } from "@/components/account/PersonView";
import { PEOPLE } from "@/lib/chat";

export function generateStaticParams() {
  return Object.keys(PEOPLE).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/app/people/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: PEOPLE[id]?.name ?? "Not found" };
}

export default async function PersonPage({ params }: PageProps<"/app/people/[id]">) {
  const { id } = await params;
  if (!PEOPLE[id]) notFound();
  return <PersonView id={id} />;
}
