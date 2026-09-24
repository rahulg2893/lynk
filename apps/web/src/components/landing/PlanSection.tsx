import { FadeIn } from "@/components/motion/FadeIn";
import { DecisionPreview } from "./DecisionPreview";

/** Centred statement plus the live plan demo, like the reference's second block. */
export function PlanSection() {
  return (
    <section className="px-4 py-24 md:px-6 md:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <FadeIn inView>
          <h2 className="mx-auto max-w-[18ch] text-4xl leading-[1.08] text-balance md:text-6xl">
            When everyone agrees, Lynk writes it down.
          </h2>
          <p className="mx-auto mt-5 max-w-[48ch] text-lg text-muted">
            It spots the plan in the chat and asks before saving anything. Try it below.
          </p>
        </FadeIn>
      </div>
      <div className="mx-auto mt-14 max-w-xl">
        <DecisionPreview />
      </div>
    </section>
  );
}
