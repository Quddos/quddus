import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quddus.diaspafra.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Raheem Qudus · AI, BCI & XR",
    template: "%s · Raheem Qudus",
  },
  description:
    "Raheem Qudus: full-stack AI engineer, brain-computer interface researcher and XR technologist. Adaptive VR therapy, EEG, imitation learning, open AI tools and APIs.",
  keywords: [
    "Raheem Qudus",
    "Quddos",
    "brain-computer interface",
    "EEG",
    "VR rehabilitation",
    "XR",
    "healthcare AI",
    "QUDMI",
    "K2-SURG",
    "Last One Standing VR",
  ],
  authors: [{ name: "Raheem Qudus", url: siteUrl }],
  openGraph: {
    type: "website",
    title: "Raheem Qudus · AI, BCI & XR",
    description: "Engineering minds, bodies and worlds.",
    images: ["/media/raheem.webp"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
