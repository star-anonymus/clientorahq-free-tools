import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Toaster from "@/components/ui/Toaster";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-orbitron", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Free Online PDF, Image & Text Tools — No Upload | ClientoraHQ",
    template: "%s | ClientoraHQ Free Tools",
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US" },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.png" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
};

export const viewport: Viewport = { themeColor: "#02060c", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body>
        <a href="#main" className="absolute -left-[999px] top-2 z-[100] rounded-lg bg-cyan px-4 py-2 font-bold text-ink focus:left-2">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
