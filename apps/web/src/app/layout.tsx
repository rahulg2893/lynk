import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});



/* Display serif for landing-page headlines only; the app uses the system font. */
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Lynk",
    template: "%s | Lynk",
  },
  description:
    "Lynk is a chat app for friends and family that remembers plans, lists and the little things people tell you.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} antialiased`}
      // The boot script sets data-theme before React loads.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
