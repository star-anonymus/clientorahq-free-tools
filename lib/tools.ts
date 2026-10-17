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
  // ───────────────────────── Phase B: was "coming soon" on the portfolio
  {
    slug: "background-remover",
    name: "Background Remover",
    short: "Cut out the background of any photo — transparent PNG.",
    category: "image",
    icon: "wand",
    title: "Remove Background from Image Free — No Upload",
    description: "Remove the background from photos automatically with AI that runs in your browser. Download a transparent PNG or put it on a colour. Free, no sign-up, no upload.",
    alternativeTo: "remove.bg",
    keywords: ["remove background", "background remover", "transparent background", "remove bg free"],
    steps: ["Select a photo of a person, product or animal.", "Wait a few seconds while the AI model cuts it out on your device.", "Download a transparent PNG, or pick a background colour first."],
    features: ["Full-resolution PNG, free", "Transparent, white or any colour", "AI runs on your device", "No credits, no watermark"],
    isNew: true,
    faqs: [
      { q: "Is my photo uploaded?", a: "No. The AI model is downloaded to your browser once (about 80 MB, then cached) and your photo is processed on your own device. The photo itself never leaves it." },
      { q: "Why is the first run slow?", a: "The first time, your browser downloads the AI model. After that it is cached, so the next photos are much faster." },
      { q: "What photos work best?", a: "A clear subject — a person, product, pet or car — against a background that contrasts with it. Fine hair and glass are the hardest parts for any background remover." },
    ],
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    short: "QR codes for links, Wi-Fi, contacts, WhatsApp — PNG or SVG.",
    category: "image",
    icon: "qr",
    title: "Free QR Code Generator — No Expiry, PNG & SVG",
    description: "Make QR codes for a website, Wi-Fi, contact card, WhatsApp, email or text. Pick colours and size, download PNG or SVG. Static codes that never expire. Free.",
    alternativeTo: "QR Code Generator Pro",
    keywords: ["qr code generator", "free qr code", "wifi qr code", "vcard qr code", "qr code svg"],
    steps: ["Pick what the code should open: link, Wi-Fi, contact and more.", "Fill in the details and choose colours.", "Download PNG for print or SVG for designs."],
    features: ["Never expires — no tracking redirect", "Wi-Fi, vCard, WhatsApp, email, SMS", "Custom colours and error correction", "PNG up to 2048 px or SVG"],
    isNew: true,
    faqs: [
      { q: "Do these QR codes expire?", a: "No. The data is written straight into the code, with no redirect through our servers, so it keeps working forever. Many paid QR sites use redirect links that stop working when you stop paying." },
      { q: "Can I track scans?", a: "Not with a static code — that is the trade-off for no expiry and no tracking. Add UTM tags to your link if you want to see scans in your analytics." },
    ],
  },
  {
    slug: "color-palette-generator",
    name: "Color Palette Generator",
    short: "Generate, lock and export palettes — or pull colours from a photo.",
    category: "image",
    icon: "palette",
    title: "Color Palette Generator — Hex, CSS & Tailwind",
    description: "Generate beautiful colour palettes, lock the ones you like, pull colours from an image and export as hex, CSS variables or Tailwind config. Includes a contrast checker.",
    alternativeTo: "Coolors",
    keywords: ["color palette generator", "colour palette from image", "hex color palette", "tailwind color palette"],
    steps: ["Press Generate (or the space bar) until you like it — lock colours to keep them.", "Or upload a photo to pull its main colours.", "Copy hex codes, CSS variables or Tailwind config."],
    features: ["Harmony modes: analogous, complementary, triad, mono", "Extract palette from an image", "WCAG contrast check", "Export hex, CSS, Tailwind, JSON"],
    isNew: true,
    faqs: [
      { q: "How is the palette from an image made?", a: "The photo is read on a canvas in your browser and its pixels are grouped into the most common colours (k-means clustering). The photo is never uploaded." },
    ],
  },
  {
    slug: "markdown-editor",
    name: "Markdown Editor",
    short: "Write Markdown with a live preview. Copy HTML or save .md.",
    category: "text",
    icon: "file-code",
    title: "Online Markdown Editor with Live Preview — Free",
    description: "Write Markdown with a live side-by-side preview. Toolbar for bold, links, lists and tables. Copy as HTML or download .md and .html. Saves to your browser automatically.",
    keywords: ["markdown editor", "online markdown editor", "markdown to html", "markdown preview"],
    steps: ["Write Markdown on the left — use the toolbar if you like.", "Watch the formatted preview on the right.", "Copy the HTML or download .md / .html."],
    features: ["Live preview, GitHub-style", "Tables, task lists, code blocks", "Auto-saves in your browser", "Export .md, .html or copy HTML"],
    isNew: true,
    faqs: [
      { q: "Where is my document saved?", a: "In your browser's local storage on this device only, so it is still there when you come back. Nothing is sent to a server. Clearing your browser data removes it." },
    ],
  },
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    short: "Professional PDF invoices for freelancers — any currency, no watermark.",
    category: "business",
    icon: "receipt",
    title: "Free Invoice Generator for Freelancers — PDF",
    description: "Create a professional invoice in minutes: your details, client, line items, tax and discount. Download a clean PDF with no watermark. Saved in your browser. Free.",
    alternativeTo: "FreshBooks",
    keywords: ["invoice generator", "free invoice maker", "freelance invoice template", "invoice pdf"],
    steps: ["Fill in your details, your client and the invoice number.", "Add line items, tax and any discount.", "Download the PDF and send it to your client."],
    features: ["30+ currencies", "Tax, discount, notes and bank details", "Clean PDF, no watermark", "Your details remembered on this device"],
    isNew: true,
    faqs: [
      { q: "Is this invoice legally valid?", a: "An invoice needs your details, the client's, a unique number, date, what you did and the amount — this tool covers all of that. Some countries need a tax/VAT number too; add it in your details." },
      { q: "Do you keep a copy of my invoices?", a: "No. Your business details and the last invoice are saved only in your own browser so you don't retype them. We never see them." },
    ],
  },
  {
    slug: "resume-builder",
    name: "Resume Builder",
    short: "Fill in a form, pick a template, download a clean PDF resume.",
    category: "business",
    icon: "file-user",
    title: "Free Resume Builder — ATS-Friendly PDF, No Sign-up",
    description: "Build a clean, ATS-friendly resume in minutes. Fill in a simple form, get strong bullet-point suggestions, choose a template and download a PDF. Free, no account, no watermark.",
    alternativeTo: "Zety",
    keywords: ["resume builder", "free resume builder", "cv maker", "ats resume template", "resume pdf"],
    steps: ["Fill in your details, experience, education and skills.", "Use the bullet ideas to describe your work with results.", "Pick a template and download your PDF."],
    features: ["ATS-friendly single column", "Bullet-point ideas by role", "Two clean templates", "Saved on your device, no account"],
    isNew: true,
    faqs: [
      { q: "Is the resume ATS-friendly?", a: "Yes. The PDF uses real, selectable text in one column with standard headings (Experience, Education, Skills), which is what applicant tracking systems read best." },
      { q: "Does it use AI to write my resume?", a: "No — and that keeps it free and private. Instead you get proven bullet templates by role (action verb + task + result) that you fill in with your own numbers." },
    ],
  },
  {
    slug: "cover-letter-generator",
    name: "Cover Letter Generator",
    short: "A tailored cover letter from the job, company and your strengths.",
    category: "business",
    icon: "mail",
    title: "Free Cover Letter Generator — Tailored in Minutes",
    description: "Write a tailored cover letter in minutes. Enter the job, company and your top strengths, pick a tone, then edit and download. Template-based, free and private.",
    keywords: ["cover letter generator", "free cover letter", "cover letter template", "cover letter for freelancers"],
    steps: ["Enter the job title, company and hiring manager.", "Add your experience and two or three strengths with results.", "Pick a tone, edit the letter, then copy or download it."],
    features: ["Formal, friendly or confident tone", "Job, freelance-proposal and internship styles", "Edit before you download", "PDF or text"],
    isNew: true,
    faqs: [
      { q: "Is this written by AI?", a: "No. It assembles a proven structure — hook, proof, fit, call to action — from what you type. It is instant, free and private, and you should still read it and make it sound like you." },
    ],
  },
  {
    slug: "date-calculator",
    name: "Date Calculator",
    short: "Age, days between dates, add or subtract days, countdowns.",
    category: "daily",
    icon: "calendar",
    title: "Date Calculator — Age, Days Between Dates & More",
    description: "Calculate exact age, the number of days between two dates (or working days), add or subtract days from a date, and count down to any event. Free date calculator.",
    keywords: ["date calculator", "age calculator", "days between dates", "add days to date", "working days calculator"],
    steps: ["Pick a calculator: age, between dates, add days or countdown.", "Choose your dates.", "Read the answer in years, months, weeks and days."],
    features: ["Exact age with next birthday", "Working days (skips weekends)", "Add or subtract days, weeks, months", "Live countdown"],
    isNew: true,
    faqs: [
      { q: "Are the start and end dates counted?", a: "By default we count the days between the two dates, not including the end date — the way most calculators do. Tick 'include end date' to count both." },
    ],
  },
  {
    slug: "bmi-calculator",
    name: "BMI & Health Calculator",
    short: "BMI, daily calories, water intake and healthy weight range.",
    category: "daily",
    icon: "heart-pulse",
    title: "BMI Calculator — Calories, Water & Ideal Weight",
    description: "Calculate your BMI, daily calorie needs (BMR and TDEE), water intake and healthy weight range in metric or imperial units, with a clear visual scale.",
    keywords: ["bmi calculator", "calorie calculator", "tdee calculator", "ideal weight calculator", "water intake calculator"],
    steps: ["Enter your height, weight, age and sex.", "Choose how active you are.", "See your BMI, calories, water and healthy weight range."],
    features: ["Metric and imperial", "BMR and TDEE (Mifflin-St Jeor)", "Healthy weight range for your height", "Calories to lose or gain"],
    isNew: true,
    faqs: [
      { q: "Is BMI accurate?", a: "BMI is a quick screening number, not a diagnosis. It doesn't know muscle from fat, so athletes can read 'overweight'. Use it as a guide and talk to a doctor about your health." },
      { q: "Is my data stored?", a: "No. The numbers are worked out in your browser and are not saved or sent anywhere." },
    ],
  },
  {
    slug: "pomodoro-timer",
    name: "Pomodoro Timer",
    short: "Focus timer with tasks, custom intervals, sounds and history.",
    category: "daily",
    icon: "timer",
    title: "Pomodoro Timer Online — Focus Timer with Tasks",
    description: "A free Pomodoro focus timer with custom work and break lengths, a task list, sound and desktop alerts, and a history of your focus sessions. Works offline.",
    keywords: ["pomodoro timer", "focus timer", "study timer", "pomodoro online"],
    steps: ["Add what you are working on.", "Start a 25-minute focus session (or set your own length).", "Take the break when the bell rings — your sessions are logged."],
    features: ["Custom focus and break lengths", "Task list with pomodoro counts", "Sound + desktop notification", "Today's focus history"],
    isNew: true,
    faqs: [
      { q: "Does the timer keep running if I switch tabs?", a: "Yes. It tracks the real end time, so it stays accurate even when the tab is in the background, and rings when the session ends." },
    ],
  },
  // ───────────────────────── Phase C: free versions of tools people pay for
  {
    slug: "split-pdf",
    name: "Split PDF",
    short: "Pull out pages or split a PDF into several files.",
    category: "pdf",
    icon: "split",
    title: "Split PDF Online Free — Extract Pages, No Upload",
    description: "Split a PDF into separate files or extract the pages you need. Pick pages by clicking thumbnails or typing ranges like 1-3, 7. Free, private, no upload.",
    alternativeTo: "Smallpdf",
    keywords: ["split pdf", "extract pages from pdf", "separate pdf pages", "pdf splitter"],
    steps: ["Select a PDF.", "Click the pages you want, or type ranges like 1-3, 8.", "Download them as one PDF, or every page as its own file."],
    features: ["Visual page picker", "Ranges like 1-3, 5, 9-12", "One PDF or one file per page (ZIP)", "Quality untouched"],
    isNew: true,
    faqs: [PRIVATE_FAQ, { q: "Does splitting reduce quality?", a: "No. Pages are copied exactly as they are — text stays selectable and images keep their resolution." }],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    short: "Make a PDF smaller for email and upload portals.",
    category: "pdf",
    icon: "shrink",
    title: "Compress PDF Free — Reduce PDF Size, No Upload",
    description: "Reduce PDF file size in your browser. Choose a light clean-up that keeps text selectable, or strong compression for scanned PDFs. Free, private, no file limit.",
    alternativeTo: "iLovePDF",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "make pdf smaller"],
    steps: ["Select the PDF you want to shrink.", "Pick Light (keeps text) or Strong (best for scans and photos).", "Compare the sizes and download."],
    features: ["Light mode keeps text selectable", "Strong mode for scans and photo PDFs", "See the saving before you download", "No 2-files-a-day limit"],
    isNew: true,
    faqs: [
      PRIVATE_FAQ,
      { q: "Which mode should I use?", a: "Light rewrites the file more efficiently and keeps text and links — good for documents made on a computer. Strong turns each page into a compressed image — best for scanned documents and photo-heavy PDFs, but text is no longer selectable." },
      { q: "Why did my PDF barely shrink in Light mode?", a: "Most of a PDF's size is usually images. Light mode doesn't touch them, so try Strong — or the 100/150 DPI settings for the biggest saving." },
    ],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    short: "Turn some or all pages and save the PDF the right way up.",
    category: "pdf",
    icon: "rotate",
    title: "Rotate PDF Pages Online Free — Save Permanently",
    description: "Rotate PDF pages left or right — all pages or just the ones you click — and save the PDF permanently. Free, private and works offline.",
    alternativeTo: "Adobe Acrobat",
    keywords: ["rotate pdf", "rotate pdf pages", "turn pdf page", "flip pdf"],
    steps: ["Select the PDF.", "Rotate all pages, or click single pages to turn them.", "Download the fixed PDF."],
    features: ["Rotate one page or all", "Live thumbnails", "Lossless — nothing re-compressed", "Saved permanently in the file"],
    isNew: true,
    faqs: [PRIVATE_FAQ],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    short: "Turn every PDF page into a high-quality JPG or PNG image.",
    category: "pdf",
    icon: "images",
    title: "PDF to JPG Converter — Pages to Images Free",
    description: "Convert PDF pages to JPG or PNG images at 72–300 DPI. Pick pages, download one image or all as a ZIP. Free, private and no upload.",
    alternativeTo: "Smallpdf",
    keywords: ["pdf to jpg", "pdf to png", "pdf to image", "convert pdf to jpg"],
    steps: ["Select a PDF.", "Choose JPG or PNG and the quality (DPI).", "Download single pages or all of them as a ZIP."],
    features: ["JPG or PNG", "72, 150, 200 or 300 DPI", "Choose which pages", "ZIP download for all pages"],
    isNew: true,
    faqs: [PRIVATE_FAQ, { q: "Which DPI should I pick?", a: "150 DPI is sharp on screens and small enough to share. Use 300 DPI for printing; 72 DPI for quick previews." }],
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    short: "Draw, type or upload your signature and place it on a PDF.",
    category: "pdf",
    icon: "file-pen",
    title: "Sign PDF Online Free — Add Signature, No Upload",
    description: "Sign a PDF in your browser: draw, type or upload your signature, place it on any page, add a date or text, and download. Free, private, no account or credits.",
    alternativeTo: "DocuSign",
    keywords: ["sign pdf", "sign pdf online free", "add signature to pdf", "electronic signature pdf"],
    steps: ["Select the PDF you need to sign.", "Draw, type or upload your signature, then tap the page to place it.", "Drag to move, resize, add a date — then download the signed PDF."],
    features: ["Draw, type or upload a signature", "Place on any page, drag to adjust", "Add date and text fields", "Signature saved on your device only"],
    isNew: true,
    faqs: [
      PRIVATE_FAQ,
      { q: "Is this a legally binding signature?", a: "In most countries a simple electronic signature — like a drawn or typed signature on a PDF — is valid for everyday agreements, contracts and forms. Some documents (property, wills, some government forms) need a certified digital signature, which this tool does not create." },
      { q: "Can I sign on my phone?", a: "Yes. Draw your signature with your finger, then tap the page where it should go." },
    ],
  },
  {
    slug: "screen-recorder",
    name: "Screen Recorder",
    short: "Record your screen, tab or window with mic — no time limit.",
    category: "business",
    icon: "screen",
    title: "Free Screen Recorder Online — No Time Limit, No Watermark",
    description: "Record your screen, a window or a browser tab with your microphone and system sound, straight from the browser. No time limit, no watermark, no upload — download the video.",
    alternativeTo: "Loom",
    keywords: ["screen recorder", "free screen recorder", "record screen online", "loom alternative", "screen recorder no watermark"],
    steps: ["Choose mic and sound options, then press Start recording.", "Pick the screen, window or tab to share.", "Press Stop, watch it back and download the video."],
    features: ["No time limit, no watermark", "Microphone + system/tab audio", "Optional camera bubble", "Download WebM or MP4 (where supported)"],
    isNew: true,
    faqs: [
      { q: "Is my recording uploaded?", a: "No. The video is recorded by your browser into your computer's memory and saved straight to your downloads. It is never uploaded." },
      { q: "Is there a time limit?", a: "No limit from us. Very long recordings are held in memory until you stop, so for hour-plus recordings keep other heavy apps closed." },
      { q: "Does it work on phones?", a: "Screen recording from a web page needs a desktop browser — Chrome, Edge, Firefox or Opera on Windows, Mac, Linux or ChromeOS. Phones don't allow it." },
    ],
  },
  {
    slug: "time-tracker",
    name: "Time Tracker",
    short: "Track hours per client and project, then export a timesheet.",
    category: "business",
    icon: "clock",
    title: "Free Time Tracker for Freelancers — Timesheet & CSV",
    description: "A simple time tracker for freelancers: start/stop timers per client and project, add time manually, see weekly totals and earnings, export CSV timesheets. Saved in your browser.",
    alternativeTo: "Toggl",
    keywords: ["time tracker", "free time tracker", "timesheet", "freelance time tracking", "toggl alternative"],
    steps: ["Type what you're working on and pick a project.", "Press Start — stop when you're done (it keeps running if you close the tab).", "See today's and this week's totals, then export a CSV timesheet."],
    features: ["One-click start/stop", "Projects with hourly rates", "Weekly totals and earnings", "CSV export for invoices"],
    isNew: true,
    faqs: [
      { q: "Where is my time data stored?", a: "Only in your browser on this device (local storage). Nothing is sent to a server. Export a CSV now and then as a backup, or before clearing your browser data." },
      { q: "Does the timer keep running if I close the tab?", a: "Yes. The start time is saved, so when you come back the timer shows the right total." },
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
