"use client";

import type { Attachment } from "./chat";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_FILES = 10;

const id = () => `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/** Photos are shrunk to 1280px so a chat full of them still fits in the browser's storage. */
function shrink(file: File, max = 1280): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(src);
      resolve({ url: canvas.toDataURL("image/jpeg", 0.82), width, height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error(`${file.name} couldn't be opened as a photo.`));
    };
    img.src = src;
  });
}

/** Turn picked, dropped or pasted files into attachments, with a reason for any that can't be sent. */
export async function toAttachments(files: File[]): Promise<{ items: Attachment[]; problems: string[] }> {
  const items: Attachment[] = [];
  const problems: string[] = [];
  for (const file of files.slice(0, MAX_FILES)) {
    if (file.size > MAX_FILE_BYTES) {
      problems.push(`${file.name} is over 10 MB.`);
      continue;
    }
    const base = { id: id(), name: file.name || "Pasted image", size: file.size, mime: file.type || "application/octet-stream" };
    if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      try {
        const photo = await shrink(file);
        items.push({ ...base, kind: "image", ...photo });
      } catch (e) {
        problems.push(e instanceof Error ? e.message : `${file.name} couldn't be added.`);
      }
    } else {
      // Kept for this visit only; real uploads arrive with the server.
      items.push({ ...base, kind: "file", url: URL.createObjectURL(file) });
    }
  }
  if (files.length > MAX_FILES) problems.push(`Only ${MAX_FILES} files can be sent at once.`);
  return { items, problems };
}
