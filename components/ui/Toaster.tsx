"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import type { ToastDetail } from "@/lib/toast";

interface Item extends ToastDetail { id: number }

export default function Toaster() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let n = 0;
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastDetail>).detail;
      const id = ++n;
      setItems((p) => [...p.slice(-2), { ...detail, id }]);
      setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), detail.type === "error" ? 6000 : 3500);
    };
    window.addEventListener("cq-toast", onToast);
    return () => window.removeEventListener("cq-toast", onToast);
  }, []);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[90] flex flex-col items-center gap-2 px-4">
      {items.map((t) => {
        const Icon = t.type === "error" ? AlertCircle : t.type === "success" ? CheckCircle2 : Info;
        const color = t.type === "error" ? "text-bad" : t.type === "success" ? "text-ok" : "text-cyan";
        return (
          <div key={t.id} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border border-line-hi bg-bg-2/95 px-4 py-3 text-[14.5px] shadow-xl shadow-black/50 backdrop-blur">
            <Icon size={18} className={`flex-none ${color}`} aria-hidden="true" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
