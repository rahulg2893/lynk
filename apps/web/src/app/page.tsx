import { Nav } from "@/components/landing/Nav";
import { HeroStage } from "@/components/landing/HeroStage";
import { VelocityMarquee } from "@/components/landing/VelocityMarquee";
import { Chapters } from "@/components/landing/Chapters";
import { Control } from "@/components/landing/Control";
import { Devices } from "@/components/landing/Devices";
import { LinkUp } from "@/components/landing/LinkUp";
import { Closing } from "@/components/landing/Closing";

/*
 * The story: a dark launch stage, the words moving with your scroll, four
 * chapters of what Lynk does, privacy, where it runs, and the logo's rings
 * linking up as the invitation. z-index: the fixed nav (z-50) is the only
 * layered element.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main className="landing">
        <HeroStage />
        <VelocityMarquee />
        <Chapters />
        <Control />
        <Devices />
        <LinkUp />
      </main>
      <Closing />
    </>
  );
}
