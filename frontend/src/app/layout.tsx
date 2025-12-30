import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Battery Labs - Cell Characterization Dashboard",
    template: "%s | Battery Labs",
  },
  description:
    "Professional battery cell characterization system with EIS analysis, state-of-health monitoring, and comprehensive cell database management.",
  keywords: [
    "battery",
    "cell characterization",
    "EIS analysis",
    "impedance spectroscopy",
    "state of health",
    "battery management",
    "lithium-ion",
    "energy storage",
  ],
  authors: [{ name: "ThinkClock Labs" }],
  creator: "ThinkClock Labs",
  publisher: "ThinkClock Labs",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Battery Labs",
    title: "Battery Labs - Cell Characterization Dashboard",
    description:
      "Professional battery cell characterization system with EIS analysis and state-of-health monitoring.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Battery Labs Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Battery Labs - Cell Characterization Dashboard",
    description:
      "Professional battery cell characterization system with EIS analysis and state-of-health monitoring.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/icon.svg",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50`}
      >
        <div id="__next">
          {children}
        </div>
      </body>
    </html>
  );
}
