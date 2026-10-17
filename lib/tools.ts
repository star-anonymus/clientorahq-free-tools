import type { IconName } from "@/components/ToolIcon";

export type CategoryId = "pdf" | "image" | "text" | "business" | "daily";

export interface Category {
  id: CategoryId;
  name: string;
  title: string;
  blurb: string;
  color: string;
  icon: IconName;
}

export const categories: Category[] = [
  { id: "pdf", name: "PDF", title: "Free PDF tools", blurb: "Merge, split, compress, rotate, sign and convert PDFs without uploading them anywhere.", color: "#ff7a8a", icon: "file-text" },
  { id: "image", name: "Image", title: "Free image tools", blurb: "Convert, compress and clean up photos, make QR codes and colour palettes.", color: "#b9a0ff", icon: "image" },
  { id: "text", name: "Text", title: "Free text tools", blurb: "Count, clean, convert and write text — fast, private and with no character limit.", color: "#29e6ff", icon: "type" },
  { id: "business", name: "Business", title: "Free business tools", blurb: "Invoices, resumes, cover letters, time tracking and screen recording for freelancers.", color: "#ffc857", icon: "briefcase" },
  { id: "daily", name: "Daily", title: "Free everyday tools", blurb: "Passwords, unit and date maths, health numbers and a focus timer.", color: "#5ee59a", icon: "sun" },
];

export interface Faq { q: string; a: string }

export interface ToolMeta {
  slug: string;
  name: string;
  /** One line for the card. */
  short: string;
  category: CategoryId;
  icon: IconName;
  /** <title>, under ~60 chars before the brand suffix. */
  title: string;
  /** Meta description, ~150 chars. */
  description: string;
  /** Paid product people usually reach for, used in copy. */
  alternativeTo?: string;
  keywords: string[];
  steps: [string, string, string];
  faqs: Faq[];
  /** Short "what it does" bullets shown under the tool. */
  features: string[];
  isNew?: boolean;
}

const PRIVATE_FAQ: Faq = {
  q: "Are my files uploaded to a server?",
  a: "No. This tool runs entirely in your browser using JavaScript. Your file is read and processed on your own device and is never sent to ClientoraHQ or anyone else — you can even switch off your internet after the page loads.",
};

