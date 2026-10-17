import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quddus.diaspafra.org";
const description =
  "Raheem Qudus (Raheem Quddus) is a full-stack AI engineer, brain-computer interface researcher and XR technologist: adaptive VR therapy, EEG, imitation learning, mixed-reality surgical training and free AI tools.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Raheem Qudus · AI Engineer, BCI Researcher & XR Technologist",
    template: "%s · Raheem Qudus",
  },
  description,
  applicationName: "Raheem Qudus",
  keywords: [
    "Raheem Qudus",
    "Raheem Quddus",
    "Quddos",
    "brain-computer interface",
    "EEG",
    "VR rehabilitation",
    "stroke rehabilitation VR",
    "XR developer",
    "healthcare AI",
    "imitation learning",
    "QUDMI",
    "K2-SURG",
    "Last One Standing VR",
    "SRM University-AP",
  ],
  authors: [{ name: "Raheem Qudus", url: siteUrl }],
  creator: "Raheem Qudus",
  alternates: { types: { "text/plain": "/llms.txt" } },
  openGraph: {
    type: "profile",
    siteName: "Raheem Qudus",
    title: "Raheem Qudus · AI, BCI & XR",
    description: "Engineering minds, bodies and worlds.",
    firstName: "Raheem",
    lastName: "Qudus",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "Raheem Qudus · AI, BCI & XR", description: "Engineering minds, bodies and worlds." },
  robots: { index: true, follow: true, googleBot: { "max-image-preview": "large", "max-snippet": -1 } },
  // Paste the verification codes from Google Search Console / Bing Webmaster Tools into these env vars.
  verification: {
    ...(process.env.GOOGLE_SITE_VERIFICATION && { google: process.env.GOOGLE_SITE_VERIFICATION }),
    ...(process.env.BING_SITE_VERIFICATION && { other: { "msvalidate.01": process.env.BING_SITE_VERIFICATION } }),
  },
};

export const viewport: Viewport = {
  themeColor: "#04050a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
