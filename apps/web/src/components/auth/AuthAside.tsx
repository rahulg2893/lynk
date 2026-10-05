import { Avatar } from "@/components/chat/primitives";
import { CheckCircle } from "@phosphor-icons/react/ssr";
import { FadeIn } from "@/components/motion/FadeIn";

const LINES = [
  { id: "amara", name: "Amara", text: "Saturday morning works for me" },
  { id: "jonas", name: "Jonas", text: "Saturday 10am at Boulder Barn then?" },
  { id: "tomas", name: "Tomás", text: "Perfect, see you there" },
];

/**
 * The product's story in miniature, beside the sign-in form on wide screens:
 * a few messages settle into a saved plan. Decorative, so it's hidden from
 * screen readers; the form carries everything people need.
 */
export function AuthAside() {
  return (
    <aside aria-hidden className="hidden p-3 lg:block">
      <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[2rem] bg-stage p-12 text-on-stage">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 45% at 80% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%)",
          }}
        />
        <h2 className="relative max-w-[14ch] text-5xl leading-[1.05]">Pick up where your people left off.</h2>

        <div className="relative mx-auto w-full max-w-md">
          <div className="grid gap-4">
            {LINES.map((line, i) => (
              <FadeIn key={line.name} delay={0.25 + i * 0.35} y={10}>
                <div className="flex items-start gap-3">
                  <Avatar id={line.id} name={line.name} size={36} />
                  <div>
                    <p className="text-[13px] font-semibold">{line.name}</p>
                    <p className="text-[15px] text-on-stage-muted">{line.text}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={1.45} y={12}>
            <div className="mt-7 rounded-2xl border border-stage-line bg-stage-2 p-4">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-on-stage-muted">
                <CheckCircle size={15} weight="fill" className="text-positive" /> Plan saved
              </p>
              <p className="mt-1 text-lg font-semibold">Climbing at Boulder Barn, Saturday 10am</p>
              <p className="mt-0.5 text-[13px] text-on-stage-muted">From 3 messages in Weekend climbers</p>
            </div>
          </FadeIn>
        </div>

        <p className="relative text-sm text-on-stage-muted">Plans, lists and the little things, kept with the chat they came from.</p>
      </div>
    </aside>
  );
}
