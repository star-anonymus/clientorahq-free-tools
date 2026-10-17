import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "Free Tools",
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#02060c",
    theme_color: "#02060c",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