export const tools: ToolMeta[] = [
  // ───────────────────────── PDF
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    short: "Combine several PDFs into one file, in the order you want.",
    category: "pdf",
    icon: "files",
    title: "Merge PDF Files Online Free — No Upload",
    description: "Combine multiple PDF files into one in seconds. Reorder files, then download one merged PDF. Free, no sign-up, no watermark — your PDFs never leave your device.",
    alternativeTo: "iLovePDF",
    keywords: ["merge pdf", "combine pdf", "join pdf files", "pdf merger free"],
    steps: ["Select or drop the PDF files you want to combine.", "Put them in order with the up and down arrows.", "Press Merge PDF and download the single file."],
    features: ["Unlimited files and pages", "Reorder before merging", "No watermark, no sign-up", "Works offline once loaded"],
    faqs: [
      PRIVATE_FAQ,
      { q: "Is there a limit on how many PDFs I can merge?", a: "There is no limit set by us. The only limit is your device's memory — most laptops handle hundreds of pages without trouble." },
      { q: "Will the merged PDF keep text selectable?", a: "Yes. Pages are copied as they are, so text, links and quality stay exactly the same as in the original files." },
      { q: "Can I merge password-protected PDFs?", a: "Encrypted PDFs need to be unlocked first. Open them in your PDF reader, save a copy without the password, then merge." },
    ],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    short: "Turn photos and scans (JPG, PNG, WEBP) into one PDF.",
    category: "pdf",
    icon: "file-image",
    title: "JPG to PDF Converter — Images to PDF Free",
    description: "Convert JPG, PNG and WEBP images to a PDF. Choose page size, orientation and margins, reorder pages, and download. Free and private — nothing is uploaded.",
    alternativeTo: "Smallpdf",
    keywords: ["jpg to pdf", "image to pdf", "png to pdf", "photos to pdf"],
    steps: ["Add your images — photos, screenshots or scans.", "Pick page size, orientation and margin, and reorder pages.", "Press Create PDF and download it."],
    features: ["A4, Letter or fit-to-image pages", "Portrait, landscape or auto", "Reorder and remove pages", "JPG, PNG, WEBP, GIF, BMP"],
    faqs: [
      PRIVATE_FAQ,
      { q: "Does it reduce image quality?", a: "JPG and PNG images are embedded as they are, without re-compressing. Other formats are converted to PNG first so quality is kept." },
      { q: "Can I put several images on one page?", a: "Each image becomes its own page, which is what most forms and portals expect. Use the Fit to image option for pages that match each photo exactly." },
    ],
  },
  {
    slug: "pdf-to-word",
    name: "PDF to Word",
    short: "Pull the text out of a PDF into an editable .docx file.",
    category: "pdf",
    icon: "file-type",
    title: "PDF to Word Converter Free — Editable DOCX",
    description: "Convert a PDF to an editable Word document (.docx) in your browser. Text and paragraphs are kept, page by page. Free, no email, no upload.",
    alternativeTo: "Adobe Acrobat",
    keywords: ["pdf to word", "pdf to docx", "convert pdf to word free", "pdf to editable word"],
    steps: ["Select the PDF you want to edit.", "Press Convert to Word — text is read page by page.", "Download the .docx and open it in Word or Google Docs."],
    features: ["Keeps paragraphs and headings", "Page markers between pages", "Several PDFs at once", "Opens in Word, Google Docs, LibreOffice"],
    faqs: [
      PRIVATE_FAQ,
      { q: "Will the layout look exactly like the PDF?", a: "The converter focuses on getting your text out cleanly into paragraphs you can edit. Complex layouts, tables and images are not rebuilt — for an exact visual copy use PDF to JPG instead." },
      { q: "Does it work with scanned PDFs?", a: "Scanned PDFs are pictures of text, so there is no text inside to extract. They need OCR, which this free tool does not do." },
    ],
  },
  // ───────────────────────── Image
  {
    slug: "image-converter",
    name: "Image Converter",
    short: "Convert between JPG, PNG and WEBP — batch, with resize.",
    category: "image",
    icon: "repeat",
    title: "Image Converter — JPG, PNG, WEBP Free Online",
    description: "Convert images between JPG, PNG and WEBP in bulk, with optional resize and quality control. Runs in your browser — free, unlimited, no upload.",
    alternativeTo: "CloudConvert",
    keywords: ["image converter", "png to jpg", "jpg to png", "webp to jpg", "convert image to webp"],
    steps: ["Add one image or a whole batch.", "Choose the format, quality and an optional max width.", "Convert and download each file or all of them as a ZIP."],
    features: ["JPG, PNG, WEBP output", "Batch convert with ZIP download", "Optional resize by width", "Transparent areas kept for PNG/WEBP"],
    faqs: [
      PRIVATE_FAQ,
      { q: "Which format should I pick?", a: "WEBP gives the smallest files for websites. JPG is the most compatible for photos. PNG is lossless and keeps transparency — best for logos and screenshots." },
      { q: "What happens to transparent backgrounds when I convert to JPG?", a: "JPG has no transparency, so transparent areas are filled with white." },
    ],
  },
  {
    slug: "compress-image",
    name: "Compress Image",
    short: "Shrink JPG, PNG and WEBP file size with a live before/after.",
    category: "image",
    icon: "minimize",
    title: "Compress Images Online Free — Reduce Image Size",
    description: "Reduce JPG, PNG and WEBP file size without visible quality loss. Pick a quality, see the saving, download one or all as ZIP. Private and free.",
    alternativeTo: "TinyPNG",
    keywords: ["compress image", "reduce image size", "image compressor", "compress jpg", "compress png"],
    steps: ["Drop the images you want to make smaller.", "Choose a quality level and an optional max width.", "Download the compressed images — see the saving for each."],
    features: ["See size saved per file", "Optional resize for big photos", "Keep format or switch to WEBP", "No 5 MB / 20 file limits"],
    faqs: [
      PRIVATE_FAQ,
      { q: "How much smaller will my images get?", a: "Phone photos usually shrink 60–85% at quality 75 with no visible difference. Resizing a 4000px photo to 1600px saves even more." },
      { q: "Why did a PNG get bigger?", a: "PNG is lossless, so screenshots and graphics are often already small. Pick WEBP as the output format to get a real saving; if a result is bigger, the tool keeps your original." },
    ],
  },
  // ───────────────────────── Text
  {
    slug: "word-counter",
    name: "Word Counter",
    short: "Words, characters, sentences, reading time and top keywords.",
    category: "text",
    icon: "hash",
    title: "Word Counter — Count Words & Characters Free",
    description: "Count words, characters, sentences and paragraphs as you type. See reading and speaking time, keyword density and social media limits. Free and private.",
    keywords: ["word counter", "character counter", "count words", "reading time calculator"],
    steps: ["Type or paste your text into the box.", "Counts update live as you write.", "Check limits for X, LinkedIn, meta descriptions and more."],
    features: ["Live word and character count", "Reading and speaking time", "Top keywords with density", "Social and SEO length limits"],
    faqs: [
      { q: "Is my text saved or sent anywhere?", a: "No. Counting happens in your browser and your text is never uploaded. If you close the tab, it is gone." },
      { q: "How is reading time worked out?", a: "We use 238 words per minute for reading and 140 for speaking — the averages found in reading research." },
    ],
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    short: "UPPER, lower, Title, Sentence, camelCase, snake_case and more.",
    category: "text",
    icon: "case-sensitive",
    title: "Case Converter — Upper, Lower, Title Case Free",
    description: "Change text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case and more in one click. Free online case converter.",
    keywords: ["case converter", "uppercase to lowercase", "title case converter", "camelcase converter"],
    steps: ["Paste your text.", "Pick the case you want.", "Copy the result or download it as a .txt file."],
    features: ["10 case styles", "Smart Title Case (keeps small words lower)", "Developer cases: camel, snake, kebab, CONSTANT", "Copy or download"],
    faqs: [
      { q: "What is the difference between Title Case and Capitalize Each Word?", a: "Title Case keeps short words like 'and', 'of' and 'the' in lowercase unless they start the title, the way headlines are usually written. Capitalize Each Word capitalises every word." },
    ],
  },
  {
    slug: "remove-duplicate-lines",
    name: "Remove Duplicate Lines",
    short: "Delete repeated lines from lists, emails or keywords — and sort.",
    category: "text",
    icon: "list-x",
    title: "Remove Duplicate Lines Online — Dedupe a List",
    description: "Remove duplicate lines from any list: emails, keywords, URLs. Ignore case and spaces, sort A–Z, and see how many duplicates were removed. Free.",
    keywords: ["remove duplicate lines", "dedupe list", "remove duplicates from list", "unique lines"],
    steps: ["Paste your list — one item per line.", "Choose ignore case, trim spaces and sorting.", "Copy the clean list."],
    features: ["Ignore case and extra spaces", "Remove empty lines", "Sort A–Z, Z–A or keep order", "Shows duplicates removed"],
    faqs: [
      { q: "Is there a size limit?", a: "No set limit. Lists with hundreds of thousands of lines work fine on a normal laptop because everything runs locally." },
    ],
  },
  {
    slug: "text-cleaner",
    name: "Text Cleaner",
    short: "Fix extra spaces, line breaks, tabs and smart quotes.",
    category: "text",
    icon: "eraser",
    title: "Text Cleaner — Remove Extra Spaces & Line Breaks",
    description: "Clean messy text copied from PDFs and emails: remove extra spaces, line breaks, tabs, empty lines and smart quotes. Free whitespace cleaner.",
    keywords: ["remove extra spaces", "remove line breaks", "whitespace cleaner", "clean text online"],
    steps: ["Paste the messy text.", "Tick the clean-ups you need.", "Copy the cleaned text."],
    features: ["Join broken PDF lines", "Collapse double spaces", "Strip empty lines and tabs", "Straighten smart quotes"],
    faqs: [
      { q: "Why does text copied from a PDF have line breaks everywhere?", a: "PDFs store each visual line separately, so copying adds a break at the end of every line. 'Join broken lines' puts sentences back together but keeps real paragraph gaps." },
    ],
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    short: "Placeholder paragraphs, sentences or words — plain or HTML.",
    category: "text",
    icon: "pilcrow",
    title: "Lorem Ipsum Generator — Placeholder Text Free",
    description: "Generate lorem ipsum placeholder text by paragraphs, sentences or words. Copy as plain text or HTML. Free dummy text generator for designers.",
    keywords: ["lorem ipsum generator", "placeholder text", "dummy text generator"],
    steps: ["Choose paragraphs, sentences or words.", "Set how many you need.", "Copy as text or as HTML <p> tags."],
    features: ["Paragraphs, sentences or words", "Start with 'Lorem ipsum dolor sit amet'", "Plain text or HTML output", "One-click copy"],
    faqs: [
      { q: "What does lorem ipsum mean?", a: "It is scrambled Latin from a text by Cicero, used since the 1500s as filler so people look at a layout instead of reading the words." },
    ],
  },
  // ───────────────────────── Daily
  {
    slug: "password-generator",
    name: "Password Generator",
    short: "Strong passwords, passphrases and PINs from Web Crypto.",
    category: "daily",
    icon: "key-round",
    title: "Strong Password Generator — Free & Secure",
    description: "Generate strong random passwords, memorable passphrases and PINs with your browser's secure random generator. See strength and crack time. Nothing is stored or sent.",
    alternativeTo: "1Password generator",
    keywords: ["password generator", "strong password generator", "passphrase generator", "random pin generator"],
    steps: ["Pick password, passphrase or PIN.", "Set the length and which characters to use.", "Copy it — and save it in your password manager."],
    features: ["crypto.getRandomValues — not Math.random", "Passwords, passphrases, PINs", "Avoid look-alike characters", "Generate 10 at once"],
    faqs: [
      { q: "Are the passwords stored anywhere?", a: "No. They are created in your browser with the Web Crypto API and never sent or saved. Once you leave the page they are gone, so copy the one you want." },
      { q: "How long should my password be?", a: "Use at least 14 characters for accounts that matter, or a 5-word passphrase. Length beats complexity: every extra character multiplies the guesses an attacker needs." },
      { q: "Is a passphrase really as strong as a random password?", a: "Each word is picked at random from a list of almost 800 everyday words, which adds about 9.6 bits per word. Six words plus a number gives around 63 bits — strong, and far easier to type and remember than random symbols. Add words for more strength." },
    ],
  },
  {
    slug: "password-strength-checker",
    name: "Password Strength Checker",
    short: "See how long a password would take to crack, and why.",
    category: "daily",
    icon: "shield-check",
    title: "Password Strength Checker — How Secure Is It?",
    description: "Check how strong your password is, estimate the time to crack it and get tips to improve it. Checked in your browser — the password is never sent.",
    keywords: ["password strength checker", "how secure is my password", "password checker"],
    steps: ["Type a password into the box.", "See its strength, entropy and crack time.", "Follow the tips to make it stronger."],
    features: ["Entropy and crack-time estimate", "Spots common passwords and patterns", "Clear tips to improve", "Never leaves your browser"],
    faqs: [
      { q: "Is it safe to type my real password here?", a: "The check runs entirely in your browser and nothing is sent or stored. Still, the safest habit is to test a password that is similar to yours rather than the real one." },
    ],
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    short: "Length, weight, temperature, area, volume, speed, data and time.",
    category: "daily",
    icon: "ruler",
    title: "Unit Converter — Length, Weight, Temperature & More",
    description: "Convert length, weight, temperature, area, volume, speed, data size and time instantly. Swap units and see a full conversion table. Free online unit converter.",
    keywords: ["unit converter", "cm to inches", "kg to lbs", "celsius to fahrenheit", "km to miles"],
    steps: ["Pick a category such as length or weight.", "Type a value and choose the two units.", "Read the answer — or the full table of every unit."],
    features: ["8 categories, 70+ units", "Swap units in one tap", "Full conversion table", "Copy any result"],
    faqs: [
      { q: "How accurate are the conversions?", a: "We use the exact definitions (for example 1 inch = 2.54 cm, 1 lb = 0.45359237 kg) and show up to 8 significant figures." },
    ],
  },
];

export function getTool(slug: string) {
  return tools.find((t) => t.slug === slug);
}

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

export function toolsIn(id: CategoryId) {
  return tools.filter((t) => t.category === id);
}
