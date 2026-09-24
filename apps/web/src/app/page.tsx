import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { PlanSection } from "@/components/landing/PlanSection";
import { Product } from "@/components/landing/Product";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Control } from "@/components/landing/Control";
import { Closing } from "@/components/landing/Closing";

/* Z-index: the fixed nav (z-50) is the only layered element on this page. */
export default function Home() {
  return (
    <>
      <Nav />
      <main className="landing">
        <Hero />
        <PlanSection />
        <Product />
        <HowItWorks />
        <Control />
        <Closing />
      </main>
    </>
  );
}
