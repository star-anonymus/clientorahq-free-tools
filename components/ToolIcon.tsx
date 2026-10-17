import {
  Briefcase, CalendarDays, CaseSensitive, Clock, Eraser, FileCode, FileImage, FilePen, FileText, FileType, FileUser, Files,
  Hash, HeartPulse, Image, Images, KeyRound, ListX, Mail, Minimize2, Palette, Pilcrow, QrCode, Receipt, Repeat, RotateCw,
  Ruler, ScreenShare, ShieldCheck, Shrink, Split, Sun, Timer, Type, WandSparkles,
  type LucideProps,
} from "lucide-react";

const ICONS = {
  briefcase: Briefcase,
  calendar: CalendarDays,
  "case-sensitive": CaseSensitive,
  clock: Clock,
  eraser: Eraser,
  "file-code": FileCode,
  "file-image": FileImage,
  "file-pen": FilePen,
  "file-text": FileText,
  "file-type": FileType,
  "file-user": FileUser,
  files: Files,
  hash: Hash,
  "heart-pulse": HeartPulse,
  image: Image,
  images: Images,
  "key-round": KeyRound,
  "list-x": ListX,
  mail: Mail,
  minimize: Minimize2,
  palette: Palette,
  pilcrow: Pilcrow,
  qr: QrCode,
  receipt: Receipt,
  repeat: Repeat,
  rotate: RotateCw,
  ruler: Ruler,
  screen: ScreenShare,
  "shield-check": ShieldCheck,
  shrink: Shrink,
  split: Split,
  sun: Sun,
  timer: Timer,
  type: Type,
  wand: WandSparkles,
} as const;

export type IconName = keyof typeof ICONS;

export default function ToolIcon({ name, ...props }: { name: IconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
