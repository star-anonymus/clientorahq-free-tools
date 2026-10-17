import { ogCard, OG_SIZE } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "ClientoraHQ Free Tools — PDF, image, text and business tools that run in your browser";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({ kicker: "30+ free tools", title: "Every tool you need — your files never leave your device", sub: "Merge & sign PDFs, compress images, remove backgrounds, invoices, resumes, screen recording." });
}
