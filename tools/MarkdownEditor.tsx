"use client";
import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Heading2, Link2, List, ListOrdered, Code, Quote, Table, CheckSquare, Download, Eye, PencilLine } from "lucide-react";
import { CopyButton, IconBtn } from "@/components/ui/kit";
import { downloadText } from "@/lib/files";
import { useLocal } from "@/lib/store";

const SAMPLE = `# Project update

Hi team — here is where we are this **week**.

## Done
- [x] New landing page
- [x] Invoice template
- [ ] Client onboarding email

## Numbers
| Metric | Last week | This week |
| --- | ---: | ---: |
| Leads | 42 | 67 |
| Replies | 9 | 15 |

> Tip: press the eye icon on mobile to switch between writing and preview.

\`\`\`js
console.log("Made with ClientoraHQ Free Tools");
\`\`\`

[Find clients with ClientoraHQ](https://clientorahq.com)
`;

export default function MarkdownEditor() {
  const [md, setMd] = useLocal("cq-markdown", SAMPLE);
  const [html, setHtml] = useState("");
  const [view, setView] = useState<"write" | "preview">("write");
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    Promise.all([import("marked"), import("dompurify")]).then(([{ marked }, { default: DOMPurify }]) => {
      const raw = marked.parse(md, { gfm: true, breaks: false, async: false }) as string;
      if (live) setHtml(DOMPurify.sanitize(raw));
    });
    return () => { live = false; };
  }, [md]);

  /** Wrap the selection (or insert at the cursor) and keep focus in the editor. */
  const wrap = (before: string, after = "", placeholder = "") => {
    const el = ta.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = md.slice(s, e) || placeholder;
    const next = md.slice(0, s) + before + sel + after + md.slice(e);
    setMd(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const line = (prefix: string) => {
    const el = ta.current;
    if (!el) return;
    const s = md.lastIndexOf("\n", el.selectionStart - 1) + 1;
    setMd(md.slice(0, s) + prefix + md.slice(s));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(el.selectionStart + prefix.length, el.selectionStart + prefix.length); });
  };

  const tools: [string, React.ReactNode, () => void][] = [
    ["Bold", <Bold key="b" size={17} />, () => wrap("**", "**", "bold")],
    ["Italic", <Italic key="i" size={17} />, () => wrap("_", "_", "italic")],
    ["Heading", <Heading2 key="h" size={17} />, () => line("## ")],
    ["Link", <Link2 key="l" size={17} />, () => wrap("[", "](https://)", "link text")],
    ["Bulleted list", <List key="ul" size={17} />, () => line("- ")],
    ["Numbered list", <ListOrdered key="ol" size={17} />, () => line("1. ")],
    ["Task", <CheckSquare key="t" size={17} />, () => line("- [ ] ")],
    ["Quote", <Quote key="q" size={17} />, () => line("> ")],
    ["Code", <Code key="c" size={17} />, () => wrap("`", "`", "code")],
    ["Table", <Table key="tb" size={17} />, () => wrap("\n| Column | Column |\n| --- | --- |\n| ", " | |\n", "Cell")],
  ];

  const words = (md.match(/\S+/g) ?? []).length;
  const page = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Document</title>\n<style>body{font:16px/1.6 system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1b1f24}pre{background:#f4f6f8;padding:12px;border-radius:8px;overflow:auto}code{font-family:ui-monospace,monospace}table{border-collapse:collapse}td,th{border:1px solid #d0d7de;padding:6px 12px}blockquote{border-left:4px solid #d0d7de;margin:0;padding-left:16px;color:#57606a}</style></head>\n<body>\n${html}\n</body></html>`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-bg/50 p-1">
        {tools.map(([label, icon, fn]) => <IconBtn key={label} label={label} onClick={fn}>{icon}</IconBtn>)}
        <span className="ml-auto lg:hidden">
          <IconBtn label={view === "write" ? "Show preview" : "Back to writing"} onClick={() => setView((v) => (v === "write" ? "preview" : "write"))}>
            {view === "write" ? <Eye size={18} /> : <PencilLine size={18} />}
          </IconBtn>
        </span>
      </div>
      <div className="grid gap-3 [&>*]:min-w-0 lg:grid-cols-2">
        <div className={view === "preview" ? "hidden lg:block" : ""}>
          <label htmlFor="md" className="sr-only">Markdown</label>
          <textarea ref={ta} id="md" value={md} onChange={(e) => setMd(e.target.value)} spellCheck className="input h-[520px] font-mono !text-[14px]" />
        </div>
        <div className={view === "write" ? "hidden lg:block" : ""}>
          <article className="md-preview h-[520px] overflow-auto rounded-xl border border-line bg-white p-5 text-[#1b1f24]" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto text-[13px] text-fg-3">{words.toLocaleString()} words · saved in this browser</span>
        <CopyButton text={html} label="Copy HTML" />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText(md, "document.md", "text/markdown")}><Download size={15} /> .md</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadText(page, "document.html", "text/html")}><Download size={15} /> .html</button>
      </div>
    </div>
  );
}
