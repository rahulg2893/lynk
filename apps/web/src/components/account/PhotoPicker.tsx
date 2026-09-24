"use client";

import { useRef, useState } from "react";
import { Camera } from "@phosphor-icons/react";
import { Avatar } from "@/components/chat/primitives";
import { Button } from "@/components/ui/controls";
import { resizePhoto } from "@/lib/account";

/** Your photo with Add / Change and Remove. Falls back to your initials. */
export function PhotoPicker({
  name,
  photo,
  onChange,
  size = 88,
}: {
  name: string;
  photo: string | null;
  onChange: (photo: string | null) => void;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await resizePhoto(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "That photo couldn't be used.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="group relative rounded-[30%]"
        // A mouse shortcut; the labelled button beside it is the accessible control.
        tabIndex={-1}
        aria-hidden
      >
        <Avatar id="me" name={name || "You"} photo={photo} size={size} />
        <span className="absolute -right-1 -bottom-1 inline-flex size-8 items-center justify-center rounded-full border-2 border-bg bg-ink text-bg transition-transform group-hover:scale-105">
          <Camera size={15} weight="fill" aria-hidden />
        </span>
      </button>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => input.current?.click()} loading={busy}>
            {photo ? "Change photo" : "Add a photo"}
          </Button>
          {photo ? (
            <Button size="sm" variant="ghost" onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-[13px] text-muted" role={error ? "alert" : undefined}>
          {error ?? "Friends see this next to your messages."}
        </p>
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
