import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Files Stay on Your Device",
  description: "ClientoraHQ Free Tools process your files in your browser. Nothing is uploaded, stored or tracked by us. See what is kept on your device and why.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <article className="wrap max-w-3xl pt-12">
      <p className="hud-label">Privacy</p>
      <h1 className="mt-3 text-[clamp(30px,5vw,44px)] font-extrabold">Your files stay on your device</h1>
      <div className="mt-6 space-y-5 text-[16.5px] leading-relaxed text-fg-2">
        <p>
          Every tool on this site runs inside your browser tab. When you pick a PDF, a photo or a recording, your browser reads it from your
          own disk and does the work with JavaScript on your own device. The file is never uploaded to ClientoraHQ or to anyone else.
        </p>
        <p>
          The site is a set of static files. There is no server behind it that could receive a file, and no account system. Tools that
          remember things for you — the time tracker, saved invoices, the Pomodoro history — keep that data in your browser&apos;s local
          storage on your device only. Clear your browser data and it is gone.
        </p>
        <p>
          One exception to be aware of: the Background Remover downloads its AI model files (not your photo) from the IMG.LY content network
          the first time you use it. Your photo is still processed on your device.
        </p>
        <p>
          The one time a file does leave your device is when you choose it: in the Screen Recorder, pressing &quot;Get share link&quot; uploads
          that one video so others can watch it from the link. It is kept for 30 days and then deleted, and you can delete it sooner. If you
          never press the button, your recording stays on your device like every other file.
        </p>
        <p>
          After you use a tool we ask how it went. When you answer or skip, we save the tool&apos;s name, this page&apos;s address, your
          star rating and the comment you typed, and nothing else: no name, no email and never your file. Please don&apos;t put personal
          details in the comment.
        </p>
        <p>
          Questions? Write to <a className="text-cyan hover:underline" href="mailto:support@clientorahq.com">support@clientorahq.com</a>.
        </p>
      </div>
    </article>
  );
}
