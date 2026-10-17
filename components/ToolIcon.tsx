import {
  Briefcase, CaseSensitive, Eraser, FileImage, FileText, FileType, Files, Hash, Image, KeyRound,
  ListX, Minimize2, Pilcrow, Repeat, Ruler, ShieldCheck, Sun, Type,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  briefcase: Briefcase,
  "case-sensitive": CaseSensitive,
  eraser: Eraser,
  "file-image": FileImage,
  "file-text": FileText,
  "file-type": FileType,
  files: Files,
  hash: Hash,
  image: Image,
  "key-round": KeyRound,
  "list-x": ListX,
  minimize: Minimize2,
  pilcrow: Pilcrow,
  repeat: Repeat,
  ruler: Ruler,
  "shield-check": ShieldCheck,
  sun: Sun,
  type: Type,
} as const;

export type IconName = keyof typeof ICONS;

export default function ToolIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
