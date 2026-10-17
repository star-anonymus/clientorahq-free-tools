"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

function Loading() {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[18px] border-2 border-dashed border-line" aria-busy="true">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-cyan/30 border-t-cyan" />
    </div>
  );
}


// Each tool is its own chunk, so a page only downloads the code it uses.
const TOOLS: Record<string, ComponentType> = {
  "merge-pdf": dynamic(() => import("@/tools/MergePdf"), { ssr: false, loading: Loading }),
  "jpg-to-pdf": dynamic(() => import("@/tools/ImagesToPdf"), { ssr: false, loading: Loading }),
  "pdf-to-word": dynamic(() => import("@/tools/PdfToWord"), { ssr: false, loading: Loading }),
  "image-converter": dynamic(() => import("@/tools/ImageConverter"), { ssr: false, loading: Loading }),
  "compress-image": dynamic(() => import("@/tools/CompressImage"), { ssr: false, loading: Loading }),
  "word-counter": dynamic(() => import("@/tools/WordCounter"), { ssr: false, loading: Loading }),
  "case-converter": dynamic(() => import("@/tools/CaseConverter"), { ssr: false, loading: Loading }),
  "remove-duplicate-lines": dynamic(() => import("@/tools/RemoveDuplicates"), { ssr: false, loading: Loading }),
  "text-cleaner": dynamic(() => import("@/tools/TextCleaner"), { ssr: false, loading: Loading }),
  "lorem-ipsum-generator": dynamic(() => import("@/tools/LoremIpsum"), { ssr: false, loading: Loading }),
  "password-generator": dynamic(() => import("@/tools/PasswordGenerator"), { ssr: false, loading: Loading }),
  "password-strength-checker": dynamic(() => import("@/tools/PasswordStrength"), { ssr: false, loading: Loading }),
  "unit-converter": dynamic(() => import("@/tools/UnitConverter"), { ssr: false, loading: Loading }),
};

export default function ToolLoader({ slug }: { slug: string }) {
  const Tool = TOOLS[slug];
  return Tool ? <Tool /> : <p className="text-fg-3">This tool is coming soon.</p>;
}
