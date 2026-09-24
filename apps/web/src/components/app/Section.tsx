import type { ReactNode } from "react";

/**
 * A grouped list, in the spirit of iOS Settings: a heading, an optional
 * footnote, and rows on one rounded card separated by hairlines.
 */
export function Section({
  title,
  footnote,
  children,
  id,
}: {
  title: string;
  footnote?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="mt-10" aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 id={id ? `${id}-title` : undefined} className="px-1 text-[13px] font-semibold text-muted">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">{children}</div>
      {footnote ? <p className="mt-2 px-4 text-[13px] leading-relaxed text-muted">{footnote}</p> : null}
    </section>
  );
}

/**
 * One row: a label and description on the left, a control on the right.
 * `labelId` lets a switch point its aria-labelledby at the visible label.
 */
export function Row({
  label,
  description,
  control,
  icon,
  labelId,
  descriptionId,
  stack = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  control?: ReactNode;
  icon?: ReactNode;
  labelId?: string;
  descriptionId?: string;
  /** Put the control under the text (wide controls, phones). */
  stack?: boolean;
}) {
  return (
    <div className={`flex gap-4 px-5 py-4 ${stack ? "flex-col" : "items-center"}`}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icon ? <span className="mt-0.5 shrink-0 text-muted">{icon}</span> : null}
        <div className="min-w-0">
          <p id={labelId} className="text-[15px] font-medium">
            {label}
          </p>
          {description ? (
            <p id={descriptionId} className="mt-0.5 text-[13px] leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {control ? <div className={stack ? "" : "shrink-0"}>{control}</div> : null}
    </div>
  );
}
