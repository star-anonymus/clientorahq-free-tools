import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Share card in the ClientoraHQ HUD look, rendered once at build time. */
export function ogCard({ kicker, title, sub, color = "#29e6ff" }: { kicker: string; title: string; sub: string; color?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
          padding: "64px 72px", background: "#02060c", color: "#e6f8ff", fontFamily: "sans-serif",
          backgroundImage: "radial-gradient(900px 520px at 85% -10%, rgba(41,230,255,.18), transparent 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 64, border: "3px dashed #29e6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#7df3ff", fontSize: 36, fontWeight: 900 }}>C</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 6, color: "#29e6ff" }}>CLIENTORA HQ</div>
            <div style={{ fontSize: 18, letterSpacing: 4, color: "#7f9fb2" }}>FREE TOOLS</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 5, color, textTransform: "uppercase" }}>{kicker}</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          <div style={{ fontSize: 32, color: "#a7c6d6", maxWidth: 1000 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", gap: 28, fontSize: 24, color: "#5ee59a" }}>
          <span>Free</span><span style={{ color: "#29e6ff" }}>·</span><span>No upload</span><span style={{ color: "#29e6ff" }}>·</span><span>No sign-up</span>
          <span style={{ marginLeft: "auto", color: "#7f9fb2" }}>tools.clientorahq.com</span>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
