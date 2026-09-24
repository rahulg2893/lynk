"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretLeft, CaretRight, DownloadSimple, FileText, X } from "@phosphor-icons/react";
import { formatBytes, type Attachment } from "@/lib/chat";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { MOTION } from "@/lib/motion";

/** Photos as a grid (one large, or tiles), files as cards with a download link. */
export function AttachmentList({
  items,
  onOpenPhoto,
}: {
  items: Attachment[];
  onOpenPhoto: (photos: Attachment[], index: number) => void;
}) {
  const photos = items.filter((a) => a.kind === "image");
  const files = items.filter((a) => a.kind === "file");
  const shown = photos.slice(0, 4);

  return (
    <div className="mt-1.5 grid max-w-md gap-1.5">
      {photos.length ? (
        <div className={`grid gap-1 overflow-hidden rounded-2xl ${photos.length === 1 ? "" : "grid-cols-2"}`}>
          {shown.map((p, i) => {
            const more = i === 3 && photos.length > 4 ? photos.length - 4 : 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPhoto(photos, i)}
                className="relative block overflow-hidden bg-surface-2"
                aria-label={more ? `Open photos, ${more} more` : `Open photo ${p.name}`}
              >
                {p.url ? (
                  // Data URLs from the browser; next/image can't optimise them.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt=""
                    className={`w-full object-cover transition-transform duration-500 hover:scale-[1.03] ${photos.length === 1 ? "max-h-80" : "aspect-square"}`}
                  />
                ) : (
                  <span className="flex aspect-square items-center justify-center px-3 text-center text-[12px] text-muted">
                    Photo not kept in this preview
                  </span>
                )}
                {more ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-semibold text-white">
                    +{more}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
            <FileText size={20} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium">{f.name}</span>
            <span className="block text-[12px] text-muted">
              {formatBytes(f.size)}
              {f.url ? "" : " · not kept after reload in this preview"}
            </span>
          </span>
          {f.url ? (
            <a
              href={f.url}
              download={f.name}
              className="inline-flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={`Download ${f.name}`}
            >
              <DownloadSimple size={18} />
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Full-screen photo viewer on the native <dialog>: Escape closes, arrow keys
 * move between photos, and focus returns to the photo that opened it.
 */
export function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Attachment[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const open = index !== null;
  const photo = open ? photos[index] : null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const go = (d: number) => {
    if (index === null || photos.length < 2) return;
    onIndex((index + d + photos.length) % photos.length);
  };

  return (
    <dialog
      ref={ref}
      aria-label="Photo"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/92 p-0 text-white backdrop:bg-black/80"
    >
      <div className="relative flex h-full flex-col" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="min-w-0 truncate text-[14px] text-white/80">
            {photo?.name}
            {photos.length > 1 && index !== null ? ` · ${index + 1} of ${photos.length}` : ""}
          </p>
          <div className="flex items-center gap-1">
            {photo?.url ? (
              <a
                href={photo.url}
                download={photo.name.replace(/\.[^.]+$/, "") + ".jpg"}
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10"
                aria-label="Download photo"
              >
                <DownloadSimple size={20} />
              </a>
            ) : null}
            <button type="button" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close">
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <AnimatePresence mode="popLayout" initial={false}>
            {photo?.url ? (
              <motion.img
                key={photo.id}
                src={photo.url}
                alt={photo.name}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.98 }}
                transition={MOTION.item}
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            ) : null}
          </AnimatePresence>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Previous photo"
              >
                <CaretLeft size={22} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 inline-flex size-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                aria-label="Next photo"
              >
                <CaretRight size={22} weight="bold" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
