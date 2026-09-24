"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * A scannable QR code drawn as SVG. Always dark modules on white so every
 * phone camera reads it, in light and dark themes alike.
 */
export function QrCode({ value, label, size = 208 }: { value: string; label: string; size?: number }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1d1d1f", light: "#ffffff" } }).then(
      (out) => live && setSvg(out),
      () => live && setSvg(null),
    );
    return () => {
      live = false;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-2xl bg-white p-3 shadow-soft [&_svg]:size-full"
      style={{ width: size, height: size }}
      // The SVG comes from the qrcode library, generated from our own URL.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
